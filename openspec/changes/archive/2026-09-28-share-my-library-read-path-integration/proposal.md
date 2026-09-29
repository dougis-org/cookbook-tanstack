## GitHub Issues

- #673
- Part of: #670
- Depends on (merged): #671, #672

## Why

- Problem statement: PR1 (`#671`) and PR2 (`#672`) landed the `LibraryShare` model,
  the `sharedOwnerIds`-aware clause on `visibilityFilter`, and the `sharing` tRPC
  router — but both shipped dark. No read path passes `ctx.sharedOwnerIds` into
  `visibilityFilter`, so a grant currently changes nothing a recipient can see. The
  feature is inert until this change wires the read side through.
- Why now: PR3 is next in the five-PR decomposition (`openspec/changes/share-my-library/tasks.md`
  Phase 3) and both of its dependencies are merged (#672 via PR #683, #671 via PR #679).
  PR4 (content UI, #674) and PR5 (account section, #675, closes the epic #668) are
  blocked on this landing.
- Business/user impact: Until this ships, Executive Chef sharers cannot verify their
  purchased capability does anything — grants exist in the database but produce no
  visible effect, which is fine for a dark ship but blocks the two remaining PRs.

## Problem Space

- Current behavior: `visibilityFilter(user, collabCookbookIds)` accepts no
  shared-owner parameter in any of its call sites; `ctx.sharedOwnerIds` is computed
  but never read outside its own tests. `Cookbook.recipes[]` entries are resolved
  assuming every entry belongs to the cookbook's owner. Every recipe/cookbook mutation
  is ownership-gated (`verifyOwnership()` / `verifyCookbookOwner()`), which incidentally
  already rejects a recipient, but nothing exercises this claim end-to-end.
- Desired behavior: A recipient's `recipes.list`/`byId` and `cookbooks.list`/`byId`
  include the granting owner's private content, tagged `sharedBy: { id, name }`
  (`null` for owned/public content). A recipient can add a shared recipe to a
  cookbook they own without copying it; if that recipe later becomes inaccessible
  (revocation, owner downgrade, owner soft-delete), the entry stays in place as
  `{ recipeId, unavailable: true }` with `orderIndex`/`chapterId` preserved and no
  leaked content. No mutation gains new capability for a recipient.
- Constraints:
  - No schema change to `ICookbookRecipeEntry` (design Decision 3 — cross-owner state
    is derived at read time, never persisted).
  - No new write-side permission layer (design Decision 4 — read-only is proved by
    the existing ownership check, not a new guard).
  - Owner display-name resolution must be a single batched lookup per list response,
    not N queries.
  - Payloads must never expose owner email or tier.
  - `src/routes/cookbooks.$cookbookId_.print.tsx` must not render cross-owner entries
    until #669 resolves.
- Assumptions:
  - `ctx.sharedOwnerIds` (from PR1) is correct and already excludes owners below
    Executive Chef tier — this change consumes it, it does not re-derive it.
  - Every existing recipe/cookbook mutation compares `doc.userId` to the caller and
    therefore already rejects a non-owner recipient; Task 3.4 exists to prove this,
    not to add the behavior.
  - `Recipe` soft-delete middleware already excludes deleted recipes from all reads
    (including shared reads) without further change.
- Edge cases considered:
  - A recipe visible at read time later becomes invisible mid-session (revocation,
    downgrade, soft-delete) — must degrade to `unavailable: true`, not an error.
  - A `LibraryShare.recipientId` pointing at a deleted user must grant access to
    nobody and must not throw.
  - A user who is simultaneously a grantee (read-only) and a cookbook collaborator
    (read-write on that one cookbook) must keep collaborator write access on that
    cookbook while the rest of the shared library stays read-only.
  - A recipient who is themselves an Executive Chef and re-shares their own library
    must not leak the original owner's content to their own recipients (no transitive
    sharing).
  - An unrelated `visibilityFilter` call site discovered during the Task 3.1 audit
    that this proposal's author did not anticipate.

## Scope

### In Scope

- Thread `ctx.sharedOwnerIds` through every `visibilityFilter` call site
  (`src/server/trpc/routers/recipes.ts`, `src/server/trpc/routers/cookbooks.ts`, and
  any other call site found by `grep -rn "visibilityFilter" src/`).
- Add `sharedBy: { id, name } | null` to `recipes.list`, `recipes.byId`,
  `cookbooks.list`, `cookbooks.byId`, resolved via one batched owner-name lookup per
  response.
- Allow a recipient to add a visible, non-owned recipe to a cookbook they own;
  resolve `Cookbook.recipes[]` entries through live caller visibility, emitting
  `{ recipeId, unavailable: true }` for entries that no longer resolve.
- Audit and fix every consumer of `Cookbook.recipes[]` (`grep -rn "\.recipes" src/`)
  to resolve through visibility, including an explicit test that the print route
  does not render cross-owner entries.
- A table-driven read-only enforcement test, derived from the router definitions
  (not hand-listed), covering every recipe and cookbook mutation invoked by a
  recipient against the owner's content.

### Out of Scope

- Any UI change (badges, gated affordances, unavailable placeholders, quota display)
  — that is PR4 (#674).
- The "Sharing & Collaboration" account section, invite/revoke UI — that is PR5
  (#675).
- Print-view attribution for cross-owner entries — deferred to #669.
- Changes to the `sharing` router itself (`shareLibrary`, `revokeLibraryShare`,
  `myLibraryShares`, `mySharedLibraries`) — already shipped in PR2 (#672/#683).
- Changes to `LibraryShare`, `visibilityFilter`'s signature/clause shape, or
  `ctx.sharedOwnerIds` computation — already shipped in PR1 (#671/#679); this change
  only threads the existing parameter through.
- Any change to tier limits, quota accounting logic, or `TIER_LIMITS`.
- Deprecating or altering cookbook Collaboration.

## What Changes

- `visibilityFilter()` call sites in `recipes.ts` and `cookbooks.ts` (and any others
  found by audit) pass `ctx.sharedOwnerIds` as their third argument.
- `recipes.list`/`byId` and `cookbooks.list`/`byId` payloads gain `sharedBy`.
- `cookbooks.ts` gains a mutation path (or extension of an existing one) permitting
  a recipient to add a shared recipe to their own cookbook, and a resolver that maps
  each `Cookbook.recipes[]` entry through live visibility before returning it.
- New table-driven integration test suite enumerating mutations from the router
  definitions and asserting `FORBIDDEN`/`NOT_FOUND` for a recipient against owner
  content.
- Test coverage added at every `visibilityFilter` and `Cookbook.recipes[]` call site
  discovered by the two required greps, recorded explicitly in the eventual PR
  description.

## Risks

- Risk: A `visibilityFilter` or `Cookbook.recipes[]` consumer is missed by the audit.
  - Impact: Missed `visibilityFilter` site — shared content silently fails to appear
    where expected (fails safe, but confusing and easy to miss in review). Missed
    `.recipes[]` consumer — either a private recipe's content leaks to a recipient
    who shouldn't see it, or the consumer crashes on an entry it can't resolve.
  - Mitigation: Both audits are mandatory greps whose full result lists must be
    recorded in the eventual PR description so review can confirm completeness; the
    spec requires one test case per discovered call site, not just the two known
    ones.
- Risk: `sharedBy` resolution regresses to one query per row under review pressure to
  ship quickly.
  - Impact: N+1 query pattern on every list endpoint touching shared content,
    degrading read performance as shared-item counts grow.
  - Mitigation: Explicit test asserting a single batched query for N shared items in
    one response (already specified in Task 3.2 / tests.md).
- Risk: Read-only enforcement (Task 3.4) is hand-listed instead of derived from the
  router, silently excluding a newly added mutation from future coverage.
  - Impact: A future mutation ships without this proposal's read-only guarantee ever
    being exercised against it.
  - Mitigation: Task 3.4 explicitly requires deriving the mutation table from the
    router definition (introspecting registered procedures), not hand-listing.
- Risk: The print route (`cookbooks.$cookbookId_.print.tsx`) renders a cross-owner
  entry before #669 resolves attribution for print views.
  - Impact: A printed cookbook could show another user's private recipe with no
    owner attribution, or attribute it incorrectly.
  - Mitigation: Task 3.3 requires an explicit test asserting the print route excludes
    cross-owner entries entirely until #669 lands.
- Risk: This is the highest-risk PR in the five-PR sequence per issue #673's own
  framing — it is the first to make shared data reachable in any read path,
  increasing exposure surface relative to PR1/PR2's dark, inert changes.
  - Impact: Any gap here is the first point where a wiring mistake becomes
    user-visible (even though the UI itself doesn't ship until PR4/PR5, other
    internal or admin surfaces reading these routers would see it).
  - Mitigation: Full TDD per `tasks.md`/`tests.md` Phase 3, plus the two mandatory
    greps recorded in the PR description as an explicit completeness check.

## Open Questions

- No unresolved ambiguity: this proposal implements Phase 3 of the already-approved
  `openspec/changes/share-my-library/` plan (proposal.md/design.md/specs/tasks.md/tests.md,
  merged via PR #676) verbatim in scope and decisions. Decisions 3 and 4 governing
  this change's two hardest calls (derived vs. persisted cross-owner state; no new
  permission layer) were made and justified in that plan and are not reopened here.
- Question: Should the Task 3.1/3.3 audit results (the full call-site lists) be
  captured in this change's `design.md` as they're discovered, or only recorded in
  the eventual PR description as the parent issue specifies?
  - Needed from: requester preference — parent issue #673 only requires the PR
    description; recording them in `design.md` as well would leave a durable
    artifact trail but duplicates information.
  - Blocker for apply: no — default to PR-description-only per #673's literal text
    unless told otherwise.

## Non-Goals

- Building any UI surface for sharing (PR4/PR5 cover this).
- Introducing a new permission/access-level concept — read-only enforcement relies
  entirely on the existing ownership check (design Decision 4).
- Persisting any cross-owner or "shared" flag on `Cookbook` or `Recipe` documents.
- Solving print-view attribution (#669).
- Re-deriving or modifying `ctx.sharedOwnerIds`, `LibraryShare`, or the `sharing`
  router's existing procedures.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

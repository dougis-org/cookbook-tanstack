## Context

- Relevant architecture:
  - `visibilityFilter()` in `src/server/trpc/routers/_helpers.ts` currently accepts
    `(user, collabCookbookIds)` and returns a Mongoose `$or` filter. Since PR1
    (#671/#679) it *supports* a third `sharedOwnerIds` parameter internally, but no
    call site passes one — every caller today gets the pre-sharing filter shape.
  - `ctx.sharedOwnerIds` (`src/server/trpc/context.ts`) is computed once per request,
    already filtered to owners currently at `executive-chef` tier, and fails closed
    (`[]`) on lookup error. This change is the first consumer of that value.
  - `ctx.getCollabCookbookIds()` (lazy, memoized accessor, per #677/PR #681) is the
    sibling pattern for collaborator cookbook ids — `sharedOwnerIds` differs in being
    eager and fail-closed rather than lazy and fail-loud (documented asymmetry from
    design Decision 2 in the parent plan).
  - Write authorization is exclusively `verifyOwnership()` / `verifyCookbookOwner()`
    in `recipes.ts`/`cookbooks.ts`, comparing `doc.userId` to the caller and throwing
    `FORBIDDEN`/`NOT_FOUND`. No mutation currently branches on sharing state.
  - `Cookbook.recipes[]` (`ICookbookRecipeEntry[]`) is read in at minimum
    `cookbooks.list`, `cookbooks.byId`, `printById`, and
    `src/routes/cookbooks.$cookbookId_.print.tsx`; each currently assumes every entry
    resolves to a `Recipe` owned by the cookbook's own owner.
  - `userLookupStages` (`_helpers.ts`, promoted from `cookbooks.ts` in PR2/#683) is
    the existing batched-name-lookup aggregation stage, already used for the
    collaborator-name join and for `ctx.sharedOwnerIds` resolution — this change reuses
    it a third time for `sharedBy` resolution rather than writing a new lookup.
- Dependencies:
  - `LibraryShare` model (`src/db/models/library-share.ts`, PR1) — read-only from
    this change's perspective; not modified.
  - `sharing` tRPC router (`src/server/trpc/routers/sharing.ts`, PR2) — not modified;
    this change only consumes `ctx.sharedOwnerIds`, which the sharing router's
    mutations affect indirectly via `LibraryShare` rows.
  - `Recipe` soft-delete middleware — already excludes deleted recipes from every
    read; this change relies on that behavior rather than re-implementing it for
    shared reads.
- Interfaces/contracts touched:
  - Every `visibilityFilter(...)` call site gains a third argument:
    `ctx.sharedOwnerIds`.
  - `recipes.list`, `recipes.byId`, `cookbooks.list`, `cookbooks.byId` response
    shapes gain `sharedBy: { id: string; name: string } | null`.
  - `cookbooks.ts`'s recipe-entry-add mutation (name TBD at implementation;
    tasks.md will pin it) relaxes its input-recipe-ownership check from "caller owns
    this recipe" to "caller can see this recipe" (own, public, collaborator, or
    shared), while leaving the *cookbook*-ownership check (`verifyCookbookOwner`)
    untouched.
  - `cookbooks.byId`'s (and any other `.recipes[]` consumer's) entry-resolution logic
    changes from "fetch by id, assume it belongs to the owner" to "resolve each id
    through the caller's visibility filter; on no match, emit
    `{ recipeId, unavailable: true }` preserving `orderIndex`/`chapterId`".
  - `ICookbookRecipeEntry` schema — **unchanged**. No new field, no migration.

## Goals / Non-Goals

### Goals

- Make an existing `LibraryShare` grant produce a visible effect on the recipient's
  `recipes.list`/`byId` and `cookbooks.list`/`byId` responses.
- Attribute every read-path item's origin (`sharedBy`) so PR4's UI has data to badge,
  without exposing owner email or tier.
- Let a recipient reference a shared recipe from their own cookbook without copying
  it, and let that reference degrade gracefully (not error) when access ends.
- Prove — by exhaustive, router-derived test, not by inspection — that no existing
  mutation grants a recipient any write capability over shared content.
- Leave every non-read-path contract (schema, mutation semantics, `sharing` router)
  exactly as PR1/PR2 shipped it.

### Non-Goals

- Any UI rendering of `sharedBy`, badges, gated controls, or unavailable
  placeholders (PR4, #674).
- Any account-page sharing management surface (PR5, #675).
- Resolving print-view attribution policy (#669) — this change only asserts the
  print route excludes cross-owner entries, it does not add attribution to it.
- Adding a permission/access-level abstraction — read-only enforcement continues to
  rely solely on `doc.userId === caller.id`.
- Reworking `ctx.sharedOwnerIds`'s computation, fail-closed behavior, or tier
  eligibility logic (owned by PR1; this change treats it as a correct input).

## Decisions

### Decision 1: Pass `sharedOwnerIds` as an explicit parameter at every call site, not via ambient context lookup inside `visibilityFilter`

- Chosen: `visibilityFilter(user, collabCookbookIds, sharedOwnerIds)` stays a pure
  function taking all three inputs explicitly; every router call site is updated to
  pass `ctx.sharedOwnerIds` (defaulting to `[]` only where no `ctx` is available,
  e.g. legacy test fixtures).
- Alternatives considered: (a) Have `visibilityFilter` accept `ctx` directly and read
  `ctx.sharedOwnerIds`/`ctx.getCollabCookbookIds()` itself. (b) A wrapper
  `visibilityFilterForRequest(ctx, user)` that threads both.
- Rationale: `visibilityFilter` is already a pure, synchronously-testable function
  exercised with plain object literals in its unit tests (per `tests.md` Task 1.1).
  Accepting `ctx` (a) would force every unit test to construct a full context object
  and would make the function's dependency on request-scoped data implicit.
  `collabCookbookIds` already sets the precedent of "caller resolves it, function
  takes it as a plain array" — (b)'s wrapper adds a layer with no behavior of its
  own beyond forwarding two already-resolved values.
- Trade-offs: Every call site must be individually updated and is therefore
  individually auditable (and individually missable) — this is precisely why Task
  3.1's exhaustive grep-and-record step exists as a review gate rather than being
  incidental.

### Decision 2: `sharedBy` resolved via a single batched follow-up query (`resolveSharedByMap`), not an aggregation `$lookup`

- Chosen (revised during implementation — see below): `resolveSharedByMap` in
  `_helpers.ts` collects the caller-relevant `userId`s for a response, filters them
  down to ids present in `ctx.sharedOwnerIds`, and issues exactly one
  `getBetterAuthCollection("user").find({ _id: { $in: [...] } }, { projection: {
  name: 1 } })` per response, then `sharedByFor(docUserId, map)` looks each document's
  owner up in that map. `null` when `userId === caller.id` or the owner isn't in
  `sharedOwnerIds` (covers owned and public/unrelated content); `{ id, name }` when
  `userId` is in `sharedOwnerIds`, regardless of the document's own `isPublic` value.
- Originally chosen at proposal time: extend the existing `recipes.list`/`byId` and
  `cookbooks.list`/`byId` Mongoose aggregations with a lookup joining each result's
  `userId` against the Better-Auth `user` collection (reusing `userLookupStages`).
- Alternatives considered: (a) Fetch documents first, then issue one follow-up
  `User.find({ _id: { $in: uniqueOwnerIds } })` query and merge in application code.
  (b) Resolve `sharedBy` per-document with an aggregation-level lookup that isn't
  deduplicated (naive per-row `$lookup`), relying on MongoDB to have already
  deduplicated the underlying `user` documents.
- Revised rationale (why implementation moved to alternative (a)): `recipes.list`,
  `recipes.byId`, and `cookbooks.byId` are plain `find`/`findOne` calls, not
  aggregation pipelines — converting them to aggregations solely to attach a
  `$lookup` stage would have been a materially larger and riskier change than this
  proposal's stated scope (Decision 1 already establishes that call sites are
  extended minimally, not restructured). `cookbooks.list` is already an aggregation
  but uses `resolveSharedByMap` too, for one consistent implementation across all
  four endpoints rather than two different patterns. Query count is identical either
  way — a query-count test (`sharing-read-path.integration.test.ts`, spying on
  `getBetterAuthCollection`) asserts exactly one call per response, which is what
  actually matters for the NFAC Performance requirement, not which of the two
  functionally-equivalent query shapes produced it. (b) remains rejected for the
  reason originally stated.
- Trade-offs: `cookbooks.byId` resolves both the cookbook's own owner and its
  resolved recipes' owners through one `resolveSharedByMap` call (concatenating both
  sets of ids before the single query) rather than two separate calls, to preserve
  the "one query per response" guarantee — this is the one place callers must
  remember to batch across both document kinds in a single response, called out here
  so a future endpoint following this pattern doesn't reintroduce a second query.

### Decision 3: Cross-owner cookbook-entry resolution happens in the read path, not by rewriting `Cookbook.recipes[]` at write time

- Chosen: `cookbooks.byId` (and any other `.recipes[]` consumer surviving the audit)
  fetches the cookbook's raw `recipes[]` array unchanged, then resolves each entry's
  `recipeId` against a `Recipe` query scoped by `visibilityFilter(caller, ...,
  sharedOwnerIds)`. Entries whose `recipeId` doesn't resolve become
  `{ recipeId, unavailable: true }`, preserving `orderIndex`/`chapterId` from the
  original entry.
- Alternatives considered: (a) Persist a `sharedFromUserId`/`unavailable` flag on the
  entry at add time and reconcile it via a background job on revocation/downgrade
  (mirrors `hiddenByTier`). (b) Copy the recipe into a new recipient-owned document
  when added to the cookbook.
- Rationale: This is the parent plan's Decision 3 (`openspec/changes/share-my-library/design.md`),
  carried forward unchanged — restated here because it is the central design
  decision this change actually implements, not merely inherits. (a) requires a
  reconciliation job whose only purpose is keeping derivable state in sync, which is
  itself a source of staleness bugs (the exact failure mode `hiddenByTier` has
  needed prior fixes for, per project history). (b) breaks live-reference semantics
  — the recipient would stop seeing the owner's edits and the copy would count
  against the recipient's own recipe quota, contradicting the proposal's "no new
  `Recipe` document created" requirement.
- Trade-offs: Every `.recipes[]` consumer must resolve entries through visibility
  rather than trusting the array as-is; this is a per-request filter over an
  already-fetched, typically small (single cookbook) recipe set, not an added round
  trip at scale. The audit (Task 3.3) is the primary mechanism for finding every
  place this trade-off must be paid.
- Refinement during implementation: `cookbooks.byId` is a `publicProcedure` —
  emitting `{ recipeId, unavailable: true, orderIndex, chapterId }` for *every*
  caller (not just the cookbook's own owner/editor collaborator) would let an
  anonymous viewer of a public cookbook enumerate the existence, id, and position of
  another user's private recipe by watching an entry silently appear as "unavailable"
  once they lose access to it — a new information-disclosure surface this proposal
  didn't intend to open. The resolver therefore only emits the `unavailable` stub for
  a caller who owns the cookbook or is a collaborator on it, viewer or editor (the
  same privilege `printById` already checks for its `isAuthorized` gate); every other
  caller gets the pre-change behavior of the entry being silently absent. Accepted
  residual: an invited viewer-role collaborator (who has read access to the cookbook
  but not necessarily to every recipe referenced in it) does learn the id,
  orderIndex, and existence of an otherwise-invisible cross-owner entry, which a
  stranger cannot — judged acceptable since the collaborator was deliberately invited
  to that cookbook, but worth re-checking if #674's UI ever surfaces `unavailable`
  entries to non-owner viewers.

### Decision 4: Read-only enforcement is proved, not implemented, via a router-introspecting test

- Chosen: The Task 3.4 test enumerates every mutation procedure registered on the
  `recipes` and `cookbooks` routers programmatically (iterating the router's
  procedure map rather than a hand-authored list of procedure names), invokes each
  as a recipient against the owner's document, and asserts `FORBIDDEN`/`NOT_FOUND`
  plus an unchanged document. No new guard, middleware, or check is added to any
  mutation as part of this change.
- Alternatives considered: (a) Add an explicit `assertNotSharedOnly(ctx, doc)` guard
  to every mutation, defense-in-depth style. (b) Hand-list the mutations to test
  rather than deriving the list from the router.
- Rationale: This restates and operationalizes the parent plan's Decision 4. (a) is
  rejected because `doc.userId !== recipient.id` already causes every existing
  mutation to reject a recipient — adding a parallel guard is dead code implying a
  richer permission system than exists, and risks a future mutation shipping with
  the guard present but the underlying ownership check subtly wrong, masked by the
  guard. (b) defeats the point: the value of this test is that adding a new mutation
  to the router automatically adds it to the sweep; a hand-list requires remembering
  to update it, which is exactly the kind of drift Task 3.1's "one case per
  discovered call site" requirement is also designed against.
- Trade-offs: If router introspection can't cleanly enumerate mutation procedures
  (framework-dependent), the test must fall back to a documented, exhaustively
  cross-checked hand-list with a comment explaining why introspection wasn't
  possible — this is a known implementation risk, not a design ambiguity, and is
  flagged in Risks below.

## Proposal to Design Mapping

- Proposal element: Thread `sharedOwnerIds` through every `visibilityFilter` call site
  - Design decision: Decision 1
  - Validation approach: One test per call site asserting shared content appears;
    regression test that a caller with `sharedOwnerIds: []` sees byte-identical
    results to pre-change behavior.
- Proposal element: `sharedBy` on read payloads via single batched lookup
  - Design decision: Decision 2
  - Validation approach: Query-count assertion (one lookup per response, not N);
    payload assertions that `sharedBy` is `null` for owned/public content and
    `{ id, name }` for shared content, with no email/tier present.
- Proposal element: Recipient adds shared recipe to own cookbook; unavailable
  fallback
  - Design decision: Decision 3
  - Validation approach: Integration test adding, then revoking/downgrading/deleting
    the source recipe and asserting `unavailable: true` with `orderIndex`/
    `chapterId` preserved and no leaked content; explicit test that the print route
    excludes cross-owner entries.
- Proposal element: Table-driven, router-derived read-only enforcement sweep
  - Design decision: Decision 4
  - Validation approach: The test itself is the validation — it must fail if run
    against a hypothetical mutation that doesn't check ownership, proving the sweep
    isn't vacuous (verified by temporarily commenting out an ownership check during
    development, per `superpowers:test-driven-development` practice, then reverting).

## Functional Requirements Mapping

- Requirement: A recipient sees the owner's private recipes and cookbooks read-only.
  - Design element: Decision 1 — `sharedOwnerIds` threaded into every
    `visibilityFilter` call.
  - Acceptance criteria reference: `specs/library-sharing-read-path/spec.md` —
    "Recipient visibility".
  - Testability notes: Seed owner content pre- and post-grant; assert recipient sees
    both, a stranger sees neither.
- Requirement: Hidden content (tier-hidden, soft-deleted) stays hidden from
  recipients even when shared.
  - Design element: Decision 1 — the shared clause inherits the same
    `hiddenByTier`/soft-delete exclusions as every other `visibilityFilter` clause
    (already true of the filter shape shipped in PR1; this change is responsible for
    not bypassing it at any call site).
  - Acceptance criteria reference: "Hidden content stays hidden".
  - Testability notes: Owner has a `hiddenByTier: true` recipe and a soft-deleted
    recipe; assert both absent from the recipient's `recipes.list`.
- Requirement: Owner identity is visible to the recipient, with no other owner PII.
  - Design element: Decision 2 — `sharedBy: { id, name }` via `userLookupStages`
    projection.
  - Acceptance criteria reference: "Recipient visibility"; NFAC Security.
  - Testability notes: Assert payload keys exhaustively — no `email`, no `tier`
    field present anywhere in `sharedBy` or elsewhere in the response attributable to
    the owner.
- Requirement: A recipient can add a shared recipe to a cookbook they own without
  creating a new `Recipe` document or affecting their quota.
  - Design element: Decision 3.
  - Acceptance criteria reference: "Adding shared recipes to own cookbooks".
  - Testability notes: Assert `Recipe.countDocuments({ userId: recipient.id })` is
    unchanged after the add; assert the recipient's quota-usage read is unchanged.
- Requirement: A cross-owner entry that becomes inaccessible renders as
  `unavailable: true` without leaking content, preserving position.
  - Design element: Decision 3 — read-time resolution against live visibility.
  - Acceptance criteria reference: "Unavailable shared entries".
  - Testability notes: Three independent triggers (revoke grant, downgrade owner
    tier, soft-delete recipe) each independently produce `unavailable: true`;
    `orderIndex`/`chapterId` unchanged in all three; response contains no recipe
    name/ingredients/instructions for that entry.
- Requirement: No mutation grants a recipient write access to shared content.
  - Design element: Decision 4.
  - Acceptance criteria reference: "Read-only enforcement".
  - Testability notes: Router-derived exhaustive table; explicit sub-case for
    collaborator-management mutations (add/remove collaborator) and cookbook-entry
    mutations (add/remove recipe), since these are structurally different from
    simple field-update mutations and easiest to overlook.
- Requirement: The print route does not render cross-owner cookbook entries.
  - Design element: Decision 3, scoped exclusion — deferred to #669 for
    attribution, but exclusion (not silent inclusion) is required now.
  - Acceptance criteria reference: "Unavailable shared entries" (print-route
    carve-out, tracked against #669 as a forward dependency).
  - Testability notes: Explicit test rendering/resolving a print-route payload for a
    cookbook containing a cross-owner entry; assert the entry is excluded, not
    rendered as `unavailable` or otherwise.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: `sharedBy` resolution for a list of N items costs one additional
    batched query, not N.
  - Design element: Decision 2.
  - Testability notes: Assert exact query count via a query-counting test harness
    (existing pattern from PR1's `context.integration.test.ts` query-count
    assertions) for N = 1 and N > 1 shared items in one response.
- Requirement category: security
  - Requirement: Owner email and tier never appear in any recipe/cookbook read
    payload, including nested `sharedBy`.
  - Design element: Decision 2 — explicit allow-list projection (`{ id, name }`
    only), mirroring the `sharing` router's existing allow-list projection pattern
    from PR2.
  - Testability notes: Snapshot/shape assertion on the full response object, not
    just the `sharedBy` sub-object, to catch a leak introduced elsewhere in the same
    aggregation.
- Requirement category: security
  - Requirement: A revoked or downgraded owner's content is not recoverable from a
    previously-cached client id.
  - Design element: Decision 1 + Decision 3 — visibility is recomputed from live
    `ctx.sharedOwnerIds` on every request; nothing is cached server-side across
    requests.
  - Testability notes: Grant → fetch by id (succeeds) → revoke → re-fetch same id →
    `NOT_FOUND`.
- Requirement category: reliability
  - Requirement: A `LibraryShare` whose `recipientId` points at a deleted user
    grants access to nobody and does not throw.
  - Design element: Decision 1 — `ctx.sharedOwnerIds` computation (PR1, unchanged)
    already fails closed; this change's obligation is that no new call site
    introduces an unguarded lookup of the recipient's own user document that could
    throw on a dangling reference.
  - Testability notes: Construct a grant with a recipient id that has no
    corresponding user document (or whose user was deleted); assert no error
    surfaces from any of the four touched endpoints.
- Requirement category: reliability
  - Requirement: A user who is both a grantee and a cookbook collaborator keeps
    collaborator write access on that specific cookbook while the rest of the shared
    library stays read-only.
  - Design element: Decision 1 + Decision 4 — `collabCookbookIds` and
    `sharedOwnerIds` are independent inputs to `visibilityFilter`/mutation checks;
    collaborator status is never derived from or overridden by sharing status.
  - Testability notes: Seed both a `LibraryShare` grant and a `Collaborator` row for
    the same two users on one specific cookbook; assert writes succeed on that
    cookbook and are rejected on every other owner cookbook.

## Risks / Trade-offs

- Risk/trade-off: The Task 3.1 (`visibilityFilter`) and Task 3.3 (`.recipes[]`)
  greps miss a call site because it's reached indirectly (e.g. through a shared
  query-building helper rather than a literal `visibilityFilter(` or `.recipes`
  token match).
  - Impact: Silent under-sharing (safe but incomplete) or, worse for `.recipes[]`,
    an unresolved-visibility leak.
  - Mitigation: Both grep result lists are recorded verbatim in the eventual PR
    description per the parent issue's requirement, giving review an explicit
    completeness artifact to check against the actual diff, not just trusting the
    author's memory.
- Risk/trade-off: Decision 4's router-introspection approach may not be mechanically
  straightforward depending on how tRPC routers expose their procedure map at
  runtime in this codebase's tRPC version.
  - Impact: Falling back to a hand-list reintroduces the exact drift risk Decision 4
    exists to eliminate.
  - Mitigation: If introspection proves impractical, the implementation must add a
    companion test asserting the hand-list's length matches
    `Object.keys(router._def.procedures).length` (or the equivalent for the tRPC
    version in use), so an added mutation at least fails the count assertion instead
    of silently going untested.
- Risk/trade-off: Extending four existing aggregations (`recipes.list/byId`,
  `cookbooks.list/byId`) with an additional lookup stage increases each pipeline's
  complexity and risk of subtle stage-ordering bugs (e.g. a `$match` after the
  `$lookup` inadvertently filtering on a field that no longer exists at that stage).
  - Impact: A misordered pipeline could silently drop results or mis-attribute
    `sharedBy`.
  - Mitigation: `sharedBy` projection is added as a late stage, after all existing
    filtering/sorting/pagination stages, specifically to avoid interacting with
    them; this ordering constraint is captured as an explicit code-review checkpoint
    in tasks.md.

## Rollback / Mitigation

- Rollback trigger: A production incident traced to this change — e.g. a
  `.recipes[]` consumer found post-merge that leaks cross-owner recipe content, or
  the read-only enforcement sweep proves to have a gap exploited in the wild.
- Rollback steps: This change is purely additive to read paths and contains no
  schema migration (per Decision 3, `ICookbookRecipeEntry` is unchanged). Revert is
  a plain `git revert` of the merge commit; no data backfill or forward-fix is
  required since no persisted state was written by this change. `ctx.sharedOwnerIds`
  itself (computed in PR1) is unaffected by reverting this change — reverting only
  removes this change's *consumption* of it, returning to the PR1/PR2 dark-ship
  state.
- Data migration considerations: None. No document shape changes.
- Verification after rollback: Confirm `recipes.list`/`byId` and
  `cookbooks.list`/`byId` no longer include shared content or `sharedBy` for a
  previously-verified grant; confirm existing (pre-change) test suites for those
  routers still pass unmodified.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying test or code; do not weaken the read-only
  enforcement sweep's assertions or narrow its router-derived coverage to make it
  pass.
- If security checks fail: Any finding on owner-identity exposure (email/tier
  leakage) or on the read-only enforcement sweep is blocking per this project's
  standing policy (mirrors PR2's "security findings on `sharing.ts` are blocking and
  must not be waived") and must not be waived without an explicit, cited human
  acceptance (see `CLAUDE.md` "Quality gate: accepted risks").
- If required reviews are blocked/stale: Escalate per the parent epic's own PR
  sequencing — this is explicitly called "the highest-risk PR in the sequence" by
  issue #673, so a stale review should not be worked around by narrowing scope
  without re-confirming the narrowed scope against `tasks.md` Phase 3 first.
- Escalation path and timeout: No project-specific SLA found for this repository;
  default to the standing PR review/auto-merge conventions in `CLAUDE.md` (thread
  resolution required, auto-merge once gates pass).

## Open Questions

- None blocking. This design fully inherits and operationalizes Decisions 3 and 4
  from the already-approved parent plan (`openspec/changes/share-my-library/design.md`);
  the only new design content here is Decisions 1 and 2, which are mechanical
  consequences of "thread an existing parameter" and "reuse an existing batched-join
  helper" and carry no unresolved trade-off requiring a human call.

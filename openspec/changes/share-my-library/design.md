## Context

- Relevant architecture:
  - Visibility for user-owned content is centralized in `visibilityFilter()` in
    `src/server/trpc/routers/_helpers.ts`. It returns a Mongoose `$or` filter with a
    public clause, an owner clause, and (since Collaboration) a collaborator clause.
  - Per-request authorization data is assembled in `src/server/trpc/context.ts`, which
    already performs one indexed lookup to build `ctx.collabCookbookIds`.
  - Write authorization is ownership-based: `verifyOwnership()` and
    `verifyCookbookOwner()` compare `doc.userId` against the caller and throw
    `FORBIDDEN` on mismatch.
  - Tier policy lives in `src/lib/tier-entitlements.ts` (`TIER_LIMITS`,
    `TIER_DESCRIPTIONS`, `hasAtLeastTier`). Project convention keeps entitlement
    decisions in this shared module rather than inline in routers.
  - `execChefProcedure` (`src/server/trpc/routers/cookbooks.ts:258`) is the existing
    Executive-Chef-gated procedure wrapper built on `verifiedProcedure`.
  - `usersRouter.search` is already Executive-Chef gated and regex-escapes input; it
    is the existing user-lookup primitive for invite flows.
  - Account UI is a single page (`src/routes/account.tsx`) composing section
    components from `src/components/account/`.
- Dependencies:
  - Mongoose models in `src/db/models/`, barrel-exported via `index.ts`.
  - Existing `Collaborator` model and its `reconcileCollaborationOnDowngrade()` in
    `src/lib/reconcile-user-content.ts` (referenced for contrast; not modified).
  - `Recipe` soft-delete middleware, which already excludes deleted recipes from all
    reads and therefore from shared reads.
- Interfaces/contracts touched:
  - `visibilityFilter(user, collabCookbookIds)` → gains a third parameter.
  - `Context` type → gains `sharedOwnerIds: string[]`.
  - tRPC router surface → new `sharing` router; `sharedBy` added to recipe and
    cookbook read payloads.
  - `ICookbookRecipeEntry` → **unchanged**; cross-owner semantics are derived.

## Goals / Non-Goals

### Goals

- Let an Executive Chef grant named users read-only access to their entire library —
  all private recipes and all cookbooks, including content created after the grant.
- Make revocation (explicit, or implicit via tier downgrade) take effect immediately
  with no background job and no data mutation.
- Let a recipient place a shared recipe into their own cookbook without copying it,
  and degrade that reference gracefully when access ends.
- Reuse existing invite plumbing (`users.search`, Executive-Chef gating) rather than
  building a parallel mechanism.
- Keep read-only enforcement structural, adding no new write-path permission checks.

### Non-Goals

- Any write access for recipients.
- Changing, migrating, or deprecating cookbook Collaboration.
- Print-view attribution (deferred to #669).
- Selective/partial sharing, onward re-sharing, notifications, or email invites.
- Changing tier limits, pricing, or `TIER_LIMITS` values.

## Decisions

### Decision 1: Separate `LibraryShare` collection, role-less and account-scoped

- Chosen: A new collection `library-shares` with
  `{ ownerId, recipientId, addedAt, addedBy }`, indexed on `recipientId`, on
  `ownerId`, and uniquely on `(ownerId, recipientId)`. No `role` field.
- Alternatives considered:
  - (a) Add a `sharedWith: ObjectId[]` array to the user document.
  - (b) Reuse `Collaborator` with a nullable `cookbookId` meaning "whole library".
  - (c) Add `isLibraryShared` boolean + a recipients array on each `Cookbook`.
- Rationale: A dedicated collection mirrors the shipped `Collaborator` shape, so the
  codebase gains a second instance of a pattern maintainers already understand. An
  unbounded array on the user document (a) grows without a natural cap and cannot be
  uniquely indexed per pair. Overloading `Collaborator` (b) makes every existing
  collaborator query ambiguous and risks a nullable `cookbookId` leaking into the
  cookbook-scoped code paths. (c) re-denormalizes the grant onto every document and
  breaks the "future content is automatically included" requirement.
- Trade-offs: One more collection and one more per-request query. Accepted: the query
  is indexed, returns only `ownerId`, and is skipped entirely for users with no grants.

### Decision 2: Live tier check in context, no reconciliation job

- Chosen: `ctx.sharedOwnerIds` is computed per request by reading the caller's
  `LibraryShare` rows and filtering to owners whose **current** tier is still
  Executive Chef. Grant rows are never deleted on downgrade.
- Alternatives considered: Mirror Collaboration's `reconcileCollaborationOnDowngrade()`
  and physically delete grant rows when an owner downgrades.
- Rationale: Because access is read-only, there is no owned-content bookkeeping to
  settle at downgrade time — nothing to unlink, re-parent, or recount. A live check
  yields instant revocation with strictly less machinery, and it makes re-upgrade
  restore prior grants for free, which deletion would destroy. Deletion would also
  introduce a race between grant creation and downgrade that the live check cannot
  have, because the check reads committed tier state at request time.
- Trade-offs: Deliberately asymmetric with Collaboration, which a maintainer may find
  surprising. Mitigated by documenting the rationale in the model file and this
  design. Also adds a tier join to context; bounded by the number of grants received.

### Decision 3: Cross-owner cookbook entries are derived, not persisted

- Chosen: No schema change to `ICookbookRecipeEntry`. When resolving a cookbook's
  `recipes[]`, each referenced recipe is checked against the caller's live visibility
  (own, public, collaborator, or shared). Entries that do not resolve are returned as
  `{ recipeId, unavailable: true }` and render as a placeholder that preserves
  ordering and chapter placement.
- Alternatives considered:
  - (a) Persist `sharedFromUserId` on the entry plus an `unavailable` flag maintained
    by a reconciliation job (the `hiddenByTier` pattern).
  - (b) Copy the recipe into a new document owned by the recipient at add time.
  - (c) Forbid adding shared recipes to one's own cookbook.
- Rationale: The entry already stores `recipeId`, and the `Recipe` document already
  stores its true `userId` — the owner is therefore always recoverable, making stored
  denormalization redundant and capable of going stale. (a) requires a reconciliation
  job whose only purpose is to keep derivable data in sync. (b) breaks the read-only,
  always-current contract: the copy diverges from the owner's edits and would count
  against the recipient's tier limits. (c) is explicitly required by #668.
- Trade-offs: Cookbook detail resolution must consult visibility per entry rather than
  trusting a stored flag. This is one filter over an already-fetched recipe set, not
  an extra round trip.

### Decision 4: Read-only by omission, not by a new permission layer

- Chosen: Add `sharedOwnerIds` only to read paths (`visibilityFilter` and read
  payload assembly). Write paths keep using `verifyOwnership()` /
  `verifyCookbookOwner()` unchanged.
- Alternatives considered: Introduce an `accessLevel` concept spanning both features,
  or add explicit `FORBIDDEN` guards for shared users on every mutation.
- Rationale: A recipient's `doc.userId` never equals their own id, so every existing
  mutation already rejects them. Adding explicit guards would be dead code that
  implies a permission system richer than what exists, and creates the risk that a
  future mutation is written with the guard but without ownership checking.
- Trade-offs: The read-only guarantee is implicit in an existing invariant rather than
  locally visible at each mutation. Mitigated by spec-level tests asserting that every
  recipe and cookbook mutation rejects a shared recipient.

### Decision 5: Single "Sharing & Collaboration" account section

- Chosen: One new `SharingSection` component on `src/routes/account.tsx` that manages
  library shares (invite, list, revoke) and lists existing cookbook collaborations,
  linking to each cookbook for collaborator management.
- Alternatives considered: A separate top-level route; or a sharing panel embedded in
  each cookbook detail page only.
- Rationale: Library sharing is account-scoped, so the account page is its natural
  home, and users think of "who can see my stuff" as one question. Surfacing existing
  collaborations read-only in the same place answers that question completely without
  relocating the per-cookbook invite flow that already works.
- Trade-offs: Collaborator management stays split — viewable on the account page,
  editable on the cookbook page. Accepted to avoid reworking shipped Collaboration UI.

### Decision 6: Recipients need no tier; sharers must hold Executive Chef continuously

- Chosen: `shareLibrary` / `revokeLibraryShare` use `execChefProcedure`. No tier check
  is applied to recipients. Active access additionally requires the owner's tier to
  still be Executive Chef at read time (Decision 2).
- Alternatives considered: Require recipients to hold at least Sous Chef, the tier at
  which private recipes first appear.
- Rationale: The capability is purchased by the sharer; gating the recipient would
  reduce the feature's value to the paying user and remove its funnel effect. A
  recipient viewing shared content creates no content and consumes no quota.
- Trade-offs: Free-tier users gain read access to private content, increasing read
  load from non-paying accounts. Bounded by the number of Executive Chef sharers.

### Decision 7: Mixed-in lists with a "Shared with me" badge

- Chosen: Shared recipes and cookbooks appear in the recipient's normal list views,
  each carrying `sharedBy: { id, name }`, rendered as a "Shared with me" badge.
- Alternatives considered: A separate "Shared With Me" route, mirroring
  Collaboration's `myCollaborations`.
- Rationale: Explicitly requested. A shared library is meant to feel like an extension
  of the recipient's own collection — they search and browse one place.
- Trade-offs: Shared content dilutes list views and interacts with pagination and
  counts. List result counts now include content the user does not own; any UI
  displaying "your N recipes" must derive its count from owned content only.

## Proposal to Design Mapping

- Proposal element: New `LibraryShare` collection with unique `(ownerId, recipientId)`
  - Design decision: Decision 1
  - Validation approach: Model unit tests for index constraints; integration test
    asserting a duplicate grant is rejected and self-share is refused.
- Proposal element: `ctx.sharedOwnerIds` filtered by owner's current tier
  - Design decision: Decision 2
  - Validation approach: Integration tests covering grant → visible, owner downgrade →
    immediately invisible, owner re-upgrade → visible again, all without mutating rows.
- Proposal element: `visibilityFilter` gains a `sharedOwnerIds` clause
  - Design decision: Decision 2 + Decision 4
  - Validation approach: Unit tests on the returned filter shape for each caller
    category; regression test that omitting the parameter preserves prior behavior.
- Proposal element: Recipients may add shared recipes to their own cookbooks
  - Design decision: Decision 3
  - Validation approach: Integration test adding a shared recipe to an owned cookbook,
    then revoking and asserting the entry returns `unavailable: true` with ordering
    and chapter placement preserved.
- Proposal element: `sharedBy` on recipe/cookbook read payloads
  - Design decision: Decision 7
  - Validation approach: Router tests asserting `sharedBy` is populated for shared
    content, `null` for owned/public content; component tests for badge rendering.
- Proposal element: Read-only enforcement
  - Design decision: Decision 4
  - Validation approach: Table-driven test invoking every recipe and cookbook mutation
    as a shared recipient and asserting `FORBIDDEN`/`NOT_FOUND`.
- Proposal element: "Sharing & Collaboration" account section
  - Design decision: Decision 5
  - Validation approach: Component tests for invite/list/revoke; E2E covering the
    grant-to-visibility round trip across two users.
- Proposal element: Executive-Chef-only sharing, no recipient tier floor
  - Design decision: Decision 6
  - Validation approach: Router tests asserting non-Executive-Chef callers receive
    `FORBIDDEN` on `shareLibrary`, and that a free-tier recipient can read shared
    content.
- Proposal element: Print impact deferred
  - Design decision: Out of scope; tracked in #669
  - Validation approach: Task asserting print paths do not render cross-owner entries
    until #669 is resolved.

## Functional Requirements Mapping

- Requirement: An Executive Chef can grant a named user read access to their library.
  - Design element: `sharing.shareLibrary` on `execChefProcedure`; `LibraryShare` row.
  - Acceptance criteria reference: `specs/library-sharing/spec.md` — "Granting library
    access".
  - Testability notes: Router integration test with a seeded Executive Chef and a
    target user; assert row created with correct `ownerId`/`recipientId`/`addedBy`.
- Requirement: A recipient sees the owner's private recipes and cookbooks read-only.
  - Design element: `ctx.sharedOwnerIds` + `visibilityFilter` shared clause.
  - Acceptance criteria reference: "Recipient visibility".
  - Testability notes: Seed private content, assert presence in `recipes.list` and
    `cookbooks.list` for the recipient and absence for an unrelated user.
- Requirement: A recipient cannot modify any shared content.
  - Design element: Decision 4 — unchanged ownership checks.
  - Acceptance criteria reference: "Read-only enforcement".
  - Testability notes: Exhaustive mutation table test; must cover update, delete, and
    collaborator-management procedures.
- Requirement: A recipient can add a shared recipe to their own cookbook.
  - Design element: Decision 3 — cross-owner `recipes[]` entry.
  - Acceptance criteria reference: "Adding shared recipes to own cookbooks".
  - Testability notes: Assert entry persists, resolves with `sharedBy` populated, and
    does not increment the recipient's recipe quota usage.
- Requirement: Revoking a share removes access immediately.
  - Design element: `sharing.revokeLibraryShare` deleting the grant row.
  - Acceptance criteria reference: "Revoking a share".
  - Testability notes: Assert content invisible on the very next request, with no
    intervening job.
- Requirement: Owner downgrade suspends all their shares immediately.
  - Design element: Decision 2 — live tier filter.
  - Acceptance criteria reference: "Tier downgrade suspends shares".
  - Testability notes: Mutate owner tier directly in the DB, assert next request for
    the recipient returns nothing, and assert grant rows still exist.
- Requirement: An unavailable cross-owner entry renders as a placeholder.
  - Design element: Decision 3 — derived `unavailable` flag.
  - Acceptance criteria reference: "Unavailable shared entries".
  - Testability notes: Revoke, then assert `cookbooks.byId` returns the entry with
    `unavailable: true` and preserved `orderIndex`/`chapterId`.
- Requirement: Owner can see and revoke every grant they have made.
  - Design element: `sharing.myLibraryShares` + `SharingSection`.
  - Acceptance criteria reference: "Managing shares".
  - Testability notes: Component test for list + revoke; assert optimistic UI reverts
    on server error.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Context creation adds at most one additional indexed query per
    authenticated request.
  - Design element: Decision 2 — single `LibraryShare` lookup projected to `ownerId`,
    joined against owner tier; skipped when the caller holds no grants.
  - Acceptance criteria reference: "Recipient visibility" (non-functional note).
  - Testability notes: Assert query count in a context-creation unit test; assert the
    lookup is skipped entirely for a user with no grant rows.

- Requirement category: security
  - Requirement: Shared access never escalates to write access, and never exposes
    `hiddenByTier` or soft-deleted content.
  - Design element: Decision 4; shared `$or` clause retains `hiddenByTier: { $ne: true }`;
    `Recipe` soft-delete middleware applies unchanged.
  - Acceptance criteria reference: "Read-only enforcement", "Hidden content stays hidden".
  - Testability notes: Seed `hiddenByTier: true` and soft-deleted recipes owned by the
    sharer; assert both are absent from every recipient-facing query.

- Requirement category: security
  - Requirement: Only Executive Chef users can initiate a share or enumerate users.
  - Design element: Decision 6 — `execChefProcedure`; existing `users.search` gate.
  - Acceptance criteria reference: "Granting library access".
  - Testability notes: Assert `FORBIDDEN` for each lower tier on `shareLibrary`.

- Requirement category: reliability
  - Requirement: Revocation is immediate and cannot be defeated by stale state.
  - Design element: Decision 2 — authorization computed from committed state per
    request; no cached grant set.
  - Acceptance criteria reference: "Revoking a share", "Tier downgrade suspends shares".
  - Testability notes: Back-to-back request test with no job execution in between.

- Requirement category: operability
  - Requirement: The feature is fully reversible without data migration.
  - Design element: Additive-only schema; no changes to `Recipe` or `Cookbook`.
  - Acceptance criteria reference: Rollback section below.
  - Testability notes: Verify that dropping the `library-shares` collection restores
    pre-feature behavior with no orphaned fields on existing documents.

## Risks / Trade-offs

- Risk/trade-off: Asymmetry with Collaboration's reconcile-on-downgrade approach.
  - Impact: A maintainer extending one feature may wrongly assume the other behaves
    identically, e.g. adding a reconciliation job that deletes grant rows and silently
    breaks re-upgrade restoration.
  - Mitigation: Document the rationale in `src/db/models/library-share.ts` and in
    Decision 2; add a test asserting grant rows survive a downgrade/re-upgrade cycle.

- Risk/trade-off: Cross-owner entries break the implicit same-owner assumption in
  cookbook consumers.
  - Impact: A consumer that resolves `recipes[]` without a visibility check could leak
    a recipe or fail on an unresolvable id. Print (`cookbooks.$cookbookId_.print.tsx`)
    is the highest-risk consumer.
  - Mitigation: A dedicated task audits every consumer of `Cookbook.recipes[]`; print
    is explicitly excluded from cross-owner support until #669.

- Risk/trade-off: Mixed-in shared content distorts counts and pagination.
  - Impact: A user could see a recipe count that exceeds their tier limit, implying a
    quota bug.
  - Mitigation: Quota displays must count owned content only; covered by an explicit
    task and an acceptance criterion.

- Risk/trade-off: Privacy surprise from whole-library sharing.
  - Impact: Unintended disclosure of content the owner considered sensitive.
  - Mitigation: Confirmation copy in the invite flow stating the grant covers all
    current and future private content; the grantee list is always visible.

- Risk/trade-off: Additional read load from non-paying recipients.
  - Impact: Free-tier accounts can read Executive Chef libraries.
  - Mitigation: Bounded by paying sharers; no new unauthenticated surface. Revisit if
    grant counts per owner become large.

## Rollback / Mitigation

- Rollback trigger: Shared content appearing for users without a valid grant; any
  recipient successfully mutating owner content; or unacceptable context-creation
  latency regression.
- Rollback steps:
  1. Revert the feature branch merge. All changes are additive; no existing document
     shape changes.
  2. `visibilityFilter`'s new parameter defaults to `[]`, so any partially reverted
     call site degrades to pre-feature visibility rather than over-sharing.
  3. Optionally drop the `library-shares` collection. Retaining it is harmless — with
     the code reverted, nothing reads it.
- Data migration considerations: None. No backfill, no field added to `Recipe` or
  `Cookbook`, no rewrite of existing documents. Cross-owner cookbook entries created
  while the feature was live persist as ordinary `recipeId` references; after rollback
  they resolve through the pre-existing visibility rules and simply return nothing for
  the recipient, which is the correct post-rollback behavior.
- Verification after rollback: Confirm a former recipient's `recipes.list` and
  `cookbooks.list` contain only their own and public content; confirm owners' content
  is unchanged; confirm cookbooks containing cross-owner entries still render.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch. Do not merge with failing required
  checks and do not bypass hooks (`--no-verify`) or waive quality-gate findings to get
  green. If a failure is a confirmed false positive, record it through the project's
  feedback mechanism rather than a blanket waiver.
- If security checks fail: Treat as blocking without exception, given this change
  alters an authorization boundary. Any Codacy/Snyk finding touching
  `visibilityFilter`, `context.ts`, or the `sharing` router must be resolved, not
  waived. Re-run the security review after any change to those files.
- If required reviews are blocked/stale: Re-request review after pushing fixes. If a
  review remains unaddressed for two working days, escalate to the repository owner
  (@dougis) on the PR. Do not self-merge an authorization change.
- Escalation path and timeout: PR comment → direct mention of @dougis → if still
  blocked after five working days, park the branch and record the blocker in the
  change's `tasks.md` rather than merging partial work.

## Open Questions

- None blocking. All design questions raised during the explore session were resolved
  and are recorded in Decisions 1-7 and in `proposal.md` under "Open Questions".
- Deferred (non-blocking, tracked in #669): how print views attribute shared content
  and render unavailable cross-owner entries.

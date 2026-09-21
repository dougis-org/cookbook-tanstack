## Context

- Relevant architecture:
  - `visibilityFilter(user, collabCookbookIds)` in `src/server/trpc/routers/_helpers.ts`
    is the single source of truth for read visibility. It returns a Mongoose `$or`
    filter: public-and-not-hidden, owned-and-not-hidden, and (third clause, added by
    Collaboration) a specific set of collaborated-on cookbook ids.
  - `src/server/trpc/context.ts` assembles per-request authorization data. It already
    performs one indexed `Collaborator.find()` to build `collabCookbookIds`, with no
    error handling.
  - `tier` is a field on the Better-Auth `user` document, reached exclusively through
    `getBetterAuthCollection("user")` (`src/db/index.ts`) — the raw MongoDB driver
    collection, not a Mongoose model. `ctx.user.tier` is populated from the session at
    login time and reflects the *caller's* tier as of session creation; it says
    nothing about any other user's *current* tier.
  - `src/server/trpc/routers/cookbooks.ts:229` defines `userLookupStages(localField,
    alias)`, a two-stage `$lookup`+`$unwind` pipeline fragment that joins a Mongoose
    aggregation against the raw `user` collection by `_id`. It is used today only by
    `fetchCollaboratorsWithUsers` (`cookbooks.ts:237`), for display names — not for any
    access decision. It is module-private (not exported).
  - `src/db/models/collaborator.ts` is the closest existing precedent for the new
    model: a small join-table-shaped Mongoose model with a unique compound index.
- Dependencies:
  - Mongoose models in `src/db/models/`, barrel-exported via `index.ts`.
  - `src/lib/tier-entitlements.ts` for the `executive-chef` tier constant — this PR
    reads it, does not modify it.
  - The epic's spec (`openspec/specs` after archive, currently
    `openspec/changes/share-my-library/specs/library-sharing/spec.md`) — this change
    implements a subset of its ADDED/MODIFIED requirements; see mapping below.
- Interfaces/contracts touched:
  - `visibilityFilter(user, collabCookbookIds, sharedOwnerIds)` — new third parameter,
    defaulted, additive.
  - `Context` type (`src/server/trpc/context.ts`) — gains `sharedOwnerIds: string[]`.
  - `userLookupStages` — moves from `cookbooks.ts` (private) to `_helpers.ts`
    (exported). Its call signature and behavior are unchanged; only its location and
    visibility change.

## Goals / Non-Goals

### Goals

- Make `ctx.sharedOwnerIds` available to every authenticated request, correctly
  reflecting live grant state and live owner tier, at the cost of exactly one
  additional indexed query.
- Make `visibilityFilter` able to express "owned by any of these other users" without
  changing behavior for any caller that does not pass the new parameter.
- Establish the `LibraryShare` collection with the same rigor as `Collaborator`
  (indexes, uniqueness) so #672's mutations have a correct foundation to write into.
- Leave `userLookupStages` reusable rather than duplicated, since #671 and any future
  aggregation-based user join both need it.

### Non-Goals

- Making any shared content actually visible in a list or detail response — that is
  call-site threading, deferred to #673.
- Building `shareLibrary` / `revokeLibraryShare` — #672.
- Retrofitting `collabCookbookIds` to fail closed — #677.
- Any UI change.

## Decisions

### Decision 1: `ctx.sharedOwnerIds` is one aggregation, not two queries

- Chosen: `LibraryShare.aggregate([{ $match: { recipientId } }, ...userLookupStages
  ('ownerId', '_owner'), { $match: { '_owner.tier': 'executive-chef' } }, { $project: {
  ownerId: 1 } }])`. One round trip, reusing the exact `$lookup`+`$unwind` shape already
  proven at `cookbooks.ts:229`.
- Alternatives considered: (a) `LibraryShare.find({ recipientId })` to get candidate
  owner ids, then a second query against `getBetterAuthCollection("user")` filtering
  those ids to `executive-chef`. (b) Cache each owner's tier on the `LibraryShare`
  document at grant time, refreshed by a job.
- Rationale: (a) is the naive path and is what "join grant rows against tier" reads
  as if taken literally without checking the existing codebase — but it costs two
  queries, which conflicts with the epic spec's NFAC ("at most one additional indexed
  query... that query projects only the `ownerId` field"). (b) reintroduces exactly the
  kind of denormalization-plus-reconciliation-job pattern that design Decision 2 of the
  epic explicitly rejected for cross-owner cookbook entries, for the same reason: a
  cached copy of live state needs a job to stay correct, and the live join makes that
  job unnecessary.
- Trade-offs: The aggregation is less obvious to a reader unfamiliar with
  `fetchCollaboratorsWithUsers` than two separate `.find()` calls would be. Mitigated
  by a code comment pointing to that function as the precedent.

### Decision 2: Relocate `userLookupStages` into `_helpers.ts`, don't duplicate it

- Chosen: Move the function from `cookbooks.ts` to `_helpers.ts`, export it, update
  `cookbooks.ts`'s two call sites to import it.
- Alternatives considered: (a) Copy a second implementation into `context.ts`. (b)
  Implement the `$lookup`+`$unwind` inline in `context.ts` without extracting anything.
- Rationale: `_helpers.ts` is already the shared home for cross-router primitives
  (`visibilityFilter`, `verifyOwnership`, `escapeRegex`) and is already being edited by
  this PR. (a) creates two independent implementations of the same two-line pipeline
  fragment that can drift — the exact failure mode `_helpers.ts` exists to prevent. (b)
  is viable but throws away a working, tested pattern for no benefit.
- Trade-offs: Widens this PR's diff into `cookbooks.ts`, a file otherwise untouched by
  this change. Mitigated by keeping the edit mechanical (import instead of define) and
  requiring `cookbooks.ts`'s existing collaborator-aggregation tests to pass unchanged.

### Decision 3: Grants are never deleted; tier eligibility is evaluated live

- Chosen: `LibraryShare` rows persist across an owner's tier changes. Eligibility
  (`_owner.tier === 'executive-chef'`) is evaluated fresh on every request via the
  Decision 1 aggregation.
- Alternatives considered: Physically delete `LibraryShare` rows when an owner
  downgrades, mirroring `reconcileCollaborationOnDowngrade()`.
- Rationale: This is epic design Decision 2, carried into this PR's scope because it
  is `ctx.sharedOwnerIds` that implements it. Deletion would require a reconciliation
  job with no compensating benefit — read-only access has no owned-content bookkeeping
  to settle — and would make re-upgrade require re-granting, which the epic proposal
  explicitly does not want.
- Trade-offs: A maintainer who knows the `Collaborator` pattern will expect
  `LibraryShare` to behave the same way and may add a downgrade job unprompted. This
  is why Task 1.2 requires a comment on the model file itself, not just in this design
  doc.

### Decision 4: Failure of the tier lookup degrades to `[]`, not a thrown error

- Chosen: The aggregation in Decision 1 is wrapped; any failure (timeout, connection
  error) results in `sharedOwnerIds = []` for that request, not a propagated exception.
- Alternatives considered: Let it throw, consistent with the adjacent
  `collabCookbookIds` block, which has no such wrapping.
- Rationale: The epic spec (`NFAC Reliability — "Recovery behavior"`) requires this
  explicitly: a failed owner-tier lookup must not turn into either a broken request or
  an accidental full-visibility fallback. Fail closed on access (no shared content
  shown), fail open on availability (request still succeeds).
- Trade-offs: This makes `sharedOwnerIds` behave differently under failure than
  `collabCookbookIds` in the same function, which is a real inconsistency. It is not
  resolved here — #677 tracks the deliberate decision about whether to retrofit
  `collabCookbookIds` to match. This PR's obligation is to comment the asymmetry where
  it lives, not to resolve it unilaterally.

## Proposal to Design Mapping

- Proposal element: New `LibraryShare` collection
  - Design decision: Decision 3 (persistence semantics); model mirrors `Collaborator`
    structurally per the epic's design Decision 1
  - Validation approach: Model unit tests for the unique compound index and required
    fields.
- Proposal element: One-query `ctx.sharedOwnerIds` resolution
  - Design decision: Decision 1
  - Validation approach: Integration test asserting query count; unit/integration
    tests on tier-filtering correctness.
- Proposal element: Relocate `userLookupStages`
  - Design decision: Decision 2
  - Validation approach: `cookbooks.ts`'s existing collaborator-aggregation tests pass
    unchanged post-move; new tests for the relocated export in `_helpers.ts`.
- Proposal element: `visibilityFilter` fourth clause, defaulted parameter
  - Design decision: Carries forward the epic's MODIFIED *Content visibility
    filtering* requirement
  - Validation approach: Unit tests for the new clause and a regression test for the
    omitted-parameter case.
- Proposal element: Fail-closed tier lookup
  - Design decision: Decision 4
  - Validation approach: Test that forces the aggregation to throw and asserts
    `sharedOwnerIds === []` and the request still succeeds.
- Proposal element: Deferred `collabCookbookIds` asymmetry
  - Design decision: Decision 4 (explicitly not resolved here)
  - Validation approach: Code comment presence; no behavioral test, since no behavior
    change is being made to `collabCookbookIds` by this PR.

## Functional Requirements Mapping

- Requirement: `LibraryShare` grants are uniquely keyed per (owner, recipient) pair.
  - Design element: Decision 3; unique compound index.
  - Acceptance criteria reference: Epic spec, ADDED *Granting library access*
    (duplicate-pair scenario) — this PR implements only the index the mutation in #672
    relies on to enforce it.
  - Testability notes: Model-level unit test inserting the same pair twice and
    asserting a duplicate-key error.
- Requirement: `ctx.sharedOwnerIds` reflects only currently-eligible owners.
  - Design element: Decision 1, Decision 3.
  - Acceptance criteria reference: Epic spec, MODIFIED *Request context composition*;
    ADDED *Tier downgrade suspends shares*.
  - Testability notes: Integration tests for grant-from-eligible-owner,
    grant-from-downgraded-owner, and re-upgrade-restores-access, each asserting
    `sharedOwnerIds` contents directly.
- Requirement: `visibilityFilter` extends correctly without breaking existing callers.
  - Design element: Additive parameter with a `[]` default.
  - Acceptance criteria reference: Epic spec, MODIFIED *Content visibility filtering*.
  - Testability notes: Byte-equivalence test of the filter object when the new
    parameter is omitted.
- Requirement: Hidden-by-tier content is never exposed via the new clause.
  - Design element: The fourth `$or` clause carries `hiddenByTier: { $ne: true }`,
    matching every other clause in the filter.
  - Acceptance criteria reference: Epic spec, ADDED *Hidden content stays hidden*.
  - Testability notes: Unit test asserting the clause shape includes that condition.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Resolving `ctx.sharedOwnerIds` costs at most one additional indexed
    query per authenticated request, and zero additional queries for a caller with no
    grants.
  - Design element: Decision 1 (single aggregation); an early-return guard when
    `LibraryShare.exists({ recipientId })` (or equivalent) finds nothing — see Task
    1.2's query-count test for the exact mechanism.
  - Acceptance criteria reference: Epic spec, NFAC Performance.
  - Testability notes: Assert query count in a context-creation unit test using a
    query-spy or count assertion against a test database.

- Requirement category: security
  - Requirement: A grant never surfaces `hiddenByTier` or soft-deleted content, and
    never surfaces an owner whose tier has lapsed.
  - Design element: Decision 1's `$match` on `_owner.tier`; the fourth `visibilityFilter`
    clause's `hiddenByTier` condition.
  - Acceptance criteria reference: Epic spec, ADDED *Hidden content stays hidden*;
    ADDED *Tier downgrade suspends shares*.
  - Testability notes: Integration test seeding a downgraded owner's grant and
    asserting exclusion; unit test on the filter clause shape.

- Requirement category: reliability
  - Requirement: A failure in the owner-tier lookup must not fail the request or leak
    shared content.
  - Design element: Decision 4.
  - Acceptance criteria reference: Epic spec, NFAC Reliability — "Recovery behavior".
  - Testability notes: Test that mocks the aggregation to throw and asserts both
    `sharedOwnerIds === []` and that the overall context-creation call still resolves.

- Requirement category: operability
  - Requirement: The relocation of `userLookupStages` must not regress Collaboration's
    existing collaborator-name display.
  - Design element: Decision 2 — mechanical import-not-redefine change.
  - Acceptance criteria reference: n/a (regression guard, not a new requirement).
  - Testability notes: `cookbooks.ts`'s pre-existing tests for
    `fetchCollaboratorsWithUsers` must pass unchanged.

## Risks / Trade-offs

- Risk/trade-off: The aggregation join is a security-relevant query with only one
  prior (display-only) precedent in the codebase.
  - Impact: An incorrect `$match`/`$unwind` ordering could silently misclassify an
    owner's eligibility.
  - Mitigation: Task-level tests assert the query shape and tier-filtering behavior in
    isolation, before #673 ever uses `sharedOwnerIds` to gate real reads.

- Risk/trade-off: `context.ts` will contain two structurally similar blocks
  (`collabCookbookIds`, `sharedOwnerIds`) with different failure semantics.
  - Impact: A future maintainer may copy the wrong one as a template.
  - Mitigation: Inline comment on the `sharedOwnerIds` block; #677 tracks the
    deliberate follow-up decision.

- Risk/trade-off: This PR's relocation of `userLookupStages` touches a file
  (`cookbooks.ts`) with no other reason to change in this PR.
  - Impact: Slightly larger diff and review surface than a foundation PR might
    otherwise have.
  - Mitigation: The change is mechanical (import instead of define); existing tests
    for the affected function are the regression guard.

## Rollback / Mitigation

- Rollback trigger: The `ctx.sharedOwnerIds` aggregation misclassifies owner
  eligibility (over- or under-inclusive); the query-count NFAC regresses (more than one
  additional query observed in production); or the `userLookupStages` relocation
  regresses Collaboration's collaborator display.
- Rollback steps:
  1. Revert the PR. All changes are additive — `visibilityFilter`'s new parameter
     defaults to `[]`, `Context.sharedOwnerIds` is a new field nothing yet reads (call
     sites are threaded in #673, not here), and `LibraryShare` is a new, empty
     collection with no other code writing to it (writes start in #672).
  2. No data migration is needed for rollback: dropping the `library-shares` collection
     is optional and harmless, since nothing yet reads or writes it outside this PR's
     own tests.
- Data migration considerations: None. No existing document shape changes.
- Verification after rollback: Confirm `cookbooks.ts`'s collaborator-name tests still
  pass (this is the one piece of existing behavior this PR touches); confirm
  `visibilityFilter`'s pre-existing call sites are unaffected.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch. Do not bypass hooks or waive findings
  to get green.
- If security checks fail: Blocking without exception — this PR introduces a new
  query that will gate real authorization decisions starting in #673. Any Codacy/Snyk
  finding touching `_helpers.ts`, `context.ts`, or `library-share.ts` must be resolved,
  not waived.
- If required reviews are blocked/stale: Re-request review after pushing fixes;
  escalate to @dougis on the PR if unaddressed after two working days.
- Escalation path and timeout: PR comment → mention @dougis → if still blocked after
  five working days, park the branch and record the blocker in this change's
  `tasks.md` rather than merging partial work.

## Open Questions

None. Both questions this scope raised were resolved in the explore session preceding
this proposal and are recorded as Decisions 1 and 4 above.

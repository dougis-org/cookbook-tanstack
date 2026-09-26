## Context

- Relevant architecture: tRPC routers under `src/server/trpc/routers/`, composed onto
  `appRouter` in `src/server/trpc/router.ts`. Shared authorization/visibility
  primitives live in `src/server/trpc/routers/_helpers.ts` (`visibilityFilter`,
  `verifyOwnership`, `userLookupStages`, `objectId`). Request-scoped context is built
  in `src/server/trpc/context.ts`, which already resolves `ctx.sharedOwnerIds` by
  aggregating `LibraryShare` rows and filtering to owners whose live tier is
  `executive-chef` (`SHARING_OWNER_TIER` in `src/lib/tier-entitlements.ts`).
- Dependencies: `LibraryShare` model (`src/db/models/library-share.ts`, unique index
  on `(ownerId, recipientId)`), `verifiedProcedure` (`src/server/trpc/init.ts`),
  `hasAtLeastTier` (`src/types/user.ts`), `usersRouter.search`
  (`src/server/trpc/routers/users.ts`, Executive-Chef-gated recipient lookup).
- Interfaces/contracts touched: `appRouter` gains a `sharing` namespace; `_helpers.ts`
  gains two new exports (`execChefProcedure`, an owner-tier-eligibility pipeline
  helper); `context.ts`'s `sharedOwnerIds` resolution is refactored to call that
  helper instead of inlining the aggregation.

Continues the decision log started in
`openspec/changes/share-my-library/design.md` (Decisions 1-7, PR 1 / #671).
Numbering below picks up at Decision 8 for this PR's scope.

## Goals / Non-Goals

### Goals

- Provide the four authorized write/read procedures (`shareLibrary`,
  `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`) needed by PR 3-5.
- Reuse existing shared primitives (`execChefProcedure`, `usersRouter.search`,
  `userLookupStages`) rather than duplicating tier-gating or lookup logic.
- Keep the owner-tier-eligibility check (Decision 2 of the foundation design) as a
  single implementation shared between `context.ts` and the two listing procedures.
- Guarantee no email or tier ever appears in a `sharing.ts` response payload.

### Non-Goals

- Not implementing any read-path integration (`sharedBy`, cross-owner cookbook
  entries) — PR 3 / #673.
- Not implementing any UI — PRs 4-5 / #674, #675.
- Not revisiting the foundation's schema or index decisions.

## Decisions

### Decision 8: Extract the owner-tier-eligibility pipeline into a shared helper

- Chosen: Add `sharingEligibleOwnerStages()` (or similarly named) to `_helpers.ts`,
  returning the `$lookup` + `$unwind` (via `userLookupStages`) + `$match
  "_owner.tier": SHARING_OWNER_TIER` pipeline fragment currently inlined in
  `context.ts:34-39`. `context.ts` is refactored to call it; `sharing.ts`'s
  `myLibraryShares` and `mySharedLibraries` call the same helper.
- Alternatives considered: (a) Leave `context.ts` untouched and duplicate the
  fragment in `sharing.ts`; (b) compute eligibility application-side by fetching all
  grant rows then checking tier per row in JS instead of in the aggregation.
- Rationale: The issue and the user (this session) were explicit that shared logic
  must never be duplicated where avoidable. This fragment is genuinely identical
  business logic (owner must be live-executive-chef) consumed by both the
  access-control path and the two display paths; a single implementation means a
  future change to the eligibility rule (e.g. admin owners) can't silently drift
  between the three call sites.
- Trade-offs: Touches `context.ts`, a hot-path file already shipped in production
  (PR 1). Mitigated by making the extraction byte-for-byte behavior-preserving and
  re-running `context.ts`'s existing test coverage before adding new callers.

### Decision 9: Promote `execChefProcedure` to `_helpers.ts`

- Chosen: Move the private `execChefProcedure` definition from `cookbooks.ts:258` to
  `_helpers.ts`, export it, and update `cookbooks.ts` to import it. `sharing.ts`
  imports the same export for `shareLibrary` and `revokeLibraryShare`.
- Alternatives considered: Mirror the ~6-line definition locally in `sharing.ts`, as
  the issue allows if promotion would "disturb the existing collaboration
  procedures."
- Rationale: The move is a pure cut-paste — `_helpers.ts` already imports
  `verifiedProcedure`-equivalent primitives from `../init` and already hosts
  `visibilityFilter`/`verifyOwnership`, so it is the natural shared home and nothing
  about `cookbooks.ts`'s usage needs to change beyond the import line.
- Trade-offs: None identified; this is the "promote it" branch of the issue's own
  either/or instruction, taken because promotion carries no behavior risk here.

### Decision 10: `shareLibrary` validation order — cheap checks before I/O

- Chosen: Validate in this order: (1) `execChefProcedure` tier/verification gate
  (middleware, already runs first), (2) self-share check
  (`input.recipientId === ctx.user.id`, in-memory) → `BAD_REQUEST`, (3) recipient
  existence lookup (query the Better-Auth `user` collection by id, mirroring the
  pattern in `usersRouter.updateProfile`) → `NOT_FOUND` if absent, (4) attempt
  `LibraryShare.create(...)`, catching a duplicate-key error (mirroring
  `isDuplicateKeyError()` in `cookbooks.ts:230`) → `CONFLICT`.
- Alternatives considered: Check-then-insert for duplicates (separate `findOne`
  before `create`).
- Rationale: Self-share needs no DB round trip and is the cheapest possible reject.
  Recipient-existence must be checked before insert because an invalid
  `recipientId` would otherwise violate the schema's `ref` softly (Mongoose doesn't
  enforce ref integrity) and produce a confusing `CONFLICT`-shaped success. Relying
  on the unique index for duplicate detection (rather than a separate `findOne`)
  removes a TOCTOU race where two concurrent grants for the same pair could both
  pass a pre-check and one would fail confusingly at insert anyway.
- Trade-offs: Relying on `E11000` means the error-shape mapping
  (`isDuplicateKeyError` → `TRPCError({code: 'CONFLICT'})`) must be tested
  explicitly, since it's not visible from the success-path code.

### Decision 11: `revokeLibraryShare` uses fetch-then-check-then-delete

- Chosen: `LibraryShare.findById(input.shareId)` → `NOT_FOUND` if missing → compare
  `grant.ownerId.toString() === ctx.user.id` → `FORBIDDEN` if not (this covers the
  recipient-attempting-to-revoke case identically to any other non-owner) → delete
  by `_id`.
- Alternatives considered: A single `LibraryShare.deleteOne({ _id, ownerId:
  ctx.user.id })` and infer `FORBIDDEN` vs `NOT_FOUND` from `deletedCount === 0`
  plus a cause.
- Rationale: The single-query alternative cannot distinguish "no such grant" from
  "grant belongs to someone else" without a second read anyway (to decide which
  error code to throw), so it saves nothing. The explicit fetch also mirrors the
  existing `verifyOwnership()` shape used throughout `cookbooks.ts`, keeping the
  authorization pattern consistent across routers.
- Trade-offs: Two round trips (`findById` + `deleteOne`) instead of one atomic
  delete; acceptable since revoke is a low-frequency, single-document operation
  with no concurrent-write contention to race against.

### Decision 12: Listing procedures project only `{ id, name }` for the other party

- Chosen: `myLibraryShares` and `mySharedLibraries` build their aggregation with an
  explicit `$project` that includes only the grant's own fields plus
  `_recipient.name`/`_owner.name` (via `userLookupStages`), never the joined user
  document's `email` or `tier`.
- Alternatives considered: Project the full joined user sub-document and strip
  fields in the JS mapping step afterward (as `fetchCollaboratorsWithUsers` in
  `cookbooks.ts` currently does for `name` only, incidentally never touching
  `email`/`tier` because it doesn't select them either).
- Rationale: An explicit allow-list `$project` at the database layer is a stronger
  guarantee against future accidental leakage than "select everything, then
  remember to delete two fields in application code" — especially given the issue's
  explicit callout that "Security findings on `sharing.ts` are blocking and must
  not be waived."
- Trade-offs: None meaningful; symmetric with the eligibility filter (Decision 8),
  which already needs `_owner.tier` for its own `$match` — that field is consumed
  and dropped within the pipeline, never reaching the `$project` stage.

### Decision 13: Router registration location is `router.ts`, not `_app.ts`

- Chosen: Register `sharing: sharingRouter` in `src/server/trpc/router.ts`, where
  every other router is composed.
- Alternatives considered: Follow the issue text and `tasks.md` literally and look
  for `_app.ts`.
- Rationale: `_app.ts` does not exist anywhere in this codebase (confirmed via
  `ls src/server/trpc/routers/` and `grep -rl cookbooksRouter`); `router.ts` is the
  actual composition root. This is a documentation drift in the issue/tasks text,
  not a real design choice, but recording it here so the implementer doesn't lose
  time searching for a nonexistent file.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: `shareLibrary` grant procedure with required rejections
  - Design decision: Decision 9 (execChefProcedure reuse), Decision 10 (validation
    order)
  - Validation approach: Table-driven integration tests per lower tier →
    `FORBIDDEN`; self-share → `BAD_REQUEST`; duplicate → `CONFLICT`; unknown
    recipient → `NOT_FOUND`; unauthenticated → `UNAUTHORIZED`.
- Proposal element: `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`
  - Design decision: Decision 11 (revoke authorization shape), Decision 8 (shared
    eligibility filter), Decision 12 (no email/tier projection)
  - Validation approach: Integration tests per the #672 TDD checklist; a payload
    shape assertion (`expect(row).not.toHaveProperty('email')` /
    `.not.toHaveProperty('tier')`) on both listings.
- Proposal element: Promote or mirror `execChefProcedure`
  - Design decision: Decision 9
  - Validation approach: Re-run `cookbooks.ts`'s existing collaboration integration
    suite unchanged after the move; assert zero diff in pass/fail outcomes.
- Proposal element: Avoid duplicating the owner-tier-eligibility check
  - Design decision: Decision 8
  - Validation approach: Unit test the extracted helper directly (owner at
    executive-chef → included; owner below → excluded); re-run `context.ts`'s
    existing `sharedOwnerIds` tests unchanged after refactor.
- Proposal element: Register the router in the correct root file
  - Design decision: Decision 13
  - Validation approach: `npx tsc --noEmit` catches a wrong import path
    immediately; an integration test calling `trpc.sharing.shareLibrary` end-to-end
    confirms wiring.

## Functional Requirements Mapping

- Requirement: An `executive-chef` owner can create a grant.
  - Design element: Decision 10, `shareLibrary`.
  - Acceptance criteria reference: `openspec/changes/share-my-library/specs/library-sharing/spec.md`
    — ADDED "Granting library access".
  - Testability notes: Assert the created row's `ownerId`, `recipientId`,
    `addedBy`, and populated `addedAt`.
- Requirement: Non-Executive-Chef callers are rejected.
  - Design element: Decision 9 (`execChefProcedure` reuse).
  - Acceptance criteria reference: ADDED "Granting library access" (rejection
    cases).
  - Testability notes: Table-driven over `home-cook`, `prep-cook`, `sous-chef`;
    assert `FORBIDDEN` and no row created.
- Requirement: Duplicate pair, self-share, unknown recipient are each rejected with
  the correct error code.
  - Design element: Decision 10.
  - Acceptance criteria reference: ADDED "Granting library access" (rejection
    cases).
  - Testability notes: One test per rejection path; assert no row created/exactly
    one row remains as applicable.
- Requirement: Owner can revoke a grant; non-owner (including the recipient)
  cannot.
  - Design element: Decision 11.
  - Acceptance criteria reference: ADDED "Revoking a share".
  - Testability notes: Assert row deleted on owner revoke; assert row survives and
    `FORBIDDEN` is thrown when the recipient (or any other user) attempts revoke.
- Requirement: Owner can list grants given; recipient can list grants received.
  - Design element: Decision 8, Decision 12.
  - Acceptance criteria reference: ADDED "Managing shares" (server half).
  - Testability notes: Assert the other party's display name is present; assert a
    grant from a since-downgraded owner is absent from both listings.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Neither listing exposes email or tier for either party.
  - Design element: Decision 12.
  - Acceptance criteria reference: NFAC Security, "Owner identity is the only
    owner data exposed" (carried over from the parent spec).
  - Testability notes: Assert absence of `email`/`tier` keys on every returned row
    in both listing tests, not just presence of the allowed fields.
- Requirement category: security
  - Requirement: Grant/revoke authorization cannot be bypassed by a non-owner or
    non-Executive-Chef caller.
  - Design element: Decision 9, Decision 11.
  - Acceptance criteria reference: ADDED "Granting library access", "Revoking a
    share".
  - Testability notes: `pr-review-toolkit:review-pr` gate required before merge;
    findings on this file are non-waivable per the issue.
- Requirement category: reliability
  - Requirement: The eligibility rule used for listings cannot drift from the rule
    used for read-path access control.
  - Design element: Decision 8 (single shared implementation).
  - Testability notes: A single unit-tested helper function with call sites in both
    `context.ts` and `sharing.ts`, verified by re-running `context.ts`'s existing
    test suite unchanged.

## Risks / Trade-offs

- Risk/trade-off: Decision 8 touches `context.ts`, which runs on every
  authenticated request in production.
  - Impact: A regression here silently breaks access control for the already-live
    foundation feature, not just this PR's new code.
  - Mitigation: Pure extraction with no logic change; existing `context.ts` test
    coverage must pass unchanged before any new call site is added, and a new unit
    test targets the extracted helper directly.
- Risk/trade-off: Decision 10's reliance on catching `E11000` couples correctness
  to MongoDB's specific duplicate-key error shape.
  - Impact: If the error shape changes (driver upgrade) the `CONFLICT` mapping
    could silently stop firing, allowing duplicate grants.
  - Mitigation: This pattern (`isDuplicateKeyError`) is already relied on elsewhere
    in `cookbooks.ts`; no new exposure. Covered by the required duplicate-pair
    integration test.

## Rollback / Mitigation

- Rollback trigger: The `pr-review-toolkit:review-pr` gate reports an
  authorization-boundary finding on `sharing.ts` that cannot be resolved before a
  deadline, or `context.ts`'s existing test suite regresses after the Decision 8
  refactor.
- Rollback steps: This PR ships dark (no route or component references the new
  router or procedures), so rollback is a plain revert of the PR's commits — no
  data migration, no feature flag needed. `LibraryShare` rows created via
  `shareLibrary` before rollback remain in the collection but become unreachable
  through the API again until re-applied.
- Data migration considerations: None — no schema change in this PR.
- Verification after rollback: `npx tsc --noEmit && npm run build` and the full
  `npm run test:integration` suite pass on `main` with the revert applied.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying cause; do not skip hooks or disable checks
  to force a merge.
- If security checks fail: Per the issue, findings on `sharing.ts` are blocking and
  must not be waived under any circumstance — fix before merge, full stop.
- If required reviews are blocked/stale: Per
  `openspec/changes/share-my-library/tasks.md`'s ownership metadata, this change
  alters an authorization boundary and must not be self-merged; escalate to
  @dougis for review rather than bypassing the gate.
- Escalation path and timeout: No fixed timeout is defined for this change; block
  on human review rather than time-boxing an authorization-boundary PR.

## Open Questions

None. All judgment calls carried over from the `/opsx:explore` session were
resolved and are recorded as Decisions 8-13 above.

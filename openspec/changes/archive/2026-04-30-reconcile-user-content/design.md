## Context

- **Relevant architecture**: Tier-based content entitlement system. User tier (`home-cook` | `prep-cook` | `sous-chef` | `executive-chef`) gates private content creation (`canCreatePrivate`) and content limits (`TIER_LIMITS`). Tier changes trigger side effects on user-owned Recipe and Cookbook documents.

- **Dependencies**:
  - `src/types/user.ts` — `TIER_RANK`, `UserTier`
  - `src/lib/tier-entitlements.ts` — `canCreatePrivate`, `getRecipeLimit`, `getCookbookLimit`, `TIER_LIMITS`
  - `src/db/models/recipe.ts` — Recipe model with `hiddenByTier`, `isPublic`, soft-delete middleware
  - `src/db/models/cookbook.ts` — Cookbook model with `hiddenByTier`, `isPublic`
  - `src/db/index.ts` — `getMongoClient()` for transaction access
  - `src/server/trpc/routers/_helpers.ts` — `visibilityFilter()`, `countUserContent()`, `userContentFilter()`

- **Interfaces/contracts touched**:
  - `admin.setTier` mutation (calls reconciliation after tier write)
  - `visibilityFilter()` (exposes hidden docs to owners — must change)
  - `countUserContent()` / `userContentFilter()` (used for enforcement — already correct)

## Goals / Non-Goals

### Goals

- Implement `reconcileUserContent(userId, oldTier, newTier)` as a standalone domain service
- Handle upgrade: clear `hiddenByTier` on all user docs
- Handle downgrade: coerce private→public when needed, enforce count limits (oldest N visible)
- Fix `visibilityFilter()` to exclude `hiddenByTier: true` docs for owners too
- Call reconciliation from `admin.setTier` after tier write succeeds
- Return detailed counts for all operations so admin UI can surface meaningful messages

### Non-Goals

- Implementing subscription webhook entry point
- Changing `canCreatePrivate`, `TIER_LIMITS`, or other entitlement logic
- Modifying soft-delete behavior
- UI changes beyond visibility filtering

## Decisions

### Decision 1: Function signature and return type

- **Chosen**: Returns an object with named counts: `{ recipesUpdated, cookbooksUpdated, recipesHidden, cookbooksHidden, madePublic }`
- **Alternatives considered**: Returning a flat total count (`totalHidden`, `totalMadePublic`), or separate `upgradeResults` / `downgradeResults` objects
- **Rationale**: Named counts allow callers (admin UI, future webhook) to construct precise messages without parsing. `madePublic` is distinct from `recipesHidden`/`cookbooksHidden` because it's a visibility coercion, not a limit enforcement. Upgrade-only changes produce `recipesUpdated`/`cookbooksUpdated` counts (hidden cleared), while downgrade-only changes produce `madePublic` + `recipesHidden`/`cookbooksHidden`.
- **Trade-offs**: Return object has 5 fields but all are needed by #411's dynamic warning UI

### Decision 2: Transaction grouping — separate transactions per collection

- **Chosen**: Two separate transactions (one for recipes, one for cookbooks). If one fails, that collection rolls back; the other may succeed. Caller is responsible for partial failure handling.
- **Alternatives considered**: Single transaction across both collections; two transactions with orchestration (recipes succeeds or fails → cookbooks succeeds or fails → commit or full rollback)
- **Rationale**: Simpler to implement (matches existing pattern in `recipes.ts:delete` which uses one session + withTransaction for its own multi-document write). If cookbooks transaction fails after recipes succeeds, the admin sees a partial success and can retry. The alternative (full rollback) is safer but adds complexity — acceptable as a future improvement.
- **Trade-offs**: Partial failure means some user docs updated and some not. Acceptable per user confirmation (point 1).

### Decision 3: visibilityFilter fix — add `hiddenByTier: { $ne: true }` to both branches

- **Chosen**:
```typescript
// Before:
{ $or: [{ isPublic: true }, { userId: user.id }] }

// After:
{
  $or: [
    { isPublic: true, hiddenByTier: { $ne: true } },
    { userId: user.id, hiddenByTier: { $ne: true } }
  ]
}
```
- **Alternatives considered**: Adding `hiddenByTier: { $ne: true }` as a top-level `$and` condition; using a sub-query
- **Rationale**: Both branches of the OR must exclude `hiddenByTier: true` docs. The top-level `$and` approach is equivalent but slightly less readable. Keeping `hiddenByTier` co-located with each branch's condition makes the intent explicit.
- **Trade-offs**: The filter now has `hiddenByTier: { $ne: true }` duplicated across branches. Functionally identical to the top-level `$and` approach but marginally more verbose.

### Decision 4: Admin.ts integration — call reconciliation after tier write, separate from audit log

- **Chosen**: `admin.setTier` writes tier → calls `reconcileUserContent` → audit log write (best-effort). The reconciliation call is outside the tier write transaction (separateMongoDB operations).
- **Alternatives considered**: Wrapping tier write + reconciliation in one transaction; calling reconciliation before tier write
- **Rationale**: Calling after is cleaner — the user's tier has changed in the DB, and now we reconcile content to match the new tier. If reconciliation fails, the tier is still changed (admin can retry manually). Before/after approach risks having content reconcile to the wrong tier if the write fails. Audit log is best-effort (try/catch, non-blocking).
- **Trade-offs**: If reconciliation fails, tier is written but content is not reconciled. Error propagates to admin. Manual retry or scripted reconciliation needed.

### Decision 5: Downgrade limit enforcement — sort by `createdAt ASC`, keep first N visible

- **Chosen**: For both recipes and cookbooks on downgrade with over-limit: sort non-deleted docs by `createdAt ASC`, first N (new tier limit) keep `hiddenByTier: false`, remainder get `hiddenByTier: true`
- **Alternatives considered**: Sort by `updatedAt`; hide newest instead of oldest; random selection
- **Rationale**: Oldest first is the spec requirement (#392). It feels fairest — users have built up content over time and the newest content is what they created most recently. `createdAt` is stable and deterministic (unlike `updatedAt` which changes on any modification).
- **Trade-offs**: Users who added content in bulk early on keep everything; latecomers get hit first by limits. This is the intended behavior per spec.

## Proposal to Design Mapping

- **Proposal element**: `src/lib/reconcile-user-content.ts` (new domain service)
  - **Design decision**: Decision 1 (function signature) + Decision 2 (transaction grouping) + Decision 5 (sort order)
  - **Validation approach**: Unit tests covering upgrade, downgrade coercion, downgrade limit, downgrade both, transaction rollback

- **Proposal element**: `visibilityFilter` fix in `_helpers.ts`
  - **Design decision**: Decision 3 (filter structure)
  - **Validation approach**: Tests for `countUserContent` / `enforceContentLimit` behavior unchanged; new tests confirming owner cannot see own hidden docs

- **Proposal element**: `admin.setTier` calls reconciliation
  - **Design decision**: Decision 4 (integration order)
  - **Validation approach**: Integration test for `admin.setTier` with content over limit, confirming counts returned and content updated

## Functional Requirements Mapping

- **Requirement**: Upgrade sets `hiddenByTier: false` on all user recipes and cookbooks
  - **Design element**: `reconcileUserContent` — upgrade branch does `updateMany({ userId }, { $set: { hiddenByTier: false } })`
  - **Acceptance criteria reference**: #409 acceptance criteria (first bullet)
  - **Testability notes**: Test with user who has mix of hiddenByTier:true and hiddenByTier:false docs; verify all become false after upgrade

- **Requirement**: Downgrade to public-only tier makes all private docs public
  - **Design element**: `reconcileUserContent` — downgrade coercion branch does `updateMany({ userId, isPublic: false }, { $set: { isPublic: true } })`
  - **Acceptance criteria reference**: #409 acceptance criteria (second bullet)
  - **Testability notes**: Test with user at `sous-chef` (private allowed) downgraded to `prep-cook` (private not allowed); verify all private docs become public

- **Requirement**: Downgrade with over-limit hides oldest N, keeps N visible
  - **Design element**: `reconcileUserContent` — downgrade limit branch sorts by `createdAt ASC`, applies limit, sets `hiddenByTier: true` on excess
  - **Acceptance criteria reference**: #409 acceptance criteria (third bullet)
  - **Testability notes**: Test with user at tier limit boundary; verify oldest N stay visible, rest hidden

- **Requirement**: Atomic — partial failure rolls back all changes
  - **Design element**: `mongoose.startSession().withTransaction()` per collection (Decision 2)
  - **Acceptance criteria reference**: #409 acceptance criteria (fourth bullet)
  - **Testability notes**: Mock transaction abort; verify no docs updated

- **Requirement**: `visibilityFilter` excludes `hiddenByTier: true` for owners
  - **Design element**: Decision 3 (filter structure)
  - **Acceptance criteria reference**: #392 acceptance criteria ("visibilityFilter() excludes hiddenByTier: true docs even for the owner")
  - **Testability notes**: Test: owner with hiddenByTier:true doc queries list; doc excluded from results

## Non-Functional Requirements Mapping

- **Requirement category: reliability**
  - **Requirement**: Partial failure leaves system in consistent state
  - **Design element**: Separate transactions per collection (Decision 2) with clear error propagation
  - **Acceptance criteria reference**: #409 acceptance criteria (atomicity bullet)
  - **Testability notes**: Transaction rollback tests confirm no partial state

- **Requirement category: performance**
  - **Requirement**: Reconciliation completes in reasonable time for users with large content sets (up to 2500 recipes, 200 cookbooks)
  - **Design element**: Single `updateMany` per collection (not iterative per-doc updates); indexed queries on `userId`, `createdAt`
  - **Acceptance criteria reference**: None explicit — implicit from tier limits
  - **Testability notes**: Not performance tested in unit tests; monitor in production

- **Requirement category: maintainability**
  - **Requirement**: Function callable from both admin and subscription webhook contexts
  - **Design element**: Pure function in `src/lib/` (no router dependencies); accepts `userId`, `oldTier`, `newTier` as plain arguments
  - **Acceptance criteria reference**: #409 ("Callable from both admin context and subscription webhook context")
  - **Testability notes**: Same unit tests apply regardless of caller

## Risks / Trade-offs

- **Risk**: Transaction failure leaves tier written but content not reconciled
  - **Impact**: User has new tier but old content visibility/counts
  - **Mitigation**: Error propagates to admin. Manual retry or scripted reconciliation can fix. Consider future enhancement to wrap tier write + reconciliation in one transaction.
  - **Trade-off**: Simpler implementation now, stronger consistency later

- **Risk**: `visibilityFilter` change breaks owner expectations
  - **Impact**: Users can no longer see their own hidden docs
  - **Mitigation**: This is the spec requirement. Hidden docs are meant to be invisible. Test coverage confirms expected behavior.
  - **Trade-off**: Users lose visibility into content they technically still own

- **Risk**: Downgrade enforcement is O(n) with large content sets
  - **Impact**: Users near limit (2500 recipes) trigger larger transactions
  - **Mitigation**: `updateMany` is single atomic operation; MongoDB handles efficiently. Index on `(userId, createdAt)` supports the sort.
  - **Trade-off**: No pagination — all matching docs updated in one transaction

## Rollback / Mitigation

- **Rollback trigger**: Implementation bugs cause data inconsistency (wrong docs hidden, private docs not made public on downgrade)
- **Rollback steps**:
  1. Identify affected users by querying for `hiddenByTier: true` on documents that should be visible
  2. Run correction script: set `hiddenByTier: false` on all docs for affected users
  3. For downgrade coercion bugs: query for `isPublic: false` docs owned by users at public-only tiers, set `isPublic: true`
- **Data migration considerations**: Direct MongoDB updates via `db.collection.updateMany()` with appropriate filters
- **Verification after rollback**: Re-run affected tests; query counts match expected state

## Operational Blocking Policy

- If CI checks fail:
  - Do not merge. Fix test failures first. If test environment is flaky (DB connection, timing), investigate and stabilize before merge.
- If security checks fail (e.g., Snyk vulnerability in new dependency):
  - Do not merge. Assess severity. If critical/high, find alternative library or patch. If medium/low, document risk and proceed with acknowledgement.
- If required reviews are blocked/stale:
  - For blocked reviews: follow up with reviewer directly. If no response in 48h, reassign.
  - For stale PRs (no activity in 7 days): ping author and reviewer for status update. Archive if no response in 14 days.
- **Escalation path**: Tag repo maintainer for persistent blocks. For security issues, escalate to security team immediately.

## Open Questions

- **Question**: Should `admin.setTier` wrap the tier write and reconciliation in a single transaction so they succeed or fail together?
  - **Needed from**: Architecture decision
  - **Decision**: Separate transactions now (simpler), single transaction as future enhancement
  - **Blocker for apply**: No — separate transactions accepted per user confirmation
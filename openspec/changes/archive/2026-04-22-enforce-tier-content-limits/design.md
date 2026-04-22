## Context

- Relevant architecture:
  - tRPC router with `protectedProcedure` — `ctx.user` carries `{ id, tier, isAdmin }`
  - `src/lib/tier-entitlements.ts` — `TIER_LIMITS`, `getRecipeLimit`, `getCookbookLimit` (from #387)
  - `src/db/models/recipe.ts` — soft-delete middleware auto-injects `{ deleted: { $ne: true } }` into `countDocuments`
  - `src/db/models/cookbook.ts` — no soft-delete middleware; cookbooks are hard-deleted
  - `src/server/trpc/routers/_helpers.ts` — shared helpers (`verifyOwnership`, `visibilityFilter`, `createTaxonomyRouter`)
- Dependencies:
  - `src/lib/tier-entitlements.ts` must export `getRecipeLimit` / `getCookbookLimit` and `EntitlementTier` — confirmed present
  - `ctx.user.tier` and `ctx.user.isAdmin` must be available in `protectedProcedure` context — confirmed present
- Interfaces/contracts touched:
  - `recipes.create` mutation — adds pre-save limit check
  - `cookbooks.create` mutation — adds pre-save limit check
  - `recipes.list` / `recipes.get` response shapes — add `hiddenByTier` field
  - `cookbooks.list` / `cookbooks.get` response shapes — add `hiddenByTier` field
  - `IRecipe` / `ICookbook` interfaces — add `hiddenByTier`
  - `makeAuthCaller` test helper signature

## Goals / Non-Goals

### Goals

- Enforce `TIER_LIMITS` for recipe and cookbook creation server-side
- Exclude `hiddenByTier: true` documents from active count
- Admin bypass for all limits
- Default missing `tier` to `home-cook` at enforcement time
- Include `hiddenByTier` in response payloads for UI greyed-out rendering
- Idempotent migration script for existing documents

### Non-Goals

- Enforcing limits on any mutation other than `create`
- Setting `hiddenByTier: true` on documents (that is #392)
- Frontend upgrade prompts or error toasts
- Distributed locking for concurrent creates

## Decisions

### Decision 1: Shared helper vs inline limit check

- Chosen: Shared `enforceContentLimit` helper in `_helpers.ts`
- Alternatives considered: Inline count + throw in each mutation
- Rationale: Two mutations need identical logic; `_helpers.ts` already holds `verifyOwnership` and other shared mutation guards; unit-testable in isolation
- Trade-offs: Slightly indirects the read path; acceptable given the codebase pattern

### Decision 2: `hiddenByTier` count exclusion approach

- Chosen: Pass `{ hiddenByTier: { $ne: true } }` explicitly to `countDocuments` alongside `{ userId }`
- Alternatives considered: Adding `hiddenByTier: { $ne: true }` to Recipe's soft-delete middleware
- Rationale: Hidden docs should still appear in list/get queries (greyed out); injecting into soft-delete middleware would exclude them from all reads, breaking the UI pattern needed by #392
- Trade-offs: The count filter is slightly different from the query filter — must be kept in sync when #392 ships

### Decision 3: Tier default location

- Chosen: Default `null | undefined` tier to `'home-cook'` inside `enforceContentLimit`
- Alternatives considered: Normalise tier at context creation in `init.ts`
- Rationale: Context layer doesn't currently normalise tier; doing it at the enforcement point avoids a broader context refactor and keeps change scope minimal
- Trade-offs: If another enforcement site is added later, it must also apply the default — document this clearly in a comment

### Decision 4: `makeAuthCaller` refactor

- Chosen: Change signature to `makeAuthCaller(userId: string, opts: { email?: string; tier?: string; isAdmin?: boolean } = {})`; delete local duplicate in `recipes.test.ts`; import shared version
- Alternatives considered: Adding a separate `makeAuthCallerWithTier` helper
- Rationale: One caller factory is easier to maintain; options object is extensible without further signature changes
- Trade-offs: All existing `makeAuthCaller(user.id)` call sites are unaffected (opts defaults to `{}`); `makeAuthCaller(user.id, user.email)` callers must be updated to `makeAuthCaller(user.id, { email: user.email })`

### Decision 5: Migration script location and pattern

- Chosen: `scripts/migrate-hidden-by-tier.ts`, following `scripts/migrate-user-tiers.ts` exactly (raw `MongoClient`, dotenv, `$exists: false` idempotent guard)
- Alternatives considered: Mongoose-based seed script in `src/db/seeds/`
- Rationale: The existing migration pattern uses raw MongoClient intentionally (avoids Mongoose model loading overhead for one-time scripts); consistency matters
- Trade-offs: Script uses raw collection names (`recipes`, `cookbooks`) — must match Mongoose model collection names

### Decision 6: `hiddenByTier` in response payloads

- Chosen: Include `hiddenByTier` in all list and get responses for Recipe and Cookbook
- Alternatives considered: Omit until #392 needs it
- Rationale: The field exists on the document once the model is updated; including it now prevents a follow-up response-shape change in #392 and allows the UI to start rendering greyout without a server change
- Trade-offs: Minor payload size increase; negligible

## Proposal to Design Mapping

- Proposal element: Add `hiddenByTier` to models
  - Design decision: Decision 2 (count exclusion), Decision 6 (response payloads)
  - Validation approach: Schema tests; response shape assertions in router tests

- Proposal element: `enforceContentLimit` helper
  - Design decision: Decision 1 (shared helper)
  - Validation approach: Direct unit tests of helper; integration tests via `recipes.create` / `cookbooks.create`

- Proposal element: Tier default `home-cook`
  - Design decision: Decision 3
  - Validation approach: Test with `tier: undefined` in `makeAuthCaller` opts

- Proposal element: Admin bypass
  - Design decision: Decision 1 (early return for `isAdmin`)
  - Validation approach: Test with `isAdmin: true`, seeded at limit

- Proposal element: Migration script
  - Design decision: Decision 5
  - Validation approach: Run script against test DB; verify all docs have `hiddenByTier: false`; re-run confirms no duplicates

- Proposal element: `makeAuthCaller` refactor
  - Design decision: Decision 4
  - Validation approach: All existing tests still pass after refactor

## Functional Requirements Mapping

- Requirement: `recipes.create` throws FORBIDDEN when user is at recipe limit
  - Design element: `enforceContentLimit` called in `recipes.create` mutation
  - Acceptance criteria reference: specs/recipes-create-limit.md
  - Testability notes: Seed exactly `limit` recipes, call `create`, assert `FORBIDDEN`

- Requirement: `cookbooks.create` throws FORBIDDEN when user is at cookbook limit
  - Design element: `enforceContentLimit` called in `cookbooks.create` mutation
  - Acceptance criteria reference: specs/cookbooks-create-limit.md
  - Testability notes: Seed exactly `limit` cookbooks, call `create`, assert `FORBIDDEN`

- Requirement: Admin bypass
  - Design element: `if (isAdmin) return` early in `enforceContentLimit`
  - Acceptance criteria reference: specs/recipes-create-limit.md, specs/cookbooks-create-limit.md
  - Testability notes: `makeAuthCaller(id, { isAdmin: true })` with seeded at-limit docs

- Requirement: `hiddenByTier: true` excluded from count
  - Design element: `countDocuments({ userId, hiddenByTier: { $ne: true } })`
  - Acceptance criteria reference: specs/recipes-create-limit.md, specs/cookbooks-create-limit.md
  - Testability notes: Seed `limit` docs with 1 marked `hiddenByTier: true`; only `limit - 1` active → create succeeds

- Requirement: `hiddenByTier` in response payloads
  - Design element: Ensure field is not stripped in `.toObject()` / `.lean()` calls
  - Acceptance criteria reference: specs/model-hidden-by-tier.md
  - Testability notes: Assert `result.hiddenByTier === false` on newly created document response

- Requirement: Migration script idempotent
  - Design element: `$exists: false` guard in `updateMany`
  - Acceptance criteria reference: specs/migration-hidden-by-tier.md
  - Testability notes: Run twice, assert modified count is 0 on second run

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Race condition tolerance — one over-limit document acceptable
  - Design element: No locking; count-then-write pattern
  - Acceptance criteria reference: N/A (accepted risk per spec)
  - Testability notes: Not tested; documented as known trade-off

- Requirement category: operability
  - Requirement: Migration is safe to run on production data
  - Design element: `$exists: false` filter; only touches documents missing the field
  - Acceptance criteria reference: specs/migration-hidden-by-tier.md
  - Testability notes: Verify `modifiedCount` equals total doc count on fresh DB; 0 on re-run

- Requirement category: security
  - Requirement: Limits cannot be bypassed by authenticated non-admin users
  - Design element: Enforcement in `protectedProcedure` mutation; `isAdmin` sourced from session context, not user input
  - Acceptance criteria reference: specs/recipes-create-limit.md
  - Testability notes: Attempt create at limit with non-admin caller; assert FORBIDDEN

## Risks / Trade-offs

- Risk/trade-off: Recipe soft-delete middleware auto-injects `deleted: { $ne: true }` into `countDocuments`. If middleware is removed or changed, the count could include deleted docs.
  - Impact: Low — over-count would make limits tighter, not more permissive (safer direction)
  - Mitigation: Comment in `enforceContentLimit` documenting the dependency on middleware

- Risk/trade-off: Raw MongoDB collection name in migration (`recipes`, `cookbooks`) must match Mongoose model plural names
  - Impact: Low — Mongoose default pluralises model names; verified correct
  - Mitigation: Add a comment in the migration script noting the collection names

## Rollback / Mitigation

- Rollback trigger: `recipes.create` or `cookbooks.create` throwing FORBIDDEN incorrectly for users under their limit; or significant increase in `FORBIDDEN` errors in monitoring after deploy
- Rollback steps:
  1. Revert the `enforceContentLimit` call site in both mutations (remove 2 lines each)
  2. Deploy — does not require a database change
  3. `hiddenByTier` field remains on documents; harmless if enforcement is not active
- Data migration considerations: Migration script adds `hiddenByTier: false` — rolling back enforcement does not require undoing the migration; the field is inert without enforcement code
- Verification after rollback: Confirm `recipes.create` and `cookbooks.create` succeed without limit errors for test users; monitor error rates

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or type errors before requesting re-review.
- If security checks fail: Do not merge. Escalate to repo owner (dougis) if the failure is a false positive with documented justification.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. After 48 hours, escalate to repo owner.
- Escalation path and timeout: Repo owner (dougis) is final decision-maker. No automated merge bypass permitted.

## Open Questions

No open questions. All design decisions confirmed during proposal exploration phase.

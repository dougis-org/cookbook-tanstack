## Context

- Relevant architecture: `src/types/user.ts` owns `UserTier`, `TIER_RANK`, `TierUser`, `hasAtLeastTier`. `src/lib/ad-policy.ts` owns `PageRole`, `AdEligibleSession`, `isAdEligible`. `docs/user-tier-feature-sets.md` is the canonical feature matrix.
- Dependencies: `tier-entitlements.ts` imports from `src/types/user.ts`. `ad-policy.ts` imports from `tier-entitlements.ts`. No DB, no side effects.
- Interfaces/contracts touched: `isAdEligible` export in `ad-policy.ts` (renamed), `PageLayout.tsx` import, `ad-policy.test.ts`, `google-adsense-contract.test.ts`

## Goals / Non-Goals

### Goals

- Single authoritative module for all tier limit constants and capability helpers
- `ad-policy.ts` tier gate delegates to the new module (no duplicate logic)
- Rename clarifies the two-gate vs single-gate distinction at the call site
- All helpers are pure functions, fully unit-testable

### Non-Goals

- Runtime enforcement of limits (downstream issues)
- Changes to `UserTier` or `hasAtLeastTier` in `src/types/user.ts`

## Decisions

### Decision 1: `EntitlementTier` as a wider local union

- Chosen: `export type EntitlementTier = UserTier | 'anonymous'`
- Alternatives considered: Adding `'anonymous'` to `UserTier` in `user.ts`
- Rationale: `anonymous` has no account and no auth concept — it doesn't belong in the auth-facing type. The wider union is scoped to entitlements only.
- Trade-offs: Callers passing `UserTier` must cast or use a helper when checking anonymous; `TIER_LIMITS` covers all five values cleanly.

### Decision 2: `showUserAds` as pure tier gate

- Chosen: `export function showUserAds(tier: EntitlementTier): boolean` — returns `true` for `anonymous` and `home-cook`
- Alternatives considered: Keeping inline check in `isAdEligible`, or merging into a single function
- Rationale: Separates concerns — tier entitlement vs page role eligibility. Enables other layers (server-side, API) to query ad status without importing page-role logic.
- Trade-offs: Two functions to understand instead of one; mitigated by clear naming (`showUserAds` = tier only, `isPageAdEligible` = full page+tier check).

### Decision 3: Rename `isAdEligible` → `isPageAdEligible`

- Chosen: Rename in-place in `ad-policy.ts`; update all three call sites
- Alternatives considered: Keeping old name with deprecated alias
- Rationale: No external consumers (all callers are internal); TypeScript catches all references at compile time; no need for an alias.
- Trade-offs: Breaking rename, but grep confirms exactly three internal call sites — low risk.

### Decision 4: `canCreatePrivate` and `canImport` as separate named functions

- Chosen: Two separate exported functions, both delegating to `hasAtLeastTier`
- Alternatives considered: Single `canDo(capability, tier)` generic helper
- Rationale: Named functions express intent at call sites; if the feature matrix ever diverges, they split without changing callers.
- Trade-offs: Two functions with identical bodies today; acceptable for expressiveness.

### Decision 5: `getRecipeLimit` / `getCookbookLimit` as typed helpers

- Chosen: Simple index into `TIER_LIMITS`; return type `number`
- Alternatives considered: Inlining `TIER_LIMITS[tier].recipes` at call sites
- Rationale: Helpers prevent typos and provide a stable import surface if `TIER_LIMITS` shape ever changes.
- Trade-offs: Thin wrappers with minimal logic; acceptable given the stability benefit.

## Proposal to Design Mapping

- Proposal element: `EntitlementTier` wider union for anonymous
  - Design decision: Decision 1
  - Validation approach: Unit tests pass `'anonymous'` to all helpers; TypeScript rejects invalid strings
- Proposal element: `showUserAds` pure tier gate
  - Design decision: Decision 2
  - Validation approach: Unit tests for all five tier values; `isPageAdEligible` tests verify delegation
- Proposal element: Rename `isAdEligible` → `isPageAdEligible`
  - Design decision: Decision 3
  - Validation approach: TypeScript compile; existing `ad-policy.test.ts` suite must remain green
- Proposal element: `canCreatePrivate`, `canImport`
  - Design decision: Decision 4
  - Validation approach: Unit tests for all five tier values for each function
- Proposal element: `getRecipeLimit`, `getCookbookLimit`
  - Design decision: Decision 5
  - Validation approach: Unit tests assert correct values per tier against `docs/user-tier-feature-sets.md`

## Functional Requirements Mapping

- Requirement: `TIER_LIMITS` covers all five tiers with correct values from feature matrix
  - Design element: `TIER_LIMITS: Record<EntitlementTier, { recipes: number, cookbooks: number }>`
  - Acceptance criteria reference: specs/tier-entitlements.md
  - Testability notes: Assert each tier's recipe and cookbook count matches the doc

- Requirement: `showUserAds` returns `true` only for `anonymous` and `home-cook`
  - Design element: Decision 2
  - Acceptance criteria reference: specs/tier-entitlements.md
  - Testability notes: Five-value parametric test

- Requirement: `canCreatePrivate` and `canImport` return `true` for `sous-chef` and above
  - Design element: Decision 4
  - Acceptance criteria reference: specs/tier-entitlements.md
  - Testability notes: Five-value parametric test for each function

- Requirement: `isPageAdEligible` delegates tier check to `showUserAds`
  - Design element: Decision 3 + Decision 2
  - Acceptance criteria reference: specs/ad-policy-refactor.md
  - Testability notes: Existing `ad-policy.test.ts` suite must pass unchanged (behavior parity)

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: All helpers are pure functions with no side effects or DB calls
  - Design element: Module imports only `src/types/user.ts`; no async, no I/O
  - Acceptance criteria reference: specs/tier-entitlements.md
  - Testability notes: Synchronous unit tests; no mocking required

- Requirement category: operability
  - Requirement: `docs/user-tier-feature-sets.md` referenced as source of truth in module comment
  - Design element: File-level comment in `tier-entitlements.ts`
  - Acceptance criteria reference: Code review
  - Testability notes: Manual review

## Risks / Trade-offs

- Risk/trade-off: `showUserAds` may diverge from the old inline logic in `isAdEligible` if refactored incorrectly
  - Impact: Ad display regression — paid users see ads or anonymous users don't
  - Mitigation: Existing `ad-policy.test.ts` suite covers all tier + role combinations; tests must remain green before merge

- Risk/trade-off: Missed caller of `isAdEligible` not caught by grep
  - Impact: Runtime `undefined is not a function` error
  - Mitigation: TypeScript strict mode; `tsc --noEmit` in CI catches all usages

## Rollback / Mitigation

- Rollback trigger: Ad regression in production (ads shown to paid users or not shown to anonymous)
- Rollback steps: Revert `ad-policy.ts` to restore `isAdEligible` with inline tier check; revert `PageLayout.tsx` import
- Data migration considerations: None — pure logic change, no schema or data involved
- Verification after rollback: Smoke test ad visibility on public recipe page as anonymous and as prep-cook user

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check. TypeScript errors or test failures block apply.
- If security checks fail: Do not merge. Escalate to repo owner.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (dougis) is the final escalation. No timeout on security failures — they block indefinitely until resolved.

## Open Questions

No open questions. All design decisions confirmed during explore session.

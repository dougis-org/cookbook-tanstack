---
name: tests
description: Tests for the tier-entitlements change
---

# Tests

## Overview

Tests for the `tier-entitlements` change. Follow strict TDD: write a failing test first, then implement to make it pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write the test and confirm it fails
2. **Write code to pass the test** — simplest implementation that makes the test green
3. **Refactor** — improve code quality while keeping the test green

## Test Cases

### Task 1 + Task 2 — `src/lib/__tests__/tier-entitlements.test.ts`

File to create before implementing `tier-entitlements.ts`.

- [ ] `TIER_LIMITS['anonymous']` equals `{ recipes: 0, cookbooks: 0 }`
- [ ] `TIER_LIMITS['home-cook']` equals `{ recipes: 10, cookbooks: 1 }`
- [ ] `TIER_LIMITS['prep-cook']` equals `{ recipes: 100, cookbooks: 10 }`
- [ ] `TIER_LIMITS['sous-chef']` equals `{ recipes: 500, cookbooks: 25 }`
- [ ] `TIER_LIMITS['executive-chef']` equals `{ recipes: 2500, cookbooks: 200 }`
- [ ] `getRecipeLimit(tier)` returns `TIER_LIMITS[tier].recipes` for all five tiers
- [ ] `getCookbookLimit(tier)` returns `TIER_LIMITS[tier].cookbooks` for all five tiers
- [ ] `showUserAds('anonymous')` returns `true`
- [ ] `showUserAds('home-cook')` returns `true`
- [ ] `showUserAds('prep-cook')` returns `false`
- [ ] `showUserAds('sous-chef')` returns `false`
- [ ] `showUserAds('executive-chef')` returns `false`
- [ ] `canCreatePrivate('anonymous')` returns `false`
- [ ] `canCreatePrivate('home-cook')` returns `false`
- [ ] `canCreatePrivate('prep-cook')` returns `false`
- [ ] `canCreatePrivate('sous-chef')` returns `true`
- [ ] `canCreatePrivate('executive-chef')` returns `true`
- [ ] `canImport('anonymous')` returns `false`
- [ ] `canImport('home-cook')` returns `false`
- [ ] `canImport('prep-cook')` returns `false`
- [ ] `canImport('sous-chef')` returns `true`
- [ ] `canImport('executive-chef')` returns `true`

Spec traceability: `specs/tier-entitlements.md` — all ADDED requirements

Run: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`

---

### Task 3 — `src/lib/__tests__/ad-policy.test.ts` (existing, must remain green)

No new test cases needed. The existing suite covers behavior parity. After refactoring `ad-policy.ts`:

- [ ] All existing `isPageAdEligible` (renamed) test cases pass unchanged
- [ ] Parametric role tests still pass for ad-eligible and non-eligible roles
- [ ] Admin user override test still passes
- [ ] Unknown tier fallback test still passes

Spec traceability: `specs/ad-policy-refactor.md` — MODIFIED tier gate requirement

Run: `npx vitest run src/lib/__tests__/ad-policy.test.ts`

---

### Task 4 — `src/lib/__tests__/google-adsense-contract.test.ts` (existing, one assertion updated)

- [ ] String assertion `'isPageAdEligible(role, session)'` passes after updating the test

Spec traceability: `specs/ad-policy-refactor.md` — ADDED isPageAdEligible export name

Run: `npx vitest run src/lib/__tests__/google-adsense-contract.test.ts`

---

### Task 5 — Full suite smoke test

- [ ] `npm run test` — all tests pass (no regressions in other modules)
- [ ] `npx tsc --noEmit` — zero type errors (confirms no missed `isAdEligible` callers)
- [ ] `npm run build` — build succeeds

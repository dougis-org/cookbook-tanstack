---
name: tests
description: Tests for the refactor-tier-entitlements-capability-map change
---

# Tests

## Overview

Tests for the `refactor-tier-entitlements-capability-map` change. All work follows strict TDD: write failing test → implement → verify pass → refactor.

Existing tests in `src/lib/__tests__/tier-entitlements.test.ts` and `src/hooks/__tests__/useTierEntitlements.test.ts` must pass without any modification — they are the regression harness.

New tests go in `src/lib/__tests__/tier-entitlements.test.ts` alongside the existing suite.

## Testing Steps

For each task, write the failing test first, confirm failure, then implement.

## Test Cases

### Task 1 — `CAPABILITY_TIERS` constant (add to `src/lib/__tests__/tier-entitlements.test.ts`)

- [ ] **`CAPABILITY_TIERS` shape:** import `CAPABILITY_TIERS` from `@/lib/tier-entitlements`; assert deep-equal `{ createPrivate: 'sous-chef', privateRecipeNotes: 'sous-chef', import: 'executive-chef' }`
  - Spec: `specs/capability-map/spec.md` — "Map contains all three current capabilities with correct tiers"
  - Confirm fails before implementation, passes after

### Task 2 — `can()` helper (add to `src/lib/__tests__/tier-entitlements.test.ts`)

- [ ] **`can('createPrivate', tier)` — all tiers:** parameterized test across `['anonymous', false], ['home-cook', false], ['prep-cook', false], ['sous-chef', true], ['executive-chef', true]`
  - Spec: `specs/can-helper/spec.md` — happy path and below-required-tier scenarios
  - Confirm fails before implementation, passes after

- [ ] **`can('privateRecipeNotes', tier)` — all tiers:** same matrix as `createPrivate` (same required tier)
  - Confirm fails before implementation, passes after

- [ ] **`can('import', tier)` — all tiers:** parameterized across all five tiers; only `'executive-chef'` returns `true`
  - Spec: `specs/can-helper/spec.md` — "Returns false when caller's tier is below the required tier"
  - Confirm fails before implementation, passes after

- [ ] **`can()` with null tier:** `can('privateRecipeNotes', null)` → `false`
  - Spec: `specs/can-helper/spec.md` — "Returns false for null tier"
  - Confirm fails before implementation, passes after

- [ ] **`can()` with undefined tier:** `can('privateRecipeNotes', undefined)` → `false`
  - Spec: `specs/can-helper/spec.md` — "Returns false for undefined tier"
  - Confirm fails before implementation, passes after

### Task 3 — Wrapper regression (no new test needed; run existing suite)

- [ ] **Existing wrapper tests pass without modification:** run `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`; all `canCreatePrivate`, `canUsePrivateRecipeNotes`, `canImport` describe blocks pass
  - Spec: `specs/capability-map/spec.md` — "Wrappers produce identical results to before the refactor"
  - Spec: `specs/can-helper/spec.md` — "All existing tests pass without modification"

### Task 4 — Hook regression (no new test needed; run existing suite)

- [ ] **Existing hook tests pass without modification:** run `npx vitest run src/hooks/__tests__/useTierEntitlements.test.ts`; all describe blocks pass after hook is updated to use `can()` internally
  - Spec: `specs/can-helper/spec.md` — "Hook return shape is unchanged after internal update"
  - Spec: `specs/can-helper/spec.md` — "All existing hook tests pass without modification"

## Validation Commands

```bash
# New tests (fail first, then pass after implementation)
npx vitest run src/lib/__tests__/tier-entitlements.test.ts

# Regression — hook
npx vitest run src/hooks/__tests__/useTierEntitlements.test.ts

# Full suite
npm run test

# Type check
npx tsc --noEmit

# Build
npm run build
```

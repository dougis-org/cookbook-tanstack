---
name: tests
description: Tests for enforce-tier-content-limits
---

# Tests

## Overview

Tests for the `enforce-tier-content-limits` change. All work follows strict TDD: write a failing test, make it pass with the simplest possible code, then refactor.

All tests are integration tests using `withCleanDb` + `seedUserWithBetterAuth` against a real MongoDB test database. No mocks for DB behavior.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code
2. **Write the simplest code** to make the test pass
3. **Refactor** while keeping tests green

---

## Test Cases

### Task 3 — `makeAuthCaller` refactor

File: `src/server/trpc/routers/__tests__/test-helpers.ts` + all consuming test files

- [ ] **Existing caller with no opts** — `makeAuthCaller(user.id)` still produces a working caller (no regression)
  - Maps to: no spec scenario; regression guard
- [ ] **Caller with tier opt** — `makeAuthCaller(user.id, { tier: 'home-cook' })` produces caller with `ctx.user.tier === 'home-cook'`
  - Maps to: design decision 4
- [ ] **Caller with isAdmin opt** — `makeAuthCaller(user.id, { isAdmin: true })` produces caller with `ctx.user.isAdmin === true`
  - Maps to: design decision 4
- [ ] **No regression in sources.test.ts, cookbooks.test.ts** — all existing tests pass after call-site update

---

### Task 4 — `enforceContentLimit` helper

File: `src/server/trpc/routers/__tests__/helpers.test.ts`

- [ ] **Recipe at-limit throws FORBIDDEN**
  - Seed `home-cook` user with 10 recipes → call helper with `resource: 'recipes'` → throws `TRPCError` code `FORBIDDEN`
  - Maps to: specs/recipes-create-limit.md — Scenario: At-limit rejection
- [ ] **Recipe under-limit resolves**
  - Seed user with 9 recipes → call helper → resolves without throwing
  - Maps to: specs/recipes-create-limit.md — Scenario: Under-limit success
- [ ] **Admin bypass — recipes**
  - Seed admin user with 10 recipes → call helper with `isAdmin: true` → resolves
  - Maps to: specs/recipes-create-limit.md — Scenario: Admin bypass
- [ ] **hiddenByTier excluded from recipe count**
  - Seed user with 10 recipes, mark 1 `hiddenByTier: true` → call helper → resolves (active count is 9)
  - Maps to: specs/recipes-create-limit.md — Scenario: hiddenByTier excluded from count
- [ ] **Missing tier defaults to home-cook — recipes**
  - Seed user with 10 recipes → call helper with `tier: undefined` → throws `FORBIDDEN`
  - Maps to: specs/recipes-create-limit.md — Scenario: Missing tier defaults to home-cook
- [ ] **Cookbook at-limit throws FORBIDDEN**
  - Seed `home-cook` user with 1 cookbook → call helper with `resource: 'cookbooks'` → throws `FORBIDDEN`
  - Maps to: specs/cookbooks-create-limit.md — Scenario: At-limit rejection
- [ ] **Cookbook under-limit resolves**
  - Seed user with 0 cookbooks → call helper → resolves
  - Maps to: specs/cookbooks-create-limit.md — Scenario: Under-limit success
- [ ] **Admin bypass — cookbooks**
  - Seed admin user with 1 cookbook → call helper with `isAdmin: true` → resolves
  - Maps to: specs/cookbooks-create-limit.md — Scenario: Admin bypass

---

### Task 5 — `recipes.create` enforcement

File: `src/server/trpc/routers/__tests__/recipes.test.ts`

- [ ] **At-limit throws FORBIDDEN**
  - Seed home-cook user, insert 10 recipes directly → `caller.recipes.create({ name: 'X' })` → throws FORBIDDEN
  - Maps to: specs/recipes-create-limit.md — Scenario: At-limit rejection
- [ ] **Under-limit succeeds**
  - Seed home-cook user, insert 9 recipes → `caller.recipes.create({ name: 'X' })` → resolves with recipe object
  - Maps to: specs/recipes-create-limit.md — Scenario: Under-limit success
- [ ] **Admin bypass**
  - Seed admin user (isAdmin: true), insert 10 recipes → `caller.recipes.create({ name: 'X' })` → resolves
  - Maps to: specs/recipes-create-limit.md — Scenario: Admin bypass
- [ ] **hiddenByTier doc excluded from count**
  - Seed home-cook user, insert 10 recipes with 1 having `hiddenByTier: true` → `caller.recipes.create({ name: 'X' })` → resolves
  - Maps to: specs/recipes-create-limit.md — Scenario: hiddenByTier excluded from count
- [ ] **Create response includes `hiddenByTier: false`**
  - Seed user under limit → create → assert `result.hiddenByTier === false`
  - Maps to: specs/recipes-create-limit.md — Requirement: MODIFIED response shape

---

### Task 6 — `cookbooks.create` enforcement

File: `src/server/trpc/routers/__tests__/cookbooks.test.ts`

- [ ] **At-limit throws FORBIDDEN**
  - Seed home-cook user, insert 1 cookbook → `caller.cookbooks.create({ name: 'Y' })` → throws FORBIDDEN
  - Maps to: specs/cookbooks-create-limit.md — Scenario: At-limit rejection
- [ ] **Under-limit succeeds**
  - Seed home-cook user, 0 cookbooks → `caller.cookbooks.create({ name: 'Y' })` → resolves
  - Maps to: specs/cookbooks-create-limit.md — Scenario: Under-limit success
- [ ] **Admin bypass**
  - Seed admin user, insert 1 cookbook → `caller.cookbooks.create({ name: 'Y' })` → resolves
  - Maps to: specs/cookbooks-create-limit.md — Scenario: Admin bypass
- [ ] **hiddenByTier doc excluded from count**
  - Seed home-cook user, insert 1 cookbook with `hiddenByTier: true` → `caller.cookbooks.create({ name: 'Y' })` → resolves
  - Maps to: specs/cookbooks-create-limit.md — Scenario: hiddenByTier excluded from count
- [ ] **Create response includes `hiddenByTier: false`**
  - Seed user → create → assert `result.hiddenByTier === false`
  - Maps to: specs/cookbooks-create-limit.md — Requirement: MODIFIED response shape

---

### Task 7 — `hiddenByTier` in list/get responses

File: `src/server/trpc/routers/__tests__/recipes.test.ts`, `src/server/trpc/routers/__tests__/cookbooks.test.ts`

- [ ] **`recipes.list` includes `hiddenByTier`**
  - Create recipe with default → `recipes.list` → each item has `hiddenByTier: false`
  - Maps to: specs/model-hidden-by-tier.md — Scenario: hiddenByTier in recipes.list response
- [ ] **`cookbooks.list` includes `hiddenByTier`**
  - Create cookbook → `cookbooks.list` → each item has `hiddenByTier: false`
  - Maps to: specs/model-hidden-by-tier.md — Scenario: hiddenByTier in cookbooks.list response

---

### Task 8 — Migration script

Manual smoke test only (no automated test added):

- [ ] **First run backfills all documents** — run against local Docker DB; confirm logged modified counts match total Recipe + Cookbook doc counts
  - Maps to: specs/migration-hidden-by-tier.md — Scenario: First run backfills all documents
- [ ] **Second run is a no-op** — re-run; confirm `modifiedCount: 0` for both collections
  - Maps to: specs/migration-hidden-by-tier.md — Scenario: Second run is a no-op
- [ ] **Missing MONGODB_URI exits with code 1** — unset env var, run script; confirm non-zero exit
  - Maps to: specs/migration-hidden-by-tier.md — Scenario: Script handles missing MONGODB_URI

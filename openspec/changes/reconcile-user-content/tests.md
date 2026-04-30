---
name: tests
description: Tests for the reconcile-user-content change
---

# Tests

## Overview

This document outlines the tests for the `reconcile-user-content` change. All work should follow a strict TDD (Test-Driven Development) process. Tests are co-located with implementation: `src/lib/__tests__/reconcile-user-content.test.ts` for the core function, and `src/server/trpc/routers/__tests__/helpers.test.ts` for the `visibilityFilter` change.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test** — Write the simplest possible code to make the test pass.
3. **Refactor** — Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: `src/lib/reconcile-user-content.ts`

- [ ] **Test 1a — Upgrade: all docs get `hiddenByTier: false`**
  - Task: 1e, 1f
  - Spec scenario: "Upgrade from sous-chef to executive-chef with mixed hiddenByTier docs"
  - Given: user owns 3 recipes (A: false, B: true, C: false) and 2 cookbooks (A: true, B: false), oldTier = 'sous-chef', newTier = 'executive-chef'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: all 3 recipes have `hiddenByTier: false` and both cookbooks have `hiddenByTier: false`
  - And: return `recipesUpdated: 3, cookbooksUpdated: 2, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0`

- [ ] **Test 1b — Upgrade with zero content**
  - Task: 1e, 1f
  - Spec scenario: "Upgrade on account with zero content"
  - Given: user owns no recipes or cookbooks, oldTier = 'home-cook', newTier = 'prep-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: returns `recipesUpdated: 0, cookbooksUpdated: 0, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0` with no error

- [ ] **Test 1c — Downgrade coercion: sous-chef → prep-cook (private not allowed)**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade from sous-chef to prep-cook (private not allowed)"
  - Given: user owns 2 private recipes (isPublic: false) and 1 private cookbook (isPublic: false), oldTier = 'sous-chef', newTier = 'prep-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: all 2 private recipes have `isPublic: true` and cookbook has `isPublic: true`
  - And: return `madePublic: 3`

- [ ] **Test 1d — Downgrade coercion between public-only tiers**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade between public-only tiers (no coercion needed)"
  - Given: user owns 1 private recipe (isPublic: false), oldTier = 'prep-cook', newTier = 'home-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: the private recipe has `isPublic: true`
  - And: return `madePublic: 1`

- [ ] **Test 1e — Downgrade coercion with zero private content**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade from sous-chef to prep-cook with zero private content"
  - Given: user owns only public recipes and cookbooks, oldTier = 'sous-chef', newTier = 'prep-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: return `madePublic: 0`

- [ ] **Test 1f — Downgrade limit enforcement: 15 recipes, limit 10**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade from sous-chef to home-cook with 15 recipes (limit: 10)"
  - Given: user owns 15 recipes at createdAt timestamps 1-15 (ascending), oldTier = 'sous-chef', newTier = 'home-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: recipes 1-10 have `hiddenByTier: false`, recipes 11-15 have `hiddenByTier: true`
  - And: return `recipesHidden: 5`

- [ ] **Test 1g — Downgrade limit at boundary: exactly 100 recipes, limit 100**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade from sous-chef to prep-cook with exactly at limit (100 recipes, limit: 100)"
  - Given: user owns exactly 100 recipes at createdAt timestamps 1-100, oldTier = 'sous-chef', newTier = 'prep-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: all 100 recipes have `hiddenByTier: false`
  - And: return `recipesHidden: 0`

- [ ] **Test 1h — Downgrade limits separately for recipes and cookbooks**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade enforces limits separately for recipes and cookbooks"
  - Given: user owns 600 recipes (createdAt 1-600) and 30 cookbooks (createdAt 1-30), oldTier = 'sous-chef', newTier = 'prep-cook' (limits: 100 recipes, 10 cookbooks)
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: recipes 1-100 visible, 101-600 hidden; cookbooks 1-10 visible, 11-30 hidden
  - And: return `recipesHidden: 500, cookbooksHidden: 20`

- [ ] **Test 1i — Combined downgrade: coercion + limit together**
  - Task: 1e, 1f
  - Spec scenario: "Downgrade from sous-chef to home-cook with 15 private recipes"
  - Given: user owns 15 private recipes (createdAt 1-15), oldTier = 'sous-chef', newTier = 'home-cook'
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: all 15 have `isPublic: true` (coercion); recipes 1-10 visible, 11-15 hidden (limit)
  - And: return `madePublic: 15, recipesHidden: 5`

- [ ] **Test 1j — Transaction rollback: recipe update fails**
  - Task: 1g
  - Spec scenario: "Recipe transaction fails, cookbook transaction succeeds"
  - Given: user owns recipes and cookbooks, recipe update operation is mocked to throw
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: no recipe `hiddenByTier` values change (rolled back)
  - And: function throws error

- [ ] **Test 1k — Transaction rollback: cookbook fails after recipe succeeds**
  - Task: 1g
  - Spec scenario: "Cookbook transaction fails after recipe transaction succeeds"
  - Given: user owns recipes and cookbooks, recipe transaction succeeds, cookbook update operation is mocked to throw
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called
  - Then: recipe updates are persisted (recipe transaction committed)
  - And: no cookbook updates applied (cookbook transaction rolled back)
  - And: function throws error

- [ ] **Test 1l — Idempotent re-run: no changes on second call**
  - Task: 1e, 1f
  - Spec scenario: "Idempotent reconciliation on re-run"
  - Given: user already reconciled (downgraded from sous-chef to prep-cook, 5 recipes hidden), same oldTier/newTier passed again
  - When: `reconcileUserContent(userId, oldTier, newTier)` is called again
  - Then: no additional changes; return all counts at 0

### Task 2: `visibilityFilter` update

- [ ] **Test 2a — Owner cannot see own hiddenByTier document**
  - Task: 2a
  - Spec scenario: "Owner cannot see own hiddenByTier document in list results"
  - Given: user U1 owns a recipe with `hiddenByTier: true`, isPublic: false
  - When: `visibilityFilter({ id: U1 })` is called and applied to a query
  - Then: the hidden recipe is not returned in results

- [ ] **Test 2b — Public doc with hiddenByTier is invisible to everyone**
  - Task: 2a
  - Spec scenario: "Public document still visible to all users regardless of hiddenByTier"
  - Given: a recipe with `isPublic: true, hiddenByTier: true`
  - When: queried with `visibilityFilter(null)` (anonymous) or `visibilityFilter({ id: "other-user" })`
  - Then: the recipe is not returned

- [ ] **Test 2c — Authenticated user gets correct filter shape**
  - Task: 2b
  - Given: authenticated user with id "u1"
  - When: `visibilityFilter({ id: "u1" })` is called
  - Then: returns `{ $or: [{ isPublic: true, hiddenByTier: { $ne: true } }, { userId: "u1", hiddenByTier: { $ne: true } }] }`

- [ ] **Test 2d — Anonymous user filter unchanged**
  - Task: 2b
  - Given: no user (anonymous)
  - When: `visibilityFilter(null)` is called
  - Then: returns `{ isPublic: true }` (no change to anonymous path)

### Task 3: `admin.setTier` integration

- [ ] **Test 3a — setTier calls reconcileUserContent with correct tiers**
  - Task: 3b, 3c, 3d
  - Given: admin, target user with tier 'sous-chef', content exists
  - When: `admin.users.setTier({ userId: targetId, tier: 'prep-cook' })` is called
  - Then: `reconcileUserContent(targetId, 'sous-chef', 'prep-cook')` was invoked
  - And: return includes reconciliation result counts

- [ ] **Test 3b — setTier succeeds even if reconciliation throws**
  - Task: 3c
  - Given: admin, target user with tier 'sous-chef', reconciliation is mocked to throw
  - When: `admin.users.setTier({ userId: targetId, tier: 'prep-cook' })` is called
  - Then: the tier update still succeeds (reconciliation error is caught and logged)
  - And: admin sees success without reconciliation counts
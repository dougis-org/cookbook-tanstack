---
name: tests
description: Tests for tier-enforcement-tests-and-docs
---

# Tests

## Overview

This document outlines the tests for the `tier-enforcement-tests-and-docs` change. All work follows a strict TDD process: write a failing test first, then implement to make it pass, then refactor.

Note: Many tasks in this change ARE the tests (C1, D1, E1, F1, G1, H2–H4). For those tasks, the "test" is the new test case itself, and the "implementation" is the code comment, assertion, or logic that makes it pass.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation, write the test case and run it to confirm it fails (or, for comment-only tasks, confirm the test file compiles and passes before adding the assertion).
2. **Write code to pass the test:** Add the minimal implementation (comment, assertion, or logic).
3. **Refactor:** Ensure code quality and that all other tests still pass.

## Test Cases

### Task A1 — Enforcement contract comment

- [ ] **A1-TC1** (manual): Open `src/lib/tier-entitlements.ts` and confirm the block comment is present above `TIER_LIMITS`, references all three enforcement layers (server, client, reconcile), and is accurate
  - Spec: `specs/documentation.md` — "Enforcement contract comment is present"
  - Verification: `grep -A8 "Enforcement contract" src/lib/tier-entitlements.ts`

### Task B1 — Race tolerance comment

- [ ] **B1-TC1** (manual): Open `src/server/trpc/routers/_helpers.ts` and confirm `enforceContentLimit` contains a comment referencing the +1 race tolerance
  - Spec: `specs/documentation.md` — "Race tolerance comment is present"
  - Verification: `grep -n "race" src/server/trpc/routers/_helpers.ts`

### Task C1 — Null-tier in helpers.test.ts

- [ ] **C1-TC1**: `enforceContentLimit(userId, undefined, false, 'recipes')` with 10 existing recipes throws `PAYMENT_REQUIRED`
  - File: `src/server/trpc/routers/__tests__/helpers.test.ts`
  - Spec: `specs/null-tier-edge-cases.md` — "enforceContentLimit with undefined tier applies home-cook limit"
  - TDD step: Write the test → run → confirm it fails (no such test exists yet) → confirm `enforceContentLimit` already handles undefined correctly → test passes

### Task D1 — Null-tier in recipes.test.ts

- [ ] **D1-TC1**: `recipes.create` with `tier: undefined` (no tier in makeAuthCaller opts) and 10 existing recipes throws `PAYMENT_REQUIRED`
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Spec: `specs/null-tier-edge-cases.md` — "User with undefined tier is blocked at home-cook recipe limit"
  - TDD step: Write the test → run → confirm it fails → confirm `enforceContentLimit` handles undefined → test passes

### Task E1 — Null-tier in cookbooks.test.ts

- [ ] **E1-TC1**: `cookbooks.create` with `tier: undefined` and 1 existing cookbook throws `PAYMENT_REQUIRED`
  - File: `src/server/trpc/routers/__tests__/cookbooks.test.ts`
  - Spec: `specs/null-tier-edge-cases.md` — "User with undefined tier is blocked at home-cook cookbook limit"
  - TDD step: Write the test → run → confirm it fails → confirm enforcement handles undefined → test passes

### Task F1 — Admin bypass on update in recipes.test.ts

- [ ] **F1-TC1**: Admin with `tier: 'home-cook'` calls `recipes.update` with `{ isPublic: false }` on own recipe → succeeds (no FORBIDDEN)
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Spec: `specs/admin-bypass.md` — "Admin with home-cook tier can make a recipe private on update"
  - TDD step: Write test → run → expect it to pass immediately (admin bypass already implemented); if it fails, the bypass is missing on the update path

- [ ] **F1-TC2** (regression): Non-admin home-cook calling `recipes.update` with `{ isPublic: false }` → throws `FORBIDDEN`
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Spec: `specs/admin-bypass.md` — "Non-admin home-cook cannot set isPublic false on update"
  - Note: This behavior is already tested; include as a paired regression guard alongside F1-TC1

### Task G1 — TierWall /pricing link assertion

- [ ] **G1-TC1**: In the existing test `'shows inline TierWall when home-cook user is at recipe limit'` — `screen.getByRole('link', { name: /upgrade/i })` has `href="/pricing"`
  - File: `src/routes/__tests__/-recipes.test.tsx`
  - Spec: `specs/tierwall-link.md` — "Inline TierWall shows Upgrade link to /pricing"
  - TDD step: Add the assertion to the existing test → run → confirm it fails if href is wrong → confirm TierWall component has `to="/pricing"` → test passes

### Tasks H1–H4 — Admin→reconcile→list integration tests

- [ ] **H2-TC1**: User with 15 staggered-timestamp recipes; after `setTier('home-cook')`; `recipes.list` returns exactly 10 items
  - File: `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`
  - Spec: `specs/admin-tier-integration.md` — "Downgrade from sous-chef to home-cook hides over-limit recipes"
  - TDD step: Write test → run → confirm it fails (no integration test exists) → verify admin.setTier calls reconcileUserContent → test passes

- [ ] **H3-TC1**: Same user; after `setTier('executive-chef')`; `recipes.list` returns all 15 items
  - File: `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`
  - Spec: `specs/admin-tier-integration.md` — "Upgrade from home-cook to executive-chef restores all hidden recipes"
  - TDD step: Continuation of H2-TC1 setup; run after setTier upgrade

- [ ] **H4-TC1**: After downgrade to home-cook; DB query shows 5 newest recipes have `hiddenByTier: true`
  - File: `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`
  - Spec: `specs/admin-tier-integration.md` — "Oldest recipes are preserved on downgrade (not newest)"
  - TDD step: Direct `Recipe.find({ userId, hiddenByTier: true })` in test; expect 5 results with createdAt > oldest-10 threshold

### Task I1 — docs/user-tier-feature-sets.md Implementation section

- [ ] **I1-TC1** (manual/script): All 8 file paths listed in the Implementation table exist
  - Spec: `specs/documentation.md` — "All file paths in the Implementation table are valid"
  - Verification command:
    ```bash
    for f in src/lib/tier-entitlements.ts src/hooks/useTierEntitlements.ts \
              src/server/trpc/routers/recipes.ts src/server/trpc/routers/cookbooks.ts \
              src/server/trpc/routers/_helpers.ts src/lib/reconcile-user-content.ts \
              src/server/trpc/routers/admin.ts src/components/ui/TierWall.tsx; do
      [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"
    done
    ```

- [ ] **I1-TC2** (manual): `grep "Implementation Planning Output" docs/user-tier-feature-sets.md` returns nothing (old section removed)
  - Spec: `specs/documentation.md` — "Old placeholder section is removed"

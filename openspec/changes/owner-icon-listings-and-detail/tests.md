---
name: tests
description: Tests for the owner-icon-listings-and-detail change
---

# Tests

## Overview

This document outlines the tests for the `owner-icon-listings-and-detail` change. All work follows strict TDD: write the failing test first, implement to make it pass, then refactor.

Test files:
- Unit: `src/components/recipes/__tests__/RecipeCard.test.tsx` (new or existing)
- Unit: `src/components/cookbooks/__tests__/CookbookCard.test.tsx` (new)
- Integration: `src/server/trpc/routers/__tests__/recipes.test.ts` (existing — add cases)
- Integration: `src/server/trpc/routers/__tests__/cookbooks.test.ts` (existing — add cases)
- E2E: `e2e/` (new test file: `owner-icon.spec.ts`)

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and confirm it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve code quality while ensuring the test still passes.

## Test Cases

### Task 3 — `cookbooks.list` returns `userId`

**Maps to:** specs/owner-icon.md — "Requirement: ADDED `userId` field in `cookbooks.list` response"
**Test file:** `src/server/trpc/routers/__tests__/cookbooks.test.ts`

- [ ] **TC-3.1** `cookbooks.list` response items include `userId` as a string
  - Setup: create a cookbook owned by a test user
  - Call `cookbooks.list` via the tRPC test caller
  - Assert each returned item has `userId` as a non-null string matching the owner's id

- [ ] **TC-3.2** `cookbooks.list` `userId` is a string even for public (non-authed) view
  - Setup: create a public cookbook
  - Call `cookbooks.list` without authentication context
  - Assert returned item includes `userId` as a string

---

### Task 4 — `recipes.list` returns explicit `userId`

**Maps to:** specs/owner-icon.md — "Requirement: ADDED Explicit `userId` in `recipes.list` response"
**Test file:** `src/server/trpc/routers/__tests__/recipes.test.ts`

- [ ] **TC-4.1** `recipes.list` items include `userId` as an explicitly typed string field
  - Setup: create a recipe with a known owner
  - Call `recipes.list` via test caller
  - Assert returned items include `userId` matching the owner's id

---

### Task 5 — `RecipeCard` renders `User` icon when `isOwner={true}`

**Maps to:** specs/owner-icon.md — "Requirement: ADDED Owner icon on recipe card"
**Test file:** `src/components/recipes/__tests__/RecipeCard.test.tsx`

- [ ] **TC-5.1** Icon renders when `isOwner={true}`
  - Render `<RecipeCard recipe={...} isOwner={true} />`
  - Assert an element with `aria-label="You own this"` is present in the DOM

- [ ] **TC-5.2** Icon absent when `isOwner={false}`
  - Render `<RecipeCard recipe={...} isOwner={false} />`
  - Assert no element with `aria-label="You own this"` is present

- [ ] **TC-5.3** Icon absent when `isOwner` is not provided (undefined)
  - Render `<RecipeCard recipe={...} />`
  - Assert no element with `aria-label="You own this"` is present

- [ ] **TC-5.4** Icon has `role="img"` and correct `aria-label` when rendered
  - Render `<RecipeCard recipe={...} isOwner={true} />`
  - Assert the icon element has `role="img"` and `aria-label="You own this"`

---

### Task 6 — `CookbookCard` renders `User` icon when `isOwner={true}`

**Maps to:** specs/owner-icon.md — "Requirement: ADDED Owner icon on cookbook card"
**Test file:** `src/components/cookbooks/__tests__/CookbookCard.test.tsx`

- [ ] **TC-6.1** Icon renders when `isOwner={true}`
  - Render `<CookbookCard cookbook={...} isOwner={true} />`
  - Assert an element with `aria-label="You own this"` is present

- [ ] **TC-6.2** Icon absent when `isOwner={false}`
  - Render `<CookbookCard cookbook={...} isOwner={false} />`
  - Assert no element with `aria-label="You own this"` is present

- [ ] **TC-6.3** Icon absent when `isOwner` not provided
  - Render `<CookbookCard cookbook={...} />`
  - Assert no element with `aria-label="You own this"` is present

---

### Tasks 7 & 8 — Listing pages pass correct `isOwner` to cards

**Maps to:** specs/owner-icon.md — recipe and cookbook card scenarios
**Test approach:** These are covered by the E2E tests (TC-E2E.1 through TC-E2E.4) and by the component-level tests above. No separate unit test needed for the listing page logic since the computation `isLoggedIn && item.userId === userId` is a one-liner with no branching complexity.

---

### Tasks 9 & 10 — Detail pages show `User` icon for owner

**Maps to:** specs/owner-icon.md — "Requirement: ADDED Owner icon on recipe detail page" and "cookbook detail page"
**Test file:** `e2e/owner-icon.spec.ts`

- [ ] **TC-9.1** (E2E) Recipe detail page shows icon for owner
  - Login as the recipe owner
  - Navigate to `/recipes/:recipeId`
  - Assert element with `aria-label="You own this"` is visible

- [ ] **TC-9.2** (E2E) Recipe detail page hides icon for non-owner
  - Login as a different user
  - Navigate to `/recipes/:recipeId` for a recipe owned by another user
  - Assert no element with `aria-label="You own this"` is present

- [ ] **TC-10.1** (E2E) Cookbook detail page shows icon for owner
  - Login as the cookbook owner
  - Navigate to `/cookbooks/:cookbookId`
  - Assert element with `aria-label="You own this"` is visible

- [ ] **TC-10.2** (E2E) Cookbook detail page hides icon for non-owner
  - Login as a different user
  - Navigate to `/cookbooks/:cookbookId` for a cookbook owned by another user
  - Assert no element with `aria-label="You own this"` is present

---

### Print suppression — all icon instances

**Maps to:** specs/owner-icon.md — "Requirement: ADDED Print suppression of owner icon"
**Test approach:** The `print:hidden` Tailwind class applies `display: none` in print media. Verified by Playwright print-media emulation.

- [ ] **TC-P.1** (E2E) `User` icon not visible in print media on recipe detail page
  - Login as recipe owner
  - Navigate to `/recipes/:recipeId`
  - `page.emulateMedia({ media: 'print' })`
  - Assert element with `aria-label="You own this"` is not visible

- [ ] **TC-P.2** (E2E) `User` icon not visible in print media on cookbook detail page
  - Login as cookbook owner
  - Navigate to `/cookbooks/:cookbookId`
  - `page.emulateMedia({ media: 'print' })`
  - Assert element with `aria-label="You own this"` is not visible

---

### E2E — Logged-out user sees no owner icons

**Maps to:** specs/owner-icon.md — logged-out scenarios

- [ ] **TC-E2E.1** (E2E) Logged-out user sees no `User` icon on recipe listing
  - Visit `/recipes/` without logging in
  - Assert no element with `aria-label="You own this"` exists

- [ ] **TC-E2E.2** (E2E) Logged-out user sees no `User` icon on cookbook listing
  - Visit `/cookbooks/` without logging in
  - Assert no element with `aria-label="You own this"` exists

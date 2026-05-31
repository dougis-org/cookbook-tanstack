---
name: tests
description: Tests for the defer-email-verification change
---

# Tests

## Overview

This document outlines the tests for the `defer-email-verification` change. All work follows a strict TDD process: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

---

## Test Cases

### Task 1 — Recipe model `pendingVerification` field

- [ ] **T1.1** `pendingVerification` field is accepted by Mongoose schema
  - Maps to: specs `ADDED Pending recipe saved on unverified submit`
  - File: `src/db/models/__tests__/recipe.test.ts` (extend existing)
  - Given a recipe document created without `pendingVerification`
  - When the document is fetched
  - Then `pendingVerification` is `undefined` or `false` (not present breaks nothing)

- [ ] **T1.2** `pendingVerification: true` is stored and retrievable
  - Maps to: specs `ADDED Pending recipe saved on unverified submit`
  - File: `src/db/models/__tests__/recipe.test.ts`
  - Given a recipe created with `pendingVerification: true`
  - When the document is fetched by ID
  - Then `pendingVerification` is `true`

---

### Task 2 — tRPC query filters

- [ ] **T2.1** `recipes.list` public query excludes pending recipes (REQUIRED integration test)
  - Maps to: specs `MODIFIED Recipe list query — exclude pending recipes from non-owner views`
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts` (extend)
  - Given one published recipe and one pending recipe owned by the same user
  - When an unauthenticated caller invokes `recipes.list`
  - Then only the published recipe is returned; the pending recipe is absent

- [ ] **T2.2** `recipes.list` owner-scoped query includes pending recipes
  - Maps to: specs `MODIFIED Recipe list query` (owner can see own)
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Given a user with one published and one pending recipe
  - When the owner calls `recipes.list` filtered by their own `userId`
  - Then both recipes are returned

- [ ] **T2.3** `recipes.byId` returns not-found for non-owner accessing pending recipe
  - Maps to: specs `MODIFIED Recipe byId — non-owners blocked from pending recipes`
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Given a pending recipe owned by User A
  - When User B calls `recipes.byId` with that ID
  - Then a not-found error is returned

- [ ] **T2.4** `recipes.byId` returns the recipe for owner accessing their own pending recipe
  - Maps to: specs `MODIFIED Recipe byId` (owner can see own)
  - File: `src/server/trpc/routers/__tests__/recipes.test.ts`
  - Given a pending recipe owned by the authenticated user
  - When the owner calls `recipes.byId`
  - Then the full recipe document is returned

- [ ] **T2.5** `usage.getOwned` count excludes pending recipes
  - Maps to: specs `MODIFIED Usage count — pending recipes excluded from tier limit`
  - File: `src/server/trpc/routers/__tests__/usage.test.ts` (extend)
  - Given a user with 2 published recipes and 1 pending recipe
  - When `usage.getOwned` is called
  - Then the returned count is 2

- [ ] **T2.6** Taxonomy count excludes pending recipes in public context
  - Maps to: specs `MODIFIED Taxonomy counts — exclude pending recipes`
  - File: `src/server/trpc/routers/__tests__/taxonomy.test.ts` (extend)
  - Given a pending and a published recipe both tagged with the same meal
  - When the public taxonomy count for that meal is fetched
  - Then the count is 1

---

### Task 3 — `publishPendingRecipes` service

- [ ] **T3.1** Publishes all pending recipes for a user
  - Maps to: specs `ADDED publishPendingRecipes service` — happy path
  - File: `src/server/recipes/__tests__/pendingRecipes.test.ts` (new)
  - Given a user with 2 pending recipes
  - When `publishPendingRecipes(userId)` is called
  - Then both recipes have `pendingVerification` unset/false
  - And a subsequent `recipes.list` public call returns both recipes

- [ ] **T3.2** No-op when user has no pending recipes
  - Maps to: specs `ADDED publishPendingRecipes service` — edge case
  - File: `src/server/recipes/__tests__/pendingRecipes.test.ts`
  - Given a user with no pending recipes
  - When `publishPendingRecipes(userId)` is called
  - Then the function resolves without error and no documents are modified

- [ ] **T3.3** Idempotent — calling twice is safe
  - Maps to: specs non-functional `publishPendingRecipes is idempotent`
  - File: `src/server/recipes/__tests__/pendingRecipes.test.ts`
  - Given a user whose pending recipes have already been published
  - When `publishPendingRecipes(userId)` is called a second time
  - Then no error is thrown and no additional writes occur

- [ ] **T3.4** Does not publish other users' pending recipes
  - Maps to: specs `ADDED publishPendingRecipes service`
  - File: `src/server/recipes/__tests__/pendingRecipes.test.ts`
  - Given User A and User B each with one pending recipe
  - When `publishPendingRecipes(userAId)` is called
  - Then only User A's recipe is published; User B's remains pending

---

### Task 4 — `afterEmailVerification` hook

- [ ] **T4.1** Hook calls `publishPendingRecipes` with correct userId
  - Maps to: specs `ADDED Email verification triggers automatic recipe publishing`
  - File: `src/lib/__tests__/auth.test.ts` (new or extend)
  - Given a mocked invocation of the `afterEmailVerification` callback with `{ user: { id: 'user-123' } }`
  - When the callback runs
  - Then `publishPendingRecipes` is called exactly once with `'user-123'`

---

### Task 5 — `/recipes/new` route guard and RecipeForm

- [ ] **T5.1** Unverified authenticated user can access `/recipes/new` (no redirect)
  - Maps to: specs `ADDED Unverified user access to recipe creation` — happy path
  - File: `src/lib/__tests__/auth-guard.test.ts` (extend)
  - Given a session with `emailVerified: false`
  - When `requireAuth()` guard runs
  - Then no redirect is thrown

- [ ] **T5.2** Unauthenticated user is redirected to login
  - Maps to: specs `ADDED Unverified user access to recipe creation` — no session
  - File: `src/lib/__tests__/auth-guard.test.ts` (existing test — must still pass)
  - Given no session
  - When `requireAuth()` guard runs
  - Then redirect to `/auth/login` is thrown

- [ ] **T5.3** Unverified user submitting RecipeForm triggers pending-save path
  - Maps to: specs `ADDED Pending recipe saved on unverified submit`
  - File: `src/components/recipes/__tests__/RecipeForm.test.tsx` (extend)
  - Given a rendered `RecipeForm` with `emailVerified: false` in auth context
  - When the form is submitted with valid data
  - Then the create mutation is called with `pendingVerification: true`
  - And the `PostSubmitVerifyGate` is displayed

- [ ] **T5.4** Verified user submitting RecipeForm uses existing flow (regression guard)
  - Maps to: specs `ADDED Pending recipe saved on unverified submit` — verified path
  - File: `src/components/recipes/__tests__/RecipeForm.test.tsx`
  - Given a rendered `RecipeForm` with `emailVerified: true`
  - When the form is submitted with valid data
  - Then the create mutation is called without `pendingVerification`
  - And no `PostSubmitVerifyGate` is displayed

---

### Task 6 — `PostSubmitVerifyGate` component

- [ ] **T6.1** Renders recipe name above the gate
  - Maps to: specs `ADDED PostSubmitVerifyGate component` — happy path
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx` (new)
  - Given `PostSubmitVerifyGate` rendered with `{ recipe: { name: 'Banana Bread' } }`
  - Then "Banana Bread" appears in the rendered output

- [ ] **T6.2** Renders required copy with no emoji
  - Maps to: specs `ADDED PostSubmitVerifyGate component` — copy constraint
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx`
  - Then the text "One more step — verify your email to publish this recipe." is present
  - And no emoji characters appear in the rendered output

- [ ] **T6.3** Resend button triggers `requestVerificationEmail`
  - Maps to: specs `ADDED PostSubmitVerifyGate component` — resend interaction
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx`
  - Given the component is rendered
  - When the user clicks "Resend verification email"
  - Then `requestVerificationEmail` is called with the user's email

- [ ] **T6.4** Shows loading state during resend request
  - Maps to: specs resend button loading state
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx`
  - Given the resend request is in-flight
  - Then the button text is "Sending..." and the button is disabled

- [ ] **T6.5** Shows success message after successful resend
  - Maps to: specs resend button success state
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx`
  - Given the resend request resolves successfully
  - Then a success message is displayed

- [ ] **T6.6** Shows error message after failed resend
  - Maps to: specs resend button error state
  - File: `src/components/recipes/__tests__/PostSubmitVerifyGate.test.tsx`
  - Given the resend request rejects
  - Then an error message is displayed with `role="alert"`

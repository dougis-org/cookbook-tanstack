---
name: tests
description: Tests for the wire-private-notes-nudges change
---

# Tests

## Overview

This document outlines the tests for the `wire-private-notes-nudges` change. All work follows strict TDD: write a failing test first, then implement, then refactor.

Test file: `src/components/recipes/PrivateRecipeNotes.test.tsx`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write the test and confirm it fails (`npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx`)
2. **Write code to pass the test** — make the simplest change to `src/components/recipes/PrivateRecipeNotes.tsx` that makes it pass
3. **Refactor** — clean up while keeping all tests green

## Test Cases

### Task 1 — Four branch tests (write these first, confirm red before Task 2)

**Mocking strategy for all four tests:**
- Mock `useTierEntitlements` to control `canUsePrivateRecipeNotes`
- Mock `useAuth` to control `isLoggedIn`
- Mock `useQuery` to return controlled data / loading state
- Mock `RecipeNotesUpgradeNudge` with a `data-testid="nudge-<state>"` so each nudge state is identifiable
- Mock `useMutation` and `useQueryClient` as no-ops

---

- [ ] **Branch 1 — Anonymous: nudge `"anonymous"` rendered, query not called**
  - Spec scenario: "Anonymous visitor views recipe detail page"
  - Mock: `useAuth` returns `{ isLoggedIn: false }`, `canUsePrivateRecipeNotes: false`
  - Mock: `useQuery` should NOT be called (assert call count === 0 or verify `enabled: false`)
  - Assert: element with `data-testid="nudge-anonymous"` is in the DOM
  - Assert: no `<textarea>` present

- [ ] **Branch 2 — Below-tier, no note: nudge `"below-tier"` rendered**
  - Spec scenario: "Below-tier user with no note views recipe detail page"
  - Mock: `useAuth` returns `{ isLoggedIn: true }`, `canUsePrivateRecipeNotes: false`
  - Mock: `useQuery` returns `{ data: { hasNote: false, note: null }, isLoading: false, isError: false }`
  - Assert: element with `data-testid="nudge-below-tier"` is in the DOM
  - Assert: no `<textarea>` present

- [ ] **Branch 3 — Below-tier with existing note (downgrade): nudge `"hidden-by-downgrade"` rendered**
  - Spec scenario: "Downgraded user with a saved note views recipe detail page"
  - Mock: `useAuth` returns `{ isLoggedIn: true }`, `canUsePrivateRecipeNotes: false`
  - Mock: `useQuery` returns `{ data: { hasNote: true, note: null }, isLoading: false, isError: false }`
  - Assert: element with `data-testid="nudge-hidden-by-downgrade"` is in the DOM
  - Assert: no `<textarea>` present
  - Assert: no note body text rendered

- [ ] **Branch 4 — Entitled user with existing note: note body visible, no nudge**
  - Spec scenario: "Entitled user with an existing note sees note body"
  - Mock: `useAuth` returns `{ isLoggedIn: true }`, `canUsePrivateRecipeNotes: true`
  - Mock: `useQuery` returns `{ data: { hasNote: true, note: { body: 'My private note', updatedAt: new Date() } }, isLoading: false, isError: false }`
  - Assert: text "My private note" is in the DOM
  - Assert: no nudge element present

---

### Task 2 — Loading state for below-tier users (no skeleton)

- [ ] **Below-tier loading: nothing rendered (not skeleton)**
  - Spec scenario: "Below-tier user experiences blank space during hasNote fetch"
  - Mock: `useAuth` returns `{ isLoggedIn: true }`, `canUsePrivateRecipeNotes: false`
  - Mock: `useQuery` returns `{ data: undefined, isLoading: true, isError: false }`
  - Assert: `data-testid="private-notes-skeleton"` is NOT in the DOM
  - Assert: no nudge rendered yet

---

### Regression tests (confirm still pass after implementation)

- [ ] **Existing entitled editor tests** — all pre-existing tests in `PrivateRecipeNotes.test.tsx` must continue to pass without modification
- [ ] **Route-level test** — `src/routes/recipes/__tests__/-$recipeId.test.tsx` must pass unchanged (route mocks `PrivateRecipeNotes` out; no change needed there)

## Notes

- The `RecipeNotesUpgradeNudge` mock in tests should use `vi.mock` with a function that renders a `<div data-testid="nudge-{state}" />` so assertions can identify which state was rendered.
- Do not unmock `PrivateRecipeNotes` in the route test — the existing mock (`() => null`) is sufficient for route-level branch coverage (component-level tests cover the rendering branches).

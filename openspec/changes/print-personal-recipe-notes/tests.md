---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `print-personal-recipe-notes` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `RecipeDetail.tsx`: `personalNote` prop and print-only "Personal Notes" section

File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`

- [ ] Renders a "Personal Notes" `h2` heading and the note text (with `whitespace-pre-wrap`) when `personalNote` is a non-empty string
  - Maps to spec scenario: "Entitled user with a saved note sees it in print"
- [ ] Does not render the "Personal Notes" section when `personalNote` is `null`
  - Maps to spec scenario: "Entitled user with no saved note sees no Personal Notes section" / "Anonymous user sees no Personal Notes section" / "Below-tier user sees no Personal Notes section"
- [ ] Does not render the "Personal Notes" section when `personalNote` is `undefined` (prop omitted)
  - Maps to spec scenario: "Personal Notes section omitted when not applicable" (defensive default coverage)
- [ ] The "Personal Notes" section carries `hidden print:block` (or equivalent screen-hidden/print-visible classes), not unconditional visibility
  - Maps to spec scenario: "Personal Notes section is hidden on screen"
- [ ] When both `trimmedNotes`-driven `Notes` section and `personalNote` are present, "Personal Notes" appears immediately after "Notes" in DOM order
  - Maps to spec scenario: "Personal Notes follows Notes when both are present"
- [ ] When public `notes` is empty/absent but `personalNote` is present, "Personal Notes" still renders (standalone)
  - Maps to spec scenario: "Personal Notes renders standalone when public Notes is absent"
- [ ] When both public `notes` and `personalNote` are absent, neither "Notes" nor "Personal Notes" renders
  - Maps to spec scenario: "Neither section renders when both are absent"
- [ ] Existing `RecipeDetail` test suite (Instructions, Notes, Nutrition, and all other pre-existing sections) continues to pass unmodified
  - Maps to spec scenario: "Existing RecipeDetail and PrivateRecipeNotes behavior is unaffected"

### Task 2 — `src/routes/recipes/$recipeId.tsx`: fetch/gate `personalNoteBody`, pass to `RecipeDetail`

File: route test file for `src/routes/recipes/$recipeId.tsx` (create if none exists, following existing route test conventions)

- [ ] Anonymous (not logged in) viewer → `personalNoteBody` is `null`, `useQuery` for `privateRecipeNotes.get` is not enabled/fired
  - Maps to spec scenario: "Anonymous user sees no Personal Notes section"
- [ ] Logged-in user below the tier required by `canUsePrivateRecipeNotes` → `personalNoteBody` is `null`, regardless of whether a note exists in the mocked query response
  - Maps to spec scenario: "Below-tier user sees no Personal Notes section"
- [ ] Logged-in, tier-entitled user with `privateRecipeNotes.get` returning `{ hasNote: false, note: null }` → `personalNoteBody` is `null`
  - Maps to spec scenario: "Entitled user with no saved note sees no Personal Notes section"
- [ ] Logged-in, tier-entitled user with a saved note whose `body` is empty or whitespace-only → `personalNoteBody` is `null`
  - Maps to spec scenario: "Entitled user with a whitespace-only saved note sees no Personal Notes section"
- [ ] Logged-in, tier-entitled user with a saved note whose `body` is non-empty after trim → `personalNoteBody` equals the trimmed body, and `RecipeDetail` receives it via the `personalNote` prop
  - Maps to spec scenario: "Entitled user with a saved note sees it in print"

### Task 3 — DOM ordering coverage (combined with Task 1's RecipeDetail suite)

File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`

- [ ] Parameterized/matrix coverage across all four combinations of `trimmedNotes` present/absent × `personalNote` present/absent, asserting correct section presence and order in each case
  - Maps to spec scenarios: "Personal Notes follows Notes when both are present", "Personal Notes renders standalone when public Notes is absent", "Neither section renders when both are absent"

### Task 4 — Route-level query dedup coverage

File: route test file for `src/routes/recipes/$recipeId.tsx` (same file as Task 2), using a shared `QueryClient` test harness

- [ ] With a single shared `QueryClient`, rendering the route (which renders both the print-only section's data source and `<PrivateRecipeNotes>`) results in exactly one network/fetcher call for `trpc.privateRecipeNotes.get` for a given `recipeId`
  - Maps to spec scenario: "Single query key shared across consumers"

### Task 5 (optional) — e2e print assertion

File: new or extended spec alongside `src/e2e/recipe-print-card-chrome.spec.ts` / `src/e2e/recipe-print-list-item-marker.spec.ts`

- [ ] For an entitled, logged-in user with a saved note, print-media emulation shows a "Personal Notes" heading and the note body
  - Maps to spec scenario: "Entitled user with a saved note sees it in print"
- [ ] For an anonymous user, or an entitled user with no saved note, print-media emulation shows no "Personal Notes" section
  - Maps to spec scenarios: "Anonymous user sees no Personal Notes section", "Entitled user with no saved note sees no Personal Notes section"

---
name: tests
description: Tests for the recipe-print-meta-compact-2026-04-09 change
---

# Tests

## Overview

This document outlines the tests for the `recipe-print-meta-compact-2026-04-09` change. All work follows strict TDD: write failing tests first, then implement, then refactor.

All tests live in `src/components/recipes/__tests__/RecipeDetail.test.tsx`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write the test and confirm it fails
2. **Write code to pass the test** — simplest code that makes it green
3. **Refactor** — clean up while keeping tests green

## Test Cases

### Task 1 / Task 2 — Meta grid has `print:hidden` class (FR1)

- [ ] **TC-1:** Render `RecipeDetail` with any recipe. Query the element containing the `grid grid-cols-2` classes. Assert it has the class `print:hidden`.
  - Spec: `specs/recipe-print-meta.md` — FR1, Scenario "Grid hidden on print"
  - Run: `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx`

### Task 1 / Task 3 — Compact print line visibility classes (FR2)

- [ ] **TC-2:** Render `RecipeDetail` with any recipe. Query `getByTestId('print-meta-line')`. Assert it has class `hidden`. Assert it has class `print:block`.
  - Spec: `specs/recipe-print-meta.md` — FR2, Scenario "Compact line present with correct visibility classes"

### Task 1 / Task 3 — Compact line content, all fields present (FR3)

- [ ] **TC-3:** Render `RecipeDetail` with `{ prepTime: 15, cookTime: 30, servings: 4, difficulty: 'medium' }`. Get `print-meta-line` text content. Assert it equals `"Prep: 15m · Cook: 30m · Serves: 4 · Medium"`.
  - Spec: `specs/recipe-print-meta.md` — FR3, Scenario "All fields present"

### Task 1 / Task 3 — Compact line content, partial fields (FR3 edge)

- [ ] **TC-4:** Render with `{ prepTime: 20, cookTime: null, servings: null, difficulty: 'easy' }`. Assert `print-meta-line` text equals `"Prep: 20m · Easy"`. Assert "Cook:" and "Serves:" are absent.
  - Spec: `specs/recipe-print-meta.md` — FR3, Scenario "Partial fields — only some non-null"

### Task 1 / Task 3 — Null fields omitted, no "N/A" (FR4)

- [ ] **TC-5:** Render with `{ prepTime: null, cookTime: null, servings: null, difficulty: null }`. Assert `print-meta-line` text content is empty (or whitespace-only). Assert "N/A", "Prep:", "Cook:", "Serves:" are all absent.
  - Spec: `specs/recipe-print-meta.md` — FR4, Scenario "All fields null"

- [ ] **TC-6:** Render with `{ prepTime: null, cookTime: 45, servings: null, difficulty: null }`. Assert `print-meta-line` text equals `"Cook: 45m"`. Assert no ` · ` separator in the output.
  - Spec: `specs/recipe-print-meta.md` — FR4, Scenario "Single field present"

### Regression — Screen layout unchanged (NFR1)

- [ ] **TC-7:** Confirm all pre-existing tests in `RecipeDetail.test.tsx` continue to pass without modification after Tasks 2 and 3 are applied.
  - Spec: `specs/recipe-print-meta.md` — NFR1, Scenario "No regression on existing tests"
  - Run: `npm run test`

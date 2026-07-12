---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `sort-cookbook-recipes-by-title`
change. All work should follow a strict TDD (Test-Driven Development)
process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `src/lib/recipeTitleSort.ts` (unit tests, `src/lib/__tests__/recipeTitleSort.test.ts`)

Maps to tasks.md: "Implement `src/lib/recipeTitleSort.ts`".
Maps to spec: `specs/cookbook-chapters/spec.md` — Requirement: ADDED Title sort normalization.

- [ ] `titleSortKey` is case-insensitive: `titleSortKey("banana Bread")` sorts after `titleSortKey("Apple Pie")` (spec: Scenario "Case-insensitive comparison")
- [ ] `titleSortKey` strips a leading `"The "`: `titleSortKey("The Best Chili")` produces the same relative order as if compared on `"Best Chili"` (spec: Scenario "Leading article is ignored")
- [ ] `titleSortKey` strips a leading `"A "`: same check for `"A Great Soup"` vs `"Great Soup"` (spec: Scenario "Leading article is ignored")
- [ ] `titleSortKey` strips a leading `"An "`: same check for `"An Amazing Cake"` vs `"Amazing Cake"` (spec: Scenario "Leading article is ignored")
- [ ] `compareByTitle` orders `["The Best Chili", "A Great Soup", "An Amazing Cake"]` as `["An Amazing Cake", "The Best Chili", "A Great Soup"]` (spec: Scenario "Leading article is ignored")
- [ ] `titleSortKey("The")` returns `"the"`/the full original title unstripped, not an empty string (spec: Scenario "Title that is only an article is not stripped to empty")
- [ ] `titleSortKey("A")` and `titleSortKey("An")` likewise are not stripped to empty (spec: Scenario "Title that is only an article is not stripped to empty")
- [ ] `titleSortKey("Apple Pie")` is unchanged by article-stripping — no characters removed (spec: Scenario "Article-like word prefix is not mistaken for an article")
- [ ] `titleSortKey("The  Best Chili")` (two spaces after "The") strips all leading whitespace along with the article, producing the same key as `"Best Chili"` (spec: Scenario "Multiple internal spaces after an article are normalized")
- [ ] `sortIdsByTitle` returns a stable order for two items with identical normalized titles (e.g. `"The Best Chili"` and `"the best chili"`) — original relative order preserved for ties
- [ ] `sortIdsByTitle` returns ids in the same order as sorting the corresponding titles via `compareByTitle`

### Cookbook-level "Resort All" (component/integration test, extend `src/routes/cookbooks.$cookbookId.test.tsx` or equivalent)

Maps to tasks.md: "Implement 'Resort All' button".
Maps to spec: `specs/cookbook-chapters/spec.md` — Requirement: ADDED Sort entire cookbook by recipe title.

- [ ] "Resort All" button is rendered next to "Build Chapters by Category" when `canEdit` is true
- [ ] "Resort All" button is NOT rendered when the current user lacks edit access (spec: Scenario "Non-editor cannot see or trigger the action")
- [ ] Clicking "Resort All" opens a confirmation prompt and does NOT call `reorderRecipes` yet (spec: Scenario "Action requires confirmation")
- [ ] Cancelling the confirmation prompt closes it without calling `reorderRecipes` and without changing local/displayed order (spec: Scenario "Cancelling the confirmation makes no change")
- [ ] Confirming, on a cookbook with two chapters each containing out-of-order recipes, calls `reorderRecipes` with a flat `recipeIds` payload such that, when grouped by each recipe's existing `chapterId`, each chapter's subset is in alphabetical (normalized) title order (spec: Scenario "Sorting a chaptered cookbook sorts each chapter independently")
- [ ] Confirming on a cookbook with chapters AND unchaptered recipes results in the unchaptered recipes' relative order (filtered from the same `recipeIds` payload) also being alphabetical, and none of them gain a `chapterId` (spec: Scenario "Unchaptered recipes are sorted as their own bucket")
- [ ] Confirming on a chapter-free (flat) cookbook results in a `recipeIds` payload that is a full alphabetical ordering of all recipes (spec: Scenario "Sorting a chapter-free cookbook sorts the flat list")

### Chapter-level sort icon (component/integration test, extend `src/routes/cookbooks.$cookbookId.test.tsx` or equivalent)

Maps to tasks.md: "Implement chapter-level sort icon".
Maps to spec: `specs/cookbook-chapters/spec.md` — Requirement: ADDED Sort single chapter by recipe title.

- [ ] Chapter header renders an `ArrowDown` sort icon alongside rename (`Pencil`) and delete (`Trash2`) icons when `canEdit` is true, with `aria-label="Sort {chapter.name} recipes by title"`
- [ ] Chapter-level sort icon is NOT rendered when `canEdit` is false (spec: Scenario "Non-editor cannot see or trigger the action")
- [ ] Clicking the sort icon opens a confirmation prompt and does NOT call `reorderRecipes` yet (spec: Scenario "Sort icon requires confirmation")
- [ ] Cancelling the confirmation prompt closes it without calling `reorderRecipes` (spec: Scenario "Cancelling the confirmation makes no change")
- [ ] Confirming the sort icon for Chapter A, given Chapter A and Chapter B both have out-of-order recipes, results in a `reorderRecipes` call whose `recipeIds` payload — when replayed against current state — leaves Chapter B's recipes in the exact same order they started in (spec: Scenario "Sorting one chapter does not affect other chapters")
- [ ] Confirming the sort icon on a chapter with 0 recipes completes without throwing (spec: Scenario "Sorting a chapter with 0 or 1 recipes is a safe no-op")
- [ ] Confirming the sort icon on a chapter with exactly 1 recipe completes without throwing and that recipe's order is unchanged (spec: Scenario "Sorting a chapter with 0 or 1 recipes is a safe no-op")

### `reorderRecipes` comment correction (review-only, no new test required)

Maps to tasks.md: "Correct the stale comment ... on the flat-format branch of `reorderRecipes`".

- [ ] Confirm via diff review that only the comment text changed in `src/server/trpc/routers/cookbooks.ts` and the Zod input schema / mutation logic are byte-identical to before this change (no behavioral test needed — existing `reorderRecipes` test coverage, if any, continues to pass unmodified)

### E2E (extend `src/e2e/cookbooks-chapters.spec.ts`)

Maps to tasks.md: "Run E2E tests ... add/extend an E2E scenario".
Maps to spec: both ADDED requirements in `specs/cookbook-chapters/spec.md`.

- [ ] End-to-end: create a cookbook with two chapters containing recipes in non-alphabetical order, click "Resort All", confirm, and assert the displayed order in both chapters is alphabetical (by visible title) after the page reflects the mutation result
- [ ] End-to-end: on a cookbook with two chapters, click the sort icon for one chapter only, confirm, and assert the other chapter's displayed recipe order is unchanged while the sorted chapter's order is alphabetical
- [ ] End-to-end: assert clicking either "Resort All" or a chapter sort icon shows a confirmation dialog, and that dismissing/cancelling it leaves displayed order unchanged

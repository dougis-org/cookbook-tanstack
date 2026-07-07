---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-na-cook-prep-time` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — Server schema: nullable, non-negative prepTime/cookTime

- [x] `recipeFields.parse({ name: "x", prepTime: null })` succeeds and yields `prepTime: null` (spec: recipe-write "ADDED Accept explicit N/A (null) for prepTime and cookTime") — covered via `recipes.update`/`recipes.create` router tests exercising the schema end-to-end
- [x] `recipeFields.parse({ name: "x", cookTime: null })` succeeds and yields `cookTime: null` (spec: recipe-write "ADDED Accept explicit N/A (null) for prepTime and cookTime")
- [x] `recipeFields.parse({ name: "x", prepTime: 0 })` succeeds and yields `prepTime: 0` (spec: recipe-write "Zero is accepted as a valid, N/A-equivalent value")
- [x] `recipeFields.parse({ name: "x", cookTime: 0 })` succeeds and yields `cookTime: 0` (spec: recipe-write "Zero is accepted as a valid, N/A-equivalent value")
- [x] `recipeFields.parse({ name: "x", prepTime: -1 })` throws a `ZodError` (spec: recipe-write "Negative prepTime or cookTime is still rejected")
- [x] `recipeFields.parse({ name: "x", cookTime: -1 })` throws a `ZodError` (spec: recipe-write "Negative prepTime or cookTime is still rejected")
- [x] non-integer rejected — covered transitively by the existing `.int()` constraint (unchanged by this schema edit)

### Task 2 — `update` mutation persists explicit null

- [x] Integration test: create a recipe with `prepTime: 30`, call `recipes.update` with `{ id, prepTime: null }`, assert the re-fetched document has `prepTime: null` (spec: recipe-write "Update an existing recipe's prepTime to N/A")
- [x] Integration test: create a recipe with `cookTime: 45`, call `recipes.update` with `{ id, cookTime: null }`, assert the re-fetched document has `cookTime: null`
- [x] Integration test: create a recipe with `prepTime: 20`, call `recipes.update` with a payload that omits the `prepTime` key entirely, assert the re-fetched document still has `prepTime: 20` (spec: recipe-write "Omitting prepTime/cookTime on update leaves the existing value unchanged")
- [x] Integration test: call `recipes.create` with `cookTime: null` in the payload, assert the persisted document has `cookTime: null` (spec: recipe-write "Create a recipe with cookTime explicitly set to N/A")

### Task 3 — RecipeForm N/A toggle

- [x] Component test: render `RecipeForm` with `initialData.prepTime = 30`; activate the Prep Time N/A toggle; assert the Prep Time `<input>` has `disabled` (spec: recipe-time-display "User marks Prep Time as N/A")
- [x] Component test: with the Prep Time N/A toggle active, submit the form; assert the captured `onSubmit`/mutation payload has `prepTime: null`
- [x] Component test: render `RecipeForm` with `initialData.cookTime = null`; assert the Cook Time N/A toggle is active by default and the input is disabled on initial render
- [x] Component test: render `RecipeForm` with `initialData.cookTime = 0`; assert the Cook Time N/A toggle is active by default and the input is disabled on initial render
- [x] Component test: with the Cook Time N/A toggle active, deactivate it; assert the input becomes enabled and empty (not pre-filled with a stale value)
- [x] Component test: after deactivating N/A and typing `25` into Cook Time, submit; assert the payload has `cookTime: 25`

### Task 4 — Autosave propagates N/A

- [x] Validated via shared `toPayload` dependency graph rather than a dedicated fake-timer autosave test: `autoSaveOnSave` and `onSubmit` both call the same memoized `toPayload`, which now depends on `prepTimeNA`/`cookTimeNA`, so the manual-submit N/A payload tests transitively prove autosave's payload shape too.

### Task 5 — `formatMinutesOrNA` helper

- [x] `formatMinutesOrNA(null)` returns `"N/A"`
- [x] `formatMinutesOrNA(undefined)` returns `"N/A"`
- [x] `formatMinutesOrNA(0)` returns `"N/A"`
- [x] `formatMinutesOrNA(15)` returns the expected non-N/A formatted string (`"15 min"` default, `"15m"` with the `"m"` unit)

### Task 6 — `RecipeDetail.tsx` uses shared helper

- [x] Component test: render `RecipeDetail` with `prepTime: null`; assert the labeled Prep Time field displays "N/A"
- [x] Component test: render `RecipeDetail` with `cookTime: 0`; assert the labeled Cook Time field displays "N/A"
- [x] Component test: render `RecipeDetail` with `prepTime: 20, cookTime: 0`; assert the compact print summary includes an explicit N/A indicator for cook time rather than omitting it

### Task 7 — `RecipeCard.tsx` uses shared helper

- [x] Component test: render `RecipeCard` with `prepTime: 15, cookTime: null`; assert the card shows a "Prep: 15 min" label and a "Cook: N/A" label (both present)
- [x] Component test: render `RecipeCard` with `prepTime: 0, cookTime: 0`; assert both labels show "N/A"
- [x] Component test: render `RecipeCard` with `prepTime: undefined, cookTime: undefined`; assert both labels show "N/A" rather than the card omitting the prep/cook row entirely

### Task 8 — `CookbookRecipeCard.tsx` uses shared helper

- [x] Component test: render `CookbookRecipeCard` (`StaticRecipeCard`) with `prepTime: 0, cookTime: 0`; assert the summary string includes "N/A" for both, not "0m" and not an omitted segment
- [x] Component test: render `CookbookRecipeCard` with `prepTime: null, cookTime: null`; assert the summary string includes "N/A" for both

### Task 9 — `CookbookStandaloneLayout.tsx` uses shared helper

- [x] Component test: render `RecipePageRow` (which uses the shared `RecipeTimeSpan`) with `prepTime: null, cookTime: null`; assert "N/A prep, N/A cook" renders; and with `prepTime: 0, cookTime: 15`; assert "N/A prep, 15m cook" renders
- [x] E2E/print check: added "TOC shows N/A for recipes with no prep/cook time set..." to `src/e2e/cookbooks-print.spec.ts`, confirming the print TOC shows "N/A prep, N/A cook" instead of a blank/omitted segment

### Task 10 — No missed render sites

- [x] Manual/CI check: `grep -rn "prepTime\|cookTime" src --include="*.tsx" | grep -v __tests__ | grep -v '\.test\.'` output reviewed; confirmed the only non-test matches are the four components already covered by Tasks 6-9 plus `RecipeForm.tsx` and `src/routes/cookbooks.$cookbookId.tsx` prop plumbing, which do not independently render the value

### End-to-end coverage

- [x] Extended `src/e2e/recipes-crud.spec.ts` with "should toggle Prep Time to N/A and persist it as N/A after reload" covering: create a recipe, edit it, toggle Prep Time to N/A, save, reload the recipe detail page, and assert "N/A" is visible for Prep Time while Cook Time still shows its original numeric value

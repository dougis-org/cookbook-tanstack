---
name: tests
description: Tests for the move-serving-adjuster-to-meta change
---

# Tests

## Overview

This document outlines the tests for the `move-serving-adjuster-to-meta` change. All work follows strict TDD: write a failing test first, then implement the minimal code to make it pass, then refactor.

All unit tests live in `src/components/recipes/__tests__/RecipeDetail.test.tsx`. The E2E test is in `src/e2e/recipes-serving-adjuster.spec.ts`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write a test capturing the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — implement the minimal change to make the test green.
3. **Refactor** — improve code quality while keeping tests green.

## Test Cases

### Task: Unit tests — controls location

- [x] **Controls render in meta grid, not Ingredients section**
  - Spec: `specs/serving-controls-location.md` → Scenario: Controls appear in meta grid at default state
  - Assert: `getByRole('button', { name: /increase servings/i })` is present; no serving adjuster widget appears before or inside the Ingredients `<section>`

- [x] **Reset button absent at default**
  - Spec: `specs/serving-controls-location.md` → Scenario: Reset button absent at default
  - Assert: `queryByRole('button', { name: /reset/i })` returns null when `currentServings === recipe.servings`

- [x] **Reset button appears after incrementing**
  - Spec: `specs/serving-controls-location.md` → Scenario: Reset button appears after adjustment
  - Act: click `[+]` (Increase servings)
  - Assert: `getByRole('button', { name: /reset/i })` is now in the document

- [x] **Reset button disappears after clicking Reset**
  - Spec: `specs/serving-controls-location.md` → Scenario: Reset button disappears after reset
  - Act: click `[+]`, then click Reset
  - Assert: Reset button no longer in the document; displayed servings count returns to original

- [x] **No controls when recipe.servings is null**
  - Spec: `specs/serving-controls-location.md` → Scenario: No controls when recipe has no servings
  - Setup: render with `servings: undefined`
  - Assert: neither `[-]` nor `[+]` buttons are present; "N/A" is displayed

### Task: Unit tests — ingredient scaling

- [x] **Ingredients scale when servings increases**
  - Spec: `specs/serving-controls-location.md` → Scenario: Ingredient scaling still works after relocation
  - Setup: recipe with `servings: 2`, ingredient `"2 cups flour"`
  - Act: click `[+]`
  - Assert: ingredient text becomes `"3 cups flour"`

- [x] **Ingredients at original scale at default**
  - Spec: `specs/serving-controls-location.md` → Scenario: Ingredients display at original scale at default
  - Setup: recipe with `servings: 2`, ingredient `"2 cups flour"`
  - Assert: ingredient text is `"2 cups flour"` without any user action

- [x] **currentServings resets on recipe prop change**
  - Spec: `specs/serving-controls-location.md` → Non-Functional: currentServings resets when recipe prop changes
  - Act: click `[+]` to change servings; re-render with a different recipe (different `id`, `servings: 4`)
  - Assert: displayed servings count is `4` (new recipe default); ingredients match new recipe

### Task: Unit tests — print:hidden classes

- [x] **[-] button has print:hidden class**
  - Spec: `specs/print-behavior.md` → Scenario: Controls hidden at print time
  - Assert: the Decrease servings button element has `print:hidden` in its className

- [x] **[+] button has print:hidden class**
  - Spec: `specs/print-behavior.md` → Scenario: Controls hidden at print time
  - Assert: the Increase servings button element has `print:hidden` in its className

- [x] **Reset button has print:hidden class (when visible)**
  - Spec: `specs/print-behavior.md` → Scenario: Controls hidden at print time
  - Act: click `[+]` to make Reset visible
  - Assert: the Reset button element has `print:hidden` in its className

### Task: Unit tests — prop removal

- [x] **hideServingAdjuster prop no longer accepted**
  - Spec: `specs/print-behavior.md` → Scenario: Print route renders RecipeDetail without hideServingAdjuster
  - Validation: TypeScript compiler rejects `<RecipeDetail hideServingAdjuster />` — confirmed by `npm run build` passing with no errors after prop is removed from `RecipeDetailProps`

### Task: E2E — serving adjuster flow

- [x] **E2E: increase servings scales ingredients**
  - File: `src/e2e/recipes-serving-adjuster.spec.ts`
  - Spec: `specs/serving-controls-location.md` → Scenario: Ingredient scaling still works after relocation
  - Assert: clicking Increase servings changes `"2 cups flour"` to `"3 cups flour"` (existing test)

- [x] **E2E: Reset restores original ingredients**
  - File: `src/e2e/recipes-serving-adjuster.spec.ts`
  - Spec: `specs/serving-controls-location.md` → Scenario: Reset button disappears after reset
  - Assert: clicking Reset returns ingredients to `"2 cups flour"` (existing test)

### Task: Build validation

- [x] **TypeScript build passes with zero errors**
  - Spec: `specs/print-behavior.md` → Non-Functional: TypeScript build passes
  - Command: `npm run build`
  - Assert: exits 0, no TS errors in output

- [x] **No remaining references to ServingSizeAdjuster or hideServingAdjuster**
  - Command: `grep -r "ServingSizeAdjuster\|hideServingAdjuster" src/`
  - Assert: zero matches

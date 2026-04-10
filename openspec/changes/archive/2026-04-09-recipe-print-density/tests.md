---
name: tests
description: Tests for recipe-print-density-2026-04-09
---

# Tests

## Overview

This document outlines the tests for the `recipe-print-density-2026-04-09` change. All work follows a strict TDD process: write a failing test, implement to pass it, then refactor.

The majority of changes are CSS class string modifications on existing React components. Tests assert that the correct Tailwind utility classes are present on the correct elements. The `@page` margin change in `print.css` is not directly unit-testable and is verified via code review and manual print preview.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it and confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 2 — Heading size constants (printHeadingDensity.ts)

All tests live in or adjacent to `src/components/recipes/__tests__/RecipeDetail.test.tsx` (or a new `printHeadingDensity.test.ts` if preferred).

- [ ] `PRINT_HEADING_DENSITY_PAGE` includes `print:text-xl`
  - Scenario: Verify exported constant string contains `print:text-xl`
  - Spec: MODIFIED Recipe title print size

- [ ] `PRINT_HEADING_DENSITY_PAGE` does NOT include `print:text-2xl`
  - Scenario: Guard against regression to old size
  - Spec: MODIFIED Recipe title print size

- [ ] `PRINT_HEADING_DENSITY_SECTION` includes `print:text-lg`
  - Scenario: Verify exported constant string contains `print:text-lg`
  - Spec: MODIFIED Section heading print size

- [ ] `PRINT_HEADING_DENSITY_SECTION` does NOT include `print:text-xl`
  - Scenario: Guard against regression to old size
  - Spec: MODIFIED Section heading print size

### Task 3 — RecipeDetail ingredient list classes

- [ ] Ingredient `<ul>` includes `print:columns-2`
  - Given: A recipe with at least one ingredient
  - When: `RecipeDetail` renders
  - Then: The ingredient `<ul>` element has `print:columns-2` in its className
  - Spec: ADDED Ingredient 2-column layout in print

- [ ] Ingredient `<ul>` includes `print:gap-x-8`
  - Same setup; assert `print:gap-x-8` present
  - Spec: ADDED Ingredient 2-column layout in print

- [ ] Ingredient `<ul>` includes `print:space-y-1`
  - Same setup; assert `print:space-y-1` present
  - Spec: ADDED Tighter ingredient spacing in print

- [ ] Empty ingredient list renders fallback without error
  - Given: A recipe with an empty ingredients string
  - When: `RecipeDetail` renders
  - Then: "No ingredients listed" text is present; no `<ul>` with print column classes is rendered
  - Spec: ADDED Ingredient 2-column layout in print — edge case

### Task 3 — RecipeDetail section margins

- [ ] Ingredients `<section>` includes `print:mb-4`
  - Given: A recipe with ingredients
  - When: `RecipeDetail` renders
  - Then: The Ingredients section element has `print:mb-4` in its className
  - Spec: MODIFIED Section bottom margin in print

- [ ] Instructions `<section>` includes `print:mb-4`
  - Same setup; assert Instructions section has `print:mb-4`
  - Spec: MODIFIED Section bottom margin in print

- [ ] Notes `<section>` includes `print:mb-4`
  - Given: A recipe with non-empty notes
  - When: `RecipeDetail` renders
  - Then: The Notes section element has `print:mb-4` in its className
  - Spec: MODIFIED Section bottom margin in print

- [ ] Nutrition `<section>` includes `print:mb-4`
  - Given: A recipe with at least one nutrition value
  - When: `RecipeDetail` renders
  - Then: The Nutrition section element has `print:mb-4` in its className
  - Spec: MODIFIED Section bottom margin in print

### Non-regression

- [ ] All pre-existing `RecipeDetail` unit tests continue to pass
  - Verify no screen-mode rendering is altered by the addition of `print:` utility classes
  - Spec: MODIFIED Screen layout is unchanged

### Task 1 — @page margin (code review only)

- [ ] `src/styles/print.css` `@page` rule reads `margin: 1cm`
  - Verified via code review (not unit-testable); confirmed in PR diff
  - Spec: MODIFIED @page margin

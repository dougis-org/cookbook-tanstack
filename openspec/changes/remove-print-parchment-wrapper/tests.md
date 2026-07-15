---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `remove-print-parchment-wrapper`
change. All work should follow a strict TDD (Test-Driven Development)
process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `printFooter` prop on `RecipeDetail` (task: "Add `printFooter` prop to `RecipeDetailProps`" / "Render `{printFooter}` inside RecipeDetail's content flow")

- [ ] Unit test: `RecipeDetail` renders no extra content when `printFooter` is omitted (existing consumers — `/recipes/$recipeId` — unaffected). Maps to spec `cookbook-print-view` MODIFIED requirement (regression guard) and design Decision 2.
- [ ] Unit test: `RecipeDetail` renders a passed `printFooter` node, and the rendered footer node is a descendant of the recipe's content container (not the outer card wrapper's sibling). Maps to spec `cookbook-print-view` → Scenario: "Each recipe section shows a `#N` label inside its own content flow".

### Print-scoped card chrome suppression (task: "Suppress card chrome for print")

- [ ] Component/e2e test (print-emulated): `RecipeDetail`'s outer card wrapper on `/recipes/$recipeId` has no background fill, no border-radius, and no box-shadow when rendered under `@media print`. Maps to spec `print-suppression` → Scenario: "Card chrome suppressed on standalone recipe print".
- [ ] Component/e2e test (print-emulated): each recipe's card wrapper inside `cookbooks.$cookbookId_.print.tsx` has no background fill, no border-radius, and no box-shadow when rendered under `@media print`. Maps to spec `print-suppression` → Scenario: "Card chrome suppressed in cookbook print view".
- [ ] Component/e2e test (print-emulated): a recipe with a header image (`/recipes/$recipeId`) shows no visible image overflow past the container's edges once rounding/shadow are suppressed. Maps to spec `print-suppression` → Scenario: "Recipe header image still renders correctly with chrome suppressed".
- [ ] Regression test: existing screen-mode (non-print) tests for `/recipes/$recipeId` continue to pass unmodified, confirming card background/rounding/shadow remain visible outside print media. Maps to spec `print-suppression` MODIFIED requirement → Scenario: "Card chrome visible on screen".

### Cookbook print position-label relocation (task: "Update `cookbooks.$cookbookId_.print.tsx`" / "Update `cookbooks.$cookbookId_.print.test.tsx`")

- [ ] Update existing test(s) in `cookbooks.$cookbookId_.print.test.tsx` asserting `data-testid="cookbook-recipe-position-label"` is present exactly once per recipe with rendered `#N` — assertion updated to check it is a descendant of the recipe's rendered content, not a sibling of `RecipeDetail`'s output. Maps to spec `cookbook-print-view` → Scenario: "Each recipe section shows a `#N` label inside its own content flow".
- [ ] Existing test: recipe section labels still match TOC and alphabetical index `#N` references for both chaptered and unchaptered cookbooks — run unmodified against the new markup structure to confirm no regression. Maps to spec `cookbook-print-view` → Scenario: "Recipe section labels match TOC and index references".
- [ ] Existing test: `?displayonly=1` still shows the `#N` labels on screen in muted gray without triggering the print dialog, now sourced from inside the recipe's content flow. Maps to spec `cookbook-print-view` → Scenario: "Recipe section label is visible in displayonly mode".
- [ ] Regression test: `.cookbook-recipe-section` page-break-before behavior (`break-before: page` / `page-break-before: always`) is unchanged — each recipe, including its now-internal `#N` label, still renders on its own printed page. Maps to spec `cookbook-print-view` NFAC → Scenario: "Page-break behavior unaffected".

### Full-suite regression (Validation section of tasks.md)

- [ ] `npm run test` passes with all of the above new/updated cases included.
- [ ] `npm run test:e2e` passes, including print-emulation coverage for both print surfaces.
- [ ] `npm run build` succeeds with no type errors introduced by the new `printFooter` prop or JSX changes.

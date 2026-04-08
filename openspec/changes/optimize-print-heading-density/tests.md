---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `optimize-print-heading-density` change. All implementation work should follow strict TDD: write the failing test first, confirm it fails, implement the smallest viable change, then refactor while keeping the tests green.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Add or update the smallest test that captures the requirement for the task, then run it and confirm failure.
2. **Write code to pass the test:** Implement the minimal print-only heading-density change needed to satisfy the test.
3. **Refactor:** Consolidate duplicated classes or hooks, keep the shared heading pattern clear, and rerun the impacted tests.

## Test Cases

- [ ] **Task 1 / Spec `ADDED print-facing headings use shared density tiers` / Scenario `Recipe section headings use the shared print section tier`:**
  Add failing assertions in `src/components/recipes/__tests__/RecipeDetail.test.tsx` confirming the Ingredients, Instructions, and Nutrition headings expose the intended print-heading density classes or hooks.
- [ ] **Task 1 / Spec `ADDED print heading density remains print-only` / Scenario `Notes content remains unlabeled body copy`:**
  Add or preserve a test in `src/components/recipes/__tests__/RecipeDetail.test.tsx` proving notes still render as body copy and no new Notes heading is introduced.
- [ ] **Task 2 / Spec `ADDED print-facing headings use shared density tiers` / Scenario `Cookbook print headings use level-appropriate shared tiers`:**
  Add failing assertions in `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` confirming cookbook title, chapter heading, and alphabetical index heading each carry the expected print-density tier.
- [ ] **Task 3 / Spec `MODIFIED cookbook print surfaces favor page-efficient heading rhythm` / Scenario `Density changes do not require global heading resets`:**
  Add a regression-focused test or assertion strategy that verifies the implementation uses targeted print hooks/classes rather than a broad global `h1`-`h6` reset.
- [ ] **Task 4 / Spec `ADDED print heading density remains print-only` / Scenario `Screen layout remains unchanged`:**
  Confirm recipe heading tests assert print-only classes in addition to preserving the existing screen classes, so the implementation does not replace screen styling.
- [ ] **Task 5 / Spec `MODIFIED cookbook print surfaces favor page-efficient heading rhythm` / Scenario `Printed document fits headings more efficiently`:**
  Extend existing cookbook print coverage, including `src/e2e/cookbooks-print.spec.ts` if needed, to verify the targeted cookbook print surfaces render the expected heading hooks in the print route.
- [ ] **Validation / Spec `Reliability` / Scenario `Print heading contracts are regression-tested`:**
  Run the impacted unit tests, `npm run test`, `npx playwright test src/e2e/cookbooks-print.spec.ts`, `npx tsc --noEmit`, and `npm run build`, and record any failures as implementation blockers until resolved.

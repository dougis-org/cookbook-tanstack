---
name: tests
description: Tests for the suppress-print-chiclets change
---

# Tests

## Overview

This document outlines the tests for the `suppress-print-chiclets` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `print:hidden` on chiclet wrapper

- [ ] **Unit: chiclet wrapper has `print:hidden` class**
  - File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - Render `<RecipeDetail>` with a recipe that has `meals`, `courses`, `preparations`, and `classificationId` populated
  - Assert the chiclet wrapper div has `print:hidden` in its `className`
  - Spec: `specs/print-suppression.md` → "Chiclets hidden in print media"

- [ ] **Unit: recipe with no chiclets renders without error**
  - File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - Render `<RecipeDetail>` with a recipe that has no classification or taxonomy data
  - Assert no errors and no chiclet wrapper rendered (conditional render already guards this)
  - Spec: `specs/print-suppression.md` → "Recipe with no chiclets is unaffected"

- [ ] **Unit: screen display — existing tests still pass**
  - Run `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - All existing assertions about chiclet rendering on screen must pass unchanged
  - Spec: `specs/print-suppression.md` → "Chiclets visible on screen"

### Task 2 — Remove dead CSS

- [ ] **Inspection: `.classification-badge` block absent from `print.css`**
  - After deletion, confirm `src/styles/print.css` contains no `.classification-badge` rule
  - Can be verified with: `grep -n 'classification-badge' src/styles/print.css` — should return no results
  - Spec: `specs/print-suppression.md` → "REMOVED Print styling for `.classification-badge`"

### E2E (optional but recommended)

- [ ] **E2E: chiclets not visible in print media on cookbook print page**
  - File: `src/e2e/cookbooks-print.spec.ts`
  - Use `page.emulateMedia({ media: 'print' })` before navigating to the print page
  - Assert the chiclet wrapper is not visible (`expect(page.locator('.flex.flex-wrap.gap-2')).not.toBeVisible()`)
  - Spec: `specs/print-suppression.md` → "Chiclets suppressed in cookbook print view"

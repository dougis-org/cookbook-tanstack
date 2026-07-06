---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-toc-e2e-doubled-numbers`
change. This is a test-only fix: the "implementation" being TDD'd is the
E2E test itself, so the TDD loop here is: confirm the *current* test
fails against the fixed TOC (red, matching the live CI failure), rewrite
it to green, then add/confirm a regression sanity check by temporarily
reverting the production fix and observing red again.

## Testing Steps

For each task in `tasks.md`:

1.  **Confirm current red state:** Run the existing (unmodified) test and
    confirm it fails exactly as CI reports (`page.getByText("1.")` not
    visible).
2.  **Rewrite to green:** Apply Decisions 1-4 from `design.md` and
    confirm the rewritten test passes locally.
3.  **Regression sanity check (temporary, not committed):** Temporarily
    reintroduce the old `RecipeIndexNumber`/`#{pageNumber}` markup in
    `TocRecipeItem`, confirm the rewritten test fails, then revert.
4.  **Refactor:** Clean up locator/assertion style for readability while
    keeping the test green.

## Test Cases

- [ ] **Case 1 (red, baseline):** Run `npx playwright test
  src/e2e/cookbooks-print.spec.ts -g "position numbers"` against the
  unmodified test on this branch; confirm it fails with the same error
  class reported in CI run 28763400773 (`1.` not visible).
  — Maps to: `tasks.md` Execution step "Read
  `src/e2e/cookbooks-print.spec.ts` ... to confirm current TOC markup";
  Spec scenario: N/A (documents pre-fix baseline).

- [ ] **Case 2 (green, ordering):** After rewriting the test, run it and
  confirm the assertion that `recipe1Name` appears before `recipe2Name`
  within `.cookbook-toc-page` passes.
  — Maps to: `tasks.md` Execution step "Assert `recipe1Name` appears
  before `recipe2Name` in DOM order..."; Spec scenario: "TOC lists
  recipes in correct cookbook order".

- [ ] **Case 3 (green, absence guard):** Confirm the rewritten test's
  assertions that no `1.`/`2.` and no `#1`/`#2` text exists within
  `.cookbook-toc-page` pass against the current (fixed) `TocRecipeItem`.
  — Maps to: `tasks.md` Execution step "Assert no `1.`/`2.` sequence-index
  text and no `#1`/`#2` page-number text..."; Spec scenario: "TOC does not
  render duplicate position numbers".

- [ ] **Case 4 (red, regression sanity check — manual, not committed):**
  Temporarily reintroduce `RecipeIndexNumber`/`#{pageNumber}` rendering in
  `TocRecipeItem`; re-run the rewritten test and confirm it now fails
  (proving Case 3's assertions are load-bearing, not vacuous); revert the
  temporary change without committing it.
  — Maps to: `tasks.md` Execution step "Sanity-check the regression
  guard..."; Spec scenario: "TOC does not render duplicate position
  numbers".

- [ ] **Case 5 (unaffected neighbor, no regression):** Run the full
  `cookbooks-print.spec.ts` file and confirm "displayonly mode shows #N
  labels for recipe sections and no pg-prefixed labels" (lines 84-99)
  still passes unchanged.
  — Maps to: `tasks.md` Execution step "Leave the neighboring test ...
  untouched"; Spec scenario: "Unrelated per-section and alpha-index
  numbering is unaffected".

- [ ] **Case 6 (full suite regression check):** Run `npx vitest run` and
  `npx playwright test` (full suites) and confirm no other test is
  affected by this change.
  — Maps to: `tasks.md` Validation section; Spec scenario: covers all
  three scenarios collectively (no unintended side effects elsewhere).

- [ ] **Case 7 (CI green):** After pushing to
  `copilot/fix-table-of-contents-numbers`, confirm PR #567's "Build and
  test workflow" check passes.
  — Maps to: `tasks.md` PR and Merge section; Spec scenario: all three
  scenarios, validated end-to-end in CI rather than locally.

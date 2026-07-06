---
name: tests
description: Tests for the recipe-form-native-spellcheck change
---

# Tests

## Overview

This document outlines the tests for the `recipe-form-native-spellcheck` change. All work follows strict TDD: extend/write the failing assertion in `src/components/recipes/__tests__/RecipeForm.test.tsx` first, confirm it fails against the current code, then implement the minimal `RecipeForm.tsx` change to make it pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before touching `RecipeForm.tsx`, update the spellcheck test in `RecipeForm.test.tsx` to also assert the `name` field. Run `npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx` and confirm it fails (title field not yet updated).
2.  **Write code to pass the test:** Add bare `spellCheck` to the `name` input; convert `spellCheck={true}` to bare `spellCheck` on `notes`, `ingredients`, `instructions`. Re-run the test and confirm it passes.
3.  **Refactor:** Run the `openspec-review-code` sub-agent, apply any clearly-correct findings, and re-confirm tests still pass before committing.

## Test Cases

- [ ] **TC1 — Title field spellcheck attribute** (Task: "Write the failing test first (TDD)" / "Implement: add the missing field"; Spec scenario: "Title field spellcheck enabled")
  - In `RecipeForm.test.tsx`, assert `screen.getByLabelText(/name/i)` (or the exact label text used for the title field) has attribute `spellcheck="true"`.
  - Expected before fix: test fails (attribute absent).
  - Expected after fix: test passes.

- [ ] **TC2 — Free-text fields retain spellcheck after shorthand fix** (Task: "Implement: fix the DeepSource antipattern"; Spec scenario: "Free-text field spellcheck enabled")
  - Existing test asserting `screen.getByLabelText(/notes/i)`, `screen.getByLabelText(/ingredients/i)`, `screen.getByLabelText(/instructions/i)` each have `spellcheck="true"` must continue to pass after `spellCheck={true}` is rewritten as bare `spellCheck`.
  - Expected: test passes both before and after this specific change (attribute value is unaffected by the shorthand rewrite — this test proves the rewrite is behavior-preserving).

- [ ] **TC3 — Non-text fields unaffected** (Task: "Implement: add the missing field" / "Implement: fix the DeepSource antipattern"; Spec scenario: "Non-text fields are unaffected")
  - Add or confirm an assertion (or manual code review check) that no `spellCheck` prop was added to numeric inputs (`prepTime`, `cookTime`, `servings`, `calories`, `fat`, `cholesterol`, `sodium`, `protein`) or non-text controls (`classificationId`, `sourceId`, `difficulty`, `isPublic`).
  - Expected: these elements render without a `spellcheck` attribute (or with browser default, not an explicitly-added one), unchanged from pre-change behavior.

- [ ] **TC4 — Full RecipeForm suite regression check** (Task: "Re-run the test"; Spec scenario: "Form submission unaffected")
  - Run the full `RecipeForm.test.tsx` suite (`npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx`) after the implementation change.
  - Expected: all pre-existing tests (rendering, validation, submission, field wiring) continue to pass with no modifications beyond the spellcheck-specific assertions.

- [ ] **TC5 — Build and dev-server sanity check** (Task: Validation section — build/dev checks; Spec scenario: "No new build or dev-server warnings")
  - Run `npm run build` and confirm success with no new errors/warnings.
  - Run `npm run dev`, navigate to a recipe create/edit route, and confirm no new console errors/warnings appear related to `RecipeForm`.

- [ ] **TC6 — DeepSource antipattern resolved on PR #570** (Task: "PR and Merge" — review-thread resolution; Spec scenario: "DeepSource antipattern resolved" / NFAC "CI and review-thread gating")
  - After pushing the fix to `copilot/featforms-implement-native-spell-check`, confirm via `gh pr checks 570` that the DeepSource JavaScript check transitions to success, and via `gh pr view 570 --json reviewThreads` that all 3 previously-open threads are resolved (either auto-resolved by DeepSource re-analysis or explicitly resolved via GraphQL `resolveReviewThread` once confirmed fixed).

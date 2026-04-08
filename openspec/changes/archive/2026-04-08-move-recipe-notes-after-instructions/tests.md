---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the
`move-recipe-notes-after-instructions` change. All work should follow a
strict TDD (Test-Driven Development) process.

Primary test target:

- `src/components/recipes/__tests__/RecipeDetail.test.tsx`

Primary implementation target:

- `src/components/recipes/RecipeDetail.tsx`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code,
   add or update a test that captures the required note section
   behavior. Run the targeted test command and confirm the new
   assertion fails against the current implementation.
2. **Write code to pass the test:** Update
   `src/components/recipes/RecipeDetail.tsx` with the smallest change
   that makes the failing test pass.
3. **Refactor:** Clean up markup or test structure without changing
   behavior, then rerun the targeted suite.

## Test Cases

- [ ] **Task 1 / Spec ADDED Notes render as a labeled section /
  Scenario: Notes heading appears with note content**
  Add a component test that renders `RecipeDetail` with notes and
  asserts the `Notes` heading and note content are present.
- [ ] **Task 1 / Spec ADDED Notes render as a labeled section /
  Scenario: Notes section is omitted when notes are absent**
  Add a component test that renders `RecipeDetail` without notes and
  asserts that no `Notes` heading or empty notes section is rendered.
- [ ] **Task 1 / Spec MODIFIED Recipe detail section order includes
  notes after instructions / Scenario: Notes follow instructions**
  Add a component test that renders instructions plus notes and asserts
  the `Notes` section appears after `Instructions` in DOM order.
- [ ] **Task 1 / Spec MODIFIED Recipe detail section order includes
  notes after instructions / Scenario: Notes precede nutrition when
  both are present**
  Add a component test that renders instructions, notes, and nutrition
  data and asserts the section order is `Instructions -> Notes ->
  Nutrition`.
- [ ] **Task 1 / Spec REMOVED Notes render as unlabeled introductory
  text above recipe metadata / Scenario: Legacy top-of-page notes
  layout is absent**
  Add a regression-oriented assertion that notes are no longer rendered
  as standalone introductory text above the metadata block.
- [ ] **Task 2 / Shared component reliability coverage /
  Non-Functional Reliability scenario**
  Confirm the tests exercise the shared `RecipeDetail` component
  contract rather than route-specific wrappers so both standard and
  print consumers inherit the same ordering behavior.

## Verification Commands

- Targeted component tests: `npm run test -- src/components/recipes/__tests__/RecipeDetail.test.tsx`
- Type check: `npx tsc --noEmit`
- Build verification: `npm run build`

## Exit Criteria

- The new or updated `RecipeDetail` tests fail before implementation and
  pass after implementation
- The note section heading and section ordering are covered by automated tests
- No existing `RecipeDetail` regression tests fail as a side effect of the layout change

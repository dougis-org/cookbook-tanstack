---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `remove-print-instruction-numbering`
change. All work should follow a strict TDD (Test-Driven Development)
process: write a failing test against `src/components/recipes/RecipeDetail.tsx`
first, then apply the minimal `print:` className changes to make it pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a
    test that captures the requirements of the task. Run the test and ensure
    it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make
    the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the
    test still passes.

## Test Cases

- [ ] **Test case 1** (task: "Write/extend a unit test... number badge
  carries `print:hidden`"; scenario: "Instruction badge is hidden in print
  preview"): Render `RecipeDetail` with a recipe containing 2+ instruction
  steps; assert the numbered circle badge `<span>` for a step has a
  `print:hidden` class in its `className`.

- [ ] **Test case 2** (task: same as above; scenario: "Instruction badge
  remains visible on screen"): Render `RecipeDetail` with the same fixture;
  assert the badge `<span>` still renders `step.number` as text content and
  retains its existing screen classes (`w-8 h-8 bg-[var(--theme-accent)]
  text-white rounded-full ...`) unchanged from before this change.

- [ ] **Test case 3** (task: "Write/extend a unit test... row `<li>` carries
  the print flush-left classes"; scenario: "Instruction text sits flush left
  after badge is hidden"): Assert the instruction row `<li>` element's
  `className` includes the print-time layout override (e.g. `print:block`)
  and that the step `<p>` no longer carries print-time top padding (e.g.
  `print:pt-0`), while its screen classes (`flex-1 pt-1`) remain unchanged.

- [ ] **Test case 4** (task: "Write/extend a unit test... `<ol>` carries
  `print:space-y-1`"; scenario: "Instruction steps are more vertically
  compact in print"): Assert the instructions `<ol>` element's `className`
  includes both the existing `space-y-4` (screen) and the new
  `print:space-y-1` (print).

- [ ] **Test case 5** (task: "Manually verify... spacer rows are unaffected";
  scenario: "Spacer rows between instruction steps are unaffected"): Using a
  recipe fixture with a blank line between two instruction steps, assert the
  rendered `recipe-instruction-spacer` `<li>` element's `className` and
  structure are unchanged by this diff (no `print:` classes added to the
  spacer branch, no badge rendered for it before or after).

- [ ] **Test case 6** (task: "Manually verify in a browser print preview...";
  scenario: "Instruction badge is hidden in print preview" +
  "Instruction text sits flush left..." + "Instruction steps are more
  vertically compact in print"): Manual/visual verification via browser
  print preview (Ctrl/Cmd+P) on a recipe detail page with 3+ instruction
  steps and at least one spacer — confirm no badge renders, text is flush
  left with no residual gap, and step-to-step spacing is visibly reduced
  relative to the screen view and comparable to the ingredients section's
  print density. (Not automatable in jsdom; tracked as a manual check.)

- [ ] **Test case 7** (task: "Manually verify the screen (non-print) view...
  is pixel-identical"; scenario: "Instruction badge remains visible on
  screen"): Manual/visual check confirming the screen rendering (badge
  present, current spacing, current layout) is identical to pre-change
  behavior when no print media is active.

- [ ] **Test case 8** (task: "Run unit/integration tests" / "Run E2E tests";
  NFAC: "Print styling follows the existing inline convention"): Run the
  full `npm run test` suite and confirm no existing test that asserts on
  `RecipeDetail` instruction markup fails or requires modification beyond
  what is captured in test cases 1-4 above (i.e., no unrelated regression).

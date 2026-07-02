---
name: tests
description: Tests for the recipe-notes-upgrade-nudge change
---

# Tests

## Overview

Test plan for `RecipeNotesUpgradeNudge`. All implementation follows strict TDD: write the failing test first, implement to make it pass, then refactor.

Test file: `src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`
Runner: `npx vitest run src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`

## Testing Steps

For each test case below:

1. **Write the failing test** — add the test case to the test file and confirm it fails (`Cannot find module` or assertion failure)
2. **Implement to pass** — write or update `src/components/recipes/RecipeNotesUpgradeNudge.tsx`
3. **Refactor** — clean up while keeping tests green

## Test Cases

### Task 1 — Write failing tests first

These must be written before the component exists. They will all fail initially.

- [ ] **TC-01** — `state="anonymous"` renders correct copy
  - Spec scenario: "Anonymous user sees login nudge"
  - Assertion: `screen.getByText('Login or register to save private notes on any recipe.')`
  - Expected result at write time: FAIL (component does not exist)

- [ ] **TC-02** — `state="anonymous"` renders Login link to `/auth/login`
  - Spec scenario: "Anonymous user sees login nudge"
  - Assertion: `screen.getByRole('link', { name: /login/i })` has `href="/auth/login"`
  - Expected result at write time: FAIL

- [ ] **TC-03** — `state="below-tier"` renders correct copy
  - Spec scenario: "Below-tier user sees upgrade nudge"
  - Assertion: `screen.getByText('Private notes are part of Sous Chef. Upgrade to add notes to any recipe you can view.')`
  - Expected result at write time: FAIL

- [ ] **TC-04** — `state="below-tier"` renders Upgrade link to `/pricing`
  - Spec scenario: "Below-tier user sees upgrade nudge"
  - Assertion: `screen.getByRole('link', { name: /upgrade/i })` has `href="/pricing"`
  - Expected result at write time: FAIL

- [ ] **TC-05** — `state="hidden-by-downgrade"` renders correct copy
  - Spec scenario: "Downgraded user sees note-saved nudge"
  - Assertion: `screen.getByText('Your notes are saved. Upgrade to Sous Chef to see and edit them again.')`
  - Expected result at write time: FAIL

- [ ] **TC-06** — `state="hidden-by-downgrade"` renders Upgrade link to `/pricing`
  - Spec scenario: "Downgraded user sees note-saved nudge"
  - Assertion: `screen.getByRole('link', { name: /upgrade/i })` has `href="/pricing"`
  - Expected result at write time: FAIL

### Task 2 — Implement component (tests should pass after this task)

- [ ] **TC-01 through TC-06** all pass after implementation
- [ ] **TC-07** — Component renders without crashing for each state value (smoke test)
  - Assertion: `render(<RecipeNotesUpgradeNudge state="anonymous" />)` does not throw; same for other two states

### Task 3 — Confirm all tests pass

- [ ] Run `npx vitest run src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`
- [ ] All 7 test cases pass (TC-01 through TC-07)
- [ ] Run `npm run test` — no regressions in any other test file

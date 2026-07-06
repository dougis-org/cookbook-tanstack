---
name: tests
description: Tests for the personal-source-privacy-e2e change
---

# Tests

## Overview

This change is itself all tests — the deliverable is `src/e2e/personal-source-privacy.spec.ts`. The TDD workflow here means writing each test, running it against the live app to confirm it fails for the right reason (or passes if the feature is already working), then verifying it is reliably green before moving on.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — add the test body to the spec file and run it in headed mode (`npx playwright test personal-source-privacy --headed`) to watch the interaction. Confirm failure is due to an unmet assertion (not a selector error or timeout).
2. **Verify green** — once the assertion passes, run twice more headlessly to confirm no flakiness.
3. **Refactor if needed** — tighten selectors, extract repetition into the `selectPersonalSource` helper, ensure no `waitForTimeout` calls remain.

## Test Cases

### Task 1 — `selectPersonalSource` helper

- [ ] **TC-1.1**: Helper selects "Personal" from the source combobox when called on `/recipes/new`
  - Run: `npx playwright test personal-source-privacy --headed` (any test that calls the helper)
  - Expected: source combobox shows "Personal" as the selected value after helper returns
  - Spec ref: all scenarios that use the helper

### Task 2 — Test file setup / `beforeEach`

- [ ] **TC-2.1**: `beforeEach` creates a Personal recipe with personalSourceName="Aunt Mary" and captures a valid `recipeId`
  - Run: add a temporary `console.log(recipeId)` in `beforeEach` and run any test
  - Expected: `recipeId` is a 24-char hex string; `recipeUrl` matches `/recipes/<id>`

### Task 3 — Test 1: owner happy path

- [ ] **TC-3.1**: Owner sees "Personal · Aunt Mary" in source line after reload
  - Spec ref: `specs/privacy-contract/spec.md` — "Owner happy path"
  - Command: `npx playwright test personal-source-privacy -g "owner happy path"`
  - Expected: test passes; `getByText(/Personal.*·.*Aunt Mary/)` is visible

### Task 4 — Test 2: cross-user privacy

- [ ] **TC-4.1**: User B does not see "Aunt Mary" in the DOM
  - Spec ref: `specs/privacy-contract/spec.md` — "User B DOM check"
  - Command: `npx playwright test personal-source-privacy -g "cross-user"`
  - Expected: `getByText("Aunt Mary")` is not visible

- [ ] **TC-4.2**: User B tRPC GET response does not contain "Aunt Mary"
  - Spec ref: `specs/privacy-contract/spec.md` — "User B network-level check"
  - Command: same test
  - Expected: raw response body string does not include "Aunt Mary"; response status is 200

### Task 5 — Test 3: unauthenticated privacy

- [ ] **TC-5.1**: Unauthenticated visitor does not see "Aunt Mary" in the DOM
  - Spec ref: `specs/privacy-contract/spec.md` — "Unauthenticated DOM check"
  - Command: `npx playwright test personal-source-privacy -g "unauthenticated"`
  - Expected: `getByText("Aunt Mary")` is not visible

- [ ] **TC-5.2**: Unauthenticated tRPC GET response does not contain "Aunt Mary"
  - Spec ref: `specs/privacy-contract/spec.md` — "Unauthenticated network-level check"
  - Command: same test
  - Expected: raw response body string does not include "Aunt Mary"; response status is 200

### Task 6 — Test 4: source switch clears

- [ ] **TC-6.1**: After switching to a non-Personal source and saving, re-selecting Personal shows an empty Personal Name input
  - Spec ref: `specs/source-switch-clears/spec.md` — "Source switch clears the personal name"
  - Command: `npx playwright test personal-source-privacy -g "source switch"`
  - Expected: `getByLabel("Personal Name")` has value `""`

### Task 7 — Test 5: selector conditional

- [ ] **TC-7.1**: Personal Name input is not visible before any source is selected
  - Spec ref: `specs/selector-conditional/spec.md` — "Personal Name input hidden when no source selected"
  - Command: `npx playwright test personal-source-privacy -g "selector conditional"`
  - Expected: `getByLabel("Personal Name")` is not visible

- [ ] **TC-7.2**: Personal Name input appears after selecting Personal
  - Spec ref: `specs/selector-conditional/spec.md` — "Personal Name input revealed when Personal source is selected"
  - Command: same test
  - Expected: `getByLabel("Personal Name")` is visible

- [ ] **TC-7.3**: Personal Name input disappears after clearing the source
  - Spec ref: `specs/selector-conditional/spec.md` — "Personal Name input hidden again after clearing source"
  - Command: same test
  - Expected: `getByLabel("Personal Name")` is not visible

### Task 8 — Full suite

- [ ] **TC-8.1**: All five tests pass in one full run with no flaky failures
  - Command: `npm run test:e2e -- --grep "Personal source privacy"` (run twice)
  - Expected: 5/5 pass, 0 failures, second run also 5/5

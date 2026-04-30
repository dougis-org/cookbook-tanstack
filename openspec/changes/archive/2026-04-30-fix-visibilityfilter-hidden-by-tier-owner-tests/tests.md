---
name: tests
description: Tests for the visibilityFilter hiddenByTier owner exclusion regression tests
---

# Tests

## Overview

This document outlines the tests for `fix-visibilityfilter-hidden-by-tier-owner-tests`. All work follows a strict TDD process: write failing tests first, implement against them, then refactor. Each test case maps to a task in `tasks.md` and an acceptance scenario in `specs/visibility-filter-hidden-by-tier-tests.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test** — Write the simplest possible code to make the test pass. (In this case, code is already fixed; tests validate the existing implementation.)
3. **Refactor** — Improve code quality and structure while ensuring the test still passes.

## Test Cases

### T-1: `cookbooks.list` — owner cannot see hiddenByTier cookbook

- [ ] **Test T-1.1:** `owner sees only visible cookbook in list, hidden is absent`
  - **Given:** Owner with a visible cookbook (C1) and a hidden cookbook (C2, `hiddenByTier: true`)
  - **When:** Owner calls `cookbooks.list()`
  - **Then:** Response has length 1; item name is "Visible Cookbook"; no item has name "Hidden Cookbook"
  - **Task:** T-1 (`cookbooks.test.ts`)
  - **Spec scenario:** "Owner with one visible and one hidden cookbook — list returns only the visible one"

- [ ] **Test T-1.2:** `owner sees correct count when mixing visible and hidden private cookbooks`
  - **Given:** Owner with a private visible cookbook and a private hidden cookbook
  - **When:** Owner calls `cookbooks.list()`
  - **Then:** Response has length 1 (only the private visible one is returned; the private hidden one is excluded because owner match also has hiddenByTier filter)
  - **Task:** T-1 (`cookbooks.test.ts`)

---

### T-2: `cookbooks.byId` — owner cannot see own hiddenByTier cookbook by ID

- [ ] **Test T-2.1:** `owner requesting own hiddenByTier cookbook byId returns null`
  - **Given:** Owner with a hidden cookbook (C1, `hiddenByTier: true`)
  - **When:** Owner calls `cookbooks.byId({ id: C1.id })`
  - **Then:** Response is `null`
  - **Task:** T-2 (`cookbooks.test.ts`)
  - **Spec scenario:** "Owner with a hidden cookbook — byId returns null"

---

### T-3: `recipes.list` — owner cannot see hiddenByTier recipe

- [ ] **Test T-3.1:** `owner sees only visible recipe in list, hidden is absent`
  - **Given:** Owner with a visible recipe (R1) and a hidden recipe (R2, `hiddenByTier: true`)
  - **When:** Owner calls `recipes.list({ userId: owner.id })`
  - **Then:** Response items has length 1; item name is "Visible Recipe"; no item has name "Hidden Recipe"
  - **Task:** T-3 (`recipes.test.ts`)
  - **Spec scenario:** "Owner with one visible and one hidden recipe — list returns only the visible one"

---

### T-4: `recipes.byId` — owner cannot see own hiddenByTier recipe by ID

- [ ] **Test T-4.1:** `owner requesting own hiddenByTier recipe byId returns null`
  - **Given:** Owner with a hidden recipe (R1, `hiddenByTier: true`)
  - **When:** Owner calls `recipes.byId({ id: R1.id })`
  - **Then:** Response is `null`
  - **Task:** T-4 (`recipes.test.ts`)
  - **Spec scenario:** "Owner with a hidden recipe — byId returns null"

---

### T-5: `visibilityFilter` behavior with real MongoDB documents

- [ ] **Test T-5.1:** `visibilityFilter for owner excludes hiddenByTier cookbooks`
  - **Given:** Owner with a visible cookbook and a hidden cookbook in the database
  - **When:** `Cookbook.find(visibilityFilter({ id: owner.id }))` is executed
  - **Then:** Returns exactly 1 document with name "Visible Cookbook"
  - **Task:** T-5 (`helpers.test.ts`)
  - **Spec scenario:** "visibilityFilter with cookbooks — owner sees only non-hidden documents"

- [ ] **Test T-5.2:** `visibilityFilter for owner excludes hiddenByTier recipes`
  - **Given:** Owner with a visible recipe and a hidden recipe in the database
  - **When:** `Recipe.find(visibilityFilter({ id: owner.id }))` is executed
  - **Then:** Returns exactly 1 document with name "Visible Recipe"
  - **Task:** T-5 (`helpers.test.ts`)
  - **Spec scenario:** "visibilityFilter with recipes — owner sees only non-hidden documents"

- [ ] **Test T-5.3:** `visibilityFilter for anonymous excludes hiddenByTier cookbooks`
  - **Given:** Owner with only a hidden cookbook in the database
  - **When:** `Cookbook.find(visibilityFilter(null))` is executed
  - **Then:** Returns 0 documents
  - **Task:** T-5 (`helpers.test.ts`)
  - **Spec scenario:** "visibilityFilter with cookbooks — anonymous sees only non-hidden documents"

---

### T-6: Anonymous user cannot see hiddenByTier documents (follow-up)

- [ ] **Test T-6.1:** `anonymous caller gets empty list when owner has only hidden cookbooks`
  - **Given:** Owner with only a hidden cookbook (C1, `hiddenByTier: true`, `isPublic: true`)
  - **When:** Anonymous caller calls `cookbooks.list()`
  - **Then:** Response has length 0
  - **Task:** T-6 (follow-up, extends existing anon test patterns)
  - **Spec scenario:** "Anonymous user cannot see hidden documents"

## Test Case to Task Mapping

| Test Case | Task | Spec Scenario |
|---|---|---|
| T-1.1: Owner sees only visible cookbook in list | T-1 | Owner with one visible and one hidden cookbook — list returns only the visible one |
| T-1.2: Owner sees correct count with mixed private cookbooks | T-1 | visibilityFilter excludes hiddenByTier for all |
| T-2.1: Owner requesting own hiddenByTier cookbook byId returns null | T-2 | Owner with a hidden cookbook — byId returns null |
| T-3.1: Owner sees only visible recipe in list | T-3 | Owner with one visible and one hidden recipe — list returns only the visible one |
| T-4.1: Owner requesting own hiddenByTier recipe byId returns null | T-4 | Owner with a hidden recipe — byId returns null |
| T-5.1: visibilityFilter for owner excludes hiddenByTier cookbooks | T-5 | visibilityFilter with cookbooks — owner sees only non-hidden documents |
| T-5.2: visibilityFilter for owner excludes hiddenByTier recipes | T-5 | visibilityFilter with recipes — owner sees only non-hidden documents |
| T-5.3: visibilityFilter for anonymous excludes hiddenByTier cookbooks | T-5 | visibilityFilter for anonymous — owner sees only non-hidden documents |
| T-6.1: Anonymous gets empty list when owner has only hidden cookbooks | T-6 | Anonymous user cannot see hidden documents |

## Execution Order

Follow the TDD cycle for each test case:

1. **RED** — Write the test; confirm it fails (or passes if code is already in place, as in this case)
2. **GREEN** — Ensure the implementation satisfies the test
3. **REFACTOR** — No refactoring needed for test-only changes

Run validation commands between each test:
```bash
npm run test -- --run src/server/trpc/routers/__tests__/cookbooks.test.ts
npm run test -- --run src/server/trpc/routers/__tests__/recipes.test.ts
npm run test -- --run src/server/trpc/routers/__tests__/helpers.test.ts
```
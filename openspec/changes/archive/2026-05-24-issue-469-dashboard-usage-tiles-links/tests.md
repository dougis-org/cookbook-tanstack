---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines tests for the `issue-469-dashboard-usage-tiles-links` change. Implementation must follow strict TDD:

1. Write failing tests first (RED).
2. Implement the smallest code change to pass (GREEN).
3. Refactor while keeping tests green (REFACTOR).

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Add/adjust route tests in `src/routes/__tests__/-home.test.tsx` before editing `src/routes/home.tsx`.
2. **Write code to pass:** Implement semantic full-tile links for Recipes/Cookbooks in `src/routes/home.tsx`.
3. **Refactor:** Clean class composition and maintain readability without changing behavior.

## Test Cases

- [ ] **Task mapping: Execution item 1**
  - [ ] Add failing test: Recipes usage tile is rendered as a link with `href="/recipes"`.
  - [ ] Map to spec scenario: ADDED -> Recipes tile full-link navigation.
- [ ] **Task mapping: Execution item 2**
  - [ ] Add failing test: Cookbooks usage tile is rendered as a link with `href="/cookbooks"`.
  - [ ] Map to spec scenario: ADDED -> Cookbooks tile full-link navigation.
- [ ] **Task mapping: Execution item 3**
  - [ ] Add/retain test: Discovery links to Recipes and Cookbooks are still present.
  - [ ] Map to spec scenario: MODIFIED -> Existing discovery links remain available.
- [ ] **Task mapping: Non-functional verification**
  - [ ] Assert no analytics behavior added (no new tracking calls/import expectations in home route tests).
  - [ ] Review loading-state tests still pass without navigation regressions.

## Validation Commands

- [ ] `npx vitest run src/routes/__tests__/-home.test.tsx`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

## Exit Criteria

- All new/updated tests pass locally.
- Test coverage demonstrates both tile links and preserved discovery links.
- Spec scenarios in `specs/home-dashboard-navigation/spec.md` are traceably covered by tests.

---
name: tests
description: Tests for progressive-paywall-nudges
---

# Tests

## Overview

This document outlines the test cases for the `progressive-paywall-nudges` change. All work follows a strict TDD (Test-Driven Development) process:

1. **Write a failing test**: Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test**: Write the simplest possible code to make the test pass.
3. **Refactor**: Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Component Unit Tests (`src/components/ui/__tests__/UsageNudge.test.tsx`)

- [ ] **Test Case 1 for Task 2 — Soft Nudge rendering at 70%**:
  - *Description*: Verify that at 70% threshold, the inline notice renders correct text and styling.
  - *Spec Scenario*: "Soft Nudge triggering at 70%–89% capacity"
  - *Task Reference*: Task 2

- [ ] **Test Case 2 for Task 2 — Soft Nudge session dismissal**:
  - *Description*: Verify that clicking the dismiss button calls `sessionStorage.setItem` and hides the element.
  - *Spec Scenario*: "Session dismissal of Soft Nudge"
  - *Task Reference*: Task 2

- [ ] **Test Case 3 for Task 2 — Loud Nudge rendering at 90%**:
  - *Description*: Verify that at 90% threshold, the persistent banner renders with the correct progress track, plan text, pricing CTA, and no dismiss button.
  - *Spec Scenario*: "Loud Nudge triggering at 90%–99% capacity"
  - *Task Reference*: Task 2

### Wall Component Extension Tests (`src/components/ui/__tests__/TierWall.test.tsx`)

- [ ] **Test Case 1 for Task 3 — Modal Comparison table**:
  - *Description*: Verify that the upgrade modal contains the "Today vs Prep Cook" comparison row when display mode is `modal` and reason is `count-limit`.
  - *Spec Scenario*: "Accessing /recipes/new directly at 100% capacity"
  - *Task Reference*: Task 3

- [ ] **Test Case 2 for Task 3 — Existing walls regression check**:
  - *Description*: Assert that other limit reasons (e.g. `import`, `private-content`) do *not* display the comparison table.
  - *Spec Scenario*: None (regression checks for non-functional requirements)
  - *Task Reference*: Task 3

### Route Blockage Tests (`src/routes/recipes/__tests__/new.test.tsx` or similar)

- [ ] **Test Case 1 for Task 5 — Page blockage at 100% limit**:
  - *Description*: Verify that navigating to `/recipes/new` when at 100% capacity blocks form entry and immediately displays the modal TierWall.
  - *Spec Scenario*: "Accessing /recipes/new directly at 100% capacity"
  - *Task Reference*: Task 5

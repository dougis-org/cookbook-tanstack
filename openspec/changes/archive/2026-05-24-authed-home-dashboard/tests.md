---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `authed-home-dashboard` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — Integrate Auth and Entitlements hooks on /home

- [ ] **Test Case 1.1**: Welcome greeting firstName extraction
  - **Description**: Verify that the greeting parses the user's full name and renders the first name correctly (e.g. `"Welcome back, Doug"`).
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-GREETING)

- [ ] **Test Case 1.2**: Date display
  - **Description**: Verify that today's date is dynamically formatted and rendered as the activity stat sub-greeting.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-GREETING)

### Task 2 — Implement the Usage Card Section

- [ ] **Test Case 2.1**: Render Recipes progress bar
  - **Description**: Verify that recipes usage count vs limit is queried via `trpc.usage.getOwned` and renders the progress bar with correct percentage.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-USAGE)

- [ ] **Test Case 2.2**: Render Cookbooks progress bar
  - **Description**: Verify that cookbooks usage count vs limit is queried and renders progress bar with correct percentage.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-USAGE)

- [ ] **Test Case 2.3**: Render "This Month" count
  - **Description**: Verify that the number of recipes created in the current calendar month is calculated and printed.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-USAGE)

### Task 3 — Update the Quick Actions Row

- [ ] **Test Case 3.1**: Enable Quick Actions for Executive Chef
  - **Description**: Verify that Executive Chef user has `canImport === true`, resulting in an active `"Import Recipe"` button.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-ACTIONS)

- [ ] **Test Case 3.2**: Lock/Disable Quick Actions for Home Cook
  - **Description**: Verify that Home Cook user has `canImport === false`, resulting in a disabled `"Import Recipe"` button displaying the `"Executive Chef"` tier badge.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-ACTIONS)

### Task 4 — Implement the Recently Saved Section

- [ ] **Test Case 4.1**: Display 3-4 recently saved recipes
  - **Description**: Verify that 3-4 recipe card links populated from `trpc.recipes.list` query are rendered correctly.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-SAVED)

- [ ] **Test Case 4.2**: Empty state layout
  - **Description**: Verify that a welcoming empty state prompt renders when recipe list query returns `0` items.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-SAVED)

### Task 5 — Implement the Contextual Upgrade Nudge

- [ ] **Test Case 5.1**: Cookbook limit reached nudge
  - **Description**: Verify that nudge displays copy *"Ready to build a second cookbook?"* when `cookbookCount >= cookbookLimit`.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-NUDGE)

- [ ] **Test Case 5.2**: Recipe limit approaching nudge
  - **Description**: Verify that nudge displays copy *"Running out of room? Upgrade to Prep Cook to save up to 100 recipes."* when recipe count is $\ge 80\%$.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-NUDGE)

- [ ] **Test Case 5.3**: Recent paid action attempt nudge
  - **Description**: Verify that nudge displays copy *"Unlock premium capabilities with Prep Cook."* when `localStorage.getItem('last_paid_action_attempt')` timestamp is within 7 days.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-NUDGE)

- [ ] **Test Case 5.4**: Hide nudge banner
  - **Description**: Verify that the upgrade nudge banner is completely hidden when no warning thresholds are met.
  - **Failing test command**: `npx vitest run src/routes/__tests__/home.test.tsx`
  - **Acceptance criteria reference**: specs/dashboard-functionality.md (F06-NUDGE)

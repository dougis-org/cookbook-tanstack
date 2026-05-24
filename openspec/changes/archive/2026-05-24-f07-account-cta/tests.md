---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `f07-account-cta` change. All work should follow a strict TDD (Test-Driven Development) process: red, green, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test case 1 for task 1 (Pricing search param validation)**:
  - Add search validation tests to check that `focus` parameter is successfully parsed by the `/pricing` route definition.
  - *Location*: `src/routes/__tests__/-pricing.test.tsx` or new test file.
  - *Scenario Reference*: Pricing Query Parameter Validation.

- [x] **Test case 2 for task 2 (Dynamic upgrade CTA text and path)**:
  - Add a test that asserts the primary upgrade button contains `"Upgrade to Prep Cook — $2.99/mo"` when logged in as `"home-cook"`.
  - Assert the link redirects to `/pricing?focus=prep-cook`.
  - *Location*: `src/routes/__tests__/-account.test.tsx`.
  - *Scenario Reference*: Active user with a next tier available.

- [x] **Test case 3 for task 2 (Top tier state)**:
  - Add a test that asserts that when the user has `"executive-chef"` tier, the upgrade button is hidden and a static box with `"You're on the top plan"` is rendered instead.
  - *Location*: `src/routes/__tests__/-account.test.tsx`.
  - *Scenario Reference*: Active user already on the top tier.

- [x] **Test case 4 for task 2 (Layout hierarchy)**:
  - Add a test that asserts the upgrade CTA is rendered above the next tier preview box in `/account` page.
  - *Location*: `src/routes/__tests__/-account.test.tsx`.
  - *Scenario Reference*: Visual order of upgrade components.

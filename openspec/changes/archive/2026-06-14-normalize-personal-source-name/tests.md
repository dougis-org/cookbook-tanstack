---
name: tests
description: Tests for the normalize-personal-source-name change
---

# Tests

## Overview

This document outlines the tests for the `normalize-personal-source-name` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Task 1 (Zod schema)**
  - Test case: Submit a `personalSourceName` with padded spaces to `recipes.create` or `recipes.update` and verify it is saved trimmed.
- [ ] **Task 2 (`recipes.create` mutation)**
  - Test case: Call `recipes.create` with `sourceId` set to the "Personal" source's ID and `personalSourceName` set to "Grandma". Verify the recipe is saved with `personalSourceName: "Grandma"`.
  - Test case: Call `recipes.create` with `sourceId` set to a non-Personal source ID and `personalSourceName` set to "Grandma". Verify the recipe is saved without `personalSourceName`.
- [ ] **Task 3 (`recipes.update` mutation)**
  - Test case: Call `recipes.update` on a recipe that has the "Personal" source and a `personalSourceName`. Pass a payload changing the `sourceId` to a non-Personal source. Verify the recipe is updated to the new `sourceId` and `personalSourceName` is cleared.

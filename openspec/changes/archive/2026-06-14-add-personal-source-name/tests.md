---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-personal-source-name` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Test case for Task 2: Create a recipe with `personalSourceName` of 81 characters and expect `ValidationError` (fails Mongoose validation). Maps to scenario "Exceeds maxlength validation".
- [ ] Test case for Task 2: Create a recipe with `personalSourceName` as `undefined` and an empty string `""` and expect it to save and round-trip successfully. Maps to scenario "Empty string normalization".
- [ ] Test case for Task 4 & 5: When running typescript typechecks (`npx tsc --noEmit`), the updated `Recipe` types and Zod schemas do not produce compiler errors.

---
name: tests
description: Tests for the category-dropdown-lazy-fetch change
---

# Tests

## Overview

This document outlines the tests for the `category-dropdown-lazy-fetch` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **CategoryPickerDropdown Tests:**
  - [x] **Test Case 1:** Displays placeholder when empty and does not execute classifications query on mount.
  - [x] **Test Case 2:** Displays selected name immediately on mount without executing a network query.
  - [x] **Test Case 3:** Executes classifications query when opened (lazy-fetching options).
  - [x] **Test Case 4:** Correctly lists, filters, and selects category options, calling `onChange(id, name)`.
- [x] **RecipeForm Integration Tests:**
  - [x] **Test Case 5:** `RecipeForm` schema validates and supports optional `classificationName`.
  - [x] **Test Case 6:** `RecipeForm` form defaults populate `classificationName` correctly.
  - [x] **Test Case 7:** `RecipeForm` uses `CategoryPickerDropdown` and correctly updates both `classificationId` and `classificationName` on selection.

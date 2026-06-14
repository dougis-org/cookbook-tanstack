---
name: tests
description: Tests for the category dropdown enhancement
---

# Tests

## Overview

This document outlines the tests for the `category-dropdown-enhancement` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Create `SingleSelectDropdown` component

- [x] Test that the generic dropdown renders the list of provided options in alphabetical order. (Maps to: ADDED SingleSelectDropdown Behavior)
- [x] Test that the generic dropdown pins the currently selected option to the top of the list. (Maps to: ADDED SingleSelectDropdown Behavior)
- [x] Test that typing in the search input correctly filters the options. (Maps to: ADDED SingleSelectDropdown Behavior)
- [x] Test that when no options match the search, a "No items found" or similar message is displayed. (Maps to: ADDED SingleSelectDropdown Behavior)
- [x] Test that keyboard navigation (Escape to close, clicking outside to close) works correctly.

### Update `SourcePickerDropdown`

- [x] Test that `SourcePickerDropdown` still successfully fetches and displays source options.
- [x] Test that selecting a source still calls `onChange` correctly with the right id and name.

### Update `RecipeForm`

- [x] Test that `RecipeForm` renders `SingleSelectDropdown` for categories and correctly passes the `classifications` options.
- [x] Test that changing the category in the dropdown updates the `react-hook-form` state.

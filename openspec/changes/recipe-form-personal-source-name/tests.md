---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `recipe-form-personal-source-name` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test Case 1 for Task 1 & 4 (SourceSelector persistence):**
  - Title: `SourceSelector does not clear personalSourceName on source selection change`
  - Spec Reference: `specs/source-selector/spec.md` - Scenario: Selected source changed to non-personal
  - Objective: Mount `SourceSelector` with `"personal"` source selected and some `personalSourceName`. Select a non-personal source, then assert that `onPersonalSourceNameChange` is *not* called to clear the name.
- [x] **Test Case 2 for Task 1 & 4 (SourceSelector clear persistence):**
  - Title: `SourceSelector does not clear personalSourceName when clearing source`
  - Spec Reference: `specs/source-selector/spec.md` - Scenario: Selected source cleared
  - Objective: Mount `SourceSelector` with `"personal"` source selected and some `personalSourceName`. Click the clear button, then assert that `onPersonalSourceNameChange` is *not* called to clear the name.
- [x] **Test Case 3 for Task 2 & 3 (RecipeForm create payload):**
  - Title: `RecipeForm submit includes personalSourceName in payload when source is Personal`
  - Spec Reference: `specs/recipe-write/spec.md` - Scenario: Create recipe with Personal source and personalSourceName
  - Objective: Render `RecipeForm` in create mode. Select `"Personal"` source, fill out name and a personal name, submit, and verify `mockCreateMutationFn` payload contains `personalSourceName`.
- [x] **Test Case 4 for Task 2 & 3 (RecipeForm edit pre-fill):**
  - Title: `RecipeForm edit pre-fills personalSourceName from initialData`
  - Spec Reference: `specs/recipe-write/spec.md` - Scenario: Edit recipe with existing personalSourceName
  - Objective: Render `RecipeForm` in edit mode with `initialData` containing `personalSourceName`. Verify that the personal name input field is rendered and pre-filled with the correct value.
- [x] **Test Case 5 for Task 2 & 3 (RecipeForm revert behavior):**
  - Title: `RecipeForm revert resets personalSourceName to initial value`
  - Spec Reference: `specs/recipe-write/spec.md` - Scenario: Revert recipe edits including personalSourceName
  - Objective: Render `RecipeForm` in edit mode with `initialData` containing `personalSourceName`. Change the personal name input value. Click "Revert" and verify the input value is reset to the initial value and the form is not dirty.

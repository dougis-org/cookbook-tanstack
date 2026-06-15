---
name: tests
description: Tests for the strip-personal-source-name change
---

# Tests

## Overview

This document outlines the tests for the `strip-personal-source-name` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test**: Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test**: Write the simplest possible code to make the test pass.
3.  **Refactor**: Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Update TypeScript Interface
- [x] **Test case 1**: Verify `npx tsc --noEmit` compiles successfully when `personalSourceName` is optional (absent) on recipe objects.

### Task 2: Implement Recursive Helper
- [x] **Test case 1**: Write unit tests for `stripPersonalSourceName` helper verifying:
  - It handles `null`/`undefined` input.
  - It strips `personalSourceName` for non-owners in a single recipe object.
  - It preserves `personalSourceName` for owners in a single recipe object.
  - It strips `personalSourceName` for non-owners in arrays.
  - It strips `personalSourceName` in paginated object shapes (like `{ items: [...] }`).
  - It recursively traverses nested objects (like cookbooks containing recipes).

### Task 3 & 4: Output Middleware Integration & Router Update
- [x] **Test case 1 (recipes.byId)**: Write integration tests for `recipes.byId` query:
  - **Given** a recipe with a personal source name owned by Alice.
  - **When** Alice calls `recipes.byId` for her recipe.
  - **Then** the response contains `personalSourceName` matching Alice's seed.
  - **When** Bob (another authenticated user) calls `recipes.byId` for Alice's recipe.
  - **Then** the `personalSourceName` property is completely absent (verified via `toBeUndefined()`).
  - **When** an anonymous user calls `recipes.byId` for Alice's recipe.
  - **Then** the `personalSourceName` property is completely absent (verified via `toBeUndefined()`).
- [x] **Test case 2 (recipes.list)**: Write integration tests for `recipes.list` query:
  - **Given** multiple public recipes (some owned by Alice, some by Bob) containing personal source names.
  - **When** Alice calls `recipes.list`.
  - **Then** the response items owned by Alice contain `personalSourceName`, but those owned by Bob do not have the key present at all.

---
name: tests
description: Tests for the enforce-public-only-creation change
---

# Tests

## Overview

This document outlines the tests for the `enforce-public-only-creation` change. All work follows a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Test Helpers Enhancement
- [ ] `makeTieredCaller` returns a caller with the specified tier in `ctx.user`.
- [ ] `makeTieredCaller` correctly handles `isAdmin` flag.

### Task 2: Implement Enforcement in Recipes Router
- [ ] `recipes.create`: Home Cook with `isPublic: false` creates a public recipe (silent coercion).
- [ ] `recipes.create`: Sous Chef with `isPublic: false` creates a private recipe.
- [ ] `recipes.import`: Prep Cook with `isPublic: false` imports a public recipe (silent coercion).
- [ ] `recipes.update`: Home Cook setting `isPublic: false` on an existing public recipe throws `FORBIDDEN`.
- [ ] `recipes.update`: Admin setting `isPublic: false` on an existing public recipe succeeds.

### Task 3: Implement Enforcement in Cookbooks Router
- [ ] `cookbooks.create`: Home Cook with `isPublic: false` creates a public cookbook (silent coercion).
- [ ] `cookbooks.update`: Prep Cook setting `isPublic: false` on an existing public cookbook throws `FORBIDDEN`.
- [ ] `cookbooks.update`: Sous Chef setting `isPublic: false` on an existing public cookbook succeeds.

---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `strip-personal-source-name` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **TC-1 (Centralized Helper):** Test `sanitizeRecipePersonalSource` behavior in isolation (in `src/server/trpc/routers/__tests__/helpers.test.ts`).
  - Owner match leaves `personalSourceName` present (retaining value or undefined).
  - Owner mismatch completely deletes the key `personalSourceName` from the object.
  - Anonymous/undefined viewer completely deletes the key `personalSourceName`.
- [x] **TC-2 (recipes.byId):** Verify `recipes.byId` query output in `src/server/trpc/routers/__tests__/recipes.test.ts`.
  - Owned recipe returns `personalSourceName`.
  - Public non-owned recipe does not contain `personalSourceName` key (key is absent, not `null`).
  - Unauthenticated visitor requesting a public recipe does not contain `personalSourceName` key.
- [x] **TC-3 (recipes.list):** Verify `recipes.list` query output in `src/server/trpc/routers/__tests__/recipes.test.ts`.
  - Row-by-row checks: owned rows have `personalSourceName`, non-owned rows have the key absent.
- [x] **TC-4 (recipes.create & update):** Verify `recipes.create` and `recipes.update` in `src/server/trpc/routers/__tests__/recipes.test.ts`.
  - Resulting returned objects contain the key (as caller is owner).
- [x] **TC-5 (cookbooks.byId):** Verify recipe items returned as part of a cookbook in `src/server/trpc/routers/__tests__/cookbooks.test.ts`.
  - Embedded recipes owned by other users have `personalSourceName` key stripped.
- [x] **TC-6 (Type safety):** Type check the workspace using `npx tsc --noEmit` to ensure components/routers compile when the key is absent.

---
name: tests
description: Tests for the change recipe-detail-personal-source
---

# Tests

## Overview

This document outlines the tests for the `recipe-detail-personal-source` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test case 1 (Verify display format when personalSourceName is present):** Add test in `src/components/recipes/__tests__/RecipeDetail.test.tsx` verifying that rendering with a non-empty `personalSourceName` outputs `Source: Personal · Doug's Recipes` inside the source `<p>` block.
- [x] **Test case 2 (Verify display format when personalSourceName is absent):** Add test in `src/components/recipes/__tests__/RecipeDetail.test.tsx` verifying that rendering with no `personalSourceName` outputs `Source: Personal`.
- [x] **Test case 3 (Verify display format when personalSourceName is whitespace-only):** Add test in `src/components/recipes/__tests__/RecipeDetail.test.tsx` verifying that rendering with a whitespace-only `personalSourceName` (e.g. `"   "`) outputs `Source: Personal` and trims/filters the dot separator.

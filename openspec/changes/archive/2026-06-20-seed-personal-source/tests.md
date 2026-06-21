---
name: tests
description: Tests for the seed-personal-source change
---

# Tests

## Overview

This document outlines the tests for the `seed-personal-source` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **seedSources() Tests:**
  - [ ] **Test Case 1:** Verify `seedSources()` inserts a `Source` document with `slug: "personal"` and `name: "Personal"` when the database is empty.
  - [ ] **Test Case 2:** Verify `seedSources()` is idempotent (running it multiple times does not throw or create duplicate documents).
- [ ] **db:seed Integration Tests:**
  - [ ] **Test Case 3:** Verify running the full `npm run db:seed` entrypoint seeds the Personal source correctly.

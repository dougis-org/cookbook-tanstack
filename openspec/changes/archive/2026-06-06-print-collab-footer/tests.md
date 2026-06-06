---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `print-collab-footer` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### tRPC Router Update Tests (`src/server/trpc/routers/__tests__/cookbooks.test.ts`)
- [ ] **Test Case 1 (Authorized owner/collaborator query)**: Assert that calling `printById` returns `ownerName`, the full list of collaborators, and each recipe doc has `addedByName` populated.
- [ ] **Test Case 2 (Anonymous query)**: Assert that calling `printById` for a public cookbook anonymously returns `ownerName` and the recipes' `addedByName` but an empty `collaborators` list.

### UI Rendering Tests (`src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`)
- [ ] **Test Case 3 (TOC Print Footer - Authorized)**: Assert that the Table of Contents renders the owner's name and the list of collaborator names in the printed footer block.
- [ ] **Test Case 4 (TOC Print Footer - Unauthorized/Anonymous)**: Assert that the collaborator section is omitted from the printed Table of Contents footer when the collaborator list is empty.
- [ ] **Test Case 5 (Recipe Attributions)**: Assert that each recipe detail component displays `Added by: [addedByName]` within the printed metadata line (`print-meta-line`).

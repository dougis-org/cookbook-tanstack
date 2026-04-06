---
name: tests
description: Tests for the cookbook-print-page-numbers change
---

# Tests

## Overview

This document outlines the tests for the `cookbook-print-page-numbers` change. All work follows a strict TDD process: write a failing test, implement to pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before writing implementation code, write a test that captures the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — Write the simplest code to make the test pass.
3. **Refactor** — Improve quality while keeping tests green.

---

## Test Cases

### Task: Update `CookbookStandaloneLayout.tsx` (TOC + index labels)

- [ ] **TOC rows render `#N` format**
  - Spec: `specs/print-page-numbers.md` — MODIFIED TOC position reference format
  - Test: Render `CookbookTocList` with a known recipe list; assert each row contains `#1`, `#2`, etc. and no `pg` text appears
  - File: existing test file for `CookbookStandaloneLayout` or create alongside it

- [ ] **Alphabetical index rows render `#N` format**
  - Spec: `specs/print-page-numbers.md` — MODIFIED Alphabetical index position reference format
  - Test: Render `CookbookAlphaIndex` with a known recipe list; assert each recipe row contains `#N` and no `pg` text
  - File: same test file as above

- [ ] **`RecipePageRow` renders `#N` (used by alpha index)**
  - Spec: `specs/print-page-numbers.md` — MODIFIED Alphabetical index position reference format
  - Test: Render `RecipePageRow` with `pageNumber={3}`; assert output contains `#3`, not `pg 3`

---

### Task: Update print route (`cookbooks.$cookbookId_.print.tsx`)

- [ ] **Each recipe section renders a `#N` footer label**
  - Spec: `specs/print-page-numbers.md` — ADDED Recipe position label in print view / Scenario: Position label renders for each recipe
  - Test: Render `CookbookPrintPage` (or its recipe section loop) with 3 mock recipes; assert `#1`, `#2`, `#3` each appear once in the output
  - File: create or extend test file alongside the print route

- [ ] **`#N` labels match TOC and index values for the same recipes**
  - Spec: `specs/print-page-numbers.md` — Traceability: all three locations use `buildPageMap` with same recipe list
  - Test: Use a shared recipe fixture; assert the number shown in the print section footer matches the number shown in the TOC row for the same recipe

- [ ] **No label renders when recipe is not in page map**
  - Spec: `specs/print-page-numbers.md` — ADDED / Scenario: Position label is absent when recipe not in page map
  - Test: Pass a recipe whose ID is not in `buildPageMap()` result; assert no `#N` element renders and no error is thrown

- [ ] **Page renders without crash for an empty recipe list**
  - Spec: `specs/print-page-numbers.md` — edge coverage
  - Test: Render print view with `recipes: []`; assert `CookbookEmptyState` renders and no `#N` labels appear

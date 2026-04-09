---
name: tests
description: Tests for the recipe-source-layout-2026-04-08 change
---

# Tests

## Overview

This document outlines the tests for the `recipe-source-layout-2026-04-08` change. All work should follow a strict TDD (Test-Driven Development) process: write the failing test first, then implement, then refactor.

The primary test file is `src/components/recipes/__tests__/RecipeDetail.test.tsx`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 3 — DOM order: source before chiclets

- [ ] **Test: source renders before chiclet wrapper when recipe has both source and taxonomy**
  - File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - Setup: render `RecipeDetail` with `sourceName`, `sourceUrl`, and at least one `meals` entry
  - Assert: `source.compareDocumentPosition(chicletWrapper) & Node.DOCUMENT_POSITION_FOLLOWING` is truthy (source precedes chiclet wrapper in DOM)
  - Spec ref: specs/layout/spec.md — "Source precedes chiclet wrapper in DOM"

- [ ] **Test: source renders when recipe has source but no taxonomy tags**
  - Setup: render `RecipeDetail` with `sourceName` set, no meals/courses/preparations
  - Assert: source element is present; `data-testid="chiclet-wrapper"` is not in the document
  - Spec ref: specs/layout/spec.md — "Recipe with source but no taxonomy tags"

### Task 4 — Inner wrapper has print flex-row classes

- [ ] **Test: inner wrapper contains print flex classes**
  - Setup: render `RecipeDetail` with any recipe
  - Assert: the div wrapping `<h1>` and source has classes `print:flex-row`, `print:items-baseline`, `print:justify-between`
  - Implementation note: query the wrapper by its test id or by being the parent of the `<h1>`
  - Spec ref: specs/layout/spec.md — "Inner wrapper has print flex-row classes"

- [ ] **Test: inner wrapper renders without source child when sourceName is absent**
  - Setup: render `RecipeDetail` with no `sourceName`
  - Assert: inner wrapper contains the `<h1>` and no source `<p>`
  - Spec ref: specs/layout/spec.md — "No source — inner wrapper renders without source child"

### Task 4 — Source text-sm class preserved

- [ ] **Test: source element retains text-sm class**
  - Setup: render `RecipeDetail` with `sourceName` set
  - Assert: the source `<p>` element has the `text-sm` class
  - Spec ref: specs/layout/spec.md — "Source text size remains text-sm"

### Task 4 — Actions wrapper has print:hidden

- [ ] **Test: actions wrapper has print:hidden class**
  - Setup: render `RecipeDetail` with an `actions` node (e.g., a `<button>Edit</button>`)
  - Assert: the div wrapping the actions node has class `print:hidden`
  - Spec ref: specs/layout/spec.md — "Actions wrapper is hidden on print"

- [ ] **Test: no actions wrapper when actions prop is absent**
  - Setup: render `RecipeDetail` with no `actions` prop
  - Assert: no element with `print:hidden` wrapping an actions node is in the document (conditional rendering unchanged)
  - Spec ref: specs/layout/spec.md — "No actions provided"

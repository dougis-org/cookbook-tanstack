---
name: tests
description: Tests for the print-layout-refactor-2026-04-10 change
---

# Tests

## Overview

This document outlines the tests for the `print-layout-refactor-2026-04-10` change. All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 3 — PrintLayout component

File: `src/components/cookbooks/__tests__/PrintLayout.test.tsx`
Spec: `specs/print-layout.md` — ADDED: PrintLayout component enforces a fixed light context

- [ ] **Test: renders children** — Given `<PrintLayout><span>hello</span></PrintLayout>`, the text "hello" is present in the output
- [ ] **Test: applies bg-white class** — The wrapper `div` has class `bg-white`
- [ ] **Test: applies text-gray-900 class** — The wrapper `div` has class `text-gray-900`
- [ ] **Test: does not apply print: classes** — The wrapper `div` className does not contain `print:`
- [ ] **Test: does not apply dark: classes** — The wrapper `div` className does not contain `dark:`

Run command: `npx vitest run src/components/cookbooks/__tests__/PrintLayout.test.tsx`

---

### Task 4 — PrintLayout integrated into TOC route

File: `src/routes/cookbooks.$cookbookId_.toc.tsx` (tested via route-level unit test or integration test)
Spec: `specs/print-layout.md` — ADDED: Cookbook print routes wrapped in PrintLayout

- [ ] **Test: TOC route renders inside PrintLayout** — When `CookbookTocPage` renders (with mocked query returning cookbook data), the root element or an ancestor has class `bg-white text-gray-900`

Run command: `npx vitest run src/routes/__tests__/` (or the relevant route test file)

---

### Task 5 — Stripped print: color variants from CookbookStandaloneLayout

File: `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx`
Spec: `specs/print-layout.md` — MODIFIED: Print-surface components use plain light-mode Tailwind classes

- [ ] **Test: CookbookStandalonePage does not have print:bg-white** — Rendered output does not contain the class `print:bg-white`
- [ ] **Test: CookbookStandalonePage does not have print:text-black** — Rendered output does not contain the class `print:text-black`
- [ ] **Test: CookbookPageHeader h1 does not have print:text-black** — `CookbookPageHeader` renders its `h1` without `print:text-black`
- [ ] **Test: TocRecipeItem link does not have print:text-black** — `TocRecipeItem` renders its `Link` without `print:text-black`
- [ ] **Test: RecipeTimeSpan uses text-gray-500 not print:text-gray-400** — `RecipeTimeSpan` renders with `text-gray-500` and without `print:text-gray-400`

Run command: `npx vitest run src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx`

---

### Task 6 — CookbookAlphaIndex stripped variants

File: `src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx`
Spec: `specs/print-layout.md` — MODIFIED: Print-surface components use plain light-mode Tailwind classes

- [ ] **Test: CookbookAlphaIndex heading does not have print:text-black** — The "Alphabetical Index" heading does not have `print:text-black`
- [ ] **Test: CookbookAlphaIndex letter rows do not have print:text-black** — Letter marker `li` elements do not have `print:text-black`

Run command: `npx vitest run src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx`

---

### Task 7 — Static audit (non-automated)

Spec: `specs/print-layout.md` — REMOVED: Paired dark/print color variants

- [ ] **Grep check:** After implementation, run:
  ```
  grep -n "print:text-\|print:bg-\|print:border-" src/components/cookbooks/CookbookStandaloneLayout.tsx
  ```
  Expected: zero matches

---

### Full suite regression

- [ ] `npm run test` — all tests pass
- [ ] `npm run test:e2e` — all E2E tests pass
- [ ] `npm run build` — build succeeds

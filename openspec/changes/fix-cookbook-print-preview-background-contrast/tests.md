---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-cookbook-print-preview-background-contrast` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test case 1 (task: RED — write/update failing tests; scenario: "TOC/print page background is light in the dark theme")** — In `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx`, render `CookbookStandalonePage` and assert the rendered wrapper's className includes `bg-[var(--theme-print-bg)]`. Confirm this assertion fails against current code (whose outer container has no background class at all).

- [ ] **Test case 2 (task: RED — write/update failing tests; scenario: "TOC/print page background is light in the dark theme")** — In the same test file, assert the rendered wrapper's className does **not** include `bg-[var(--theme-bg)]`. Confirm this assertion passes trivially against current code (no background class present) but is kept as a guard against a future regression that reintroduces a theme-driven background.

- [ ] **Test case 3 (task: GREEN — implement the fix; scenario: "TOC/print page background is light in the dark theme")** — After adding `bg-[var(--theme-print-bg)]` to `CookbookStandalonePage`'s outer container, re-run Test cases 1 and 2 and confirm both now pass.

- [ ] **Test case 4 (task: update E2E coverage; scenario: "TOC/print page background is light in every supported theme")** — Add/extend an E2E test (e.g. in `src/e2e/cookbooks-print.spec.ts` or `src/e2e/cookbooks-toc.spec.ts`) that, for each of the four theme classes (`dark`, `dark-greens`, `light-cool`, `light-warm`) applied to `<html>`, navigates to `/cookbooks/$id/toc` and asserts: (a) the page container's computed `background-color` matches the fixed `--theme-print-bg` value (`#ffffff`), and (b) the recipe name and cookbook title text nodes are visible (non-zero opacity, sufficient computed contrast against the background).

- [ ] **Test case 5 (task: update E2E coverage; scenario: "TOC/print page background is light in every supported theme")** — Repeat Test case 4 for `/cookbooks/$id/print` and `/cookbooks/$id/print?displayonly=1`.

- [ ] **Test case 6 (task: confirm acceptance criteria; scenario: "Actual print output is unaffected")** — Confirm (via existing print-media tests/snapshots, unmodified) that `src/styles/print.css`'s `body { background: #fff !important }` rule still governs the actual `@media print` output, and that no test in this change alters expected print-media snapshots.

- [ ] **Test case 7 (task: confirm acceptance criteria; NFAC scenario: "No regression to other consumers of `--theme-bg`")** — Run the full existing unit/integration suite (`npm run test`) and confirm no test outside `CookbookStandaloneLayout`, `CookbookPrintPage`, or `CookbookTocPage` test files changes status (no new failures, no unrelated snapshot diffs), confirming the fix is scoped to `CookbookStandalonePage`'s container className (and the local `pageBaseClass` constant) and does not affect other `--theme-bg` consumers.

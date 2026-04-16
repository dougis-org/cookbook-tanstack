---
name: tests
description: Tests for the cookbook-print-margin-optimization change
---

# Tests: Cookbook Print Margin Optimization

## Overview

All work follows a strict TDD (RED → GREEN → REFACTOR) workflow. Write each failing test case before writing implementation code. Map: test case → task in `tasks.md` → acceptance scenario in `specs/print-margins.md`.

---

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test (RED):** Before any implementation, write the test. Run it and confirm it fails.
2. **Write code to pass (GREEN):** Write the minimal code to make the test pass.
3. **Refactor:** Improve structure/readability while keeping the test green.

---

## Test Cases

### Unit Tests (Vitest) — maps to T1/T2

File: `src/routes/cookbooks.$cookbookId_.print.test.tsx` (create or extend)

- [ ] **TC-01** — Title is set to cookbook name before `window.print()` is called
  - Task: T1 (write test), T2 (implement)
  - Spec: `specs/print-margins.md` → "Browser header shows cookbook name during print"
  - Given: component mounts with valid `printData` and `displayonly` not set
  - When: `useEffect` fires
  - Then: `document.title` equals the cookbook name at the point `window.print` is called

- [ ] **TC-02** — Title is restored to original value after unmount
  - Task: T1 (write test), T2 (implement)
  - Spec: `specs/print-margins.md` → "Original document title is restored after print"
  - Given: component mounts and `window.print()` is called
  - When: component unmounts (cleanup function runs)
  - Then: `document.title` equals the value it had before mount

- [ ] **TC-03** — Title is NOT changed when `displayonly=1`
  - Task: T1 (write test), T2 (implement)
  - Spec: `specs/print-margins.md` → "Title is not changed in display-only mode"
  - Given: component mounts with `?displayonly=1` in search params
  - When: `useEffect` fires (or doesn't fire the title-swap branch)
  - Then: `document.title` remains unchanged from its pre-mount value

- [ ] **TC-04** — Title is restored even when component unmounts before `window.print()` completes
  - Task: T1 (write test), T2 (implement)
  - Spec: `specs/print-margins.md` → "Title is always restored even if print errors"
  - Given: component mounts, title is swapped, then component is forcibly unmounted mid-print
  - When: cleanup function runs
  - Then: `document.title` is restored to the original value

---

### CSS Verification — maps to T4/T5

These are verified via visual/manual inspection and Playwright, not unit tests.

- [ ] **TC-05** — Named `@page cookbook-page` rule is present in print.css
  - Task: T4 (add CSS rule)
  - Spec: `specs/print-margins.md` → "Recipe section page margins are tightened on print"
  - Verification: `grep -n 'cookbook-page' src/styles/print.css` returns both the `@page` declaration and the `page: cookbook-page` assignments

- [ ] **TC-06** — `.cookbook-recipe-section` has `page: cookbook-page`
  - Task: T4
  - Spec: "Recipe section page margins are tightened on print"
  - Verification: `grep -A5 '.cookbook-recipe-section' src/styles/print.css` shows `page: cookbook-page`

- [ ] **TC-07** — `.cookbook-toc-page` class exists on TOC wrapper in rendered HTML
  - Task: T5 (add class to component)
  - Spec: `specs/print-margins.md` → "TOC wrapper receives class"
  - Verification: navigate to `/cookbooks/:id/print?displayonly=1`, inspect DOM — outer TOC wrapper has class `cookbook-toc-page`

---

### E2E Tests (Playwright) — maps to T3/T6

File: `src/e2e/cookbooks-print.spec.ts`

- [ ] **TC-08** — `document.title` contains cookbook name when print layout is active
  - Task: T3 (write test), T2 (implement — displayonly path doesn't call `window.print`)
  - Spec: "Browser header shows cookbook name during print"
  - Given: navigate to `/cookbooks/:id/print?displayonly=1`
  - When: page is loaded
  - Then: `await page.title()` (or `page.evaluate(() => document.title)`) equals the cookbook name

- [ ] **TC-09** — Single-recipe print route does NOT set cookbook name as document title
  - Task: T6 (regression check)
  - Spec: "Single-recipe print is unaffected"
  - Given: navigate to an individual recipe route
  - When: page is loaded
  - Then: `document.title` does NOT contain any cookbook title string — it reflects the recipe title or default app title

---

## Traceability Matrix

| Test Case | Task | Spec Scenario |
|-----------|------|---------------|
| TC-01 | T1, T2 | "Browser header shows cookbook name during print" |
| TC-02 | T1, T2 | "Original document title is restored after print" |
| TC-03 | T1, T2 | "Title is not changed in display-only mode" |
| TC-04 | T1, T2 | "Title is always restored even if print errors" |
| TC-05 | T4 | "Recipe section page margins are tightened on print" |
| TC-06 | T4 | "Recipe section page margins are tightened on print" |
| TC-07 | T5 | "TOC wrapper receives class" |
| TC-08 | T3, T2 | "Browser header shows cookbook name during print" |
| TC-09 | T6 | "Single-recipe print is unaffected" |

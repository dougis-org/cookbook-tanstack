---
name: tests
description: Tests for fix-hamburger-menu-close — sidebar backdrop and theme-button close behaviors
---

# Tests

## Overview

This document outlines the tests for the `fix-hamburger-menu-close` change. All work follows strict TDD: write failing tests first, implement to make them pass, then refactor.

The fix touches only `src/components/Header.tsx`. The primary test vehicle is Playwright E2E (the UI interaction is the behavior being verified). A Vitest unit test is added for the theme-button handler change.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write the test. Run it, confirm it fails for the right reason.
2. **Write code to pass the test** — minimal change to make the test green.
3. **Refactor** — clean up if needed, confirm tests still pass.

---

## Test Cases

### E1 — Backdrop overlay closes sidebar (AC1)

Maps to: task E2 | spec AC1 (`specs/sidebar-close-behavior.md`)

- [x] **TC-01**: Open sidebar → click backdrop → assert sidebar is not visible
  - File: `src/tests/e2e/header-sidebar.spec.ts` (create or extend)
  - Steps: click hamburger button → wait for sidebar → click the `[aria-hidden="true"]` overlay div → assert `<aside>` has `translate-x-full` or is not in viewport
  - Expected to fail before E2 is implemented

- [x] **TC-02**: Backdrop does not exist when sidebar is closed
  - Steps: assert no element matching `div[aria-hidden="true"].fixed.inset-0` exists in the DOM when `isOpen` is false
  - Expected to fail before E2 is implemented

- [x] **TC-03**: Click inside the sidebar does not close it
  - Steps: open sidebar → click on the sidebar title text ("CookBook") → assert sidebar is still visible
  - Expected to pass both before and after (regression guard)

---

### E2 — Theme button closes sidebar (AC2)

Maps to: task E3 | spec AC2 (`specs/sidebar-close-behavior.md`)

- [x] **TC-04**: Open sidebar → click a non-active theme button → assert sidebar closes AND theme updates
  - Steps: open sidebar → identify a theme button that is not currently active → click it → assert sidebar not visible AND `document.documentElement.dataset.theme` equals chosen theme id
  - Expected to fail before E3 is implemented

- [x] **TC-05**: Open sidebar → click already-active theme button → assert sidebar closes
  - Steps: open sidebar → click the currently active theme button → assert sidebar not visible
  - Expected to fail before E3 is implemented

---

### E3 — Existing close behaviors (AC3 regression)

Maps to: task E4 | spec AC3 (`specs/sidebar-close-behavior.md`)

- [x] **TC-06**: X button closes sidebar
  - Steps: open sidebar → click `[aria-label="Close menu"]` button → assert sidebar not visible
  - Expected to pass before and after (regression guard)

- [x] **TC-07**: Nav link click closes sidebar
  - Steps: open sidebar → click the "Recipes" nav link → assert sidebar not visible
  - Expected to pass before and after (regression guard)

---

### E4 — Accessibility: backdrop is hidden from AT (AC4)

Maps to: task E2 | spec AC4 (`specs/sidebar-close-behavior.md`)

- [x] **TC-08**: Backdrop has `aria-hidden="true"`
  - Type: Vitest unit test on `Header` component (React Testing Library)
  - Steps: render `<Header />`, open sidebar (simulate hamburger click), query backdrop div, assert `aria-hidden="true"` attribute is present
  - Expected to fail before E2 is implemented

---
name: tests
description: Tests for the light-warm-theme change
---

# Tests

## Overview

This document outlines the tests for the `light-warm-theme` change. All work should follow a strict TDD (Test-Driven Development) process.

All tests are E2E (Playwright) in `src/e2e/theme.spec.ts`. There are no unit tests for this change — the token system is pure CSS and ThemeContext registration is trivially covered by the existing test infrastructure.

## Testing Steps

For Task 3 (write failing E2E tests):

1. **Write failing tests:** Add all test cases below to `src/e2e/theme.spec.ts` before creating `light-warm.css` or modifying `ThemeContext`. Run `npm run test:e2e` — tests must fail.
2. **Write code to pass:** Create `src/styles/themes/light-warm.css` (Task 4) and register in `ThemeContext.THEMES` (Task 5).
3. **Refactor:** Confirm no duplication, all tests green, then proceed to PR.

## Test Cases

### Task 3 — E2E tests for Light (warm) theme

Maps to specs: `specs/theme-registration.md`, `specs/theme-palette.md`, `specs/print-isolation.md`

- [ ] **Theme selector lists three options including Light (warm)**
  - File: `src/e2e/theme.spec.ts`
  - Scenario: Open hamburger menu → assert `Light (warm)` button is visible alongside `Dark` and `Light (cool)`
  - Spec trace: `theme-registration.md` → "Theme selector lists three options"

- [ ] **Switching to Light (warm) changes key surface colors**
  - File: `src/e2e/theme.spec.ts`
  - Scenario: Start in Dark → record `.site-header` bg → click `Light (warm)` → assert bg changed
  - Spec trace: `theme-palette.md` → "Header surface changes color on switch to Light (warm)"

- [ ] **light-warm: active filter chip text matches the theme accent**
  - File: `src/e2e/theme.spec.ts`
  - Scenario: Set localStorage to `light-warm` → navigate to `/recipes?hasImage=true` → resolve `--theme-accent` and chip text color → assert they match
  - Spec trace: `theme-palette.md` → "Accent token resolves to amber.700"

- [ ] **Light (warm) theme persists across page reload**
  - File: `src/e2e/theme.spec.ts`
  - Scenario: Set localStorage to `light-warm` → load → reload → assert `html.light-warm` class persists → assert `aria-pressed="true"` on the `Light (warm)` button
  - Spec trace: `theme-registration.md` → "Light (warm) preference persists across page reload"

- [ ] **No flash: html has light-warm class before hydration when light-warm stored**
  - File: `src/e2e/theme.spec.ts`
  - Scenario: Set localStorage to `light-warm` → `page.goto('/', { waitUntil: 'commit' })` → assert `html.light-warm` class is already set
  - Spec trace: `theme-registration.md` → "No flash — html has light-warm class before hydration when light-warm stored"

### Task 5 — TypeScript type-safety check (not a test file, but a verification step)

- [ ] **`ThemeId` union widens without breaking type checks**
  - Command: `npx tsc --noEmit`
  - Expected: No errors after adding `light-warm` to `THEMES`
  - Spec trace: `design.md` → Decision 2 (ThemeId union risk)

### Regression — Existing tests must continue to pass

- [ ] **All pre-existing theme tests pass unchanged**
  - Command: `npm run test:e2e`
  - Expected: Dark, Light (cool), persistence, no-flash, migration shim, and print isolation tests all still green
  - Spec trace: Confirms purely additive implementation

---
name: tests
description: Tests for fix-fouc-theme-flash — FOUC prevention via inline critical CSS and preload hints
---

# Tests

## Overview

All FOUC prevention tests are Playwright E2E tests in `src/e2e/fouc-prevention.spec.ts`. Follow strict TDD: write the test file first (Task 3), confirm tests fail, then implement Tasks 4-6 to make them pass.

Unit/integration tests (`npm run test`) have no new cases — this change is pure HTML/CSS output with no business logic. The validation is entirely observable in rendered HTML and browser paint behavior.

## Testing Steps

1. **Write failing tests** (Task 3): Create `src/e2e/fouc-prevention.spec.ts` with all cases below. Run `npm run test:e2e` — tests must fail before any implementation.
2. **Implement** (Tasks 4–6): Add inline critical CSS, preload links, and docs.
3. **Confirm passing**: Run `npm run test:e2e` — all cases must pass.
4. **Refactor** if needed: Ensure the `criticalCss` constant is readable and the comment block is complete.

## Test Cases

### Task 3 / FR-1 — Dark theme: background present on first paint

- [x] **TC-1:** Navigate to `/` with empty localStorage using `waitUntil: 'commit'` (before hydration). Assert `document.documentElement` has `background-color` matching `#0f172a` (dark background from critical CSS) and `<html>` has class `dark`.

- [x] **TC-2:** Navigate to `/` with localStorage blocked (clear storage before load). Assert `<html>` has class `dark` and computed background is dark.

  - Maps to: spec FR-1 scenarios 1 & 2; tasks.md Task 4
  - Test file: `src/e2e/fouc-prevention.spec.ts`
  - Command: `npm run test:e2e -- --grep "dark theme"`

### Task 3 / FR-2 — Light-cool theme: background present on first paint

- [x] **TC-3:** Set `localStorage["cookbook-theme"] = "light-cool"` before navigation. Navigate to `/` with `waitUntil: 'commit'`. Assert `<html>` has class `light-cool` and computed `background-color` matches `#f1f5f9` (from critical CSS).

- [x] **TC-4:** Set `localStorage["cookbook-theme"] = "light"` (legacy value). Navigate to `/`. Assert `<html>` has class `light-cool` (migrated) and background is `#f1f5f9`.

  - Maps to: spec FR-2 scenarios 1 & 2; tasks.md Task 4
  - Command: `npm run test:e2e -- --grep "light-cool theme"`

### Task 3 / FR-3 — Light-warm theme: background present on first paint

- [x] **TC-5:** Set `localStorage["cookbook-theme"] = "light-warm"` before navigation. Navigate to `/` with `waitUntil: 'commit'`. Assert `<html>` has class `light-warm` and computed `background-color` matches `#fffbeb` (from critical CSS).

- [x] **TC-6:** Set `localStorage["cookbook-theme"] = "unknown-value"`. Navigate to `/`. Assert `<html>` has class `dark` and background is `#0f172a` (fallback).

  - Maps to: spec FR-3 scenarios 1 & 2; tasks.md Task 4
  - Command: `npm run test:e2e -- --grep "light-warm theme"`

### Task 3 / FR-4 — Preload link present in SSR HTML

- [x] **TC-7:** Navigate to any page. Get page HTML source. Assert it contains `<link rel="preload" as="style"` with the fingerprinted `appCss` URL, appearing before the matching `<link rel="stylesheet"` with the same URL.

  - Maps to: spec FR-4 scenario 1; tasks.md Task 5
  - Command: `npm run test:e2e -- --grep "preload"`

### Task 3 / FR-4 — Preload does not duplicate network request

- [x] **TC-8:** Navigate to any page. Capture network requests. Assert the CSS file URL appears in the request log only once (preload + stylesheet declarations share the resource — no duplicate fetch).

  - Maps to: spec FR-4 scenario 2; tasks.md Task 5
  - Command: `npm run test:e2e -- --grep "preload"`

### Task 6 / FR-5 — Inline style block in HTML source

- [x] **TC-9:** Navigate to any page. Assert the HTML source contains an inline `<style>` block including the string `background:#0f172a` (dark default) before `<HeadContent />` output.

  - Maps to: spec MODIFIED requirement (head structure); tasks.md Task 4
  - Command: `npm run test:e2e -- --grep "inline style"`

### Task 6 / FR-5 — docs/theming.md exists and contains checklist

- [x] **TC-10:** Manual repository check: assert `docs/theming.md` exists and contains the string `Theme Maintenance Checklist`.

  - Maps to: spec FR-5; tasks.md Task 6
  - Validation in this change is manual by inspecting the repository contents; no dedicated automated lint/CI/script check is added in this PR.

## Non-Functional Tests

### Security — No user data in inline block

- [x] **TC-11:** Inspect the rendered `<style>` block content. Assert it contains only hex color values matching the pattern `#[0-9a-f]{3,6}` — no request-derived data, no encoded strings beyond the approved color values.

  - Maps to: design Non-Functional: Security; spec Non-Functional Security scenario

### Performance — Inline CSS payload size

- [x] **TC-12:** Build the project (`npm run build`). Inspect the HTML template or a server response. Assert the inline `<style>` block is no more than 300 bytes.

  - Maps to: design Non-Functional: Performance; spec Non-Functional Performance scenario

## Regression Tests

Run the full test suite to confirm no regressions:

- [x] `npm run test` — all existing unit and integration tests pass
- [x] `npm run test:e2e` — all existing E2E tests pass alongside new FOUC tests
- [x] `npm run build` — production build succeeds

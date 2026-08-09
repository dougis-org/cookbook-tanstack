---
name: tests
description: Tests for the fix-e2e-hydration-wait change
---

# Tests

## Overview

This document outlines the tests for the `fix-e2e-hydration-wait` change. All work follows a strict TDD (Test-Driven Development) process: write each failing test first, confirm it fails against the current code, then implement the minimal change to make it pass.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirement. Run it and confirm it fails against the current codebase.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve code quality/structure while keeping the test green.

## Test Cases

### Task: Add the hydration/route-idle marker (`src/routes/__root.tsx`)

- [ ] **Test case 1** — New e2e test: on first navigation to `/`, `document.documentElement` does not have `data-hydrated="true"` immediately at `domcontentloaded`, and does have it once the router reaches `idle`.
  - Maps to task: "Add the hydration/route-idle marker"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → "ADDED Deterministic navigation-readiness signal" → *Fresh navigation to a route with lazy-loaded code*
- [ ] **Test case 2** — New e2e test: after initial hydration completes on `/`, trigger an in-app client-side navigation (e.g. click a `Link` to `/recipes`); assert `data-hydrated` is removed while the router status is `pending` for that transition, then re-appears once the new route's status is `idle`.
  - Maps to task: "Add the hydration/route-idle marker"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → "ADDED Deterministic navigation-readiness signal" → *Client-side navigation after initial hydration*

### Task: Add a regression test against the #589 repro route

- [ ] **Test case 3** — New e2e test: navigate to `/cookbooks/:id/toc` (or `/cookbooks/:id/print`), a route that loads via code-splitting; assert `data-hydrated="true"` does not appear until the route's lazy chunk has resolved and its content is present in the DOM — not merely once `#app-shell` is visible. This is the direct regression guard for the #589 root cause (route-splitting racing the stylesheet gate).
  - Maps to task: "Add a regression test against the #589 repro route"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → "ADDED Deterministic navigation-readiness signal" → *Fresh navigation to a route with lazy-loaded code*

### Task: Rewrite `waitForHydration()` (`src/e2e/helpers/app.ts`)

- [ ] **Test case 4** — Unit/e2e-helper-level test (or covered by test cases 1–3 exercising the helper directly): `waitForHydration(page)` resolves only after `data-hydrated="true"` is attached; it does not resolve based on `#app-shell` visibility alone, and does not include a `networkidle` wait or a fixed sleep in its implementation (verified by code review / the removal itself, since there is no longer a code path to unit-test around a removed branch).
  - Maps to task: "Rewrite waitForHydration()"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → "ADDED Deterministic navigation-readiness signal" → *`networkidle` and fixed sleep are no longer part of the wait path*

### Task: Fix `src/e2e/theme.spec.ts:417`

- [ ] **Test case 5** — Modify the existing "switching theme changes key surface colors" test in `theme.spec.ts`: after `selectThemeViaDropdown(page, 'Light (cool)', { commit: true })`, assert `await expect(page.locator('html')).toHaveClass(/light-cool/)` resolves (replacing the removed `waitForTimeout(100)`) before the `getComputedStyle` read; the test as a whole must still pass (header background color changes as expected).
  - Maps to task: "Fix src/e2e/theme.spec.ts:417"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → "ADDED Post-interaction settle assertions use native retrying expectations, not the hydration marker" → *Theme dropdown commit followed by a computed-style read*

### Task: Re-confirm the audit finding (4 flagged specs)

- [ ] **Test case 6** — Run `cookbooks-print-theme-contrast.spec.ts`, `theme.spec.ts`, `dark-theme.spec.ts`, and `cookbooks-print.spec.ts` in full against the rewritten helper; all existing assertions in these files pass unchanged (no new edits needed beyond test case 5), confirming the exploration-phase audit.
  - Maps to task: "Re-confirm the audit finding from proposal/design"
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → Traceability section (audit finding carried from proposal)

### Non-functional: Reliability (no new flakes)

- [ ] **Test case 7** — Run the full `npm run test:e2e` suite (not just the 4 flagged specs) after all code changes land; compare failures against a `main`-branch baseline run. Any new, reproducible failure not present on `main` is treated as a blocking finding per the Operational Blocking Policy in `design.md`.
  - Maps to task: "Run E2E tests" (Validation section)
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → Non-Functional Acceptance Criteria → "Reliability" → *No new flakes introduced by removing networkidle*

### Non-functional: Performance (no regression)

- [ ] **Test case 8** — Capture `npm run test:e2e` aggregate wall-clock time on `main` before the change and on the working branch after the change; confirm no regression (expected improvement, since the new wait has no fixed 100ms-per-call floor and no worst-case 5s `networkidle` stall).
  - Maps to task: "Compare e2e suite wall-clock time" (Validation section)
  - Maps to spec scenario: `specs/e2e-test-reliability/spec.md` → Non-Functional Acceptance Criteria → "Performance" → *Wait path is no slower than the previous guess chain*

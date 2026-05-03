---
name: tests
description: Tests for the e2e-boot-loader-lsheet-fast-path change
---

# Tests

## Overview

This change adds a single E2E test. Because the test IS the implementation (no production code changes), the TDD flow is: write the test → run it → it passes → done.

The "failing test first" step is validated by temporarily removing the `l.sheet` guard from the boot-loader script and confirming the test fails, then restoring it.

## Testing Steps

### Task: Add `l.sheet` fast-path test to `src/e2e/fouc-prevention.spec.ts`

1. **Write the test** in `src/e2e/fouc-prevention.spec.ts` inside the `FOUC prevention` describe block
2. **Verify it fails without the guard** — temporarily remove `if (l.sheet) { markLoaded() }` from the `bootLoaderScript` template literal in `src/routes/__root.tsx`; run `npm run test:e2e` and confirm the new test fails while all others pass; restore the guard
3. **Confirm it passes with the guard** — run `npm run test:e2e`; new test and all existing tests must pass

## Test Cases

- [ ] **TC-1: `#app-shell` visible after second navigation**
  - Maps to: tasks.md Execution step 5
  - Spec: `specs/fouc-prevention/cached-lsheet.md` — FR-LSHEET-1 scenario "Second navigation — CSS served from browser HTTP cache"
  - Assertion: `expect(page.locator('#app-shell')).toBeVisible()` on second `page.goto('/')`

- [ ] **TC-2: `#boot-loader` not visible after second navigation**
  - Maps to: tasks.md Execution step 6
  - Spec: FR-LSHEET-1 scenario "Second navigation"
  - Assertion: `expect(page.locator('#boot-loader')).not.toBeVisible()` on second `page.goto('/')`

- [ ] **TC-3: No `load` listener attached to stylesheet link — fast-path confirmed**
  - Maps to: tasks.md Execution step 7
  - Spec: FR-LSHEET-1 — "no `'load'` event listener was attached to the stylesheet `<link>` element"
  - Assertion: `fastPathTaken` — `page.evaluate(() => !(window as any).__cssLoadListenerAttached)` is `true`
  - Failure condition: If `l.sheet` guard is removed, this assertion flips to `false` and the test fails immediately

- [ ] **TC-4: `link.sheet` non-null after second navigation — cache precondition confirmed**
  - Maps to: tasks.md Execution step 8
  - Spec: FR-LSHEET-1 — "`link.sheet` is non-null after the page loads"
  - Assertion: `sheetWasNonNull` — `page.evaluate(...)` reading `link.sheet` from the non-print stylesheet is non-null
  - Failure condition: If the browser HTTP cache wasn't primed (environment issue), this assertion explicitly fails rather than masking a false positive

- [ ] **TC-5: First navigation unaffected — regression guard**
  - Maps to: tasks.md Execution step 2
  - Spec: implicit — existing coverage must not regress
  - Assertion: `expect(page.locator('#app-shell')).toBeVisible()` on first `page.goto('/')`
  - Verified by: all existing `fouc-prevention.spec.ts` tests continue to pass after the new test is added

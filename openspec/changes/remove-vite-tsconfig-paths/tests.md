---
name: tests
description: Tests for the remove-vite-tsconfig-paths change
---

# Tests

## Overview

Tests for the `remove-vite-tsconfig-paths` change. This change is primarily a config simplification — no new application logic is added. Testing strategy uses existing test infrastructure as the regression net, plus targeted assertions in the existing `vite.config.test.ts`.

Because this change modifies test configuration (`vite.config.test.ts`) and removes a plugin, the TDD flow is:
1. Update the test file to remove stale assertions (making it accurate)
2. Verify the config changes satisfy all remaining assertions
3. Run the full suite to confirm no regressions

## Test Cases

### T1 — `vite.config.ts` uses `resolve.tsconfigPaths` not the plugin

- [ ] **Verify:** `vite.config.test.ts` first `it` block passes after removing `vite-tsconfig-paths` assertions
  - Maps to: task T1 + T3
  - Spec scenario: "Plugin order test passes after removal"
  - How: `npx vitest run vite.config.test.ts` — all remaining ordering assertions pass

- [ ] **Verify:** `vite.config.ts` does not import `vite-tsconfig-paths`
  - Maps to: task T1
  - How: `grep "vite-tsconfig-paths" vite.config.ts` returns no match

- [ ] **Verify:** `vite.config.ts` contains `resolve: { tsconfigPaths: true }`
  - Maps to: task T1
  - How: `grep "tsconfigPaths: true" vite.config.ts` returns a match

### T2 — `vitest.config.ts` uses `resolve.tsconfigPaths` not the plugin

- [ ] **Verify:** `vitest.config.ts` does not import `vite-tsconfig-paths`
  - Maps to: task T2
  - How: `grep "vite-tsconfig-paths" vitest.config.ts` returns no match

- [ ] **Verify:** `vitest.config.ts` contains `resolve: { tsconfigPaths: true }`
  - Maps to: task T2
  - How: `grep "tsconfigPaths: true" vitest.config.ts` returns a match

### T3 — `vite.config.test.ts` is accurate post-removal

- [ ] **Verify:** No reference to `vite-tsconfig-paths` string in `vite.config.test.ts`
  - Maps to: task T3
  - How: `grep "vite-tsconfig-paths" vite.config.test.ts` returns no match

- [ ] **Verify:** Second `it` block ("keeps vitest config aligned") is deleted
  - Maps to: task T3
  - How: `grep "keeps vitest config aligned" vite.config.test.ts` returns no match

- [ ] **Verify:** Remaining ordering assertions still pass
  - Maps to: task T3
  - Spec scenario: "Remaining plugin order is still enforced"
  - How: `npx vitest run vite.config.test.ts` passes

### T4 — `vite-tsconfig-paths` package removed

- [ ] **Verify:** Package absent from `package.json` dependencies
  - Maps to: task T4
  - How: `grep "vite-tsconfig-paths" package.json` returns no match

- [ ] **Verify:** Package absent from `node_modules`
  - Maps to: task T4
  - Spec scenario: "vite-tsconfig-paths plugin dependency REMOVED"
  - How: `ls node_modules/vite-tsconfig-paths` returns "No such file or directory"

### T5 — No deprecation warning emitted

- [ ] **Verify:** Dev server starts without the `vite-tsconfig-paths` warning
  - Maps to: tasks T1 + T4
  - Spec scenario: "No deprecation warning on dev server start"
  - How: Run `npm run dev` briefly; confirm no line matching `"vite-tsconfig-paths" is detected` in output

### Regression — Full suite passes

- [ ] **Verify:** All unit/integration tests pass
  - Maps to: all tasks
  - Spec scenario: "Full test suite passes after change"
  - How: `npm run test` exits 0

- [ ] **Verify:** All E2E tests pass (SSR + route resolution)
  - Maps to: all tasks
  - Spec scenario: "Playwright E2E resolves @/ imports through SSR"
  - How: `npm run test:e2e` exits 0

- [ ] **Verify:** TypeScript compilation clean
  - Maps to: all tasks
  - How: `npx tsc --noEmit` exits 0

- [ ] **Verify:** Production build succeeds
  - Maps to: all tasks
  - How: `npm run build` exits 0

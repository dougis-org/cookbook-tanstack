---
name: tests
description: Tests for the upgrade-tanstack-packages change
---

# Tests

## Overview

This document outlines the tests for the `upgrade-tanstack-packages` change. This is a dependency upgrade change — no new application code is introduced. The TDD workflow applies to any breaking-change fixes discovered during the investigation phase: write a failing test that captures the broken behavior, fix the code, then verify the test passes.

## Testing Steps

For any breaking-change fix required during Phase 4 (investigate and fix failures):

1. **Write a failing test:** Before patching app code, write a test that reproduces the failure. Run it and confirm it fails.
2. **Write code to pass the test:** Apply the minimal fix to make the test pass.
3. **Refactor:** Clean up the fix without breaking the test.

## Test Cases

### Phase 1 — Version target validation (manual verification, no automated test)

- [ ] `npm view @tanstack/react-start@latest dependencies` output confirms react-router internal pin version
- [ ] `npm view @tanstack/router-plugin@latest peerDependencies` output confirms peer dep range accepts target react-router version
- [ ] `npm install` output contains no peer dependency warnings for upgraded TanStack packages

### Phase 2 — Package installation

- [ ] `npm install` exits 0 after updating `package.json` with target versions
- [ ] `package-lock.json` is updated and reflects new resolved versions

### Phase 3 — Route tree and TypeScript compilation

- [ ] `src/routeTree.gen.ts` is regenerated after `npm run build` — file timestamp updated, no build errors
- [ ] `npx tsc --noEmit` exits 0 — no type errors introduced by upgrade

### Phase 4 — Unit and integration tests (maps to specs/upgrade-compatibility.md)

- [ ] `npm run test` exits 0 — all Vitest unit and integration tests pass
  - Spec: MODIFIED All E2E tests pass (unit suite)
  - Task: Phase 4 — fix failures; Phase 5 — final verification
- [ ] If any unit test fails due to breaking API change: a new test reproducing the failure is written first, then the fix is applied
  - Spec: ADDED E2E test failure root cause documented
  - Task: Phase 4 — categorize and fix

### Phase 5 — E2E tests (maps to specs/upgrade-compatibility.md)

- [ ] `npm run test:e2e` exits 0 — all Playwright E2E tests pass
  - Spec: MODIFIED All E2E tests pass (E2E suite)
  - Task: Phase 4 — fix failures; Phase 5 — final verification
- [ ] E2E suite runtime does not exceed 300 seconds
  - Spec: Non-Functional — Performance (E2E suite runtime)
  - Task: Phase 5 — final verification
- [ ] No previously-passing E2E test now fails (regression check)
  - Spec: MODIFIED — No regression in existing test coverage
  - Task: Phase 5 — final verification

### Phase 5 — Production build

- [ ] `npm run build` exits 0 — Nitro/Vinxi production build succeeds with upgraded packages
  - Spec: MODIFIED Production build succeeds
  - Task: Phase 5 — final verification

### CI / remote validation

- [ ] All GitHub Actions checks pass on the PR branch (build, test, lint, type-check)
  - Spec: Non-Functional — Operability (CI pipeline passes)
  - Task: PR and Merge — monitor CI checks

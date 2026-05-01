---
name: tests
description: Tests for the fix-fly-deploy-npm-mismatch change
---

# Tests

## Overview

This change is build/dependency tooling — there are no new Vitest or Playwright test files to write. The "tests" for this change are verification commands run against the build environment. Each verification is mapped to a task and a spec scenario.

The TDD framing still applies: before making any file changes, run the verification commands to confirm they currently fail (the bug is reproducible). Then apply fixes. Then re-run to confirm they pass.

## Testing Steps

1. **Establish failing baseline** — run each verification below before making any changes; confirm they produce the expected failure.
2. **Apply fixes** — implement changes per `tasks.md` Execution steps.
3. **Re-run verifications** — all must pass before opening the PR.

## Test Cases

### Task 1 — Update CI Node version

- [ ] **Verify BEFORE:** `grep 'node-version' .github/workflows/build-and-test.yml` shows `'22'` (failing baseline)
- [ ] **Verify AFTER:** `grep 'node-version' .github/workflows/build-and-test.yml` shows `'24'`
- [ ] **Spec:** `specs/deploy/deploy-lockfile-compat.md` — MODIFIED: CI lockfile auto-update uses Node 24

### Task 2 — Upgrade @tanstack/react-query and align TanStack family

- [ ] **Verify BEFORE:** `grep '"@tanstack/react-query"' package.json` shows `5.96.2`; TanStack router packages at mismatched minors (failing baseline)
- [ ] **Verify AFTER:** `grep '"@tanstack/react-query"' package.json` shows `5.100.6`
- [ ] **Verify AFTER:** All `@tanstack/react-router*`, `@tanstack/react-start`, `@tanstack/router-plugin` entries in `package.json` share the same minor version
- [ ] **Spec:** `specs/deploy/dependency-upgrade-compat.md` — MODIFIED: @tanstack/react-query version; ADDED: TanStack package version alignment

### Task 3 — Exact-pin @trpc/* packages

- [ ] **Verify BEFORE:** `grep '@trpc' package.json` shows `^11.16.0` entries (failing baseline)
- [ ] **Verify AFTER:** `grep '@trpc' package.json` shows exact version strings (`11.17.0`) with no `^` or `~`
- [ ] **Spec:** `specs/deploy/dependency-upgrade-compat.md` — ADDED: tRPC exact version pinning

### Task 4 — Regenerate package-lock.json with Node 24

- [ ] **Verify BEFORE (Docker):**
  ```bash
  docker run --rm \
    -v "$(pwd)/package.json:/app/package.json:ro" \
    -v "$(pwd)/package-lock.json:/app/package-lock.json:ro" \
    -w /app node:24-alpine npm ci --dry-run
  ```
  Expected: exits non-zero, `Missing: @tanstack/query-core@5.100.6 from lock file` (failing baseline)
- [ ] **Verify AFTER:** same command exits 0 with no error output
- [ ] **Verify AFTER:** `npm ls @tanstack/query-core` shows `@tanstack/query-core@5.100.6` at root (not nested-only)
- [ ] **Spec:** `specs/deploy/deploy-lockfile-compat.md` — ADDED: Docker npm ci lockfile compatibility; ADDED: @tanstack/query-core top-level hoisting

### Task 5 — Docker smoke test

- [ ] **Verify AFTER:** Docker `npm ci --dry-run` exits 0 (same as Task 4 after)
- [ ] **Spec:** `specs/deploy/deploy-lockfile-compat.md` — ADDED: Docker npm ci lockfile compatibility

### Task 6 — Full application validation

- [ ] **Verify AFTER:** `npm run build` exits 0
- [ ] **Verify AFTER:** `npm run test` exits 0 (all Vitest tests pass)
- [ ] **Verify AFTER:** `npm run test:e2e` exits 0 (all Playwright tests pass)
- [ ] **Verify AFTER:** `npm audit` output reviewed; no new high/critical vulnerabilities
- [ ] **Spec:** `specs/deploy/dependency-upgrade-compat.md` — Non-functional: Reliability (deterministic build); Non-functional: Security (no new vulnerabilities)

## Regression Coverage

These tests confirm no regressions from the dependency upgrades:

- [ ] Recipe list page loads (E2E — data fetching via react-query)
- [ ] Authentication flows pass (E2E — covered by existing Playwright suite)
- [ ] tRPC endpoints respond correctly (integration — covered by existing Vitest suite)

All of the above are covered by the existing test suite. No new test files need to be created.

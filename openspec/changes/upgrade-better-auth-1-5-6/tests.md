---
name: tests
description: Tests for upgrade-better-auth-1-5-6
---

# Tests

## Overview

This change is a dependency version bump with no application code changes. TDD here means running the existing test suite against the new versions (red → green without writing new tests), plus manual verification of the BSON UUID migration step.

The primary test surface is:
1. Existing unit/integration tests (`npm run test`) — must pass on upgraded versions
2. Existing E2E tests (`npm run test:e2e`) — must pass on upgraded versions  
3. Manual auth flow verification — covers BSON UUID migration and cookie behavior

## Testing Steps

For each task:

1. **Write a failing test** — for this change, "failing" means running the test suite against the upgraded packages before the BSON UUID migration step, then confirming failures are only from stale auth data (not code regressions).
2. **Write code to pass the test** — perform the BSON UUID migration (clear auth collections) and confirm tests pass.
3. **Refactor** — N/A (no code changes).

## Test Cases

### Task 1 — Package version correctness

- [ ] `npm ls better-auth` resolves to exactly `1.5.6`
  - Maps to: `specs/dependency-versions.md` → "Exact version pin in package.json"
  - How: Run `npm ls better-auth` after install; assert output contains `better-auth@1.5.6`

- [ ] `npm ls @tanstack/devtools-vite` resolves to `>=0.5.5`
  - Maps to: `specs/dependency-versions.md` → "Devtools packages at target versions"
  - How: Run `npm ls @tanstack/devtools-vite @tanstack/react-devtools`; assert versions meet targets

- [ ] `npm run build` succeeds with upgraded packages
  - Maps to: `specs/dependency-versions.md` → "Dev server starts cleanly after upgrade"
  - How: Run `npm run build`; assert exit code 0, no module resolution errors

### Task 2 — BSON UUID migration

- [ ] After clearing auth collections, `npm run test` passes
  - Maps to: `specs/auth-flows.md` → "Auth collections cleared successfully"
  - How: Drop auth collections in dev MongoDB, run `npm run test`; all tests pass

- [ ] After clearing collections and starting the server, new user sign-up creates a record with BSON UUID
  - Maps to: `specs/auth-flows.md` → "New user created with BSON UUID post-upgrade"
  - How: Sign up via the UI; inspect the `users` collection in MongoDB; confirm `_id` is a BSON UUID (not a plain string)

### Task 3 — Devtools render

- [ ] Dev server starts without console errors after upgrade
  - Maps to: `specs/dependency-versions.md` → "Dev server starts with new devtools"
  - How: Run `npm run dev`, open browser at http://localhost:3000, open DevTools console, confirm no errors from TanStack devtools initialization

### Task 4 — Manual auth flow

- [ ] Sign-up creates a session and redirects to the app
  - Maps to: `specs/auth-flows.md` → "Successful sign-up"

- [ ] Sign-in with valid credentials authenticates the user
  - Maps to: `specs/auth-flows.md` → "Successful sign-in"

- [ ] Sign-in with invalid credentials shows an error
  - Maps to: `specs/auth-flows.md` → "Wrong password rejected"

- [ ] Sign-out clears the session cookie and redirects to sign-in
  - Maps to: `specs/auth-flows.md` → "Successful sign-out"

- [ ] Page reload within 5 minutes keeps the user authenticated (cookieCache)
  - Maps to: `specs/auth-flows.md` → "Session persists across page reload within cache window"

- [ ] Accessing a protected route after sign-out redirects to sign-in
  - Maps to: `specs/auth-flows.md` → "Post-sign-out access denied"

### Regression — Full automated suite

- [ ] `npm run test` — all existing unit and integration tests pass
  - Maps to: all specs; confirms no regressions from the version bump

- [ ] `npm run test:e2e` — all E2E tests pass
  - Covers: `src/e2e/recipes-auth.spec.ts`, `src/e2e/cookbooks-auth.spec.ts`
  - Maps to: `specs/auth-flows.md` → sign-in/sign-out scenarios

- [ ] `npx tsc --noEmit` — no TypeScript errors
  - Maps to: design.md Decision 4 (no API breaking changes introduced by upgrade)

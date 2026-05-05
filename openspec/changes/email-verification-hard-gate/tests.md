---
name: tests
description: Tests for the email-verification-hard-gate change
---

# Tests

## Overview

All work follows strict TDD. Write each failing test before any implementation code, make it pass with the minimum change, then refactor. Each test case below maps to a task in `tasks.md` and an acceptance scenario in the specs.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write a test capturing the task's requirement. Run it — it must fail.
2. **Write code to pass the test:** Write the minimum code to make it green.
3. **Refactor:** Improve code quality while keeping the test green.

---

## Test Cases

### Task 1 — `requireVerifiedAuth()` in `src/lib/auth-guard.ts`

File: `src/lib/__tests__/auth-guard.test.ts`

- [ ] **FR-1** — `requireVerifiedAuth()` with `context.session = null` throws a redirect to `/auth/login` with `reason: 'auth-required'` and `from` matching `location.href`
  - Spec: `specs/auth-guard-verified/spec.md` FR-1

- [ ] **FR-2** — `requireVerifiedAuth()` with `session.user.emailVerified = false` throws a redirect to `/auth/verify-email` with `from` matching `location.href`
  - Spec: `specs/auth-guard-verified/spec.md` FR-2

- [ ] **FR-3** — `requireVerifiedAuth()` with `session.user.emailVerified = true` does not throw
  - Spec: `specs/auth-guard-verified/spec.md` FR-3

- [ ] **NFR-2** — `requireVerifiedAuth()` with `session.user.emailVerified = undefined` does not throw
  - Spec: `specs/auth-guard-verified/spec.md` NFR-2

---

### Task 2 — `validateSearch` on `/auth/verify-email`

File: `src/routes/auth/__tests__/-verify-email.test.tsx`

- [ ] **NFR-1a** — `validateSearch` with `from: 'https://evil.com'` returns `{ from: undefined }`
  - Spec: `specs/verify-email-ux/spec.md` NFR-1

- [ ] **NFR-1b** — `validateSearch` with `from: '//evil.com/steal'` returns `{ from: undefined }`
  - Spec: `specs/verify-email-ux/spec.md` NFR-1 variant

- [ ] **valid relative** — `validateSearch` with `from: '/recipes/new'` returns `{ from: '/recipes/new' }`
  - Spec: `specs/verify-email-ux/spec.md` FR-4

- [ ] **absent** — `validateSearch` with no `from` returns `{ from: undefined }`
  - Spec: `specs/verify-email-ux/spec.md` FR-5

---

### Task 3 — `VerifyEmailPage` uses `from` for "Continue" navigation

File: `src/components/auth/__tests__/VerifyEmailPage.test.tsx` (create or extend existing)

- [ ] **FR-4** — When rendered with `from="/recipes/new"` and `emailVerified: true`, the "Continue" element has href `/recipes/new`
  - Spec: `specs/verify-email-ux/spec.md` FR-4

- [ ] **FR-5** — When rendered with no `from` and `emailVerified: true`, the "Continue" element has href `/`
  - Spec: `specs/verify-email-ux/spec.md` FR-5

- [ ] **from prop passthrough** — `VerifyEmailRoute` passes `from` from `Route.useSearch()` into `VerifyEmailPage`

---

### Task 4 — Route files updated

These tests confirm the guard is wired correctly. They build on the `requireVerifiedAuth()` unit tests and verify the route config calls the guard.

- [ ] **`/recipes/new` guard** — Route test (or new unit test) confirms an unverified session triggers redirect to `/auth/verify-email` (not just login)
  - File: `src/routes/__tests__/-recipes.test.tsx` or new test
  - Spec: `specs/auth-guard-verified/spec.md` — "Unverified user navigates to recipe creation"

- [ ] **`/cookbooks/` UI gate** — Listing page is public (no redirect); unverified logged-in user sees "Verify Email to Create" CTA instead of the create form; verified user sees the create form
  - File: `src/routes/cookbooks/__tests__/index.test.tsx`

- [ ] **`/change-tier` guard** — Route renders for verified session; unverified session redirects
  - File: `src/routes/__tests__/-change-tier.test.tsx`
  - Spec: `specs/auth-guard-verified/spec.md` — "Unverified user navigates to tier change"

- [ ] **`/pricing` no guard** — Route is accessible without any session (public)
  - File: `src/routes/__tests__/-pricing.test.tsx` — confirm existing test still passes with no auth required

---

### Task 5 — Test helper default sessions

- [ ] Shared session mock in `src/test-helpers/auth.ts` (or wherever used) includes `emailVerified: true` by default, so all existing tests continue passing without modification

---

## Regression Check

After all tasks are complete, run `npm run test` — the full suite must pass. Any test that was green before this change must remain green.

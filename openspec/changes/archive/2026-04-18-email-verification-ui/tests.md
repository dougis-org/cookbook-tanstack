---
name: tests
description: Tests for the email-verification-ui change
---

# Tests

## Overview

All work follows strict TDD: write failing test → implement → refactor. Each test case maps to a task in
`tasks.md` and an acceptance scenario in `specs/email-verification.md`.

## Testing Steps

For each task:

1. Write failing test first, run it, confirm RED
2. Write minimal implementation to make it GREEN
3. Refactor, keep GREEN

## Test Cases

### Task 2 / Task 3: RegisterForm check-email state

File: `src/components/auth/__tests__/RegisterForm.test.tsx`

- [x] On mock `onSuccess`: form replaced by message containing "check" (case-insensitive)
- [x] On mock `onSuccess`: message contains the submitted email address
- [x] On mock `onSuccess`: `navigate` is NOT called
- [x] On mock `onError`: form remains visible with error text rendered
- [x] On mock `onError`: `isSubmitted` state never set (form still showing)

Spec ref: ADDED — Post-registration check-email feedback; MODIFIED — RegisterForm navigation

---

### Task 4 / Task 5: VerificationBanner component

File: `src/components/auth/__tests__/VerificationBanner.test.tsx`

- [x] Renders banner text when `isLoggedIn: true` and `emailVerified: false`
- [x] Returns null when `emailVerified: true`
- [x] Returns null when session is null (unauthenticated)
- [x] Returns null when current pathname starts with `/auth/`
- [x] "Resend" button calls `authClient.sendVerificationEmail` with `session.user.email` as email
- [x] "Resend" button shows loading state while request is in flight
- [x] Shows "Email sent!" (or similar) message after successful resend
- [x] Shows error message text after failed resend (BetterAuth error surfaced)
- [x] `session?.user?.emailVerified` optional chain — no throw when field absent (pass `user: {}` as session user)

Spec ref: ADDED — Verification banner; ADDED — Resend from banner; Non-functional: security (email from
session), reliability (missing field)

---

### Task 7 / Task 8: VerifyEmailPage component + route

File: `src/routes/auth/__tests__/-verify-email.test.tsx`

- [x] Renders success message when mock `useAuth()` returns `emailVerified: true`, no `?error` param
- [x] Success state includes a link to `/` (continue to app)
- [x] Renders error message when `?error` param is any non-empty string
- [x] Error state includes a resend button
- [x] Renders default "verify your email" + resend when `emailVerified: false` + no `?error` param
- [x] Resend button in error state calls `authClient.sendVerificationEmail`
- [x] Resend loading/success/error states behave identically to banner resend tests
- [x] Verified session state takes precedence over a stale `?error` param
- [x] Shared verification email helper throws BetterAuth response error messages and fallback messages

Spec ref: ADDED — Email verification landing page; ADDED — Resend from landing page

---

### Integration: Banner wired in root

Manual / E2E (no unit test for placement):

- [x] Dev server: register new account → banner visible on `/` (unverified)
- [x] Dev server: verified session → banner not visible
- [x] Dev server: `/auth/login` while unverified → banner not visible
- [x] Dev server: resend from banner → resend endpoint succeeds and UI shows success

Spec ref: Non-functional — Performance (no extra requests), Security (unauthenticated = no banner)

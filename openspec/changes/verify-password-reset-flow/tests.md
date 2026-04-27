---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `verify-password-reset-flow` change. All work should follow a strict TDD process: write the failing test first, implement the minimum code to pass it, then refactor without breaking coverage.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before changing app code, add or update a test that captures the desired password reset verification behavior.
2. **Write code to pass the test:** Make only the smallest auth UI or route change needed to satisfy the failing test.
3. **Refactor:** Clean up naming, mocks, and duplication while keeping the tests green.

## Test Cases

- [ ] **Task group 1 / Spec: Password Reset Request Verification**
  - Add `src/components/auth/__tests__/ForgotPasswordForm.test.tsx`
  - Assert `requestPasswordReset` receives `{ email, redirectTo: "/auth/reset-password" }`
  - Assert neutral success messaging on success
  - Assert validation and client error behavior
- [ ] **Task group 2 / Spec: Password Reset Completion Verification**
  - Add `src/components/auth/__tests__/ResetPasswordForm.test.tsx`
  - Assert `resetPassword` receives `{ newPassword, token }`
  - Assert mismatched passwords block submission
  - Assert success navigates to `/auth/login`
  - Assert Better Auth errors render to the user
- [ ] **Task group 3 / Spec: Password Reset Completion Verification**
  - Add `src/routes/auth/__tests__/-reset-password.test.tsx`
  - Assert missing token renders the invalid-token state
  - Assert valid token renders the form
- [ ] **Task group 4 / Spec: MODIFIED Password Reset Delivery Confidence**
  - Record manual Mailtrap smoke-test evidence in PR validation notes
  - Confirm reset email delivery, tokenized URL, reset completion, and successful login with the new password
- [ ] **Task group 5 / Spec: Issue Closure Traceability**
  - Confirm the PR body contains `Closes #341`
  - Confirm the PR summary states this work verifies and closes the existing feature path

## Manual Mailtrap Smoke Checklist

- Confirm the environment has `MAILTRAP_API_TOKEN` and `MAIL_FROM` set before starting. To route to a sandbox inbox, also set `MAILTRAP_INBOX_ID`.
- Open `/auth/forgot-password` and submit a password reset request for a known account.
- Confirm the reset email appears in Mailtrap.
- Open the link from the email and confirm it lands on `/auth/reset-password?token=...`.
- Submit a new password from the reset form.
- Confirm login succeeds at `/auth/login` with the updated password.

---
name: tests
description: Tests for the Mailtrap foundational integration
---

# Tests

## Overview

This document outlines the tests for the `mailtrap-email-foundation` change. All work follows a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test**: Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test**: Write the simplest possible code to make the test pass.
3.  **Refactor**: Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 3: Implement Email Utility

- [ ] **Verify `sendEmail` calls transporter with correct data**
  - **Task**: Task 3
  - **Spec Reference**: Transactional Email Service
  - **Test file**: `src/lib/__tests__/mail.test.ts`
  - **Scenario**: Mock `nodemailer.createTransport` and verify that calling `sendEmail({ to: 'user@example.com', ... })` results in a `sendMail` call with the expected recipient and from address.

- [ ] **Verify singleton transporter behavior**
  - **Task**: Task 3
  - **Test file**: `src/lib/__tests__/mail.test.ts`
  - **Scenario**: Verify that repeated calls to `sendEmail` reuse the same transporter instance (if using connection pooling).

### Task 4: Integrate with BetterAuth

- [ ] **Verify Password Reset hook is configured**
  - **Task**: Task 4
  - **Spec Reference**: BetterAuth Email Hooks
  - **Test file**: `src/lib/__tests__/auth.test.ts`
  - **Scenario**: Assert that `auth.options.emailAndPassword.sendResetPassword` is a function.

- [ ] **Verify Email Verification hook is configured**
  - **Task**: Task 4
  - **Spec Reference**: BetterAuth Email Hooks
  - **Test file**: `src/lib/__tests__/auth.test.ts`
  - **Scenario**: Assert that `auth.options.emailVerification.sendVerificationEmail` is a function.

### Task 2: Configure Environment

- [ ] **Verify environment variable validation**
  - **Task**: Task 2
  - **Spec Reference**: Reliability - Environment variable validation
  - **Test file**: `src/lib/__tests__/mail.test.ts`
  - **Scenario**: Verify that `sendEmail` fails gracefully or logs a warning if `MAILTRAP_HOST` is missing during initialization.

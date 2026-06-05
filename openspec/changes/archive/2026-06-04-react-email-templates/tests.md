---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `react-email-templates` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 3 — Base layout component
- [x] **Test Case 3.1:** Verify `Layout` component compiles with basic text children.
- [x] **Test Case 3.2:** Verify compiled output contains base colors (dark background slate, light slate text).

### Task 4 — Verification template
- [x] **Test Case 4.1:** Verify `VerificationEmail` renders a greeting and logo.
- [x] **Test Case 4.2:** Verify a link containing the verification URL is present in the rendered HTML.

### Task 5 — Password reset template
- [x] **Test Case 5.1:** Verify `PasswordResetEmail` renders a security warning.
- [x] **Test Case 5.2:** Verify a link containing the reset URL is present in the rendered HTML.

### Task 6 — Tier notification template
- [x] **Test Case 6.1:** Verify `TierNotificationEmail` renders the correct limits for Executive Chef.
- [x] **Test Case 6.2:** Verify `TierNotificationEmail` renders pricing information matching the upgraded tier.

### Task 7 — Update mail rendering engine
- [x] **Test Case 7.1:** Verify `sendEmail` compiles a React element into the `html` field.
- [x] **Test Case 7.2:** Verify `sendEmail` compiles a React element into the `text` field (plain-text).

### Task 8 — Update Auth callbacks
- [x] **Test Case 8.1:** Verify Better-Auth callbacks invoke `sendEmail` with `VerificationEmail` React elements on user signup.
- [x] **Test Case 8.2:** Verify Better-Auth callbacks invoke `sendEmail` with `PasswordResetEmail` React elements on password reset request.

### Task 9 — Trigger Tier Notification on Set Tier
- [x] **Test Case 9.1:** Verify `admin.users.setTier` mutation calls `sendEmail` when a tier changes.
- [x] **Test Case 9.2:** Verify `admin.users.setTier` mutation does not call `sendEmail` if the tier is unchanged.

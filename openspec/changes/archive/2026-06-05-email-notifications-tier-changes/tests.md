---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `email-notifications-tier-changes` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test Case 1 for Step 3 (Layout Footer link):** Verify that `src/emails/Layout.tsx` renders the transaction notice footer text and a link pointing to the `/account` settings route.
- [x] **Test Case 2 for Step 4 & 5 (Upgrade template layout):** Verify that `src/emails/TierNotificationEmail.tsx` when rendered with `changeType: 'upgrade'` renders the upgrade heading, the new limits (e.g. 2500 recipes, 200 cookbooks for Executive Chef), and subscription price ($9.99/mo).
- [x] **Test Case 3 for Step 4 & 5 (Downgrade template layout):** Verify that `src/emails/TierNotificationEmail.tsx` when rendered with `changeType: 'downgrade'` renders the downgrade message, the list of hidden item counts (e.g. "15 recipes and 3 cookbooks have been hidden"), and pricing/unlocked information.
- [x] **Test Case 4 for Step 6 (Router email dispatch):** Verify that `admin.users.setTier` mutation calls `sendEmail` with `changeType: 'admin-change'` and supplies the correct user email and name.
- [x] **Test Case 5 for Step 6 (Router email dispatch with reconciliation results):** Verify that `admin.users.setTier` mutation queries `reconcileUserContent` and passes the returned counts (`recipesHidden`, `cookbooksHidden`, `madePublic`) to the `sendEmail` options.

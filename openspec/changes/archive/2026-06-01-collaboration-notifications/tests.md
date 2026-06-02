---
name: tests
description: Tests for the collaboration notifications change
---

# Tests

## Overview

This document outlines the test cases and plans for the `collaboration-notifications` change. All work follows a strict TDD (Test-Driven Development) workflow, ensuring failing tests are written first, followed by implementation, and completed with refactoring.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `src/db/models/__tests__/notification.test.ts` (Task 1)

- [ ] **Test Case 1.1 — Schema Validations:** Verify the schema validates successfully with proper enums (`collaboration_invited`, `collaboration_removed`, `recipe_added`, `recipe_removed`).
- [ ] **Test Case 1.2 — Default Fields:** Verify that `read` defaults to `false` and `createdAt` automatically populates with the current date/time.
- [ ] **Test Case 1.3 — Required Fields:** Enforce validation errors if `userId`, `senderId`, or `type` are missing.

### `src/server/trpc/routers/__tests__/notifications.test.ts` (Task 2)

- [ ] **Test Case 2.1 — `unreadCount` query:** Query returns the correct count of notifications where `read === false` and `userId === ctx.user.id`.
- [ ] **Test Case 2.2 — `list` query:** Query returns the most recent 10 notifications for the user, sorted by `createdAt` descending.
- [ ] **Test Case 2.3 — `list` query joins:** Query successfully populates the sender's details (username, name) from the `user` collection.
- [ ] **Test Case 2.4 — `markRead` mutation (single):** Successfully marks a specific notification as `read === true`.
- [ ] **Test Case 2.5 — `markRead` mutation (all):** Successfully marks all unread notifications for the calling user as `read === true`.

### `src/server/trpc/routers/__tests__/cookbooks.test.ts` (Task 3)

- [ ] **Test Case 3.1 — Invite Notification Trigger:** Adding a collaborator successfully creates a `Notification` record of type `'collaboration_invited'` in the database for the invited user.
- [ ] **Test Case 3.2 — Invite Email Dispatch:** Verify that `sendEmail` from `@/lib/mail` is invoked asynchronously with correct payload details (subject, recipient, and direct link).
- [ ] **Test Case 3.3 — Remove Notification Trigger:** Removing a collaborator successfully creates a `Notification` of type `'collaboration_removed'`.
- [ ] **Test Case 3.4 — Collaborative Edit Recipe Add:** When a collaborator (editor) calls `addRecipe`, verify a notification of type `'recipe_added'` is saved for the cookbook owner.
- [ ] **Test Case 3.5 — Owner Edit Recipe Add:** When the owner calls `addRecipe`, verify that no notification is created.

### `src/lib/__tests__/reconcile-user-content.test.ts` (Task 4)

- [ ] **Test Case 4.1 — Tier Downgrade Eviction Notification:** Verify that when `reconcileCollaborationOnDowngrade` deletes collaborator links, a database notification card is saved for each evicted collaborator explaining their access has ended.

### `src/components/notifications/__tests__/NotificationBell.test.tsx` (Task 5)

- [ ] **Test Case 5.1 — Unread Badge Render:** Verify the bell icon displays the correct unread count badge overlay when `unreadCount > 0`.
- [ ] **Test Case 5.2 — Hide Badge when Zero:** Verify the unread badge is not rendered when the unread count is `0`.
- [ ] **Test Case 5.3 — Dropdown Toggle:** Clicking the bell toggles the visibility of the `NotificationDropdown`.
- [ ] **Test Case 5.4 — Notification Navigation:** Clicking a notification card inside the dropdown marks it as read, closes the dropdown, and navigates the user to the correct URL (e.g. `/cookbooks/$id`).

---
name: tests
description: Tests for the admin-user-tier-management change
---

# Tests

## Overview

TDD workflow for `admin-user-tier-management`. Write failing test → implement → refactor. Each test case maps to a task in `tasks.md` and an acceptance scenario in `specs/`.

## Testing Steps

For each task:

1. **Write a failing test** before any implementation code. Run it, confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 2 — Admin tRPC router (`src/server/trpc/routers/__tests__/admin.test.ts`)

Spec references: `specs/admin-access-guard.md`, `specs/admin-set-tier.md`, `specs/audit-log-write.md`

#### `admin.users.list`

- [ ] Returns all user documents transformed via `transformUserDoc` when caller is admin
- [ ] Throws `UNAUTHORIZED` when session is absent
- [ ] Throws `FORBIDDEN` when caller is authenticated but `isAdmin` is false
- [ ] Returns empty array (not error) when no users exist in collection

#### `admin.users.setTier`

- [ ] Updates user's `tier` field in MongoDB and returns updated user when caller is admin and target differs from caller
- [ ] Writes one `adminAuditLog` document with correct shape (`adminId`, `adminEmail`, `targetUserId`, `targetEmail`, `action: "set-tier"`, `before`, `after`) on successful tier change
- [ ] Returns early with no DB write and no audit log entry when new tier equals current tier (no-op)
- [ ] Throws `FORBIDDEN` when `targetUserId` equals `ctx.user.id` (self-change)
- [ ] Throws `BAD_REQUEST` / Zod parse error when `tier` input is not a valid `UserTier` value
- [ ] Throws `FORBIDDEN` when caller is not admin
- [ ] Throws `UNAUTHORIZED` when session is absent
- [ ] Returns success (does not throw) when audit log `insertOne` throws — tier change persists
- [ ] Does not surface audit log error to caller when audit write fails

### Task 4 — Admin users page (`src/routes/admin/__tests__/users.test.tsx`)

Spec references: `specs/admin-user-list.md`, `specs/admin-set-tier.md`

- [ ] Renders a table row for each user returned by `admin.users.list`
- [ ] Each row displays user email, name (or "—" when name is null/absent), and current tier label
- [ ] Tier selector is disabled for the row matching the current admin's own user ID
- [ ] Tier selector is enabled for all other user rows
- [ ] Selecting a new tier for another user opens the confirmation modal
- [ ] Confirmation modal displays old tier and new tier
- [ ] Clicking "Cancel" in the modal closes it without calling the `setTier` mutation
- [ ] Clicking "Confirm" in the modal calls `admin.users.setTier` with correct `userId` and `tier`
- [ ] After successful mutation, query is invalidated (table re-fetches)
- [ ] Each row contains a link or button labeled "View audit log" with `userId` param in href

### Task 5 — Admin nav link in Header (`src/components/__tests__/Header.test.tsx`)

Spec references: `specs/admin-nav-link.md`

- [ ] Admin link renders when `useSession` returns `{ status: 'authenticated', data: { user: { isAdmin: true } } }`
- [ ] Admin link is absent when `isAdmin` is `false` (authenticated, non-admin)
- [ ] Admin link is absent when `isAdmin` is absent/undefined (authenticated, no flag)
- [ ] Admin link is absent when `status` is `'loading'`
- [ ] Admin link is absent when `status` is `'unauthenticated'`

### Task 6 — E2E tests (`e2e/admin/`)

Spec references: `specs/admin-access-guard.md`, `specs/admin-user-list.md`, `specs/admin-set-tier.md`

- [ ] Non-admin authenticated user navigating to `/admin/users` is redirected to `/account`
- [ ] Unauthenticated user navigating to `/admin/users` is redirected to `/auth/login` with `reason=auth-required`
- [ ] Admin user can load `/admin/users` and see the user table with at least one row
- [ ] Admin can select a new tier for a non-self user, complete the confirmation modal, and see the updated tier in the table
- [ ] Admin tier selector is visually disabled for their own row
- [ ] Admin nav link is visible in the Header when logged in as admin
- [ ] Admin nav link is not visible when logged in as non-admin user

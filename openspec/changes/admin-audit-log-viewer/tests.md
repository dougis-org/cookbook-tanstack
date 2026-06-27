---
name: tests
description: Tests for the admin-audit-log-viewer change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, implement the minimum to pass it, refactor.

Test files:
- `src/server/trpc/routers/__tests__/admin.test.ts` — tRPC procedure unit tests (Tasks 2)
- `src/routes/admin/__tests__/audit.test.tsx` — RTL component tests (Tasks 4, 5)
- `e2e/admin-audit-log.spec.ts` — Playwright E2E golden path (Task 6)

---

## Task 2 — `admin.auditLog.list` tRPC procedure

File: `src/server/trpc/routers/__tests__/admin.test.ts`

Spec reference: `specs/audit-log-list/spec.md` → Requirement: ADDED `admin.auditLog.list`

### TDD cycle

Write each test below as a failing test first. Then implement the minimum in `src/server/trpc/routers/admin.ts` to pass it, then refactor.

- [ ] **TC-2-1: Returns all entries with offset pagination (no filters)**
  - Seed 30 mock entries in `adminAuditLog`.
  - Call `admin.auditLog.list({})` (defaults: page 1, limit 25).
  - Assert `entries.length === 25` and `total === 30`.
  - Assert entries are sorted `createdAt` descending.

- [ ] **TC-2-2: Returns page 2 correctly**
  - Same 30-entry seed.
  - Call `admin.auditLog.list({ page: 2 })`.
  - Assert `entries.length === 5` (entries 26–30) and `total === 30`.

- [ ] **TC-2-3: Out-of-range page returns empty entries**
  - Seed 10 entries.
  - Call `admin.auditLog.list({ page: 99 })`.
  - Assert `entries.length === 0` and `total === 10`.

- [ ] **TC-2-4: Filter by userId returns only matching entries**
  - Seed 5 entries for userId A, 3 for userId B.
  - Call `admin.auditLog.list({ userId: "<userId-A>" })`.
  - Assert `entries.length === 5` and `total === 5`.
  - Assert all returned entries have `targetEmail` matching user A's entries.

- [ ] **TC-2-5: Filter by date range**
  - Seed entries with `createdAt` spread across 3 days.
  - Call with `{ from: day2Start, to: day2End }`.
  - Assert only entries from day 2 are returned.

- [ ] **TC-2-6: Non-admin session is rejected**
  - Call `admin.auditLog.list({})` with a non-admin session (or no session).
  - Assert a `TRPCError` with code `UNAUTHORIZED` or `FORBIDDEN` is thrown.
  - Assert no entries are returned.

- [ ] **TC-2-7: Empty collection returns valid response**
  - Ensure `adminAuditLog` is empty.
  - Call `admin.auditLog.list({})`.
  - Assert `{ entries: [], total: 0 }` is returned without throwing.

---

## Task 4 — `AdminAuditPage` route component

File: `src/routes/admin/__tests__/audit.test.tsx`

Spec reference: `specs/audit-log-list/spec.md` → Requirement: ADDED `/admin/audit` route

### TDD cycle

Write each test below as a failing test first. Then implement the minimum in `src/routes/admin/audit.tsx` to pass it.

- [ ] **TC-4-1: Renders table headers**
  - Mock `trpc.admin.auditLog.list` to return `{ entries: [], total: 0 }`.
  - Render `AdminAuditPage`.
  - Assert column headers "Timestamp", "Admin", "Target User", "Before", "After" are present.

- [ ] **TC-4-2: Renders a populated entry row**
  - Mock procedure to return one entry with known data.
  - Render component.
  - Assert the row displays the admin email, target email, before tier display name, after tier display name, and a readable timestamp.

- [ ] **TC-4-3: Renders empty state when no entries**
  - Mock procedure to return `{ entries: [], total: 0 }`.
  - Assert empty state message is displayed (e.g., "No audit log entries found").
  - Assert no `<tbody>` rows are rendered.

- [ ] **TC-4-4: Tier identifiers displayed as human-readable names**
  - Mock one entry with `before.tier = 'home-cook'`, `after.tier = 'executive-chef'`.
  - Assert "Home Cook" and "Executive Chef" appear in the rendered output.
  - Assert "home-cook" and "executive-chef" do NOT appear as raw strings in the visible table cells.

- [ ] **TC-4-5: Pagination controls are rendered**
  - Mock procedure to return `{ entries: [...25 items], total: 60 }` for page 1.
  - Assert "Prev" button is disabled (page 1).
  - Assert "Next" button is enabled.

- [ ] **TC-4-6: Pagination controls at last page**
  - Mock `total: 60`, render with `page: 3` in search params.
  - Assert "Next" button is disabled.
  - Assert "Prev" button is enabled.

---

## Task 5 — Replace stub anchors in `/admin/users`

File: `src/routes/admin/__tests__/audit.test.tsx` or `src/routes/admin/__tests__/users.test.tsx`

Spec reference: `specs/audit-log-list/spec.md` → Requirement: MODIFIED "View audit log" links

- [ ] **TC-5-1: "View audit log" link has correct href**
  - Render `AdminUsersPage` with a mocked user list (`[{ id: 'user-1', email: 'a@b.com', tier: 'home-cook' }]`).
  - Assert the "View audit log" element is a `<Link>` (or `<a>`) with `href` containing `/admin/audit?userId=user-1`.
  - Assert the element is NOT `aria-disabled`.
  - Assert no `cursor-not-allowed` class is present.

---

## Task 6 — Playwright E2E golden path

File: `e2e/admin-audit-log.spec.ts`

Spec reference: `specs/audit-log-list/spec.md` → Requirement: ADDED `/admin/audit` route

- [ ] **TC-6-1: "View audit log" link navigates to filtered audit view**
  - Admin logs in, navigates to `/admin/users`.
  - Clicks "View audit log" for the first user row.
  - Assert URL matches `/admin/audit?userId=<some-id>`.
  - Assert the audit page renders (table or empty state — no error/crash).

- [ ] **TC-6-2: "Audit Log" nav link is active on `/admin/audit`**
  - Admin navigates directly to `/admin/audit`.
  - Assert the "Audit Log" nav link has the active/accent style.
  - Assert the "Users" nav link does not have the active style.

- [ ] **TC-6-3: Navigating to `/admin/audit` without filter shows all entries or empty state**
  - Admin navigates to `/admin/audit`.
  - Assert page renders without error.
  - Assert either table rows or empty-state message is visible.

- [ ] **TC-6-4: Filter pre-fill from users table**
  - (If test data permits) After navigating via "View audit log" for a known user, assert the target user filter input is pre-filled with the user's ID or email.

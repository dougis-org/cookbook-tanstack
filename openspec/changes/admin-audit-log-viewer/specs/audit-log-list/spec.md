## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `admin.auditLog.list` tRPC procedure

The system SHALL expose a paginated, filterable read procedure for `adminAuditLog` entries, accessible only to admins.

#### Scenario: List all entries (no filters)

- **Given** an authenticated admin session
- **When** `admin.auditLog.list` is called with no filter arguments
- **Then** the procedure returns `{ entries: AuditLogEntry[], total: number }` where `entries` contains the most recent 25 entries (sorted `createdAt` descending) and `total` reflects the full collection count

#### Scenario: Filter by targetUserId

- **Given** an authenticated admin session and the `adminAuditLog` collection contains entries for multiple users
- **When** `admin.auditLog.list` is called with `{ userId: "<targetUserId>" }`
- **Then** only entries where `targetUserId` matches are returned, and `total` reflects the filtered count

#### Scenario: Filter by date range

- **Given** an authenticated admin session
- **When** `admin.auditLog.list` is called with `{ from: "<isoDate>", to: "<isoDate>" }`
- **Then** only entries where `createdAt >= from` and `createdAt <= to` are returned

#### Scenario: Paginate results

- **Given** an authenticated admin session and the collection contains 60 entries
- **When** `admin.auditLog.list` is called with `{ page: 2 }`
- **Then** entries 26–50 are returned and `total` is 60

#### Scenario: Page out of range

- **Given** an authenticated admin session and the collection contains 10 entries
- **When** `admin.auditLog.list` is called with `{ page: 99 }`
- **Then** `entries` is empty and `total` is 10 (no error thrown)

#### Scenario: Non-admin caller is rejected

- **Given** a session for a non-admin user
- **When** `admin.auditLog.list` is called
- **Then** a `UNAUTHORIZED` or `FORBIDDEN` TRPCError is thrown and no entries are returned

---

### Requirement: ADDED `/admin/audit` route

The system SHALL render a paginated, filterable audit log table at `/admin/audit`, protected by the existing admin layout guard.

#### Scenario: Golden path — view all entries

- **Given** an authenticated admin navigates to `/admin/audit`
- **When** the page loads
- **Then** a table is displayed with columns: Timestamp, Admin, Target User, Before, After; entries are sorted newest-first; pagination controls reflect total count

#### Scenario: Pre-filtered by userId from users table

- **Given** an authenticated admin clicks "View audit log" for a user on `/admin/users`
- **When** the browser navigates to `/admin/audit?userId=<id>`
- **Then** the table shows only entries for that user and the filter state reflects the userId

#### Scenario: Empty state — no entries match filters

- **Given** an authenticated admin applies filters that match no entries
- **When** the table renders
- **Then** an empty-state message is displayed (e.g., "No audit log entries found") and no table rows are shown

#### Scenario: Empty state — collection is empty

- **Given** no entries exist in `adminAuditLog`
- **When** an authenticated admin navigates to `/admin/audit`
- **Then** the empty-state message is displayed

#### Scenario: Page resets on filter change

- **Given** an authenticated admin is on `/admin/audit?page=3`
- **When** the userId filter is changed
- **Then** the URL updates to reflect `page=1` and the first page of filtered results is shown

#### Scenario: Tier displayed as human-readable label

- **Given** an entry exists with `before.tier = 'home-cook'` and `after.tier = 'sous-chef'`
- **When** the entry renders in the table
- **Then** the Before column shows "Home Cook" and the After column shows "Sous Chef"

---

### Requirement: MODIFIED "View audit log" links in `/admin/users`

The system SHALL replace the disabled stub anchors in the users table with real navigable `<Link>` elements pointing to `/admin/audit?userId=<id>`.

#### Scenario: Link navigates to filtered audit view

- **Given** an authenticated admin is on `/admin/users`
- **When** they click "View audit log" for a specific user
- **Then** the browser navigates to `/admin/audit?userId=<that user's id>` and the audit table pre-filters to that user

#### Scenario: Link href is correct before click

- **Given** the `/admin/users` page renders with a user row
- **When** the DOM is inspected
- **Then** the "View audit log" element is an enabled `<Link>` with `href="/admin/audit?userId=<id>"` (not a disabled anchor)

---

### Requirement: ADDED "Audit Log" nav link in `AdminLayout`

The system SHALL display an "Audit Log" nav link in the admin nav bar, parallel to "Users".

#### Scenario: Nav link navigates to audit log

- **Given** an authenticated admin is on any `/admin/*` route
- **When** they click "Audit Log" in the nav
- **Then** the browser navigates to `/admin/audit`

#### Scenario: Nav link is active when on `/admin/audit`

- **Given** an authenticated admin is on `/admin/audit`
- **When** the nav renders
- **Then** the "Audit Log" link has the active style (accent color, font-medium) and "Users" does not

## MODIFIED Requirements

None — no existing requirements are changed. The "View audit log" stub links in `/admin/users` are an in-progress stub (not a shipped requirement), so replacing them is captured above as ADDED.

## REMOVED Requirements

None.

## Traceability

- Proposal: `admin.auditLog.list` tRPC procedure → Requirement: ADDED `admin.auditLog.list`
- Proposal: New route `/admin/audit` → Requirement: ADDED `/admin/audit` route
- Proposal: Replace stub links → Requirement: MODIFIED "View audit log" links
- Proposal: Nav link in `AdminLayout` → Requirement: ADDED "Audit Log" nav link
- Design Decision 1 (sub-router) → Requirement: ADDED `admin.auditLog.list`
- Design Decision 2 (offset pagination) → Scenarios: Paginate results, Page out of range
- Design Decision 3 (URL search params) → Scenarios: Pre-filtered by userId, Page resets on filter change
- Design Decision 4 (page reset) → Scenario: Page resets on filter change
- Design Decision 6 (tier display names) → Scenario: Tier displayed as human-readable label
- Requirement: ADDED `admin.auditLog.list` → Tasks: tRPC procedure, unit tests
- Requirement: ADDED `/admin/audit` route → Tasks: route file, E2E test
- Requirement: MODIFIED "View audit log" links → Tasks: update users.tsx
- Requirement: ADDED "Audit Log" nav link → Tasks: update admin.tsx

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "Non-admin caller is rejected" (ADDED `admin.auditLog.list` section).

No additional NFAC security scenarios — `adminProcedure` middleware enforces the access control at the tRPC layer, and the `/admin` layout enforces it at the route level. Both are already covered by existing test suites and the functional scenario above.

### Requirement: Performance

#### Scenario: Filtered query uses index

- **Given** the `adminAuditLog` collection has a compound index on `{ targetUserId: 1, createdAt: -1 }`
- **When** `admin.auditLog.list` is called with a `userId` filter
- **Then** MongoDB query planner uses the compound index (verifiable via `collection.indexes()` returning the expected index)

### Requirement: Reliability

#### Scenario: Empty collection returns valid response

- **Given** the `adminAuditLog` collection has zero documents
- **When** `admin.auditLog.list` is called
- **Then** the procedure returns `{ entries: [], total: 0 }` without throwing

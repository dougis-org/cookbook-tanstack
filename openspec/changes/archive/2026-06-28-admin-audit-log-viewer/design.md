## Context

- Relevant architecture:
  - Admin section lives at `/admin` (TanStack Router file-based route). `src/routes/admin.tsx` provides the `AdminLayout` with nav and `requireAdmin()` guard. Sub-routes render via `<Outlet />`.
  - tRPC is the data layer. `src/server/trpc/routers/admin.ts` exports `adminRouter` with an `admin.users` sub-router. Procedures use `adminProcedure` from `src/server/trpc/init.ts`.
  - `adminAuditLog` Mongoose model lives in `src/db/models/admin-audit-log.ts`. Fields: `adminId`, `adminEmail`, `targetUserId`, `targetEmail`, `action` (`'set-tier'`), `before.tier`, `after.tier`, `createdAt`, `updatedAt`.
  - `/admin/users` already has disabled "View audit log" stub anchors that link to `/admin/audit?userId=<id>`.
- Dependencies: #330 merged (audit log writes live in production).
- Interfaces/contracts touched:
  - `adminRouter` export (add `auditLog` sub-router).
  - `AdminLayout` nav (add link).
  - `AdminUsersPage` user row (replace stub anchor with `<Link>`).

## Goals / Non-Goals

### Goals

- Expose a read procedure for `adminAuditLog` behind `adminProcedure`.
- Render a paginated, filterable table at `/admin/audit`.
- Wire the existing stub links in `/admin/users` to the new route.

### Non-Goals

- Audit log writes, non-tier actions, export, deletion.

## Decisions

### Decision 1: tRPC sub-router placement

- Chosen: `admin.auditLog.list` — a new `auditLog` sub-router nested in `adminRouter`, parallel to `admin.users`.
- Alternatives considered: nesting under `admin.users` as `admin.users.auditLog.list`.
- Rationale: Audit log is a first-class admin capability, not a sub-feature of user management. Parallel placement keeps the namespace flat and allows non-user audit events later without restructuring.
- Trade-offs: Slightly larger router file; negligible.

### Decision 2: Offset pagination

- Chosen: `page` (1-indexed) + `limit` (default 25, max 100) returned alongside `total` count.
- Alternatives considered: Cursor-based pagination (opaque `createdAt` cursor).
- Rationale: Admin-only tool with modest data volume. Offset is simpler to implement, easier to test, and allows jumping to arbitrary pages. Cursor migration path documented in Risks.
- Trade-offs: Slower at very large collection sizes; acceptable for this use case.

### Decision 3: Filter parameters via URL search params

- Chosen: TanStack Router `validateSearch` on the `/admin/audit` route, accepting `userId` (optional string), `from` / `to` (optional ISO date strings), `page` (optional number, default 1).
- Alternatives considered: Local component state (not shareable/bookmarkable).
- Rationale: URL state is shareable and survives refresh. `validateSearch` provides type safety. The stub link in `/admin/users` already passes `?userId=` — this makes the contract explicit.
- Trade-offs: Filter state in URL means back-button restores filters, which is the desired UX.

### Decision 4: Page reset on filter change

- Chosen: Reset `page` to 1 whenever `userId`, `from`, or `to` changes. Handled in the route component by navigating with `{ replace: true, search: (prev) => ({ ...prev, page: 1, <filter>: newValue }) }`.
- Alternatives considered: Preserving page across filter changes (leads to empty pages).
- Rationale: Prevents the common UX bug where a user filters after browsing to page 5 and sees no results.
- Trade-offs: None.

### Decision 5: MongoDB index

- Chosen: Compound index `{ targetUserId: 1, createdAt: -1 }` on the `adminAuditLog` collection. Simple `{ createdAt: -1 }` index also added for the unfiltered path.
- Alternatives considered: Single-field index on `createdAt` only.
- Rationale: The primary filtered query (by `targetUserId`) benefits from the compound index. The full-log unfiltered path benefits from the sort index.
- Trade-offs: Slightly more write overhead; negligible at this scale.

### Decision 6: Display of tier identifiers

- Chosen: Use the existing `TIER_DISPLAY_NAMES` map from `src/lib/tier-entitlements.ts` to render human-readable tier names in the table (e.g., "Home Cook" not "home-cook").
- Alternatives considered: Inline mapping in the route component.
- Rationale: Keeps tier display logic centralized per project convention.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: New tRPC procedure `admin.auditLog.list`
  - Design decision: Decision 1 (sub-router placement), Decision 2 (offset pagination), Decision 3 (filter params)
  - Validation approach: Unit tests for filter logic, pagination math, and `adminProcedure` authorization.

- Proposal element: New route `/admin/audit`
  - Design decision: Decision 3 (URL search params + `validateSearch`), Decision 4 (page reset), Decision 6 (tier display)
  - Validation approach: Playwright E2E golden path; unit test of `validateSearch` schema.

- Proposal element: Nav link in `AdminLayout`
  - Design decision: Trivial — mirrors existing "Users" link pattern.
  - Validation approach: E2E test navigates to /admin/audit via nav.

- Proposal element: Replace stub anchors in `/admin/users`
  - Design decision: Decision 3 (link carries `?userId=` search param)
  - Validation approach: Unit test that the rendered link has correct `href`; E2E test that clicking it pre-filters the audit view.

- Proposal element: MongoDB index
  - Design decision: Decision 5
  - Validation approach: Index verified via `AdminAuditLog.collection.indexes()` in integration test or confirmed via db:connect script.

## Functional Requirements Mapping

- Requirement: Return paginated audit log entries filtered by `targetUserId`, `from`, `to`
  - Design element: `admin.auditLog.list` procedure (Decision 1, 2, 3)
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: Unit test with mock `AdminAuditLog.find()` returning controlled data; verify skip/limit math and filter conditions.

- Requirement: Render table with timestamp, admin email, target email, before/after tier
  - Design element: `/admin/audit` route component
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: RTL render test asserting column headers and row content; Playwright screenshot for visual regression.

- Requirement: Filters reset page to 1 on change
  - Design element: Decision 4 navigation logic
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: E2E: navigate to page 2, change filter, assert URL shows `page=1`.

- Requirement: "View audit log" links in `/admin/users` navigate to filtered view
  - Design element: Replace stub anchors with `<Link>` (Decision 3)
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: Unit test: render `AdminUsersPage` and assert link `href` includes `userId` param.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Only admins can call `admin.auditLog.list`
  - Design element: `adminProcedure` middleware (existing)
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: Unit test: call procedure without admin session → expect `UNAUTHORIZED` or `FORBIDDEN` TRPCError.

- Requirement category: performance
  - Requirement: Filtered queries complete quickly at modest log volumes
  - Design element: Decision 5 — compound MongoDB index
  - Acceptance criteria reference: N/A (operational)
  - Testability notes: Integration test with seeded data; confirm index exists via `collection.indexes()`.

- Requirement category: reliability
  - Requirement: Empty state renders gracefully (no results, no errors)
  - Design element: Route component empty-state branch
  - Acceptance criteria reference: specs/audit-log-list.md
  - Testability notes: Unit test: procedure returns `{ entries: [], total: 0 }`; RTL asserts empty-state message renders.

## Risks / Trade-offs

- Risk/trade-off: Offset pagination degrades at large collection sizes.
  - Impact: Low — admin-only, expected volume hundreds to low-thousands.
  - Mitigation: Compound index covers the common filtered path. Cursor migration documented for future.

- Risk/trade-off: `page` in URL can go out of range if logs are deleted.
  - Impact: Minor — table shows empty page.
  - Mitigation: Procedure clamps `page` to last available page when `skip >= total`; UI shows empty state with "No results on this page" and a "Back to first page" link.

## Rollback / Mitigation

- Rollback trigger: Audit log page causes 500s in production or breaks existing admin routes.
- Rollback steps:
  1. Revert `src/server/trpc/routers/admin.ts` to remove `auditLog` sub-router.
  2. Revert `src/routes/admin.tsx` to remove nav link.
  3. Revert `src/routes/admin/users.tsx` stub anchors.
  4. Delete `src/routes/admin/audit.tsx`.
  - The `adminAuditLog` collection and model are untouched by this change — no data migration needed on rollback.
- Data migration considerations: None. This change is read-only with respect to the database (no schema changes, writes, or migrations).
- Verification after rollback: Confirm `/admin/users` loads, "View audit log" links are gone or disabled, `/admin/audit` returns 404.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check — do not skip or force-merge.
- If security checks fail: Treat as a blocker. Review Codacy/Snyk findings; patch before proceeding.
- If required reviews are blocked/stale: Ping the reviewer after 24 hours. Escalate to project owner after 48 hours.
- Escalation path and timeout: If blocked for 72 hours with no response, create a follow-up issue and consider splitting the change.

## Open Questions

No open questions. All design decisions confirmed during exploration.

## GitHub Issues

- #338
- #330 (dependency — audit log writes)

## Why

- Problem statement: Admins can change user tiers via `/admin/users`, and every change is written to `adminAuditLog`, but there is no UI to view those records. The log is write-only from an admin's perspective.
- Why now: Issue #330 (tier management) is merged. The audit log collection is populated and the stub "View audit log" links in the users table are already pointing at `/admin/audit?userId=...` — this is the natural next step.
- Business/user impact: Admins have no accountability trail they can inspect. If a tier change was made incorrectly or disputed, there is no in-product way to verify what happened and when.

## Problem Space

- Current behavior: `adminAuditLog` collection accumulates entries on every `admin.setTier` mutation. No route or tRPC procedure exists to read from it. The "View audit log" links in `/admin/users` are disabled stubs.
- Desired behavior: `/admin/audit` shows a paginated, filterable table of all tier-change events. Clicking "View audit log" for a specific user pre-filters to that user's history.
- Constraints:
  - Admin-only: protected by existing `requireAdmin()` guard via the `/admin` layout.
  - Must fit the existing admin shell (`AdminLayout` with nav, `Outlet`).
  - tRPC is the only permitted data layer — no direct DB calls from route loaders.
  - TanStack Router search-param validation (`validateSearch`) must be used for filter state.
- Assumptions:
  - The `adminAuditLog` collection only contains `action: 'set-tier'` events for now; the UI can be scoped to that single action type.
  - Audit log volume is modest (hundreds to low-thousands of entries); offset pagination is sufficient.
  - No export or bulk-delete functionality is required.
- Edge cases considered:
  - Empty state (no logs yet, or no results for active filters).
  - `?userId=` param references a user who has no audit entries.
  - Filters applied in combination (user + date range).
  - Pagination with active filters (page must reset to 1 when filters change).

## Scope

### In Scope

- New tRPC procedure `admin.auditLog.list` — paginated, filterable query returning audit log entries with total count.
- New route `src/routes/admin/audit.tsx` at `/admin/audit`.
- "Audit Log" nav link added to `AdminLayout` in `src/routes/admin.tsx`.
- Filter controls: by target user (`?userId=`), by date range (`?from=`, `?to=`).
- Pagination controls (`?page=`, default page size 25).
- "View audit log" links in `/admin/users` upgraded from disabled stubs to real `<Link>` components.
- Unit tests for the tRPC procedure (filter logic, pagination, authorization).
- Playwright E2E test covering the golden path.

### Out of Scope

- Audit log writes (handled in #330).
- Non-tier admin actions (extend when more event types are added).
- Filter by acting admin (can be added later; issue does not require it in v1).
- CSV/JSON export.
- Bulk deletion or retention policies.
- Real-time updates.

## What Changes

- `src/server/trpc/routers/admin.ts` — add `auditLog` sub-router with `list` procedure.
- `src/routes/admin.tsx` — add "Audit Log" nav link.
- `src/routes/admin/audit.tsx` — new page component.
- `src/routes/admin/users.tsx` — replace disabled anchor stubs with real `<Link to="/admin/audit" search={{ userId: user.id }}>` elements.
- `src/server/trpc/routers/__tests__/admin.test.ts` — new test cases for `auditLog.list`.

## Risks

- Risk: Offset pagination becomes slow as the collection grows into the tens of thousands.
  - Impact: Low — admin-only tool, acceptable query time at this scale; MongoDB index on `createdAt` mitigates.
  - Mitigation: Add a compound index on `(targetUserId, createdAt)` to support the filtered path efficiently. Document cursor-based migration path for later.

- Risk: `?userId=` search param holds an arbitrary string that could be crafted to probe for user existence.
  - Impact: Low — the route is already admin-only; no additional exposure beyond what the users list provides.
  - Mitigation: No additional mitigation needed beyond `requireAdmin()`.

- Risk: Filter state stored in URL means page number persists when filters change, showing an empty page.
  - Impact: Minor UX issue.
  - Mitigation: Reset `page` to 1 whenever any filter value changes (handled in the route component).

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during the explore session:
- Offset pagination (not cursor-based) — confirmed.
- `admin.auditLog.list` sub-router (not nested under `admin.users`) — confirmed.
- Filter by target user via `?userId=` pre-fill from the users table; no filter-by-admin in v1 — confirmed.
- Page size 25 — reasonable default, no override needed.

## Non-Goals

- Auditing non-tier admin actions (future work).
- Exposing audit logs to non-admin users.
- Retention / deletion policies.
- Real-time or streaming updates.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

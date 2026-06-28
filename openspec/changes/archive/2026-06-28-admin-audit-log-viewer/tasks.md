# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/admin-audit-log-viewer` then immediately `git push -u origin feature/admin-audit-log-viewer`

## Execution

### Task 1 — Add compound indexes to `adminAuditLog` model (`src/db/models/admin-audit-log.ts`)

Add two indexes to `adminAuditLogSchema`:
- `{ targetUserId: 1, createdAt: -1 }` (compound, for filtered queries)
- `{ createdAt: -1 }` (single-field, for unfiltered sort)

No migration needed — Mongoose creates indexes on first use.

Verify: `npm run db:connect` succeeds (smoke test). Index existence can be confirmed via a quick Mongo shell query or integration test.

### Task 2 — Add `admin.auditLog.list` tRPC procedure (`src/server/trpc/routers/admin.ts`)

**Write test first:** `src/server/trpc/routers/__tests__/admin.test.ts`

Add a new `auditLogRouter` with a `list` procedure using `adminProcedure`. Input schema:

```typescript
z.object({
  userId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
})
```

Return type: `{ entries: AuditLogEntry[], total: number }` where each entry includes:
- `id` (string)
- `createdAt` (ISO string)
- `adminEmail`
- `targetEmail`
- `before.tier`
- `after.tier`

Query logic:
1. Build filter object from `userId`, `from`, `to` (add `targetUserId`, `createdAt: { $gte, $lte }` conditions when present).
2. Run `AdminAuditLog.countDocuments(filter)` for `total`.
3. Run `AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)` for entries.
4. Return mapped entries + total.

Add `auditLog: auditLogRouter` to `adminRouter`.

Test cases to cover (see `specs/audit-log-list/spec.md`):
- Returns all entries with correct pagination when no filters
- Filters by `userId` → only matching entries returned
- Filters by `from`/`to` → only entries in range returned
- Page 2 returns correct skip
- Out-of-range page returns empty entries, correct total
- Non-admin session → `FORBIDDEN` TRPCError

### Task 3 — Add "Audit Log" nav link to `AdminLayout` (`src/routes/admin.tsx`)

Add a `<Link to="/admin/audit" ...>` nav entry after the existing "Users" link, following the same `className` / `activeProps` pattern.

Verify: `npm run build` passes; nav link renders in admin shell.

### Task 4 — Create `/admin/audit` route (`src/routes/admin/audit.tsx`)

**Write test first:** `src/routes/admin/__tests__/audit.test.tsx` (RTL render tests)

Route file exports `Route` with:
- `validateSearch`: Zod schema accepting `{ userId?: string, from?: string, to?: string, page?: number }` with defaults.
- Component: `AdminAuditPage`

`AdminAuditPage` implementation:
1. Read search params via `Route.useSearch()`.
2. Call `trpc.admin.auditLog.list` with search params (use `useQuery` + `trpc.admin.auditLog.list.queryOptions(...)`).
3. Render a table with columns: Timestamp, Admin, Target User, Before, After.
4. Render empty state when `total === 0` or `entries.length === 0`.
5. Render pagination controls (Prev / Next buttons, current page indicator) — disable Prev on page 1, disable Next when `page * limit >= total`.
6. Filter controls: a text input for Target User (pre-filled from `userId` search param), date inputs for From/To. On change, navigate with `{ replace: true, search: (prev) => ({ ...prev, page: 1, <filter>: value }) }`.
7. Tier values displayed using `TIER_DISPLAY_NAMES` from `src/lib/tier-entitlements.ts`.
8. Timestamp formatted as `toLocaleString()` or equivalent readable format.

RTL test cases:
- Renders table headers
- Renders entry row with correct data
- Renders empty state message when entries is empty
- "View audit log" link in users table has correct href (can be tested here or in Task 5)

### Task 5 — Replace stub anchors in `/admin/users` (`src/routes/admin/users.tsx`)

Replace the `<a>` stub in each user row with:

```tsx
<Link
  to="/admin/audit"
  search={{ userId: user.id }}
  className="text-xs text-[var(--theme-accent)] hover:underline"
>
  View audit log
</Link>
```

Remove `aria-disabled`, `tabIndex={-1}`, `onClick={(e) => e.preventDefault()}`, `cursor-not-allowed`, and the `title="coming soon"` attribute.

Verify: existing unit tests for `AdminUsersPage` still pass; link href renders correctly.

### Task 6 — Playwright E2E test (`e2e/admin-audit-log.spec.ts`)

Write an E2E test covering:
1. Admin logs in, navigates to `/admin/users`, clicks "View audit log" for a user.
2. Assert browser is on `/admin/audit?userId=<id>`.
3. Assert audit table renders (or empty state if no entries).
4. Navigate to `/admin/audit` (no filter) via nav link — assert nav link is active.
5. (If seed data available) Assert a tier-change row shows human-readable tier names.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx vitest run src/server/trpc/routers/__tests__/admin.test.ts` — all new `auditLog.list` test cases pass
- [x] `npx vitest run src/routes/admin/__tests__/audit.test.tsx` — all RTL tests pass
- [x] `npm run test` — full unit suite passes (no regressions in existing admin tests)
- [x] `npx playwright test e2e/admin-audit-log.spec.ts` — E2E golden path passes
- [x] `npm run build` — build succeeds with no TypeScript errors
- [x] All completed tasks marked `[x]`

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` (covers tRPC procedure integration)
- **Regression / E2E tests** — `npm run test:e2e` — all E2E tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes to `feature/admin-audit-log-viewer` and push to remote
- [ ] Open PR from `feature/admin-audit-log-viewer` to `main`. PR body must include `Closes #338`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user:
  1. **Build and tests** — run all steps in Remote push validation; fix any failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run validation, push, wait 180s; repeat until all resolved
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL>`; fix failing required checks, commit, validate, push, wait 180s; restart loop from step 1

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): (project owner)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required beyond this change's artifacts
- [ ] Sync approved spec delta: copy `openspec/changes/admin-audit-log-viewer/specs/audit-log-list/spec.md` to `openspec/specs/admin-audit-log-list/spec.md`; update relative links: replace `../../design.md` → `../../changes/archive/YYYY-MM-DD-admin-audit-log-viewer/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-admin-audit-log-viewer/tasks.md`
- [ ] Archive the change: move `openspec/changes/admin-audit-log-viewer/` to `openspec/changes/archive/YYYY-MM-DD-admin-audit-log-viewer/` — stage both the copy and the deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-admin-audit-log-viewer/` exists and `openspec/changes/admin-audit-log-viewer/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-admin-audit-log-viewer` then `git push -u origin doc/archive-YYYY-MM-DD-admin-audit-log-viewer`
- [ ] Open PR from `doc/archive-...` to `main` with title `docs: archive admin-audit-log-viewer (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments or CI failures on the doc branch
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feature/admin-audit-log-viewer doc/archive-YYYY-MM-DD-admin-audit-log-viewer`

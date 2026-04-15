# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/admin-user-tier-management` then immediately `git push -u origin feat/admin-user-tier-management`

## Execution

### 1. Audit log model

- [x] Create `src/db/models/admin-audit-log.ts` — Mongoose model with schema: `adminId`, `adminEmail`, `targetUserId`, `targetEmail`, `action` (string literal `"set-tier"`), `before: { tier }`, `after: { tier }`, timestamps
- [x] Barrel-export from `src/db/models/index.ts`
- [x] Verify: `npx tsc --noEmit`

### 2. Admin tRPC router (write tests first)

- [x] Write unit tests in `src/server/trpc/routers/__tests__/admin.test.ts` covering:
  - `admin.users.list` — returns all users; rejects non-admin caller (FORBIDDEN); rejects unauthenticated (UNAUTHORIZED)
  - `admin.users.setTier` — updates tier and writes audit log; no-op on same tier (no DB write, no log); blocks self-change (FORBIDDEN); validates tier input with Zod (BAD_REQUEST on invalid)
  - Audit write failure — tier update succeeds, error is caught and not surfaced to caller
- [x] Create `src/server/trpc/routers/admin.ts` with:
  - `admin.users.list` — `adminProcedure` query: fetch all users from MongoDB "user" collection, transform via `transformUserDoc`
  - `admin.users.setTier` — `adminProcedure` mutation: validate input (userId: string, tier: `z.enum([...UserTier values])`); reject self-change; fetch current tier; no-op if same; update user; write audit log in try/catch
- [x] Add `admin` router to `src/server/trpc/root.ts`
- [x] Verify tests pass: `npx vitest run src/server/trpc/routers/__tests__/admin.test.ts`
- [x] Verify: `npx tsc --noEmit`

### 3. Admin layout route

- [x] Create `src/routes/admin.tsx` — layout route with `beforeLoad: [requireAuth(), requireAdmin()]`; renders `<Outlet />` inside an admin layout wrapper (simple heading "Admin" + nav to sub-routes)
- [x] Verify type check: `npx tsc --noEmit`

### 4. Admin users page (write tests first)

- [x] Write unit/component tests in `src/routes/admin/__tests__/users.test.tsx` covering:
  - Table renders with user rows including email, name, tier
  - Tier selector disabled for own user row
  - Tier selector change opens confirmation modal
  - Cancel in modal does not fire mutation
  - Confirm in modal fires `admin.users.setTier` mutation
  - Audit log link present per row with correct `userId` param
- [x] Create `src/routes/admin/users.tsx` — route component:
  - Uses `trpc.admin.users.list.useQuery()` to load users
  - Renders table: email, name (or "—"), tier badge, tier selector (disabled for own row), "View audit log" link (disabled, href to `/admin/audit?userId=<id>`, marked "coming soon")
  - Confirmation modal: shows "Change [user email] from [old tier] to [new tier]?" with Cancel / Confirm buttons
  - On confirm: calls `trpc.admin.users.setTier.useMutation()` then invalidates query
- [x] Verify tests pass: `npx vitest run src/routes/admin/__tests__/users.test.tsx`
- [x] Verify: `npx tsc --noEmit`

### 5. Admin nav link in Header (write tests first)

- [x] Write unit tests for `src/components/__tests__/Header.test.tsx` (or update existing) covering:
  - Admin link renders when `isAdmin: true` and `status: 'authenticated'`
  - Admin link absent when `isAdmin: false`
  - Admin link absent when `status: 'loading'`
  - Admin link absent when `status: 'unauthenticated'`
- [x] Modify `src/components/Header.tsx` — add conditional admin link gated on `useSession().data?.user.isAdmin && status === 'authenticated'`
- [x] Verify tests pass: `npx vitest run src/components/__tests__/Header.test.tsx`
- [x] Verify: `npx tsc --noEmit`

### 6. E2E tests

- [x] Write Playwright tests in `e2e/admin/` covering:
  - Non-admin session navigating to `/admin/users` → redirected to `/account`
  - Unauthenticated navigating to `/admin/users` → redirected to `/auth/login`
  - Admin session can load `/admin/users` and see user table
  - Admin can complete tier change flow: select tier → confirm modal → tier updated in table
  - Admin tier selector disabled for own row

### 7. Final validation

- [x] `npm run test` — all unit/integration tests pass
- [x] `npm run test:e2e` — all E2E tests pass
- [x] `npm run build` — build succeeds
- [x] `npx tsc --noEmit` — no type errors

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All acceptance criteria from specs covered:
  - [x] `specs/admin-access-guard.md` — dual-layer guard scenarios pass
  - [x] `specs/admin-user-list.md` — user list renders, placeholder link present
  - [x] `specs/admin-set-tier.md` — tier change with modal, self-block, no-op
  - [x] `specs/audit-log-write.md` — audit written on change, not on no-op, failure tolerant
  - [x] `specs/admin-nav-link.md` — link conditional on isAdmin + authenticated status

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/admin-user-tier-management` and push to remote
- [ ] Open PR from `feat/admin-user-tier-management` to `main`; title: `feat: admin UI for user tier management (#330)`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers (Codacy, CodeRabbit)
- Required approvals: 1 (auto-merge when CI passes and reviews clear)

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all tasks complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (update or create spec files for admin access guard, user tier management)
- [ ] Archive: move `openspec/changes/admin-user-tier-management/` to `openspec/changes/archive/YYYY-MM-DD-admin-user-tier-management/` — stage both new location and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-admin-user-tier-management/` exists and `openspec/changes/admin-user-tier-management/` is gone
- [ ] Commit and push archive to `main` in one commit
- [ ] Prune: `git fetch --prune` and `git branch -d feat/admin-user-tier-management`
- [ ] Close #330 as completed (auto-closed via PR if linked in PR description)

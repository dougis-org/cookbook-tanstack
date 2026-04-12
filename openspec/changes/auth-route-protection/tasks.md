# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/auth-route-protection` then immediately `git push -u origin feat/auth-route-protection`

## Execution

### Task 1 — Setup: branch from main (see Preparation above)

### Task 2 — Create `src/types/router.ts` with `RouterContext` interface

Create a new file `src/types/router.ts`:
- Import the Better-Auth `auth` instance type for session inference
- Export `RouterContext` interface with `session: AuthSession | null` where `AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>`
- This file is server-safe (type-only imports)

Verify: TypeScript compilation passes after creation.

### Task 3 — Create `src/lib/get-session.ts` using `createServerFn`

Create a new file `src/lib/get-session.ts`:
- Import `createServerFn` from `@tanstack/react-start`
- Import `getRequestHeaders` from `@tanstack/react-start/server`
- Import `auth` from `@/lib/auth`
- Export `getSession` as a `createServerFn().handler(async () => auth.api.getSession({ headers: getRequestHeaders() }))`
- This runs inline on the server (SSR) and as an RPC call on the client

Verify: File imports without error; TypeScript passes.

### Task 4 — Create `src/lib/auth-guard.ts`

Create a new file `src/lib/auth-guard.ts`:
- Define `RedirectReason` type: `'auth-required' | 'tier-limit-reached'`
- Export `REDIRECT_REASON_MESSAGES`: `Record<RedirectReason, string>` with human-readable messages for each reason
- Export `requireAuth()` factory function that returns a `beforeLoad`-compatible function:
  - Reads `context.session` (typed as `RouterContext`)
  - If null, throws `redirect({ to: '/auth/login', search: { reason: 'auth-required', from: location.href } })`
  - If non-null, returns void (allows navigation)
- Add commented stub for future `requireTier(tier: UserTier)` with JSDoc noting its eventual behavior (redirect to `/account` with `reason: 'tier-limit-reached'`)

Verify: TypeScript compilation passes; `requireAuth()` can be invoked with a mock context.

### Task 5 — Update `src/router.tsx` with typed `RouterContext`

Modify `src/router.tsx`:
- Import `RouterContext` from `@/types/router`
- Add type parameter to `createRouter<typeof routeTree, RouterContext>(...)`
- Update `context: {}` to `context: { session: null }` as the initial/default context

Verify: TypeScript compilation passes.

### Task 6 — Update `src/routes/__root.tsx` to use `createRootRouteWithContext` + `beforeLoad`

Modify `src/routes/__root.tsx`:
- Replace `createRootRoute` import with `createRootRouteWithContext`
- Import `getSession` from `@/lib/get-session`
- Import `RouterContext` from `@/types/router`
- Change `createRootRoute({...})` to `createRootRouteWithContext<RouterContext>()({...})`
- Add `beforeLoad: async () => { const session = await getSession(); return { session } }`
- Retain all existing `shellComponent`, `head`, etc. config unchanged

Verify: Dev server starts; navigating to `/` loads without error; TypeScript passes.

### Task 7 — Write tests for `requireAuth()` (TDD — before migrating routes)

Add unit tests in `src/lib/__tests__/auth-guard.test.ts`:
- Test: `requireAuth()` with `context.session = null` throws a redirect to `/auth/login`
- Test: thrown redirect search includes `reason: 'auth-required'`
- Test: thrown redirect search includes the `from` location href
- Test: `requireAuth()` with a non-null session returns void (no throw)
- Test: `REDIRECT_REASON_MESSAGES` has an entry for each `RedirectReason` value

Run: `npx vitest run src/lib/__tests__/auth-guard.test.ts`

### Task 8 — Write tests for `LoginForm` redirect and banner behavior (TDD)

Add/update unit tests in `src/components/auth/__tests__/LoginForm.test.tsx`:
- Test: when `reason=auth-required` search param present, banner text matching `REDIRECT_REASON_MESSAGES['auth-required']` is rendered
- Test: when no `reason` param, no banner is rendered
- Test: on successful login with valid relative `from=/recipes/new`, `navigate` is called with `/recipes/new`
- Test: on successful login with no `from`, `navigate` is called with `/`
- Test: on successful login with `from=http://evil.com`, `navigate` is called with `/` (open-redirect rejected)
- Test: on successful login with `from=//evil.com`, `navigate` is called with `/`

Run: `npx vitest run src/components/auth/__tests__/LoginForm.test.tsx`

### Task 9 — Write tests for `Header` nav visibility (TDD)

Add/update unit tests in `src/components/__tests__/Header.test.tsx`:
- Test: when `useAuth()` returns `session = null`, "New Recipe" link is not in the DOM
- Test: when `useAuth()` returns `session = null`, "Import Recipe" link is not in the DOM
- Test: when `useAuth()` returns a non-null session, both links are in the DOM

Run: `npx vitest run src/components/__tests__/Header.test.tsx`

### Task 10 — Migrate route files: remove `server.middleware`, add `beforeLoad`

Modify the following files, in each:
- Remove the `server: { middleware: [authMiddleware] }` block
- Remove the `import { authMiddleware }` import
- Add `import { requireAuth } from '@/lib/auth-guard'`
- Add `beforeLoad: requireAuth()` to the route config

Files to modify:
- `src/routes/recipes/new.tsx`
- `src/routes/recipes/$recipeId_.edit.tsx`

Also add fresh `beforeLoad: requireAuth()` (no existing middleware to remove) to:
- `src/routes/import/index.tsx`

Verify: TypeScript compilation passes on all three files.

### Task 11 — Delete `src/lib/middleware.ts`

Delete the file `src/lib/middleware.ts`.

Verify: `grep -r "authMiddleware" src/` returns no results; `npm run build` passes.

### Task 12 — Update `src/routes/auth/login.tsx` — add `validateSearch`

Modify `src/routes/auth/login.tsx`:
- Import `RedirectReason` from `@/lib/auth-guard`
- Add `validateSearch` to the route config that parses `reason` (as `RedirectReason | undefined`) and `from` (as `string | undefined`) from the raw search object

Verify: TypeScript compilation passes; no runtime error when navigating to `/auth/login` with no params.

### Task 13 — Update `src/components/auth/LoginForm.tsx` — banner + `from` redirect

Modify `src/components/auth/LoginForm.tsx`:
- Import `REDIRECT_REASON_MESSAGES` from `@/lib/auth-guard`
- Import `Route` from the login route (or use `useSearch` from `@tanstack/react-router`)
- Read `reason` and `from` from search params via `Route.useSearch()`
- Add a redirect banner: if `reason` is a known `RedirectReason`, display `REDIRECT_REASON_MESSAGES[reason]` above the form
- Update `onSuccess` callback: validate `from` (must start with `/` and not start with `//`); if valid, navigate to `from`; otherwise navigate to `/`

Verify: Tests from Task 8 pass; manual test confirms banner and redirect work.

### Task 14 — Update `src/components/Header.tsx` — conditional nav items

Modify `src/components/Header.tsx`:
- The `session` value is already available via `useAuth()` (already imported)
- Wrap the "New Recipe" `<Link>` in `{session && (...)}`
- Wrap the "Import Recipe" `<Link>` in `{session && (...)}`

Verify: Tests from Task 9 pass; manual test with logged-out state confirms links are gone.

### Task 15 — Review for duplication and unnecessary complexity

- Review all modified files for accidental duplication or over-engineering
- Confirm `requireAuth` is the only place that constructs the redirect
- Confirm no remaining references to `server.middleware` or `authMiddleware`

## Validation

- [x] Run unit/integration tests: `npm run test` — all pass
- [x] Run E2E tests: `npm run test:e2e` — all pass
- [x] Run type checks: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeds
- [x] `grep -r "authMiddleware" src/` — returns no results
- [x] `ls src/lib/middleware.ts` — file not found
- [ ] Manual smoke: navigate to `/recipes/new` while logged out → redirect to login with banner
- [ ] Manual smoke: navigate to `/import` while logged out → redirect to login with banner
- [ ] Manual smoke: log in via redirect → lands on originally-requested page
- [ ] Manual smoke: hamburger menu while logged out → no New/Import Recipe links
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — covered by `npm run test`
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, **MUST** iterate and address the failure before pushing

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/auth-route-protection` to `main`; reference `dougis-org/cookbook-tanstack#299` in the PR description
- [ ] Wait for 120 seconds for agentic reviewers to post their comments
- [ ] **Monitor PR comments** — when comments appear, address them, commit fixes, follow all steps in Remote push validation, then push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — when any CI check fails, diagnose and fix, commit fixes, follow all steps in Remote push validation, then push; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Claude Code / Doug Hubbard
- Reviewer(s): Doug Hubbard
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `docs/` if any architectural documentation covers route protection patterns
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/auth-route-protection/` to `openspec/changes/archive/YYYY-MM-DD-auth-route-protection/` in a single atomic commit (stage both the copy and the deletion together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-auth-route-protection/` exists and `openspec/changes/auth-route-protection/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/auth-route-protection`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/auth-route-protection`

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/email-verification-hard-gate` then immediately `git push -u origin feat/email-verification-hard-gate`

## Execution

### 1. Add `requireVerifiedAuth()` to `src/lib/auth-guard.ts`

- [x] Write failing tests in `src/lib/__tests__/auth-guard.test.ts` covering:
  - FR-1: unauthenticated user → redirects to `/auth/login` with `reason` and `from`
  - FR-2: `emailVerified: false` → redirects to `/auth/verify-email` with `from`
  - FR-3: `emailVerified: true` → no redirect
  - NFR-2: `emailVerified: undefined` → no redirect
- [x] Export `requireVerifiedAuth()` from `src/lib/auth-guard.ts`:
  - Check auth first (delegate to same logic as `requireAuth()`)
  - If `context.session.user.emailVerified === false`, throw `redirect({ to: '/auth/verify-email', search: { from: location.href } })`
  - Otherwise return (pass through)
- [x] Run `npx vitest run src/lib/__tests__/auth-guard.test.ts` — all tests green

### 2. Extend `/auth/verify-email` route to accept `from` search param

- [x] Write failing tests in `src/routes/auth/__tests__/-verify-email.test.tsx` covering:
  - NFR-1: `from` with `://` is stripped (returns `undefined`)
  - NFR-1: `from` with `//` prefix is stripped (returns `undefined`)
  - Valid relative `from` is preserved
  - Missing `from` returns `undefined`
- [x] Update `validateSearch` in `src/routes/auth/verify-email.tsx`:
  - Accept `from?: string`
  - Strip `from` if it contains `://` or starts with `//`
- [x] Pass `from` prop through to `VerifyEmailPage` from `VerifyEmailRoute`
- [x] Run `npx vitest run src/routes/auth/__tests__/-verify-email.test.tsx` — all tests green

### 3. Update `VerifyEmailPage` to navigate to `from` after verification

- [x] Write failing tests in `src/components/auth/__tests__/VerifyEmailPage.test.tsx` (or update existing) covering:
  - FR-4: verified state renders "Continue" link pointing to `from` when provided
  - FR-5: verified state renders "Continue" link pointing to `/` when `from` is absent
- [x] Update `VerifyEmailPage` in `src/components/auth/VerifyEmailPage.tsx`:
  - Add `from?: string` to `VerifyEmailPageProps`
  - Change the `<Link to="/">Continue to app</Link>` in the verified state to `<Link to={from ?? "/"}>Continue</Link>`
- [x] Run `npx vitest run src/components/auth/__tests__/VerifyEmailPage.test.tsx` — all tests green (or relevant test file name)

### 4. Update five route files to use `requireVerifiedAuth()`

- [x] `src/routes/recipes/new.tsx` — replace `requireAuth()` with `requireVerifiedAuth()` import and usage
- [x] `src/routes/recipes/$recipeId_.edit.tsx` — replace `requireAuth()` with `requireVerifiedAuth()`
- [x] `src/routes/import/index.tsx` — replace `requireAuth()` with `requireVerifiedAuth()`
- [x] `src/routes/cookbooks/index.tsx` — add `import { requireVerifiedAuth } from '@/lib/auth-guard'` and `beforeLoad: requireVerifiedAuth()` (then removed because route is public-content)
- [x] `src/routes/change-tier.tsx` — add `import { requireVerifiedAuth } from '@/lib/auth-guard'` and `beforeLoad: requireVerifiedAuth()`
- [x] Update existing route tests (if any) to set `emailVerified: true` on mock sessions so existing happy-path tests continue passing

### 5. Update test helpers

- [x] Check `src/test-helpers/auth.ts` and any shared session mocks — ensure default mock sessions include `emailVerified: true` so existing tests are unaffected

### 6. Full validation

- [x] `npm run test` — all unit/integration tests pass
- [x] `npm run build` — build succeeds
- [x] Type check: confirm no TypeScript errors

## Validation

- [x] `npm run test` — all tests pass
- [x] `npm run build` — no build errors
- [x] `npx tsc --noEmit` — no type errors
- [x] Guard behavior manually verified on dev server: unverified session redirects to `/auth/verify-email?from=<path>`, verified session passes through
- [x] "Continue" on verify-email page navigates to `from` or `/` correctly
- [x] `/pricing` is still accessible without login

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass ✓
- **Build** — `npm run build` — must succeed with no errors ✓
- **Type check** — TypeScript must report no errors ✓

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/email-verification-hard-gate` and push to remote
- [x] Open PR from `feat/email-verification-hard-gate` to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — address each, commit fixes, run all remote push validation steps, push; wait 180 seconds, repeat until no unresolved comments remain
- [x] **Monitor CI checks** — diagnose any failure, fix, commit, run all remote push validation steps, push; wait 180 seconds, repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` notify user — never force-merge

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): Doug Hubbard
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (changes are purely code)
- [x] Sync approved spec deltas into `openspec/specs/` (appended to `auth-route-guards` and `email-verification-ui`)
- [x] Archive the change: move `openspec/changes/email-verification-hard-gate/` to `openspec/changes/archive/2026-05-06-email-verification-hard-gate/` — staged both the new location and the deletion of the old location in a **single commit**
- [x] Confirm `openspec/changes/archive/2026-05-06-email-verification-hard-gate/` exists and `openspec/changes/email-verification-hard-gate/` is gone
- [x] Commit and push the archive commit to `main`
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/email-verification-hard-gate`

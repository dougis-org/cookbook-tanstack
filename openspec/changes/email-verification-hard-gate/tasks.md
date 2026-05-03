# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/email-verification-hard-gate` then immediately `git push -u origin feat/email-verification-hard-gate`

## Execution

### 1. Add `requireVerifiedAuth()` to `src/lib/auth-guard.ts`

- [ ] Write failing tests in `src/lib/__tests__/auth-guard.test.ts` covering:
  - FR-1: unauthenticated user → redirects to `/auth/login` with `reason` and `from`
  - FR-2: `emailVerified: false` → redirects to `/auth/verify-email` with `from`
  - FR-3: `emailVerified: true` → no redirect
  - NFR-2: `emailVerified: undefined` → no redirect
- [ ] Export `requireVerifiedAuth()` from `src/lib/auth-guard.ts`:
  - Check auth first (delegate to same logic as `requireAuth()`)
  - If `context.session.user.emailVerified === false`, throw `redirect({ to: '/auth/verify-email', search: { from: location.href } })`
  - Otherwise return (pass through)
- [ ] Run `npx vitest run src/lib/__tests__/auth-guard.test.ts` — all tests green

### 2. Extend `/auth/verify-email` route to accept `from` search param

- [ ] Write failing tests in `src/routes/auth/__tests__/-verify-email.test.tsx` covering:
  - NFR-1: `from` with `://` is stripped (returns `undefined`)
  - NFR-1: `from` with `//` prefix is stripped (returns `undefined`)
  - Valid relative `from` is preserved
  - Missing `from` returns `undefined`
- [ ] Update `validateSearch` in `src/routes/auth/verify-email.tsx`:
  - Accept `from?: string`
  - Strip `from` if it contains `://` or starts with `//`
- [ ] Pass `from` prop through to `VerifyEmailPage` from `VerifyEmailRoute`
- [ ] Run `npx vitest run src/routes/auth/__tests__/-verify-email.test.tsx` — all tests green

### 3. Update `VerifyEmailPage` to navigate to `from` after verification

- [ ] Write failing tests in `src/components/auth/__tests__/VerifyEmailPage.test.tsx` (or update existing) covering:
  - FR-4: verified state renders "Continue" link pointing to `from` when provided
  - FR-5: verified state renders "Continue" link pointing to `/` when `from` is absent
- [ ] Update `VerifyEmailPage` in `src/components/auth/VerifyEmailPage.tsx`:
  - Add `from?: string` to `VerifyEmailPageProps`
  - Change the `<Link to="/">Continue to app</Link>` in the verified state to `<Link to={from ?? "/"}>Continue</Link>`
- [ ] Run `npx vitest run src/components/auth/__tests__/VerifyEmailPage.test.tsx` — all tests green (or relevant test file name)

### 4. Update five route files to use `requireVerifiedAuth()`

- [ ] `src/routes/recipes/new.tsx` — replace `requireAuth()` with `requireVerifiedAuth()` import and usage
- [ ] `src/routes/recipes/$recipeId_.edit.tsx` — replace `requireAuth()` with `requireVerifiedAuth()`
- [ ] `src/routes/import/index.tsx` — replace `requireAuth()` with `requireVerifiedAuth()`
- [ ] `src/routes/cookbooks/index.tsx` — add `import { requireVerifiedAuth } from '@/lib/auth-guard'` and `beforeLoad: requireVerifiedAuth()`
- [ ] `src/routes/change-tier.tsx` — add `import { requireVerifiedAuth } from '@/lib/auth-guard'` and `beforeLoad: requireVerifiedAuth()`
- [ ] Update existing route tests (if any) to set `emailVerified: true` on mock sessions so existing happy-path tests continue passing

### 5. Update test helpers

- [ ] Check `src/test-helpers/auth.ts` and any shared session mocks — ensure default mock sessions include `emailVerified: true` so existing tests are unaffected

### 6. Full validation

- [ ] `npm run test` — all unit/integration tests pass
- [ ] `npm run build` — build succeeds
- [ ] Type check: confirm no TypeScript errors

## Validation

- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — no build errors
- [ ] `npx tsc --noEmit` — no type errors
- [ ] Guard behavior manually verified on dev server: unverified session redirects to `/auth/verify-email?from=<path>`, verified session passes through
- [ ] "Continue" on verify-email page navigates to `from` or `/` correctly
- [ ] `/pricing` is still accessible without login

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — TypeScript must report no errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/email-verification-hard-gate` and push to remote
- [ ] Open PR from `feat/email-verification-hard-gate` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — address each, commit fixes, run all remote push validation steps, push; wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — diagnose any failure, fix, commit, run all remote push validation steps, push; wait 180 seconds, repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` notify user — never force-merge

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): Doug Hubbard
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (changes are purely code)
- [ ] Sync approved spec deltas into `openspec/specs/` (no global specs exist for these capabilities yet — create as needed)
- [ ] Archive the change: move `openspec/changes/email-verification-hard-gate/` to `openspec/changes/archive/YYYY-MM-DD-email-verification-hard-gate/` — stage both the new location and the deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-email-verification-hard-gate/` exists and `openspec/changes/email-verification-hard-gate/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d feat/email-verification-hard-gate`

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/verify-password-reset-flow` then immediately `git push -u origin feat/verify-password-reset-flow`

## Execution

### 1. Add forgot-password form coverage

- [x] Write failing tests first for `src/components/auth/ForgotPasswordForm.tsx` covering:
  - valid submission sends `requestPasswordReset` with `{ email, redirectTo: "/auth/reset-password" }`
  - successful submission shows the neutral confirmation state
  - client error displays a readable error message
  - invalid email blocks submission
- [x] Extend `src/test-helpers/auth.ts` mocks if needed to support `requestPasswordReset`
- [x] Implement only the smallest auth UI changes needed to make the new tests pass
- [x] Verify: `npx vitest run src/components/auth/__tests__/ForgotPasswordForm.test.tsx`

### 2. Add reset-password form coverage

- [x] Write failing tests first for `src/components/auth/ResetPasswordForm.tsx` covering:
  - valid submission sends `resetPassword` with `{ newPassword, token }`
  - mismatched passwords show an error and do not submit
  - Better Auth error displays a readable error message
  - successful submission navigates to `/auth/login`
- [x] Add any route/navigation mocks required by the existing test setup
- [x] Implement only the smallest auth UI changes needed to make the new tests pass
- [x] Verify: `npx vitest run src/components/auth/__tests__/ResetPasswordForm.test.tsx`

### 3. Add reset route token-handling coverage

- [x] Write failing tests first for `src/routes/auth/reset-password.tsx` covering:
  - missing token renders the invalid-token state
  - present token renders `ResetPasswordForm`
- [x] Implement only the smallest route changes needed to make the new tests pass
- [x] Verify: `npx vitest run src/routes/auth/__tests__/-reset-password.test.tsx`

### 4. Capture manual Mailtrap verification steps

- [x] Add or update concise validation notes for password reset manual smoke coverage in the change artifacts or implementation PR notes:
  - request a password reset from `/auth/forgot-password`
  - confirm the email appears in Mailtrap
  - open the reset link and confirm `/auth/reset-password?token=...`
  - set a new password and confirm login with the new credential
- [x] Verify the checklist reflects the actual current UI and environment variables

### 5. Review issue linkage before PR

- [x] Confirm the implementation PR body includes `Closes #341`
- [x] Summarize in the PR description that existing password reset code was verified rather than rebuilt

## Validation

- [x] `npx vitest run src/components/auth/__tests__/ForgotPasswordForm.test.tsx src/components/auth/__tests__/ResetPasswordForm.test.tsx src/routes/auth/__tests__/-reset-password.test.tsx`
- [x] `npx vitest run src/lib/__tests__/auth.test.ts src/lib/__tests__/mail.test.ts`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [ ] Manual Mailtrap smoke validation completed in an environment with valid credentials
- [x] Run project security/code quality checks required by repo standards if implementation changes go beyond tests
- [ ] All execution sub-tasks above checked off
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx vitest run src/components/auth/__tests__/ForgotPasswordForm.test.tsx src/components/auth/__tests__/ResetPasswordForm.test.tsx src/routes/auth/__tests__/-reset-password.test.tsx src/lib/__tests__/auth.test.ts src/lib/__tests__/mail.test.ts`
- **Integration tests** — run any existing auth integration coverage affected by the change; if none are touched, document that no additional integration suite was needed
- **Regression / E2E tests** — run a focused auth regression slice if the implementation changes user-visible behavior beyond tests; otherwise document why component and route coverage is sufficient
- **Build** — `npm run build`
- **Type check** — `npx tsc --noEmit`
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`
- [ ] Ensure the PR body includes `Closes #341`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Codex agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure -> diagnose -> fix -> validate locally -> push -> re-check
- Security finding -> remediate -> validate locally -> push -> re-scan
- Review comment -> address -> validate locally -> push -> confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No repository documentation updates expected unless the implementation adds a new auth testing note
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/verify-password-reset-flow/` to `openspec/changes/archive/YYYY-MM-DD-verify-password-reset-flow/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-verify-password-reset-flow/` exists and `openspec/changes/verify-password-reset-flow/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/verify-password-reset-flow`

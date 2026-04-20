# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/email-verification-ui` then
  immediately `git push -u origin feat/email-verification-ui`

## Execution

- [x] **Task 1: Verify `authClient.sendVerificationEmail` availability**
  - [x] Check `src/lib/auth-client.ts` — confirm `authClient.sendVerificationEmail` exists at runtime
  - [x] If missing, add `emailVerificationClient()` from `better-auth/client/plugins` to `createAuthClient` plugins
  - [x] Run `npm run build` to confirm no type errors before proceeding

- [x] **Task 2: Write tests for `RegisterForm` check-email state (TDD)**
  - [x] Add tests to `src/components/auth/__tests__/RegisterForm.test.tsx` (create file if absent)
  - [x] Test: form replaced by "check your email" message on mock `onSuccess`
  - [x] Test: message contains the submitted email address
  - [x] Test: `navigate` is NOT called on success
  - [x] Test: form still visible + error shown on mock `onError`
  - [x] Run `npx vitest run src/components/auth/__tests__/RegisterForm.test.tsx` — expect RED

- [x] **Task 3: Implement `RegisterForm` check-email state**
  - [x] Add `isSubmitted` state to `src/components/auth/RegisterForm.tsx`
  - [x] On `onSuccess`: set `isSubmitted = true` (remove `navigate({ to: "/" })`)
  - [x] Render "check your email" message with user's email and link to `/auth/login` when `isSubmitted`
  - [x] Run tests — expect GREEN

- [x] **Task 4: Write tests for `VerificationBanner` (TDD)**
  - [x] Create `src/components/auth/__tests__/VerificationBanner.test.tsx`
  - [x] Test: renders for authenticated user with `emailVerified: false`
  - [x] Test: not rendered when `emailVerified: true`
  - [x] Test: not rendered when session is null
  - [x] Test: not rendered on `/auth/*` routes (mock `useRouterState`)
  - [x] Test: resend button triggers `authClient.sendVerificationEmail` with session email
  - [x] Test: loading state during resend
  - [x] Test: "Email sent!" success state after resend
  - [x] Test: error message on resend failure
  - [x] Test: missing `emailVerified` field does not throw (optional chain)
  - [x] Run tests — expect RED

- [x] **Task 5: Implement `VerificationBanner` component**
  - [x] Create `src/components/auth/VerificationBanner.tsx`
  - [x] Use `useAuth()` for session; guard: `!isLoggedIn` or `emailVerified` → return null
  - [x] Use `useRouterState` to suppress on `/auth/*` routes
  - [x] Resend calls `authClient.sendVerificationEmail({ email: session.user.email, callbackURL: "/auth/verify-email" })`
  - [x] Local state: `resendStatus: 'idle' | 'loading' | 'success' | 'error'` + `resendError: string`
  - [x] Run tests — expect GREEN

- [x] **Task 6: Wire banner into `__root.tsx`**
  - [x] Import `VerificationBanner` in `src/routes/__root.tsx`
  - [x] Render `<VerificationBanner />` between `<Header />` and `{children}` in `RootDocument`
  - [x] Visual check: start dev server, register new account, confirm banner appears

- [x] **Task 7: Write tests for `/auth/verify-email` landing page (TDD)**
  - [x] Create `src/routes/auth/__tests__/-verify-email.test.tsx`
  - [x] Test: success state when `emailVerified: true` in session (no error param)
  - [x] Test: error state when `?error` param present (any non-empty value)
  - [x] Test: default "verify your email" + resend state when unverified + no error param
  - [x] Test: resend from error state calls `sendVerificationEmail`
  - [x] Run tests — expect RED

- [x] **Task 8: Implement `/auth/verify-email` route and page**
  - [x] Create `src/routes/auth/verify-email.tsx` with `validateSearch` for `{ error?: string }`
  - [x] Create `src/components/auth/VerifyEmailPage.tsx` — success / error / default states
  - [x] Success: "Email verified! You can now access all features." + link to `/`
  - [x] Error: "Verification link is invalid or expired." + resend button (same resend logic as banner)
  - [x] Default: "Please verify your email." + resend button
  - [x] Inspect actual BetterAuth redirect params with a test token; adjust error param key if needed
  - [x] Run tests — expect GREEN

## Validation

- [x] `npm run test` — all tests pass
- [x] `npm run test:e2e` — E2E suite passes
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] `node scripts/lint-route-outlet.cjs` — no outlet violations
- [x] Manual smoke test: register → check email state shown; verify link → success page; banner appears; resend works

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --squash`
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit, validate, push; wait
  180 seconds; repeat
- [ ] **Monitor CI checks** — poll for check status autonomously; fix failures, commit, validate, push; wait
  180 seconds; repeat
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED`
  proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): dougis
- Required approvals: 0 (auto-merge via CI gates + thread resolution)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (CONTRIBUTING.md if needed)
- [ ] Sync approved spec deltas into `openspec/specs/email-verification-ui/`
- [ ] Archive the change: move `openspec/changes/email-verification-ui/` to
  `openspec/changes/archive/2026-04-18-email-verification-ui/` **and stage both the new location and
  the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-18-email-verification-ui/` exists and
  `openspec/changes/email-verification-ui/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/email-verification-ui`

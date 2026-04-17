# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/mailtrap-email-foundation` then immediately `git push -u origin feat/mailtrap-email-foundation`

## Execution

- [x] **Task 1: Add dependencies**
  - [x] Run `npm install nodemailer`
  - [x] Run `npm install --save-dev @types/nodemailer`
- [x] **Task 2: Configure Environment**
  - [x] Update `.env.example` with `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, and `MAIL_FROM`.
  - [x] Add the same keys to local `.env` (manual step).
- [x] **Task 3: Implement Email Utility**
  - [x] Create `src/lib/mail.ts` with a `nodemailer` transporter and a `sendEmail` helper.
  - [x] Ensure the transporter is a singleton or reused to benefit from connection pooling.
- [x] **Task 4: Integrate with BetterAuth**
  - [x] Update `src/lib/auth.ts` to include `emailAndPassword.sendResetPassword` and `emailVerification.sendVerificationEmail` hooks.
  - [x] Ensure hooks call `sendEmail` without `await` (fire-and-forget).
- [x] **Task 5: Documentation**
  - [x] Ensure `README.md` or relevant docs are updated if necessary.

## Validation

- [x] **Unit Tests**
  - [x] Create `src/lib/__tests__/mail.test.ts`.
  - [x] Mock `nodemailer` and verify `sendEmail` calls it with correct parameters.
  - [x] Verify `BetterAuth` configuration in `src/lib/__tests__/auth.test.ts` (ensure hooks are defined).
- [ ] **Integration Test (Manual)**
  - [ ] Trigger a password reset via the UI (if available) or a script and verify arrival in Mailtrap.
- [x] **Project Standards**
  - [x] Run `node scripts/lint-route-outlet.cjs`.
  - [x] Run `npm run build` to ensure no type errors.
  - [x] Run `vitest` to verify all tests pass.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass.
- **Build** — `npm run build`; build must succeed with no errors.
- if **ANY** of the above fail, you **MUST** iterate and address the failure.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously
- [x] **Monitor CI checks** — poll for check status autonomously
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`

Ownership metadata:

- Implementer: Gemini CLI
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/mailtrap-email-foundation/foundation.md`
- [x] Archive the change: move `openspec/changes/mailtrap-email-foundation/` to `openspec/changes/archive/2026-04-16-mailtrap-email-foundation/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-04-16-mailtrap-email-foundation/` exists and `openspec/changes/mailtrap-email-foundation/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/mailtrap-email-foundation`

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/react-email-templates` then immediately `git push -u origin feat/react-email-templates`

## Execution

- [x] **Task 1 — Install dependencies:** Add `react-email`, `@react-email/components`, and `@react-email/render` to `package.json` dependencies and run `npm install`.
- [x] **Task 2 — Add preview script:** Add `"email:dev": "email dev --dir src/emails"` to the `scripts` section in `package.json`.
- [x] **Task 3 — Create base layout component:** Implement `src/emails/Layout.tsx` to provide a dark-slate-themed layout with cyan highlights, proper spacing, clean typography, a logo area, and a footer.
- [x] **Task 4 — Implement verification template:** Create `src/emails/VerificationEmail.tsx` utilizing the base `Layout`, displaying a welcome message, and rendering a call-to-action button linking to the verification url.
- [x] **Task 5 — Implement password reset template:** Create `src/emails/PasswordResetEmail.tsx` displaying the security notice, warning about link expiration, and rendering a call-to-action button linking to the reset url.
- [x] **Task 6 — Implement tier notification template:** Create `src/emails/TierNotificationEmail.tsx` showing the user's tier upgrade or downgrade, outlining the limits of their new tier (e.g. 2500 recipes, 200 cookbooks for Executive Chef), and including pricing details if applicable.
- [x] **Task 7 — Update mail rendering engine:** Modify `src/lib/mail.ts`'s `sendEmail` function to compile the optional `react` option into HTML and plain-text using `@react-email/render` before sending.
- [x] **Task 8 — Update Auth callbacks:** Modify `src/lib/auth.ts` callbacks (`sendResetPassword` and `sendVerificationEmail`) to pass the new React Email components instead of the inline HTML strings.
- [x] **Task 9 — Trigger Tier Notification on Set Tier:** Update the `setTier` mutation in `src/server/trpc/routers/admin.ts` to send a `TierNotificationEmail` asynchronously when a user's tier is modified.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run verification server check: Verify that `npm run email:dev` starts up and renders templates correctly
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #345".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): User
- Required approvals: 1 approval or passing PR status check gates

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/react-email-templates/` to `openspec/changes/archive/2026-06-04-react-email-templates/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-04-react-email-templates/` exists and `openspec/changes/react-email-templates/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-04-react-email-templates` then `git push -u origin doc/archive-2026-06-04-react-email-templates`
- [ ] Open a PR from `doc/archive-2026-06-04-react-email-templates` to `main` with title `docs: archive react-email-templates (2026-06-04)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/react-email-templates doc/archive-2026-06-04-react-email-templates`

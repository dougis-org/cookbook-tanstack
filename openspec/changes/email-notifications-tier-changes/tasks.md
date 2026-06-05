# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/email-notifications-tier-changes` then immediately `git push -u origin feat/email-notifications-tier-changes`

## Execution

- [x] **Step 3 — Refactor layout footer:** Update `src/emails/Layout.tsx` footer text to note transactional nature of emails and add a link to `/account` settings page.
- [x] **Step 4 — Implement dynamic template logic:** Modify `src/emails/TierNotificationEmail.tsx` to accept `changeType` prop (`'upgrade' | 'downgrade' | 'admin-change' | 'trial-expiring'`) and reconciliation counts (`recipesHidden`, `cookbooksHidden`, `madePublic`).
- [x] **Step 5 — Render dynamic email content:** Under `src/emails/TierNotificationEmail.tsx`, conditionally render headers, descriptions, and reconciliation statistics based on the `changeType`.
- [x] **Step 6 — Update tRPC setTier router:** Modify `src/server/trpc/routers/admin.ts` to pass the reconciliation results and `changeType: 'admin-change'` into the `sendEmail` invocation.
- [x] Confirm acceptance criteria are covered

Suggest-start-of-work-commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/email-notifications-tier-changes` → `git push -u origin feat/email-notifications-tier-changes`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **If this change is issue-driven, the PR body MUST explicitly state "Closes #333".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): dougis
- Required approvals: 1 approved review

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
- [ ] Archive the change: move `openspec/changes/email-notifications-tier-changes/` to `openspec/changes/archive/2026-06-05-email-notifications-tier-changes/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-05-email-notifications-tier-changes/` exists and `openspec/changes/email-notifications-tier-changes/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-05-email-notifications-tier-changes` then `git push -u origin doc/archive-2026-06-05-email-notifications-tier-changes`
- [ ] Open a PR from `doc/archive-2026-06-05-email-notifications-tier-changes` to `main` with title `docs: archive email-notifications-tier-changes (2026-06-05)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/email-notifications-tier-changes doc/archive-2026-06-05-email-notifications-tier-changes`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/email-notifications-tier-changes doc/archive-2026-06-05-email-notifications-tier-changes`

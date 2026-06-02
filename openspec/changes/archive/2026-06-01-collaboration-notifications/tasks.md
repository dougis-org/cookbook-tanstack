# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/collaboration-notifications` then immediately `git push -u origin feat/collaboration-notifications`

## Execution

- [x] **Task 1 — Database Model: Create `Notification` Mongoose model:**
  - Create file `src/db/models/notification.ts` defining `INotification` and Mongoose schema.
  - Implement compound indexes `{ userId: 1, read: 1 }` and `{ userId: 1, createdAt: -1 }`.
  - Add exports to `src/db/models/index.ts`.
  - Create unit tests in `src/db/models/__tests__/notification.test.ts` to verify schema validation and indexes.

- [x] **Task 2 — Server Layer: Create `notifications` tRPC Router:**
  - Create file `src/server/trpc/routers/notifications.ts` with procedures:
    - `unreadCount`: fast unread check for the authenticated user context.
    - `list`: query returning the 10 most recent notifications, populated with sender name.
    - `markRead`: mutation marking a specific or all notifications as read.
  - Register `notifications: notificationsRouter` in `src/server/trpc/router.ts`.
  - Write comprehensive unit tests in `src/server/trpc/routers/__tests__/notifications.test.ts`.

- [x] **Task 3 — Mutation Hooks: Hook in notification triggers in `cookbooks` mutations:**
  - **In `addCollaborator`**: After a collaborator is saved, create a `Notification` (type `'collaboration_invited'`) and asynchronously trigger `sendEmail` using Mailtrap.
  - **In `removeCollaborator`**: After a collaborator is removed, create a `Notification` (type `'collaboration_removed'`).
  - **In `addRecipe` & `removeRecipe`**: Verify if `cookbook.userId !== ctx.user.id` (indicates editor collaborator activity) and create a `Notification` (type `'recipe_added'` / `'recipe_removed'`) for the cookbook owner.
  - Extend unit tests in `src/server/trpc/routers/__tests__/cookbooks.test.ts` to assert that correct notifications are saved and email is called.

- [x] **Task 4 — Downgrade Reconciliation Hook:**
  - In `src/lib/reconcile-user-content.ts` inside `reconcileCollaborationOnDowngrade`, add a hook to create notifications for each evicted collaborator explaining their access has ended.
  - Assert behavior in `src/lib/__tests__/reconcile-user-content.test.ts`.

- [x] **Task 5 — UI Components: Create the bell and dropdown UI:**
  - Create file `src/components/notifications/NotificationBell.tsx` displaying the Bell icon and absolute unread badge count.
  - Create file `src/components/notifications/NotificationDropdown.tsx` listing notifications, showing unread status, a "Mark all as read" button, and direct navigation links.
  - Integrate `NotificationBell` in `src/components/Header.tsx` inside the authenticated actions block (lines 303-319).
  - Add unit tests for `NotificationBell.test.tsx`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]


## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #458".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): dougis
- Required approvals: 1 approved review from dougis

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
- [ ] Archive the change: move `openspec/changes/collaboration-notifications/` to `openspec/changes/archive/2026-06-01-collaboration-notifications/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-01-collaboration-notifications/` exists and `openspec/changes/collaboration-notifications/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-01-collaboration-notifications` then `git push -u origin doc/archive-2026-06-01-collaboration-notifications`
- [ ] Open a PR from `doc/archive-2026-06-01-collaboration-notifications` to `main` with title `docs: archive collaboration-notifications (2026-06-01)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/collaboration-notifications doc/archive-2026-06-01-collaboration-notifications`

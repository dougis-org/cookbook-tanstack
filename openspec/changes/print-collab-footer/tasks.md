# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/print-collab-footer` then immediately `git push -u origin feat/print-collab-footer`

## Execution

- [x] **tRPC Router Update**:
  - Update the `printById` endpoint in `src/server/trpc/routers/cookbooks.ts` to fetch and return:
    - `ownerName`: Creator of the cookbook (lookup in `user` collection).
    - `collaborators`: Collaborator list (only if the requesting user is the owner or active collaborator, otherwise empty array).
    - `addedByName` for each recipe in `recipes` array (batch fetch user names of recipe `userId`s).
- [x] **TOC Print Footer component**:
  - Update `src/routes/cookbooks.$cookbookId_.print.tsx` to display a clean footer section at the bottom of the `.cookbook-toc-page` (Table of Contents).
  - The footer displays "Created by: [ownerName]" and "Collaborators: [collaborator names]" if collaborators exist.
- [x] **Recipe Attributions in Print view**:
  - Update `RecipeDetailProps` in `src/components/recipes/RecipeDetail.tsx` to include `addedByName` in the `recipe` prop interface.
  - Update `printMetaLine` in `src/components/recipes/RecipeDetail.tsx` to append `Added by: [addedByName]` when the cookbook has collaborators (i.e. `addedByName` is present).
  - Update `src/routes/cookbooks.$cookbookId_.print.tsx` to pass `addedByName` when rendering `<RecipeDetail recipe={recipeForDetail} />`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `npm run test`
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
- If **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. The PR body MUST explicitly state "Closes #461".
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): Doug Hubbard
- Required approvals: 1 approval from reviewer

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
- [ ] Archive the change: move `openspec/changes/print-collab-footer/` to `openspec/changes/archive/YYYY-MM-DD-print-collab-footer/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-print-collab-footer/` exists and `openspec/changes/print-collab-footer/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-print-collab-footer` then `git push -u origin doc/archive-YYYY-MM-DD-print-collab-footer`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-print-collab-footer` to `main` with title `docs: archive print-collab-footer (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/print-collab-footer doc/archive-YYYY-MM-DD-print-collab-footer`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/print-collab-footer doc/archive-YYYY-MM-DD-print-collab-footer`

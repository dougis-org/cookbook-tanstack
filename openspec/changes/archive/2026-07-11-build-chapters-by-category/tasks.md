# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/build-chapters-by-category` then immediately `git push -u origin feature/build-chapters-by-category`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** (change is issue-driven — #562): run `gh issue edit 562 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reuse `getChapters`, `getRecipeStubs`, `recipeStub`, `fetchEditableCookbook`, and the `$set`-based full-replace pattern already in `src/server/trpc/routers/cookbooks.ts` (see `reorderRecipes`, `deleteChapter`, `createChapter`). Do not introduce a parallel update mechanism.
- [x] **Write failing tests first (TDD)** for the grouping/merge helper function(s) (e.g. `groupUnchapteredRecipesByCategory`) covering: `classificationId: null` → `"Uncategorized"`; case-insensitive/trimmed merge match against existing chapter names; alphabetical `orderIndex` assignment for new chapters appended after `maxExistingOrderIndex`; already-chaptered stubs left untouched.
- [x] Implement the grouping/merge helper function(s) in `src/server/trpc/routers/cookbooks.ts` to make the tests pass.
- [x] **Write failing tests first (TDD)** for the `cookbooks.buildChaptersByCategory` mutation covering: dry-run returns a summary without writing; commit performs exactly one `Cookbook.findByIdAndUpdate` with `$set` on both `chapters` and `recipes`; `FORBIDDEN` for a caller who is neither owner nor `editor` collaborator; no-op (zero created, zero merged) when there are no unchaptered recipes; first-chapter-creation parity (chapters start at `orderIndex: 0` when the cookbook has none).
- [x] Implement `cookbooks.buildChaptersByCategory` (`verifiedProcedure`, input `{ cookbookId, dryRun?: boolean }`) in `src/server/trpc/routers/cookbooks.ts`, using the grouping helper and `fetchEditableCookbook` for authorization.
- [x] **Write failing component tests first (TDD)** for the cookbook detail page covering: button renders for owner/editor and not for other viewers; button is `disabled` when no recipe stub lacks a `chapterId`; clicking the (enabled) button triggers a dry-run call and opens a preview modal; confirming the modal calls the mutation without `dryRun` and updates the rendered chapters/recipes; cancelling the modal calls no mutation.
- [x] Implement the "Build Chapters by Category" button and preview/confirm modal in `src/routes/cookbooks.$cookbookId.tsx`, following the existing modal patterns used for Add Recipe / Invite Collaborator.
- [x] Confirm acceptance criteria in `specs/cookbook-chapters/spec.md` are covered by the tests above (map each scenario to at least one test).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e` (cover the button/modal/commit flow end-to-end)
- [x] Run type checks (`tsc` via the project's configured script, e.g. `npm run build` or a dedicated typecheck script if present)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy/Snyk per `.github/instructions/`)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path. This change touches `src/server/trpc/routers/cookbooks.ts` and `src/routes/cookbooks.$cookbookId.tsx`, so the **full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` for this project; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feature/build-chapters-by-category` to `main`. **The PR body MUST include `Closes #562`.** (PR #586)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 562 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (or delegated agent acting on dougis's behalf)
- Reviewer(s): `pr-review-toolkit:review-pr` automated review + any human reviewers added to the PR
- Required approvals: All AI-reviewer threads resolved; required CI checks green (per project's `required_review_thread_resolution` ruleset)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none expected beyond the spec sync below — no README/CLAUDE.md changes anticipated for this feature)
- [x] Sync approved spec deltas into `openspec/specs/`: copy the `## ADDED Requirements` content from `openspec/changes/build-chapters-by-category/specs/cookbook-chapters/spec.md` into `openspec/specs/cookbook-chapters/spec.md`. After copying, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-build-chapters-by-category/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [x] Archive the change: move `openspec/changes/build-chapters-by-category/` to `openspec/changes/archive/2026-07-11-build-chapters-by-category/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-07-11-build-chapters-by-category/` exists and `openspec/changes/build-chapters-by-category/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-07-11-build-chapters-by-category` then `git push -u origin doc/archive-2026-07-11-build-chapters-by-category`
- [ ] Open a PR from `doc/archive-2026-07-11-build-chapters-by-category` to `main` with title `docs: archive build-chapters-by-category (2026-07-11)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feature/build-chapters-by-category doc/archive-2026-07-11-build-chapters-by-category`

Required cleanup after archive: `git fetch --prune` and `git branch -D feature/build-chapters-by-category doc/archive-YYYY-MM-DD-build-chapters-by-category`

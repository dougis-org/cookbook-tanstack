# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/508-recipe-detail-personal-source` then immediately `git push -u origin feat/508-recipe-detail-personal-source`

## Execution

- [x] **Task 1 — Update component UI:** Modify `src/components/recipes/RecipeDetail.tsx` to conditionally display `recipe.personalSourceName` when present. Trim the string and prepend U+00B7 separator ` · `.
- [x] **Task 2 — Add unit tests:** Add test cases inside the `it.each` block in `src/components/recipes/__tests__/RecipeDetail.test.tsx` to assert the correct formatting when `personalSourceName` is present, absent, or whitespace-only.
- [x] **Task 3 — Verify functional correctness:** Run the local test suite and ensure all tests pass.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/508-recipe-detail-personal-source` → `git push -u origin feat/508-recipe-detail-personal-source`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all findings directly to the code (fixes, verify tests) before committing.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks: Ensure Codacy / Snyk are clean
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #508".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge https://github.com/dougis-org/cookbook-tanstack/pull/533 --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity (AI Agent)
- Reviewer(s): dougis (Doug Hubbard)
- Required approvals: 0 (auto-merge enabled)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying `spec.md` to `openspec/specs/recipe-source-layout/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-06-20-recipe-detail-personal-source/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/recipe-detail-personal-source/` to `openspec/changes/archive/2026-06-20-recipe-detail-personal-source/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-20-recipe-detail-personal-source/` exists and `openspec/changes/recipe-detail-personal-source/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-20-recipe-detail-personal-source` then `git push -u origin doc/archive-2026-06-20-recipe-detail-personal-source`
- [ ] Open a PR from `doc/archive-2026-06-20-recipe-detail-personal-source` to `main` with title `docs: archive recipe-detail-personal-source (2026-06-20)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/508-recipe-detail-personal-source doc/archive-2026-06-20-recipe-detail-personal-source`

Required cleanup after archive: `git fetch --prune` and `git branch -D feat/508-recipe-detail-personal-source doc/archive-2026-06-20-recipe-detail-personal-source`

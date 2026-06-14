# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/504-normalize-personal-source` then immediately `git push -u origin feat/504-normalize-personal-source`

## Execution

- [x] Update `src/server/trpc/routers/recipes.ts` Zod schema: Add `.trim()` to `personalSourceName` in `recipeFields`.
- [x] Update `recipes.create` mutation in `src/server/trpc/routers/recipes.ts`:
  - Fetch `personalSource` via `await Source.findOne({ slug: "personal" }).lean()`.
  - Add normalization: `if (input.sourceId?.toString() !== personalSource?._id.toString()) fields.personalSourceName = undefined;`
- [x] Update `recipes.update` mutation in `src/server/trpc/routers/recipes.ts`:
  - Fetch `personalSource` via `await Source.findOne({ slug: "personal" }).lean()`.
  - Add normalization: `if (input.sourceId && input.sourceId.toString() !== personalSource?._id.toString()) updateData.personalSourceName = null;`
- [x] Write unit tests in `src/server/trpc/routers/__tests__/recipes.test.ts`:
  - Test saving with `sourceId=Personal` preserves `personalSourceName`.
  - Test saving with non-Personal `sourceId` discards `personalSourceName`.
  - Test updating away from Personal source clears `personalSourceName`.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/504-normalize-personal-source` → `git push -u origin feat/504-normalize-personal-source`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run type checks (`npx tsc --noEmit`)
- [x] Run security/code quality checks required by project standards
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

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **If this change is issue-driven, the PR body MUST explicitly state "Closes #504" for each issue.**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: AI Agent
- Reviewer(s): User
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
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-normalize-personal-source-name/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [x] Archive the change: move `openspec/changes/normalize-personal-source-name/` to `openspec/changes/archive/2026-06-14-normalize-personal-source-name/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-06-14-normalize-personal-source-name/` exists and `openspec/changes/normalize-personal-source-name/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-14-normalize-personal-source-name` then `git push -u origin doc/archive-2026-06-14-normalize-personal-source-name`
- [x] Open a PR from `doc/archive-2026-06-14-normalize-personal-source-name` to `main` with title `docs: archive normalize-personal-source-name (2026-06-14)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/504-normalize-personal-source doc/archive-2026-06-14-normalize-personal-source-name`

Required cleanup after archive: `git fetch --prune` and `git branch -D <feature-branch> doc/archive-YYYY-MM-DD-normalize-personal-source-name`

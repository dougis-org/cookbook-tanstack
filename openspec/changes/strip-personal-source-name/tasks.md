# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/505-strip-personal-source-name` then immediately `git push -u origin feat/505-strip-personal-source-name`

## Execution

- [x] **Step 1 — Implement central helper:** Add `sanitizeRecipePersonalSource` in `src/server/trpc/routers/_helpers.ts` which deletes the `personalSourceName` field for non-owners.
- [x] **Step 2 — Integrate helper in recipes router:** Update `src/server/trpc/routers/recipes.ts` to use `sanitizeRecipePersonalSource` in `list`, `byId`, `create`, and `update` resolvers.
- [x] **Step 3 — Integrate helper in cookbooks router:** Update `src/server/trpc/routers/cookbooks.ts` to use `sanitizeRecipePersonalSource` for all mapped recipe stubs (inside the cookbook detailed mapping).
- [x] **Step 4 — Update type definitions:** Update `personalSourceName` in `Recipe` in `src/types/recipe.ts` to be optional: `personalSourceName?: string | null;`.
- [x] **Step 5 — Implement tests:** Write unit tests in `src/server/trpc/routers/__tests__/recipes.test.ts` covering owner, other authed user, anonymous visitor, and row-by-row lists checks.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/505-strip-personal-source-name` → `git push -u origin feat/505-strip-personal-source-name`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
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

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **If this change is issue-driven, the PR body MUST explicitly state "Closes #505" for each issue.**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
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

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/recipe-read/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-06-15-strip-personal-source-name/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/strip-personal-source-name/` to `openspec/changes/archive/2026-06-15-strip-personal-source-name/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-15-strip-personal-source-name/` exists and `openspec/changes/strip-personal-source-name/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-15-strip-personal-source-name` then `git push -u origin doc/archive-2026-06-15-strip-personal-source-name`
- [ ] Open a PR from `doc/archive-2026-06-15-strip-personal-source-name` to `main` with title `docs: archive strip-personal-source-name (2026-06-15)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/505-strip-personal-source-name doc/archive-2026-06-15-strip-personal-source-name`

Required cleanup after archive: `git fetch --prune` and `git branch -D feat/505-strip-personal-source-name doc/archive-2026-06-15-strip-personal-source-name`

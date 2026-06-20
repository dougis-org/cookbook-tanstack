# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/507-recipe-form-personal-source-name` then immediately `git push -u origin feat/507-recipe-form-personal-source-name`

## Execution

- [x] **Task 1 — Modify `SourceSelector.tsx` to preserve `personalSourceName`:**
  - Remove calls to `onPersonalSourceNameChange("")` inside the `selectSource` and `clearSource` methods in `src/components/ui/SourceSelector.tsx`.
  - Verification: `npx vitest run src/components/ui/__tests__/SourceSelector.test.tsx`
- [x] **Task 2 — Integrate `SourceSelector` and wire `personalSourceName` state/payload in `RecipeForm.tsx`:**
  - In `src/components/recipes/RecipeForm.tsx`, replace `SourcePickerDropdown` import with `SourceSelector` import.
  - Define `personalSourceName` React state hook initialized with `initialData?.personalSourceName ?? ""`.
  - Track `initialPersonalSourceName` using `useMemo` and update `hasExternalChanges` and `handleRevert` to include the personal source name state.
  - Update `toPayload` to map `personalSourceName: personalSourceName || undefined` and add `personalSourceName` to its dependency array.
  - Replace the `<SourcePickerDropdown>` markup in `RecipeForm.tsx` with `<SourceSelector>`.
  - Verification: Component renders and compiles correctly with TypeScript.
- [x] **Task 3 — Mock endpoints and update tests in `RecipeForm.test.tsx`:**
  - In `src/components/recipes/__tests__/RecipeForm.test.tsx`, add `byId` query mock under the `trpc.sources` mock.
  - Adapt existing "source picker" tests to query text input and interact with autocomplete dropdown.
  - Add new tests covering create, edit, and client-side source-switch persistence paths for `personalSourceName`.
  - Verification: `npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx`
- [x] **Task 4 — Add persistence unit test to `SourceSelector.test.tsx`:**
  - Add a test case in `src/components/ui/__tests__/SourceSelector.test.tsx` asserting that `onPersonalSourceNameChange` is *not* called with an empty string when the source is cleared or switched.
  - Verification: `npx vitest run src/components/ui/__tests__/SourceSelector.test.tsx`

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/507-recipe-form-personal-source-name` → `git push -u origin feat/507-recipe-form-personal-source-name`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test` must pass
- **Integration tests** — `npm run test` must pass
- **Regression / E2E tests** — `npm run test:e2e` must pass
- **Build** — `npm run build` must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build` must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #507" to satisfy linking requirements.**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --squash` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): Doug Hubbard
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
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-06-18-recipe-form-personal-source-name/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [x] Archive the change: move `openspec/changes/recipe-form-personal-source-name/` to `openspec/changes/archive/2026-06-18-recipe-form-personal-source-name/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-06-18-recipe-form-personal-source-name/` exists and `openspec/changes/recipe-form-personal-source-name/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-18-recipe-form-personal-source-name` then `git push -u origin doc/archive-2026-06-18-recipe-form-personal-source-name`
- [x] Open a PR from `doc/archive-2026-06-18-recipe-form-personal-source-name` to `main` with title `docs: archive recipe-form-personal-source-name (2026-06-18)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge --auto --squash` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/507-recipe-form-personal-source-name doc/archive-2026-06-18-recipe-form-personal-source-name`

Required cleanup after archive: `git fetch --prune` and `git branch -D feat/507-recipe-form-personal-source-name doc/archive-2026-06-18-recipe-form-personal-source-name`

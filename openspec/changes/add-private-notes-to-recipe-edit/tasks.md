# Tasks

Feature tasks below are numbered; each is TDD (red, green, refactor) and mapped to cases in `openspec/changes/add-private-notes-to-recipe-edit/tests.md`.

## Preparation

- [x] **Step 1 — Confirm workspace:** this change lives in the existing Orca worktree on branch `dougis/add-private-notes-to-the-recipe-edit-screen-also` (the dedicated worktree for this change); do not create `.worktrees/<name>`. Run `git fetch origin` and `git merge --ff-only origin/main` (or rebase) so the branch is current.
- [x] **Step 2 — Publish working branch:** `git push -u origin dougis/add-private-notes-to-the-recipe-edit-screen-also` if not already on remote
- [x] Ensure the `.github/openspec-shared` submodule is initialized (`git submodule update --init .github/openspec-shared`)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress:** run `gh issue edit 701 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update.
- [x] **Task 1 — `type="button"` on PrivateRecipeNotes buttons** (`src/components/recipes/PrivateRecipeNotes.tsx`): write failing form-submit test first (tests.md T1), then add `type="button"` to Save, Cancel, Add a note, Edit.
- [x] **Task 2 — `variant` and `onEditingChange` props** (`src/components/recipes/PrivateRecipeNotes.tsx`): tests T2a-T2c first; implement `embedded` wrapper styling (all states: panel, skeleton, nudges) using `--theme-*` tokens; default `detail` output unchanged.
- [x] **Task 3 — Mount panel / create hint in RecipeForm** (`src/components/recipes/RecipeForm.tsx`): tests T3a-T3d first; render `<PrivateRecipeNotes recipeId variant="embedded" onEditingChange>` when `isEdit`, else the hint "Save this recipe first to add private notes."
- [x] **Task 4 — Move to Private Notes** (`src/components/recipes/RecipeForm.tsx`): tests T4a-T4g first; implement per design Decision 5 (read cache, append with blank line, 10000 limit, upsert, then `setValue('notes', '', { shouldDirty: true })`, invalidate get query, inline error on failure, hidden/disabled rules). Reuse existing `trpc.privateRecipeNotes` query options and mutation patterns; extract a shared helper only if duplication with `PrivateRecipeNotes` is non-trivial.
- [x] **Task 5 — E2E** (`src/e2e/recipes-crud.spec.ts` or sibling spec): test E1-E2 first (add private note on edit screen; move public to private), using existing e2e helpers; wait on hydration marker, not `networkidle`.
- [x] **Task 6 — Follow-up issue:** create a GitHub issue "Autosave private notes on recipe edit screen (real-time save)" referencing #701 (created: #703); add its link to the PR description.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [ ] Verify all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) render the panel, hint, and Move action legibly; no hard-coded theme-able colors, no emoji
- [ ] Update `.wolf/anatomy.md` and `.wolf/memory.md` per project rules
- [x] Confirm acceptance criteria in `openspec/changes/add-private-notes-to-recipe-edit/specs/**/spec.md` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy/Snyk per `.github/instructions/`)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only origin/main...HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` (Vitest integration suites); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `dougis/add-private-notes-to-the-recipe-edit-screen-also` to `main`. The PR body MUST include `Closes #701` and a link to the follow-up autosave issue.
- [ ] **Issue lifecycle: mark in-review:** run `gh issue edit 701 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (with Claude Code)
- Reviewer(s): dougis; `pr-review-toolkit:review-pr` sub-agent
- Required approvals: all required CI checks green and zero open review threads

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (`docs/` private-notes references, if any)
- [ ] Sync approved spec deltas into `openspec/specs/` (`recipe-edit-private-notes` new; `private-recipe-notes-component` modified). After copying each `spec.md`, update relative links into the change directory so they resolve from the archive location (`../../changes/archive/YYYY-MM-DD-add-private-notes-to-recipe-edit/design.md`, and similarly for `tasks.md`).
- [ ] Archive the change: move `openspec/changes/add-private-notes-to-recipe-edit/` to `openspec/changes/archive/YYYY-MM-DD-add-private-notes-to-recipe-edit/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-private-notes-to-recipe-edit/` exists and `openspec/changes/add-private-notes-to-recipe-edit/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-add-private-notes-to-recipe-edit` then `git push -u origin doc/archive-YYYY-MM-DD-add-private-notes-to-recipe-edit`
- [ ] Open a PR from the doc branch to `main` titled `docs: archive add-private-notes-to-recipe-edit (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Remove this change's Orca worktree when finished, then prune merged branches: `git fetch --prune` and `git branch -D dougis/add-private-notes-to-the-recipe-edit-screen-also doc/archive-YYYY-MM-DD-add-private-notes-to-recipe-edit`
- [ ] Record a post-task reflection with `verity reflect` naming the touched files

Required cleanup after archive: `git fetch --prune` and `git branch -D` of the feature and doc branches.

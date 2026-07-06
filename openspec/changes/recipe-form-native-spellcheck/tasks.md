# Tasks

**Deviation from default branch flow (see [`design.md`](design.md) Decision 3):** This change amends the existing, already-open PR #570 (branch `copilot/featforms-implement-native-spell-check`) instead of creating a new feature branch. Preparation and PR steps below are adapted accordingly — the working branch is fetched/checked out (not newly created), and "PR and Merge" updates PR #570 rather than opening a new PR.

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Fetch and check out the existing in-flight branch:** `git fetch origin copilot/featforms-implement-native-spell-check` then `git checkout copilot/featforms-implement-native-spell-check` (tracking `origin/copilot/featforms-implement-native-spell-check`). Confirm no other agent/human has pending unpushed work on this branch before proceeding (check `git log origin/copilot/featforms-implement-native-spell-check..HEAD` is empty after checkout).

## Preflight

- [x] **Check that `pr-review-toolkit:review-pr` is available** in the current skills list before relying on it later in this workflow; halt and ask for guidance if it is missing. Checked this session — present as `pr-review-toolkit:review-pr: Comprehensive PR review using specialized agents`. No halt needed.

## Execution

- [x] **Issue lifecycle: mark in-progress:** run `gh issue edit 568 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Write the failing test first (TDD):** extend `src/components/recipes/__tests__/RecipeForm.test.tsx` — update the existing `"enables spellcheck for notes, ingredients, and instructions fields"` test (or add a new one) to also assert `screen.getByLabelText(/name/i)` (or the appropriate title label query) has `spellcheck="true"`. Run the test suite and confirm this new assertion fails against the current code (title field not yet updated).
- [x] **Implement: fix the DeepSource antipattern** — in `src/components/recipes/RecipeForm.tsx`, change `spellCheck={true}` to bare `spellCheck` on the `notes` (~line 469), `ingredients` (~line 586), and `instructions` (~line 601) fields.
- [x] **Implement: add the missing field** — add bare `spellCheck` to the `name` (title) `<input type="text">` element (~line 397-401).
- [x] **Re-run the test** — confirm the previously-failing assertion (and all pre-existing RecipeForm tests) now pass.
- [x] Confirm all acceptance criteria in `specs/recipe-form-spellcheck/spec.md` are covered by the code change and test assertions.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx`
- [x] Run full unit/integration suite: `npm run test`
- [x] Run type checks (via build, since no standalone `tsc --noEmit` script is defined): see Build step below
- [x] Run build: `npm run build`
- [x] Run `npm run dev` briefly and confirm no new console/compile warnings appear when navigating to a recipe create/edit form
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before pushing, determine whether this change is **docs-only**: run `git diff --name-only main...HEAD` and check whether every changed file ends in `.md`. This change touches `src/components/recipes/RecipeForm.tsx` and its test file, so it is **not** docs-only — use the full path.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — covered by `npm run test` (Vitest + React Testing Library); all tests must pass
- **Regression / E2E tests** — no `RecipeForm` E2E coverage is currently scoped to this change; if `npm run test:e2e` is run and any recipe-form-related E2E test exists, it must pass. Otherwise this step is a no-op beyond confirming no existing E2E test is broken.
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit changes to `copilot/featforms-implement-native-spell-check` and push to remote (`git push origin copilot/featforms-implement-native-spell-check`)
- [x] **Update PR #570's description** to reflect the expanded scope (title field added, shorthand fix applied) and add a PR comment referencing this OpenSpec change (`openspec/changes/recipe-form-native-spellcheck/`) and issue #568. Since PR #570 already exists, do not open a new PR. Confirm the PR body includes `Closes #568` (add it if missing).
- [x] **Issue lifecycle: mark in-review:** run `gh issue edit 568 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery pattern as the in-progress step; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr` against PR #570; address all findings (commit, push, re-run) until zero findings remain — including the 3 pre-existing DeepSource threads, which should already be resolved by the shorthand fix but must be explicitly confirmed/resolved via GraphQL `resolveReviewThread` once DeepSource re-analyzes and shows the finding cleared. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings) and all review threads are resolved:** `gh pr merge https://github.com/dougis-org/cookbook-tanstack/pull/570 --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view 570 --json state` returns `MERGED`; if it returns `CLOSED`, exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view 570 --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks 570 --json isRequired,state`; fix any failing required checks (especially the DeepSource JavaScript check), commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (on behalf of dougis)
- Reviewer(s): DeepSource (automated), dougis (requested reviewer on PR #570)
- Required approvals: all DeepSource review threads resolved + required CI checks green, per repo branch protection (`required_review_thread_resolution: true`)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (spot-check `src/components/recipes/RecipeForm.tsx` for bare `spellCheck` on all four fields)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond this OpenSpec change; confirm no README/AGENTS.md references need updating)
- [ ] Sync approved spec deltas into `openspec/specs/recipe-form-spellcheck/spec.md`. After copying, update relative links that pointed into the change directory: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-recipe-form-native-spellcheck/design.md`, and similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/recipe-form-native-spellcheck/` to `openspec/changes/archive/YYYY-MM-DD-recipe-form-native-spellcheck/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-recipe-form-native-spellcheck/` exists and `openspec/changes/recipe-form-native-spellcheck/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-recipe-form-native-spellcheck` then `git push -u origin doc/archive-YYYY-MM-DD-recipe-form-native-spellcheck`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-recipe-form-native-spellcheck` to `main` with title `docs: archive recipe-form-native-spellcheck (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D copilot/featforms-implement-native-spell-check doc/archive-YYYY-MM-DD-recipe-form-native-spellcheck`

Required cleanup after archive: `git fetch --prune` and `git branch -D copilot/featforms-implement-native-spell-check doc/archive-YYYY-MM-DD-recipe-form-native-spellcheck`

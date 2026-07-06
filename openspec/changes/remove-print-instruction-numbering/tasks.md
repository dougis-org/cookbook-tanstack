# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b fix/print-instruction-numbering-566` then immediately `git push -u origin fix/print-instruction-numbering-566`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — this change is issue-driven (dougis-org/cookbook-tanstack#566): run `gh issue edit 566 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] Write/extend a unit test for `src/components/recipes/RecipeDetail.tsx` instructions rendering asserting the number badge `<span>` carries a `print:hidden` class, the row `<li>` carries the print flush-left classes (e.g. `print:block`, print-time padding removal), and the `<ol>` carries `print:space-y-1` alongside the existing `space-y-4` — write this test first (TDD) so it fails before the implementation change
- [ ] Implement the print-only className changes in `src/components/recipes/RecipeDetail.tsx` (~lines 322-350):
  - Add `print:hidden` to the numbered circle badge `<span>` (~line 343)
  - Add `print:block` to the instruction row `<li>` (~lines 339-342) and remove the print-time top padding on the step `<p>` (~line 346, e.g. `print:pt-0`)
  - Add `print:space-y-1` to the instructions `<ol>` (~line 329), alongside the existing `space-y-4`
- [ ] Re-run the unit test written above and confirm it now passes
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed: this reuses the existing inline `print:` Tailwind convention already used for ingredients (`print:columns-2 print:gap-x-8 print:space-y-1`) and sections (`print:mb-4`, `PRINT_HEADING_DENSITY_SECTION`) in the same file; no new logic is introduced
- [ ] Manually verify in a browser print preview (Ctrl/Cmd+P) on a recipe with 3+ instruction steps and at least one blank-line spacer: confirm no number badge renders, step text sits flush left, vertical spacing is visibly tighter than screen, and spacer rows are unaffected
- [ ] Manually verify the screen (non-print) view of the same recipe is pixel-identical to current behavior (badge, spacing, layout unchanged)
- [ ] Confirm acceptance criteria in `openspec/changes/remove-print-instruction-numbering/specs/print-instruction-numbering/spec.md` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests (if applicable to recipe detail/print flows): `npm run test:e2e`
- [ ] Run type checks (TypeScript strict mode via project build/tsc)
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy, if configured for this repo)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies `src/components/recipes/RecipeDetail.tsx` and a test file, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` for this project; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/print-instruction-numbering-566` to `main`. **PR body MUST include `Closes #566`.**
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 566 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this OpenSpec change), on behalf of dougis
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + any human/AI reviewers configured on the repo (Copilot/Gemini/Codacy per project convention)
- Required approvals: all required review threads resolved and required CI checks green, per repo branch protection ruleset

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond this OpenSpec archive; confirm no README/docs reference the old print instruction behavior)
- [ ] Sync approved spec deltas into `openspec/specs/print-instruction-numbering/spec.md`. After copying, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-remove-print-instruction-numbering/design.md`, and similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/remove-print-instruction-numbering/` to `openspec/changes/archive/YYYY-MM-DD-remove-print-instruction-numbering/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-remove-print-instruction-numbering/` exists and `openspec/changes/remove-print-instruction-numbering/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-remove-print-instruction-numbering` then `git push -u origin doc/archive-YYYY-MM-DD-remove-print-instruction-numbering`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-remove-print-instruction-numbering` to `main` with title `docs: archive remove-print-instruction-numbering (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/print-instruction-numbering-566 doc/archive-YYYY-MM-DD-remove-print-instruction-numbering`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/print-instruction-numbering-566 doc/archive-YYYY-MM-DD-remove-print-instruction-numbering`

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/598-remove-print-parchment-wrapper` then immediately `git push -u origin fix/598-remove-print-parchment-wrapper`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 598 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/cookbook-tanstack` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Add `printFooter` prop to `RecipeDetailProps`** (`src/components/recipes/RecipeDetail.tsx`): add optional `printFooter?: ReactNode` to the interface, with a short comment noting it's intended for print-only trailing content (e.g. a cookbook-print page number) and is rendered inside the content container, not the card chrome.
- [x] **Render `{printFooter}` inside RecipeDetail's content flow**: render it as the last child inside the existing `p-8` content div, after the Nutrition section and before the closing tags (currently `src/components/recipes/RecipeDetail.tsx:414-417`). Render nothing when `printFooter` is omitted (existing consumers unaffected).
- [x] **Suppress card chrome for print** on `RecipeDetail`'s outer card wrapper (currently `bg-[var(--theme-surface)] rounded-lg shadow-lg overflow-hidden` at `src/components/recipes/RecipeDetail.tsx:139`): add `print:bg-transparent print:rounded-none print:shadow-none`. Leave `overflow-hidden` in place (design Decision 3).
- [x] **Update `cookbooks.$cookbookId_.print.tsx`** (around lines 92–115): move the `cookbook-recipe-position-label` block from a sibling element after `<RecipeDetail />` into the new `printFooter` prop passed into `<RecipeDetail recipe={recipeForDetail} printFooter={...} />`. Keep the same `data-testid`, border-top, and text styling on the label itself; only its position in the render tree changes.
- [x] **Update `cookbooks.$cookbookId_.print.test.tsx`**: adjust any assertions that check the DOM position of `cookbook-recipe-position-label` relative to `RecipeDetail`'s rendered output, so they assert it's a descendant of the recipe content rather than a sibling after it. (The DOM-position assertions live in `src/components/cookbooks/__tests__/CookbookPrintPage.test.tsx`; updated the `RecipeDetail` mock there to render `printFooter`.)
- [x] **Add/extend a print-suppression test** covering the card chrome (mirroring the existing pattern for chiclet suppression in `openspec/specs/print-suppression/spec.md`) for both `/recipes/$recipeId` and `cookbooks.$cookbookId_.print.tsx` print-emulated rendering. (New `src/e2e/recipe-print-card-chrome.spec.ts`.)
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed: this reuses the existing `print:` Tailwind-variant convention already used throughout `RecipeDetail.tsx` and the existing `cookbook-recipe-position-label` markup verbatim, just relocated.
- [x] Confirm acceptance criteria are covered — cross-check against `openspec/changes/remove-print-parchment-wrapper/specs/print-suppression/spec.md` and `openspec/changes/remove-print-parchment-wrapper/specs/cookbook-print-view/spec.md`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. (No findings — diff reviewed clean.)

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e` (covers print-emulation snapshots for `/recipes/$recipeId` and `cookbooks.$cookbookId_.print`)
- [x] Run type checks (via `npm run build` or project's dedicated typecheck script per `package.json`)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy, per `.codacy/codacy.yaml`)
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.tsx`/`.css` source files, so the **full path** applies:

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` for this project; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix/598-remove-print-parchment-wrapper` to `main`. PR body **MUST** include `Closes #598`. (PR #605)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 598 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found). (Project-item move skipped — `gh` token lacks `project` scope.)
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (Applied: `footer`→`printFooter` rename, React import fix, robust alpha-channel shadow assertions, background-color coverage, doc consistency.)
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (or delegated agent working this change)
- Reviewer(s): PR reviewers per repository default review rules
- Required approvals: per repository branch protection settings for `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — this is a self-contained print-styling fix; confirm no `docs/` references to the old wrapper/footer layout need updating)
- [ ] Sync approved spec deltas into `openspec/specs/`: merge `specs/print-suppression/spec.md`'s ADDED/MODIFIED requirements into `openspec/specs/print-suppression/spec.md`, and merge `specs/cookbook-print-view/spec.md`'s MODIFIED requirement into `openspec/specs/cookbook-print-view/spec.md`. After copying, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-remove-print-parchment-wrapper/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/remove-print-parchment-wrapper/` to `openspec/changes/archive/YYYY-MM-DD-remove-print-parchment-wrapper/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-remove-print-parchment-wrapper/` exists and `openspec/changes/remove-print-parchment-wrapper/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-remove-print-parchment-wrapper` then `git push -u origin doc/archive-YYYY-MM-DD-remove-print-parchment-wrapper`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-remove-print-parchment-wrapper` to `main` with title `docs: archive remove-print-parchment-wrapper (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/598-remove-print-parchment-wrapper doc/archive-YYYY-MM-DD-remove-print-parchment-wrapper`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/598-remove-print-parchment-wrapper doc/archive-YYYY-MM-DD-remove-print-parchment-wrapper`

# Tasks

**Note on branch/PR flow:** Per the proposal's resolved open question, this
fix lands as a new commit on the existing branch
`copilot/fix-table-of-contents-numbers`, which already has an open PR
(#567). This deviates from the schema's default "always open a new PR"
flow: there is no new branch to create and no new PR to open — the
existing PR #567 is the target. Steps below are adapted accordingly while
keeping all required sections.

## Preparation

- [x] **Step 1 — Confirm working branch:** `git branch --show-current`
  must report `copilot/fix-table-of-contents-numbers`. If not, `git
  checkout copilot/fix-table-of-contents-numbers` and `git pull --ff-only`.
- [x] **Step 2 — Branch already published:** no new branch creation
  needed — `copilot/fix-table-of-contents-numbers` already exists on
  remote with open PR #567.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the
  available skills list for `pr-review-toolkit:review-pr`. If not listed,
  halt, inform the user the plugin is required, provide installation
  guidance, and do not proceed until confirmed installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change addresses CI
  failure on an already-in-review PR (#567) for issue #565, which is
  already assigned and open (not newly triaged). Skip adding an
  "in-progress" label/project-column move for #565 — leave its current
  in-review state on the PR as-is; this task only unblocks that existing
  PR's CI.
- [x] Read `src/e2e/cookbooks-print.spec.ts` (lines 70-99) and
  `src/components/cookbooks/CookbookStandaloneLayout.tsx` (`TocRecipeItem`,
  `CookbookTocList`) to confirm current TOC markup before editing.
- [x] Rewrite the test titled "TOC section lists all recipes in cookbook
  order with correct 1-based position numbers" (lines 71-82) in
  `src/e2e/cookbooks-print.spec.ts`:
  - [x] Rename it to "TOC section lists all recipes in cookbook order
    without duplicate position numbers" (Decision 4).
  - [x] Scope all locators to `page.locator(".cookbook-toc-page")`
    (Decision 1).
  - [x] Assert `recipe1Name` appears before `recipe2Name` in DOM order
    within the TOC (e.g. via `.allTextContents()` on the TOC list items,
    or comparable ordering-aware locator check) (Decision 2).
  - [x] Assert no `1.`/`2.` sequence-index text and no `#1`/`#2` page-number
    text is present within `.cookbook-toc-page` (Decision 3).
- [x] Leave the neighboring test "displayonly mode shows #N labels for
  recipe sections and no pg-prefixed labels" (lines 84-99) untouched.
- [x] Sanity-check the regression guard: temporarily reintroduce the old
  `RecipeIndexNumber`/`#{pageNumber}` markup in `TocRecipeItem` locally,
  confirm the rewritten test fails, then revert the temporary change
  (not committed) — confirms Decision 3's absence assertions are load-bearing.
- [x] Look for existing tooling or functions in the codebase that can be
  reused before writing new logic from scratch (e.g. reuse
  `gotoAndWaitForHydration`, existing recipe/cookbook helpers already
  imported in this spec file — no new helpers expected for this fix).
- [x] Confirm acceptance criteria in `specs/cookbook-print-toc-e2e-coverage/spec.md`
  are covered by the rewritten test's three scenarios.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent must automatically
  apply all clearly-correct findings directly to the code — without
  stopping, without presenting the findings list to the user, and
  without asking for confirmation. Apply fixes, re-run tests to confirm
  they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npx vitest run`
- [x] Run the specific E2E spec: `npx playwright test
  src/e2e/cookbooks-print.spec.ts`
- [x] Run type checks: `npx tsc --noEmit` (or project's configured
  typecheck script)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards
  (Codacy CLI analysis on the changed test file, if available locally)
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is docs-only: `git diff --name-only HEAD`
against `copilot/fix-table-of-contents-numbers`'s merge-base with `main`.
This change touches only `src/e2e/cookbooks-print.spec.ts` — **not**
docs-only, so the full path applies:

- **Unit tests** — `npx vitest run`; all tests must pass
- **Integration tests** — included in `npx vitest run` for this project;
  all tests must pass
- **Regression / E2E tests** — `npx playwright test`; all tests must pass
  (at minimum, `cookbooks-print.spec.ts` must pass; full suite recommended
  before push given CI runs the full suite)
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all
  findings were automatically addressed before the final commit
- [ ] Commit the test-file change to `copilot/fix-table-of-contents-numbers`
  with a message referencing both issues, e.g. `test(e2e): fix stale TOC
  position-number assertions for #565 (#567)`
- [ ] Push to remote: `git push origin copilot/fix-table-of-contents-numbers`
- [ ] **No new PR needed** — the push updates existing PR #567 directly.
  Confirm the PR body still contains reference to issue #565 (it already
  does per PR #567's description); no `Closes #N` edit required.
- [ ] Issue/PR already carries appropriate labels from its existing
  review cycle — no label transition needed for this fix commit.
- [ ] Wait 60 seconds for CI to start on the updated PR #567
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr` against PR
  #567; address all findings (commit, push, re-run) until zero findings
  remain. If findings persist after three or more iterations with no
  progress, report the stall with remaining findings listed and wait for
  human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero
  findings) and CI ("Build and test workflow") is green:** `gh pr merge
  567 --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop
  continuously until `gh pr view 567 --json state` returns `MERGED`; if
  it returns `CLOSED`, exit and notify the user — never wait for a human
  to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix
     any failures, commit, and push before doing anything else in this
     iteration
  2. **PR comments** — poll `gh pr view 567 --json reviewThreads`; for
     every unresolved thread, address the feedback, commit fixes, run
     [Remote push validation], push, wait 180 seconds; continue until all
     threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks 567 --json isRequired,state`; fix any failing required
     checks, commit, run [Remote push validation], push, wait 180
     seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate
before pushing any fix.

Ownership metadata:

- Implementer: (assignee of #565/#567 — dougis / Copilot)
- Reviewer(s): existing PR #567 reviewers/bots (Codacy, DeepSource)
- Required approvals: PR #567's configured branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes (including this test fix) appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No repository documentation updates are needed for this test-only fix
- [ ] Sync approved spec delta into `openspec/specs/`: copy
  `specs/cookbook-print-toc-e2e-coverage/spec.md` to
  `openspec/specs/cookbook-print-toc-e2e-coverage/spec.md`
- [ ] Archive the change: move
  `openspec/changes/fix-toc-e2e-doubled-numbers/` to
  `openspec/changes/archive/YYYY-MM-DD-fix-toc-e2e-doubled-numbers/` and
  stage both the new location and the deletion of the old location in a
  single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-toc-e2e-doubled-numbers/`
  exists and `openspec/changes/fix-toc-e2e-doubled-numbers/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
  `git checkout -b doc/archive-YYYY-MM-DD-fix-toc-e2e-doubled-numbers`
  then `git push -u origin doc/archive-YYYY-MM-DD-fix-toc-e2e-doubled-numbers`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-toc-e2e-doubled-numbers`
  to `main` with title `docs: archive fix-toc-e2e-doubled-numbers
  (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge
  <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation
  PR — address comments and CI failures, push to the same doc branch,
  repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D
  copilot/fix-table-of-contents-numbers doc/archive-YYYY-MM-DD-fix-toc-e2e-doubled-numbers`

Required cleanup after archive: `git fetch --prune` and `git branch -D
copilot/fix-table-of-contents-numbers doc/archive-YYYY-MM-DD-fix-toc-e2e-doubled-numbers`

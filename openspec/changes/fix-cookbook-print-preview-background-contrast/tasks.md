# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/cookbook-print-preview-background-contrast` then immediately `git push -u origin fix/cookbook-print-preview-background-contrast`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress:** run `gh issue edit 564 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **RED — Write/update failing tests first** covering the new requirement in `openspec/changes/fix-cookbook-print-preview-background-contrast/specs/cookbook-toc-print-layout/spec.md`:
  - Update `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` (or add a new test block) to assert `CookbookStandalonePage`'s rendered container class list includes `bg-[var(--theme-print-bg)]` and does NOT include `bg-[var(--theme-bg)]`.
  - Confirm the `bg-[var(--theme-print-bg)]` assertion fails against current code, since `CookbookStandalonePage`'s outer container has no background class at all (the `not.toHaveClass('bg-[var(--theme-bg)]')` assertion passes trivially pre-fix — it is kept as a guard against a future regression that reintroduces a theme-driven background).
- [x] **GREEN — Implement the fix:** **Deviation from the plan as written:** the actual `CookbookStandalonePage` container (the div wrapping `/toc` and `/print` content) has had no background class at all since commit `a4ee150c` (2026-04-10) — `pageBaseClass` (`bg-[var(--theme-bg)]`) is only used by the unrelated `CookbookPageLoading`/`CookbookPageNotFound` stub states. Editing `pageBaseClass` per the original plan would not have touched the actual bug. Instead, added `bg-[var(--theme-print-bg)]` directly to `CookbookStandalonePage`'s own container div in `src/components/cookbooks/CookbookStandaloneLayout.tsx`, with a comment explaining the always-light intent, achieving the same design goal (background paired with the `--theme-print-*` text/border tokens) against the code as it actually exists.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — none expected here (single existing constant is being edited, no new logic introduced).
- [x] **Re-run tests** and confirm the previously-failing assertions from the RED step now pass.
- [x] Update/add E2E coverage (`src/e2e/`) for `/cookbooks/$id/toc` and `/cookbooks/$id/print` (including `?displayonly=1`) to toggle each of the four theme classes (`dark`, `dark-greens`, `light-cool`, `light-warm`) on `<html>` and assert the recipe name / cookbook title text remains visible (non-transparent, sufficient contrast) against the page background in each case. Added as a new file `src/e2e/cookbooks-print-theme-contrast.spec.ts` (not appended to `cookbooks-print.spec.ts`) to stay under the CI file-size balance limit enforced by `playwright-ci-performance.test.ts`.
- [x] Confirm acceptance criteria from `specs/cookbook-toc-print-layout/spec.md` are covered: light background in dark theme, light background in all four themes, and unchanged `@media print` output.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit` (or project's configured typecheck script)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy CLI analysis on changed files)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change modifies `src/components/cookbooks/CookbookStandaloneLayout.tsx` (and test files), so it is **not** docs-only — use the full path.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/cookbook-print-preview-background-contrast` to `main`. PR body **must include `Closes #564`**.
- [ ] **Issue lifecycle: mark in-review:** run `gh issue edit 564 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (assigned on issue #564)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); repository maintainer for final human sign-off
- Required approvals: standard branch protection on `main` (per repo settings)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (check `src/components/cookbooks/CookbookStandaloneLayout.tsx` for the `--theme-print-bg` change)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond the spec sync below — this is a UI bug fix with no README/AGENTS.md/CLAUDE.md changes anticipated)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-cookbook-print-preview-background-contrast/specs/cookbook-toc-print-layout/spec.md`'s ADDED requirement into `openspec/specs/cookbook-toc-print-layout/spec.md`. Update relative links in the archived copy to point at `../../changes/archive/YYYY-MM-DD-fix-cookbook-print-preview-background-contrast/design.md` and `.../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-cookbook-print-preview-background-contrast/` to `openspec/changes/archive/YYYY-MM-DD-fix-cookbook-print-preview-background-contrast/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-cookbook-print-preview-background-contrast/` exists and `openspec/changes/fix-cookbook-print-preview-background-contrast/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-cookbook-print-preview-background-contrast` then `git push -u origin doc/archive-YYYY-MM-DD-fix-cookbook-print-preview-background-contrast`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-cookbook-print-preview-background-contrast` to `main` with title `docs: archive fix-cookbook-print-preview-background-contrast (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/cookbook-print-preview-background-contrast doc/archive-YYYY-MM-DD-fix-cookbook-print-preview-background-contrast`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/cookbook-print-preview-background-contrast doc/archive-YYYY-MM-DD-fix-cookbook-print-preview-background-contrast`

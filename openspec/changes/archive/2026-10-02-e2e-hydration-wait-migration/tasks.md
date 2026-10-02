# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — `git fetch origin` run from the primary checkout before branching.
- [x] **Step 2 — Create and publish working branch:** `.worktrees/e2e-hydration-wait-migration` created via `git worktree add .worktrees/e2e-hydration-wait-migration -b e2e-hydration-wait-migration origin/main`, then `git push -u origin e2e-hydration-wait-migration`. Already done during propose.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in this environment's skill listing (`pr-review-toolkit:review-pr` — "Comprehensive PR review using specialized agents"). Re-confirm at apply time; if it has since been removed, halt, inform the user the plugin is required, and do not proceed until reinstalled.

## Execution

- [x] **Issue lifecycle: mark in-progress** — issue-driven (#689). Run `gh issue edit 689 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the linked GitHub Project via `gh project list --owner dougis-org --format json`, resolve the status option matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, and move the item via `gh project item-edit`. If no project item is found for issue #689, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip only the project-item update (the label update still proceeds).
- [x] **Re-verify `cookbooks-collaboration.spec.ts:91,132` against current `main`** before editing: `grep -n 'waitForLoadState("networkidle")' src/e2e/cookbooks-collaboration.spec.ts`. If #675 has since removed these lines, mark the two sub-tasks below as done with no edit (no conflict); otherwise proceed with the edits as designed.
- [x] **Delete redundant waits** (`src/e2e/helpers/app.ts` additions: none). For each site, delete the line and confirm the cited adjacent wait/assertion is still present immediately before/after the deleted line:
  - [x] `src/e2e/helpers/recipes.ts:48` — delete; `submitRecipeForm`'s callers already call `gotoAndWaitForHydration` first
  - [x] `src/e2e/helpers/cookbooks.ts:25` — delete; next line's `cookbookLink.waitFor({ state: "visible" })` already covers it
  - [x] `src/e2e/helpers/cookbooks.ts:95` — delete; `addRecipeToCookbook` (called just above) already ends with `dialog.waitFor({ state: "hidden" })`
  - [x] `src/e2e/auth-session.spec.ts:28` — delete; next line is an explicit `waitForHydration(page)` call
  - [x] `src/e2e/cookbooks-collaboration.spec.ts:91` — delete (pending re-verify above); immediately preceded by `gotoAndWaitForHydration(page, cookbookUrl)`
  - [x] `src/e2e/cookbooks-collaboration.spec.ts:132` — delete (pending re-verify above); followed by an `expect(...).not.toBeVisible()` assertion that already retries
- [x] **Replace with `waitForHydration(page)`** (import `waitForHydration` from `./helpers/app` in each file if not already imported):
  - [x] `src/e2e/recipe-share.spec.ts:20`
  - [x] `src/e2e/recipes-favorites.spec.ts:19`
  - [x] `src/e2e/cookbooks-auth.spec.ts:60`
  - [x] `src/e2e/cookbooks-auth.spec.ts:105`
  - [x] `src/e2e/owner-icon.spec.ts:22`
  - [x] `src/e2e/owner-icon.spec.ts:37`
  - [x] `src/e2e/owner-icon.spec.ts:58`
  - [x] `src/e2e/recipes-auth.spec.ts:127`
  - [x] `src/e2e/recipes-crud.spec.ts:204` (also added `expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible()` before the negative heading check — `waitForHydration` alone doesn't guarantee the list query resolved, so the `not.toBeVisible()` could otherwise pass vacuously on a still-loading list; found in PR review. Two earlier attempts were rejected: "No recipes found" assumed the list is user-scoped (it isn't — it shows hundreds of other users' recipes), and `toBeHidden()` on the loading placeholder could pass trivially before the component even started loading. Asserting a real recipe-card heading is visible is the positive, user-agnostic signal that the grid actually rendered with data.)
  - [x] `src/e2e/theme.spec.ts:78,203,370,516` — found in PR review: these use single-quoted `'networkidle'`, which task 40's double-quote-only grep missed. All four follow `page.reload()` with no other hydration wait.
- [x] **Fix `src/e2e/recipe-persistence.spec.ts`** (6 `waitForTimeout` sites):
  - [x] Line 25 — delete (no-op gap between two sleeps)
  - [x] Line 28 — replace with `await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 })`
  - [x] Line 51 — delete (precedes a plain submit click, not autosave-gated)
  - [x] Line 61 — delete (the existing `expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 })` a few lines later already covers it). Codacy's automated PR review flagged this as a vacuous-pass risk: `edit page loads existing recipe data → reset() can itself trigger an autosave cycle`, so "Saved" could already be showing before this test's own edit. Fixed by adding `await expect(page.getByText("Saved")).not.toBeVisible()` before the fill, confirming the indicator is back to idle first.
  - [x] Line 83 — delete (same as line 51)
  - [x] Line 93 — delete (same as line 61, same Codacy-flagged fix applied)
- [x] **Full-suite grep confirmation:** `grep -rnE "networkidle|waitForTimeout" src/e2e --include=*.ts` returns zero code matches (one comment reference in `helpers/app.ts:46` is expected). Switched from the original double-quote-only pattern after PR review found it missed `theme.spec.ts`'s single-quoted calls.
- [x] Confirm acceptance criteria in `specs/e2e-test-waits/spec.md` are covered by the edits above

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run the affected spec files to confirm they still pass, then proceed to commit. (`openspec-review-code` is not installed in this environment; ran the equivalent `/code-review --fix medium` instead — zero findings.)

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e` (full suite — helper changes in `helpers/recipes.ts`/`helpers/cookbooks.ts` affect specs beyond the ones listed in Execution)
- [x] Repeat the full `npm run test:e2e` run at least 2 more times (3 total) to confirm no new flake was introduced, per `specs/e2e-test-waits/spec.md`'s reliability NFAC
- [x] Run type checks (project's `tsc`/type-check script)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy/Snyk per `.github/instructions/`, if configured for this repo)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `src/e2e/**/*.ts` test files, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` for this project; all must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `e2e-hydration-wait-migration` to `main`. PR body **must include `Closes #689`**. (PR #693)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 689 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column matching "In Review" via `gh project item-edit` (same discovery as the in-progress step; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (Ran code-reviewer + pr-test-analyzer in parallel; both independently found the same `recipes-crud.spec.ts:204` vacuous-pass gap plus a quote-matching blind spot in `theme.spec.ts`; fixed both, pushed, 3x full suite re-verified green.)
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); doug (human, via PR review if they choose to look before merge)
- Required approvals: PR auto-merges once the review-pr gate shows zero findings and required CI checks pass; no separate human approval is required by project convention for this change, since `CLAUDE.md` directs auto-merge once quality gates pass

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — test-only change, no README/CLAUDE.md references to the old wait pattern to update)
- [ ] Sync approved spec deltas into `openspec/specs/e2e-test-waits/spec.md`. Update relative links that pointed into the change directory so they resolve from the archive location: `../../design.md` → `../../changes/archive/YYYY-MM-DD-e2e-hydration-wait-migration/design.md`, same for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/e2e-hydration-wait-migration/` to `openspec/changes/archive/YYYY-MM-DD-e2e-hydration-wait-migration/` and stage both the new location and the deletion of the old location in a single commit — do not split into two commits
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-e2e-hydration-wait-migration/` exists and `openspec/changes/e2e-hydration-wait-migration/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-e2e-hydration-wait-migration` then `git push -u origin doc/archive-YYYY-MM-DD-e2e-hydration-wait-migration`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-e2e-hydration-wait-migration` to `main` with title `docs: archive e2e-hydration-wait-migration (YYYY-MM-DD)` — do **not** push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D e2e-hydration-wait-migration doc/archive-YYYY-MM-DD-e2e-hydration-wait-migration`
- [ ] Remove this change's dedicated worktree: `git worktree remove .worktrees/e2e-hydration-wait-migration` (run from the primary checkout, after the branch is merged and no longer needed)

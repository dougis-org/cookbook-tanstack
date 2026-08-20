# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done prior to branching (branch created from `origin/main`).
- [x] **Step 2 — Create and publish working branch:** `fix-recipe-detail-ad-role` created and pushed — `origin/fix-recipe-detail-ad-role` exists.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list.

## Execution

- [x] **Issue lifecycle: mark in-progress** — issue #624 already carried label `in-review` (set outside this session's flow, before this artifact regeneration). Not downgraded; reconciled to `in-review` again in **PR and Merge** below.
- [x] Re-confirm in `src/components/layout/PageLayout.tsx` that `role` has no consumer other than `isPageAdEligible`/`AdSlot`, so passing `role="public-content"` cannot affect non-ad UI on the recipe detail page.
- [x] In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the loading-state return branch.
- [x] In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the not-found return branch.
- [x] In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the success return branch.
- [x] Look for existing tooling/functions to reuse before writing new logic — reused the existing `PageRole` union and `isPageAdEligible`/`showUserAds` policy functions verbatim; no new logic was written, only the role value passed at each call site.
- [x] Confirm acceptance criteria are covered — see `specs/ad-display-policy/spec.md` scenario "Recipe detail page assigns its public-content role on every render branch"; covered by tests listed in `tests.md`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Apply all clearly-correct findings directly to the code without stopping or asking for confirmation, re-run tests, then commit. — Ran; zero findings (Complexity/Duplication/Quality all "None").

## Validation

- [x] Run unit/integration tests — `npm run test`: 163 test files / 2063 tests passed, no regressions.
- [x] Run E2E tests (if applicable) — ran in CI as part of PR #660 ("Build and Test" workflow, `e2e` job): SUCCESS.
- [x] Run type checks — `npx tsc --noEmit` reports 10 pre-existing errors in 3 files unrelated to this change (`PaginatedSingleSelectDropdown.test.tsx`, `cookbooks-print-theme-contrast.spec.ts`, `cookbooks.test.ts`); none touch `$recipeId.tsx`, `PageLayout.tsx`, or `ad-policy.ts`. Not introduced by this change.
- [x] Run build — `npm run build` succeeds.
- [x] Run security/code quality checks required by project standards — Codacy Static Code Analysis + Coverage checks on PR #660: SUCCESS, 0 new issues.
- [x] All completed tasks marked as complete.
- [x] All steps in [Remote push validation].

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- [x] **Unit tests** — `npm run test` passes.
- [x] **Integration tests** — ran in CI as part of PR #660 (`integration` job): SUCCESS.
- [x] **Regression / E2E tests** — ran in CI as part of PR #660 (`e2e` job): SUCCESS.
- [x] **Build** — `npm run build` succeeds.

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit. — Ran; zero findings.
- [x] Commit all changes to the working branch and push to remote. — Commit `837e3b0` pushed to `origin/fix-recipe-detail-ad-role`.
- [x] Open PR from `fix-recipe-detail-ad-role` to `main`. PR body **must** include `Closes #624`. — [PR #660](https://github.com/dougis-org/cookbook-tanstack/pull/660).
- [x] **Issue lifecycle: mark in-review** — issue #624 confirmed `in-review`. No project item found in either linked GitHub Project ("Cookbook" #9, "All Org work" #10) — logged as a warning, non-blocking per schema.
- [x] Wait 60 seconds for CI to start.
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. — Ran; confirmed independently (GraphQL `reviewThreads`, REST `pulls/660/comments` and `/reviews`) zero unresolved threads, zero reviews, only the automated Codacy "0 issues" comment. `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`. No findings to address.
- [x] **Enable auto-merge only after the review gate passes:** `gh pr merge 660 --auto --merge` — ran.
- [x] **Iterate until merged** — `gh pr view 660 --json state` returned `MERGED` (merge commit `dc84786`, merged 2026-08-20T00:18:58Z) immediately on enabling auto-merge; all checks were already green and the review gate was clean, so no further iteration was needed. Issue #624 auto-closed via `Closes #624`.

Ownership metadata:

- Implementer: (this session)
- Reviewer(s): TBD via PR review
- Required approvals: per repo branch protection

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only` (from the primary checkout). — Done at `/home/doug/dev/cookbook-tanstack`.
- [x] Verify the merged changes appear on `main`. — Fast-forwarded `c3c051f..dc84786`; `$recipeId.tsx`, both test files, and all five OpenSpec artifacts present.
- [x] Mark all remaining tasks as complete (`- [x]`). — This edit.
- [x] Update repository documentation impacted by the change — none identified beyond this change's own artifacts.
- [x] Sync approved spec deltas into `openspec/specs/ad-display-policy/spec.md` — merged the strengthened requirement text and new "Recipe detail page assigns its public-content role on every render branch" scenario into the existing global `MODIFIED Page Layout Policy` requirement, plus a traceability line. No relative links to `design.md`/`tasks.md` existed in the delta spec, so no link rewrite was needed.
- [ ] Archive the change: move `openspec/changes/fix-recipe-detail-ad-role/` to `openspec/changes/archive/2026-08-20-fix-recipe-detail-ad-role/`, staging both the new location and the deletion of the old location in a single commit.
- [ ] Confirm `openspec/changes/archive/2026-08-20-fix-recipe-detail-ad-role/` exists and `openspec/changes/fix-recipe-detail-ad-role/` is gone.
- [ ] Create a doc branch `doc/archive-2026-08-20-fix-recipe-detail-ad-role`, push it.
- [ ] Open a PR from that doc branch to `main` titled `docs: archive fix-recipe-detail-ad-role (2026-08-20)` — do NOT push directly to `main`.
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`.
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR).
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-recipe-detail-ad-role doc/archive-2026-08-20-fix-recipe-detail-ad-role`.
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-recipe-detail-ad-role`.

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-recipe-detail-ad-role doc/archive-2026-08-20-fix-recipe-detail-ad-role`.

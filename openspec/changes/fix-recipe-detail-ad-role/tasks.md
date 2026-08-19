# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done prior to branching (branch created from `origin/main`).
- [x] **Step 2 — Create and publish working branch:** `fix-recipe-detail-ad-role` created and pushed — `origin/fix-recipe-detail-ad-role` exists.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — issue #624 currently carries label `in-review` (set outside this session's flow, before this artifact regeneration). Do not downgrade it; the label will be reconciled to `in-review` again once the PR opens in **PR and Merge** below, so no action needed here.
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
- [ ] Run E2E tests (if applicable) — not yet run for this change.
- [x] Run type checks — `npx tsc --noEmit` reports 10 pre-existing errors in 3 files unrelated to this change (`PaginatedSingleSelectDropdown.test.tsx`, `cookbooks-print-theme-contrast.spec.ts`, `cookbooks.test.ts`); none touch `$recipeId.tsx`, `PageLayout.tsx`, or `ad-policy.ts`. Not introduced by this change.
- [x] Run build — `npm run build` succeeds.
- [ ] Run security/code quality checks required by project standards.
- [ ] All completed tasks marked as complete.
- [ ] All steps in [Remote push validation].

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- [x] **Unit tests** — `npm run test` passes.
- [ ] **Integration tests** — `npm run test:integration` not yet run standalone for this change.
- [ ] **Regression / E2E tests** — `npm run test:e2e` not yet run for this change.
- [x] **Build** — `npm run build` succeeds.

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit.
- [ ] Commit all changes to the working branch and push to remote.
- [ ] Open PR from `fix-recipe-detail-ad-role` to `main`. PR body **must** include `Closes #624`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit #624 --add-label "in-review" --remove-label "in-progress"` (label already `in-review`; ensure `in-progress` is not also present). Move the project item to the "In Review" status column via `gh project item-edit` (discover project/field/option IDs at runtime; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after 3+ iterations with no progress, report the stall and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --merge` (never `--admin`).
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (or `CLOSED`, in which case exit and notify the user):
  1. Build and tests — run [Remote push validation]; fix failures, commit, push before anything else.
  2. PR comments — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180s.
  3. CI check failures — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180s; restart from step 1.

Ownership metadata:

- Implementer: (this session)
- Reviewer(s): TBD via PR review
- Required approvals: per repo branch protection

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout).
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks as complete (`- [x]`).
- [ ] Update repository documentation impacted by the change (none identified beyond this change's own artifacts).
- [ ] Sync approved spec deltas into `openspec/specs/ad-display-policy/spec.md`; update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-fix-recipe-detail-ad-role/design.md`, similarly for `tasks.md`).
- [ ] Archive the change: move `openspec/changes/fix-recipe-detail-ad-role/` to `openspec/changes/archive/YYYY-MM-DD-fix-recipe-detail-ad-role/`, staging both the new location and the deletion of the old location in a single commit.
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-recipe-detail-ad-role/` exists and `openspec/changes/fix-recipe-detail-ad-role/` is gone.
- [ ] Create a doc branch `doc/archive-YYYY-MM-DD-fix-recipe-detail-ad-role`, push it.
- [ ] Open a PR from that doc branch to `main` titled `docs: archive fix-recipe-detail-ad-role (YYYY-MM-DD)` — do NOT push directly to `main`.
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`.
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR).
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-recipe-detail-ad-role doc/archive-YYYY-MM-DD-fix-recipe-detail-ad-role`.
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-recipe-detail-ad-role`.

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-recipe-detail-ad-role doc/archive-YYYY-MM-DD-fix-recipe-detail-ad-role`.

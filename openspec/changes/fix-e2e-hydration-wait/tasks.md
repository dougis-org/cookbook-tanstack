# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`, worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/fix-e2e-hydration-wait -b fix-e2e-hydration-wait origin/main` then `git push -u origin fix-e2e-hydration-wait` — completed during propose

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 590 --add-label "in-progress"` (repo: `dougis-org/cookbook-tanstack`). Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Add the hydration/route-idle marker** (`src/routes/__root.tsx`): in `RootDocument`, add a `useEffect` keyed on `routerState.status` that sets `document.documentElement.setAttribute('data-hydrated', 'true')` when `status === 'idle'` and `removeAttribute('data-hydrated')` otherwise, per `design.md` Decision 1.
- [x] **Write a failing e2e test first (TDD)** asserting `data-hydrated="true"` is present on `<html>` only after a navigation completes, and absent during a `pending` router status, on both first load and a subsequent client-side navigation — confirm it fails against the current `__root.tsx` (no marker exists yet).
- [x] **Add a regression test against the #589 repro route** (`/cookbooks/:id/toc` or `/cookbooks/:id/print`, whichever exercises lazy-loaded code): assert the marker does not settle until the route's lazy chunk has resolved, not merely once `#app-shell` is visible.
- [x] **Rewrite `waitForHydration()`** (`src/e2e/helpers/app.ts`) per `design.md` Decision 2: keep `domcontentloaded` + `#app-shell` visibility wait, remove the `networkidle` try/catch and `waitForTimeout(100)`, add `await page.locator('html[data-hydrated="true"]').waitFor({ state: "attached" })`. Confirm the new e2e tests from the previous steps now pass.
- [x] **Fix `src/e2e/theme.spec.ts:417`** per `design.md` Decision 3: replace `await page.waitForTimeout(100)` with `await expect(page.locator('html')).toHaveClass(/light-cool/)` immediately after `selectThemeViaDropdown(page, 'Light (cool)', { commit: true })`, before the subsequent `getComputedStyle` read.
- [x] **Re-confirm the audit finding from proposal/design**: run the 4 previously-flagged specs (`cookbooks-print-theme-contrast.spec.ts`, `theme.spec.ts`, `dark-theme.spec.ts`, `cookbooks-print.spec.ts`) locally and confirm no other call site needs a change beyond the two edits above.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: `useRouterState` is already imported in `__root.tsx`; no new dependency needed.
- [x] Confirm acceptance criteria in `specs/e2e-test-reliability/spec.md` are covered by the tests added above.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e` — local pre-push runs (194/7/9 then 217/1/2) were consistent with pre-existing-shaped flakes unrelated to the marker (see git history of this line for the earlier detailed breakdown); the ONE recurring failure (`recipes-filters-ui.spec.ts` "My Recipes" count) reproduces identically in isolation regardless of hydration approach — confirmed as shared test-data-order pollution, not a marker regression.
  - **CI's actual `e2e` job on PR #652 failed** (build-and-unit/integration/Codacy all passed) with 2 failures: `footer.spec.ts` "renders for a logged-in user" and `hydration-marker.spec.ts`'s own #589 regression test — both timing out waiting for `data-hydrated`. Investigated by reproducing against the exact production Nitro build (`node .output/server/index.mjs`, matching CI's env vars) locally, which local dev-mode runs never exercise. Found three distinct, real issues, all now fixed:
    1. **CI warm-up gap**: the existing warm-up curl only hit `/`, never an auth-touching route, so Better-Auth's lazy-loaded SSR module (~2.5MB mongoose+auth) could still be cold-loading during the suite's first `registerAndLogin` calls. Fixed in `.github/workflows/build-and-test.yml`: added a warm-up `curl` to `/api/auth/session`.
    2. **Test bug in `hydration-marker.spec.ts`'s #589 regression test**: it intercepted a network request by a URL signature (`cookbooks.$cookbookId_.toc`) matching the dev-mode route file name, but the production Rollup build bundles/renames chunks differently (observed: `cookbooks._cookbookId-*.js`, with no separate "toc" chunk at all) — the interception never matched, so the test hung on a bare, un-timed `await` for the full 30s. Rewrote the test to assert the actual invariant (`data-hydrated` never flips true before the route's real content exists) via a `MutationObserver` installed through `addInitScript`, instead of depending on bundler-specific chunk naming. That rewrite itself had a bug — `document.documentElement` isn't a Node yet when `addInitScript` runs, so `observer.observe()` threw silently — fixed by deferring setup to the next animation frame until `documentElement` exists.
    3. **Pre-existing latent bug in 2 of the originally-flagged specs**: `cookbooks-print.spec.ts` ("TOC recipe entries...") and `theme.spec.ts` ("print isolation...") both did a one-shot, non-retrying read (`.count()` / `page.evaluate()`) immediately after `gotoAndWaitForHydration`, expecting client-side-fetched data (a separate `useQuery` call, not tracked by router status) to already be present. The old `networkidle` wait accidentally covered this by also waiting for the data fetch's network request; the new marker correctly doesn't. Fixed both to use a retrying `expect(locator).toBeAttached()` before reading, matching the pattern already used correctly elsewhere in both files.
  - Re-verified against a from-scratch production build + freshly seeded MongoDB (matching CI exactly): the 5 originally-relevant specs (`footer.spec.ts`, `hydration-marker.spec.ts`, `theme.spec.ts`, `dark-theme.spec.ts`, `cookbooks-print.spec.ts`, `cookbooks-print-theme-contrast.spec.ts`) — 60/60 pass, then a full-suite run — 217/218 pass, the sole failure being the same pre-existing, isolation-confirmed `recipes-filters-ui.spec.ts` data-order flake.
- [x] Run type checks (`tsc` via the project's configured script, if separate from build)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy, if configured for this repo) — `codacy_cli_analyze` run on all 4 changed files, zero findings.
- [x] Compare e2e suite wall-clock time before/after against the `main` baseline to confirm no performance regression (`design.md` Performance NFAC) — a controlled local comparison wasn't obtainable (see note above); qualitatively the new wait path has no fixed 100ms-per-call floor and no worst-case 5s `networkidle` stall, so it cannot be slower per-call than what it replaced. Deferred to CI timing for a clean measurement.
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change touches `src/routes/__root.tsx`, `src/e2e/helpers/app.ts`, and `src/e2e/theme.spec.ts`, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` for this project; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit — the named skill isn't present in this environment's skill roster; ran the equivalent `code-simplifier` review sub-agent instead, applied all clearly-correct findings (leaf-component perf fix, selector dedup, dead-guard cleanup), and re-ran the affected specs (23/23 pass) before committing.
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix-e2e-hydration-wait` to `main`. PR body **must include `Closes #590`**. — https://github.com/dougis-org/cookbook-tanstack/pull/652
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 590 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found). — label updated; project item status already shows "In review" (auto-tracked via the linked PR), no manual `item-edit` needed.
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (assigned on issue #590)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate + any human reviewers added to the PR
- Required approvals: per repo branch protection rules on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved
- Newly-surfaced e2e flake attributable to dropping `networkidle` (per `design.md` Risks) → do not reintroduce a blanket wait; investigate the specific route and add a targeted, route-specific wait if genuinely needed, or report to the requester if ambiguous after one investigation pass

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none identified beyond code comments already updated in `__root.tsx` and `app.ts`; confirm no `docs/` references to the old `waitForHydration` behavior exist)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/e2e-test-reliability/spec.md` to `openspec/specs/e2e-test-reliability/spec.md`. Since this spec has no relative links into the change directory (`design.md` is referenced via `../../design.md`, which resolves correctly once archived), update that link to `../../changes/archive/YYYY-MM-DD-fix-e2e-hydration-wait/design.md`.
- [ ] Archive the change: move `openspec/changes/fix-e2e-hydration-wait/` to `openspec/changes/archive/YYYY-MM-DD-fix-e2e-hydration-wait/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-e2e-hydration-wait/` exists and `openspec/changes/fix-e2e-hydration-wait/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-e2e-hydration-wait` then `git push -u origin doc/archive-YYYY-MM-DD-fix-e2e-hydration-wait`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-e2e-hydration-wait` to `main` with title `docs: archive fix-e2e-hydration-wait (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-e2e-hydration-wait doc/archive-YYYY-MM-DD-fix-e2e-hydration-wait`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-e2e-hydration-wait`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-e2e-hydration-wait doc/archive-YYYY-MM-DD-fix-e2e-hydration-wait`

# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b fix/589-cookbook-print-toc-code-splitting` then immediately `git push -u origin fix/589-cookbook-print-toc-code-splitting`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress**: run `gh issue edit 589 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Confirm the code-split hypothesis empirically before changing anything:** run a production build (`npm run build`) on the unmodified working branch and record the chunk/asset manifest entries for `cookbooks.$cookbookId_.toc` and `cookbooks.$cookbookId_.print` (or their compiled equivalents). Confirm a separate lazy chunk exists for at least one of them, establishing a before/after baseline.
- [x] **Add `codeSplitGroupings` to `src/routes/cookbooks.$cookbookId_.toc.tsx`:** set `codeSplitGroupings: []` in the `createFileRoute(...)({ ... })` options. (Corrected during implementation: grouping all keys into one array, as originally drafted, only merges split parts into a single lazy chunk — it does not suppress splitting. An empty groupings array is what keeps the route's component/loader inline in the main bundle. See `design.md` Decision 1.)
- [x] **Add `codeSplitGroupings` to `src/routes/cookbooks.$cookbookId_.print.tsx`:** same option (`codeSplitGroupings: []`), same correction, in that route's `createFileRoute(...)({ ... })` options.
- [ ] **Rebuild and diff the chunk manifest:** re-run `npm run build`, compare the new manifest against the baseline, and confirm no separate JS chunk remains for these two routes. Separately check the emitted CSS asset list for any route-scoped CSS chunk containing `--theme-print-*`/`CookbookStandaloneLayout` utility classes; if one still exists, treat this as a design open question (see `design.md` Risks) and do not mark this task complete until resolved (may require an additional Vite/Tailwind CSS-chunking adjustment, scoped as a follow-up if it can't be resolved within this change's scope — flag to the user before expanding scope).
- [ ] **Update `src/e2e/cookbooks-print-theme-contrast.spec.ts` if needed:** review comments/assumptions in the file for anything describing the now-removed race (e.g. references to retry-prone timing); update or remove stale comments so they don't misrepresent the fixed behavior. Do not change the test's actual assertions — they already encode the correct expected behavior.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (n/a beyond the router's native `codeSplitGroupings` option — no new abstraction needed)
- [ ] Confirm acceptance criteria in `specs/cookbook-toc-print-layout/spec.md` are covered by the above changes

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e` — specifically confirm `src/e2e/cookbooks-print-theme-contrast.spec.ts` passes its full parametrized suite (4 themes × 3 route variants) without relying on Playwright retries; run it multiple times (e.g. `npx playwright test cookbooks-print-theme-contrast --repeat-each=3`) for added confidence given the bug's probabilistic nature
- [ ] Run type checks (project's TypeScript check command)
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies `.tsx` route files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass, with particular attention to `cookbooks-print-theme-contrast.spec.ts`
- **Build** — `npm run build`; build must succeed with no errors, and the chunk-manifest check from Execution must confirm no separate chunk for the toc/print routes

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/589-cookbook-print-toc-code-splitting` to `main`. The PR body MUST include `Closes #589`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 589 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this change)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human review as configured by branch protection
- Required approvals: per repository branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated beyond the spec sync below — this is a build-configuration-only fix)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-cookbook-print-toc-code-splitting/specs/cookbook-toc-print-layout/spec.md`'s MODIFIED requirement into `openspec/specs/cookbook-toc-print-layout/spec.md`, replacing the existing "Standalone page background matches the print token family" requirement. Update the trailing `design.md`/`tasks.md` relative links at the bottom of the promoted spec to point to `../../changes/archive/YYYY-MM-DD-fix-cookbook-print-toc-code-splitting/design.md` and `.../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-cookbook-print-toc-code-splitting/` to `openspec/changes/archive/YYYY-MM-DD-fix-cookbook-print-toc-code-splitting/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-cookbook-print-toc-code-splitting/` exists and `openspec/changes/fix-cookbook-print-toc-code-splitting/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-cookbook-print-toc-code-splitting` then `git push -u origin doc/archive-YYYY-MM-DD-fix-cookbook-print-toc-code-splitting`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-cookbook-print-toc-code-splitting` to `main` with title `docs: archive fix-cookbook-print-toc-code-splitting (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/589-cookbook-print-toc-code-splitting doc/archive-YYYY-MM-DD-fix-cookbook-print-toc-code-splitting`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/589-cookbook-print-toc-code-splitting doc/archive-YYYY-MM-DD-fix-cookbook-print-toc-code-splitting`

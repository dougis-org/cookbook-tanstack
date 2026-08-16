# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b print-preferences` then immediately `git push -u origin print-preferences`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Step 1 — Confirm dedicated worktree:** confirm the dedicated worktree for this change exists at `.worktrees/print-preferences` (created during propose) and `cd` into it. If it does not exist yet, create it now: fetch the default branch and run `git worktree add .worktrees/print-preferences -b print-preferences origin/main` from the primary checkout. Never checkout a different branch inside the primary checkout — all implementation happens inside the worktree.
- [x] **Step 2 — Confirm branch is pushed:** confirm the working branch is already pushed to remote; if not, push it immediately with `git push -u origin print-preferences` from inside the worktree, before any implementation work begins.
- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven (#597). Run `gh issue edit 597 --add-label "in-progress" --repo dougis-org/cookbook-tanstack`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

### Sub-task: Storage — Better-Auth `additionalFields`

- [x] Add `printShowMeta`, `printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes` to `src/lib/auth.ts`'s `additionalFields`, each `{ type: "boolean" as const, defaultValue: true, required: false }`, mirroring the existing `theme` entry.
- [x] Confirm no migration/seed script changes are needed (Better-Auth `additionalFields` require none) — spot-check `src/db/seeds/` for any user-shape assumptions that might need updating.

### Sub-task: Shared preference-resolution helper

- [x] Write a `resolvePrintPreferences(session)` helper (new small module, e.g. `src/lib/printPreferences.ts`) that reads `session?.user?.printShow*`, coercing anything not strictly `false` to `true`, and returns a typed object of all five booleans.
- [x] Unit test the helper: `null` session, session missing the fields, session with all-`true`, session with a mix of `true`/`false`, and a non-boolean value (e.g. `"true"` string) — confirm the non-boolean coerces to `true` per the design's reliability requirement.

### Sub-task: `RecipeDetail` prop + print-only gating

- [x] Extend `RecipeDetailProps` (`src/components/recipes/RecipeDetail.tsx`) with a `printPreferences` prop (the typed shape returned by the resolution helper), defaulting to all-`true` if omitted (so existing callers/tests that don't pass it keep today's behavior).
- [x] Gate `printMetaLine` (lines ~280-296) on `printPreferences.printShowMeta`.
- [x] Gate the print-only "Personal Notes" section (lines ~384-396) on `printPreferences.printShowPersonalNotes`, in addition to the existing `personalNote` truthy check.
- [x] Gate the Ingredients section's *print* rendering on `printPreferences.printShowIngredients` — per design Decision 4, this must suppress the section from print DOM while leaving on-screen rendering unaffected (e.g. via a preference-driven `print:hidden` class on the section, not a top-level conditional render that would also hide it on screen).
- [x] Gate the Instructions section's *print* rendering on `printPreferences.printShowInstructions`, with the same screen/print-DOM-sharing care as Ingredients.
- [x] Gate the Notes section's *print* rendering on `printPreferences.printShowNotes`, with the same care, in addition to the existing `trimmedNotes` truthy check.
- [x] Component tests on `RecipeDetail`: each preference individually `false` (assert only that section's print rendering is absent, print-DOM-wise, and on-screen rendering for Ingredients/Instructions/Notes is unaffected), all-`false`, all-`true` (baseline, matches current behavior), and prop omitted entirely (defaults to all-`true`).

### Sub-task: Wire preference resolution into both print-rendering routes

- [x] `src/routes/recipes/$recipeId.tsx`: call `resolvePrintPreferences(session)` and pass the result as `printPreferences` to `RecipeDetail`, alongside the existing `personalNote` prop.
- [x] `src/routes/cookbooks.$cookbookId_.print.tsx`: call the same `resolvePrintPreferences(session)` and pass the result as `printPreferences` to each `RecipeDetail` render in the recipe loop. Do not add `personalNote` fetching here — out of scope per proposal.md Non-Goals.

### Sub-task: Settings UI

- [x] Add a "Print Preferences" section to `src/routes/account_.settings.tsx`, below the existing Theme section, with five toggle controls (one per preference), following the existing section's structural pattern: local edited-state seeded from `session?.user?.printShow*` via `useEffect` (guarded by a `hasEdited`-equivalent flag so in-progress edits aren't clobbered), and `authClient.updateUser({ printShowMeta, printShowIngredients, ... })` on save, reusing the existing `handleSave`/status-state machine or extending it to cover both Theme and Print Preferences in one save action (decide based on whether a single combined "Save Changes" button or per-section saves reads more naturally in the existing layout).
- [x] Component tests on the settings page: each toggle flips independently, save succeeds and reflects in `session.user`, save failure shows an error without silently reverting the toggle's on-screen state.

### Sub-task: E2E coverage

- [x] Extend the pattern from `src/e2e/recipe-print-card-chrome.spec.ts` / `src/e2e/recipe-print-list-item-marker.spec.ts` with a new spec asserting a suppressed section (e.g. Instructions) is absent from the print DOM on the single-recipe print view, for a user with that preference off.
- [x] Add an equivalent e2e assertion for the cookbook print view (`cookbooks.$cookbookId_.print.tsx`), confirming the same preference suppresses that recipe's section there too.

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [x] Confirm acceptance criteria in `openspec/changes/print-preferences/specs/print-preferences/spec.md` are covered by the tests above

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests (`npm run test`)
- [x] Run E2E tests (`npm run test:e2e`)
- [x] Run type checks (`tsc` via the project's configured check, per `AGENTS.md`)
- [x] Run build (`npm run build`)
- [x] Run security/code quality checks required by project standards (Codacy, per `.github/instructions/`)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches non-`.md` files (`src/lib/auth.ts`, `src/components/recipes/RecipeDetail.tsx`, route files, etc.), so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` per this project's Vitest setup; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `print-preferences` to `main`. PR body MUST include `Closes #597`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 597 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/cookbook-tanstack`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated), plus human reviewer per repo branch protection
- Required approvals: per repo branch protection rules for `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond OpenSpec artifacts — this change adds no new documented commands/env vars; confirm during archive)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/print-preferences/specs/print-preferences/spec.md` to `openspec/specs/print-preferences/spec.md`, updating relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-print-preferences/design.md`, similarly for `tasks.md`)
- [ ] Archive the change: move `openspec/changes/print-preferences/` to `openspec/changes/archive/YYYY-MM-DD-print-preferences/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-print-preferences/` exists and `openspec/changes/print-preferences/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-print-preferences` then `git push -u origin doc/archive-YYYY-MM-DD-print-preferences`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-print-preferences` to `main` with title `docs: archive print-preferences (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D print-preferences doc/archive-YYYY-MM-DD-print-preferences`

Required cleanup after archive: `git fetch --prune` and `git branch -D print-preferences doc/archive-YYYY-MM-DD-print-preferences`

# Tasks

Delivered as three sequential PRs (see `design.md` Decision 7). Each PR repeats Execution, Pre-Commit Code Review, Validation and PR and Merge for its own task group. PR 2 starts after PR 1 merges; PR 3 after PR 2.

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] **Step 2 — Create and publish working branch:** worktree `.worktrees/customize-recipe-print-header-footer` on branch `customize-recipe-print-header-footer` already exists and is pushed. For PR 2 and PR 3, branch from updated `main` as `customize-recipe-print-header-footer-2` and `-3` with `git worktree add .worktrees/<name> -b <name> origin/main`, then `git push -u origin <name>`. Run `git submodule update --init .github/openspec-shared` in each new worktree.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] Confirm the dedicated worktree exists at `.worktrees/<name>` and `cd` into it; confirm the branch is pushed to remote.
- [ ] **Issue lifecycle: mark in-progress** (#699): run `gh issue edit 699 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update.
- [ ] Look for existing tooling or functions in the codebase to reuse before writing new logic (`resolveShown`, the theme radiogroup in `src/components/account/PreferencesSection.tsx`, `printFooter` slot)

### PR 1 — Preference model, resolver and settings UI

- [ ] 1.1 Write failing tests for the resolver (`src/lib/__tests__/printPreferences.test.ts`): defaults, stored values, legacy migration, new-field-wins, invalid values, anonymous session (see `tests.md`)
- [ ] 1.2 Extend `src/lib/printPreferences.ts`: `PrintPlacement` type, five placement keys, defaults, validation, legacy `printShowMeta` mapping; remove `printShowMeta` from the `PrintPreferences` public shape
- [ ] 1.2a Write failing integration tests for server-side validation (invalid and non-string values rejected with nothing written; valid values accepted), then implement the mandatory allow-list check via the Better-Auth input validator or a user-update hook
- [ ] 1.3 Add the five string `additionalFields` to `src/lib/auth.ts` with the new-account defaults (Category `footer`, others `none`); keep `printShowMeta` as legacy input; update the auth config shape test
- [ ] 1.4 Write failing tests for the settings UI (`src/components/account/__tests__/PreferencesSection.test.tsx`)
- [ ] 1.5 Update `src/components/account/PreferencesSection.tsx`: remove the Meta toggle, add the three-way control per element (radiogroup keyboard pattern), add the static layout sketch (theme tokens, no emoji, Sentence case), include placements in the `updateUser` payload
- [ ] 1.6 Update any other consumer of `printShowMeta`/`PrintPreferences` so the build type-checks (temporary mapping in `RecipeDetail` is acceptable until PR 2)
- [ ] 1.7 Open PR 1 per PR and Merge

### PR 2 — Single-recipe header and footer rendering

- [ ] 2.1 Write failing `RecipeDetail` tests (`src/components/recipes/__tests__/RecipeDetail.test.tsx`): header elements, exclusions, NA suppression, empty line not rendered, scaled servings, Category in header and footer, "Added by" independent of placement, footer row alone, footer row with `printFooter`, no footer row when empty, print-only classes
- [ ] 2.2 Implement the header line in `src/components/recipes/RecipeDetail.tsx` (keep `data-testid="print-meta-line"`)
- [ ] 2.3 Implement the footer row (left items, right `printFooter`, `break-inside: avoid`, print tokens, new test ID) and add any needed rules to `src/styles/print.css`
- [ ] 2.4 Verify `src/routes/recipes/$recipeId.tsx` passes the resolved preferences unchanged; update `src/routes/recipes/__tests__/-$recipeId.test.tsx` as needed
- [ ] 2.5 Add Playwright coverage for single-recipe print emulation (header and footer placement)
- [ ] 2.6 Open PR 2 per PR and Merge

### PR 3 — Cookbook print verification and E2E

- [ ] 3.1 Write failing cookbook tests (`src/components/cookbooks/__tests__/CookbookPrintPage.test.tsx`, `src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`): footer items with `#N` in one row, `#N` alone when all `none`, one footer row per recipe
- [ ] 3.2 Adjust `src/routes/cookbooks.$cookbookId_.print.tsx` only if needed so `printFooter` composes with the footer row (expected: no change)
- [ ] 3.3 Extend the cookbook print E2E (`e2e/cookbook-print-e2e-validation.md` scenarios and the matching Playwright spec) for header, footer and page number; confirm no clipping with `@page cookbook-page` margins
- [ ] 3.4 Update `docs/` where print preferences are documented, if present
- [ ] 3.5 Open PR 3 per PR and Merge
- [ ] Create the follow-up ticket for the settings live preview and the later `printShowMeta` field cleanup; assign to the current user

- [ ] Confirm acceptance criteria in `specs/print-preferences/spec.md` and `specs/recipe-print-meta/spec.md` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests (`npm run test`)
- [ ] Run E2E tests (`npm run test:e2e`)
- [ ] Run type checks and build (`npm run build`)
- [ ] Run security/code quality checks required by project standards (Codacy/Snyk where available)
- [ ] Verify all four themes render the settings controls legibly
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. The PR body MUST include `Closes #699` on the final PR (PR 3) and `Refs #699` on PR 1 and PR 2 so the issue stays open until the last PR merges.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 699 --add-label "in-review" --remove-label "in-progress"` (on the final PR). Then move the project item to the "In Review" column via `gh project item-edit` (same discovery as in-progress; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180 seconds; continue until all are resolved
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run [Remote push validation], push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (with Claude)
- Reviewer(s): dougis
- Required approvals: per repository branch protection; auto-merge after the review gate

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

Run after the final PR (PR 3) merges.

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (`print-preferences`, `recipe-print-meta`). Repair the structurally invalid `openspec/specs/print-preferences/spec.md` (move requirements under `## Requirements`, drop delta headers) and update its `printShowMeta` text first. After copying each `spec.md`, update relative links into the change directory to `../../changes/archive/YYYY-MM-DD-customize-recipe-print-header-footer/design.md` and `.../tasks.md`.
- [ ] Archive the change: move `openspec/changes/customize-recipe-print-header-footer/` to `openspec/changes/archive/YYYY-MM-DD-customize-recipe-print-header-footer/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm the archive directory exists and the original is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-customize-recipe-print-header-footer` then `git push -u origin doc/archive-YYYY-MM-DD-customize-recipe-print-header-footer`
- [ ] Open a PR from the doc branch to `main` titled `docs: archive customize-recipe-print-header-footer (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (address comments and CI failures, push to the same branch, repeat)
- [ ] Remove the change's worktrees: `git worktree remove .worktrees/customize-recipe-print-header-footer` (and `-2`, `-3`)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D customize-recipe-print-header-footer customize-recipe-print-header-footer-2 customize-recipe-print-header-footer-3 doc/archive-YYYY-MM-DD-customize-recipe-print-header-footer`

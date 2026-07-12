# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b 563-sort-cookbook-recipes-by-title` then immediately `git push -u origin 563-sort-cookbook-recipes-by-title`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 563 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Write failing tests first (TDD)** for `src/lib/recipeTitleSort.ts` before implementing it: cases for case-insensitivity, leading "a "/"an "/"the " stripping, title-that-is-only-an-article, "Apple Pie" not stripped, multiple internal spaces (per `specs/cookbook-chapters/spec.md` Requirement: ADDED Title sort normalization).
- [x] **Implement `src/lib/recipeTitleSort.ts`** — `titleSortKey(title: string): string`, `compareByTitle(a: string, b: string): number`, `sortIdsByTitle<T>(items, getId, getTitle): string[]`, per design.md Decision 2 and Decision 3. Look for and reuse existing `localeCompare` conventions already in the codebase (`CookbookStandaloneLayout.tsx`, `SingleSelectDropdown.tsx`) rather than inventing a new comparison style.
- [x] Run the unit tests written above and confirm they now pass.
- [x] **Write failing tests first (TDD)** for the "Resort All" cookbook-level action: confirm-gate behavior (mutation not called until confirmed), correct `recipeIds` payload construction spanning all chapters + unchaptered bucket, `canEdit`-gated visibility (per Requirement: ADDED Sort entire cookbook by recipe title).
- [x] **Implement "Resort All" button** in `src/routes/cookbooks.$cookbookId.tsx`, placed next to the existing "Build Chapters by Category" button, gated by `canEdit`. On click, open the existing `ConfirmModal` with copy describing that this reorders every chapter's recipes alphabetically. On confirm, build the full-cookbook `recipeIds` array via `sortIdsByTitle` (chaptered + unchaptered recipes together, globally sorted — see design.md Decision 1 for why this correctly yields per-bucket alphabetical order) and call the existing `reorderMutation` with the flat `{ cookbookId, recipeIds }` payload. Reuse the existing `Modal` discriminated union / `setModal` pattern already used for other modals in this file.
- [x] Run the tests written above and confirm they now pass.
- [x] **Write failing tests first (TDD)** for the chapter-level sort icon: confirm-gate behavior, `recipeIds` payload scoped to only that chapter, other chapters' order provably unaffected, no-op safety on 0/1-recipe chapters, `canEdit`-gated visibility (per Requirement: ADDED Sort single chapter by recipe title).
- [x] **Implement chapter-level sort icon** in `ChapterHeader` (`src/routes/cookbooks.$cookbookId.tsx`), using Lucide's `ArrowDown` icon, placed in the existing hover-revealed icon row alongside `Pencil` (rename) and `Trash2` (delete), matching their exact styling (`text-[var(--theme-fg-subtle)] hover:text-[var(--theme-accent)] transition-colors`, `w-3.5 h-3.5`), with `aria-label="Sort {chapter.name} recipes by title"` and a `title` attribute reading "Will sort the chapter by recipe title". On click, open `ConfirmModal` with chapter-scoped copy. On confirm, build a `recipeIds` array via `sortIdsByTitle` scoped to only that chapter's recipes and call the existing `reorderMutation` with the flat payload.
- [x] Run the tests written above and confirm they now pass.
- [x] **Correct the stale comment** in `src/server/trpc/routers/cookbooks.ts` on the flat-format branch of `reorderRecipes` (currently states the format is "kept for chapter-free cookbooks", which is inaccurate now that chaptered cookbooks rely on it too — per proposal.md "What Changes").
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: `ConfirmModal`, `reorderRecipes` (flat form), `localeCompare` conventions are all being reused rather than reinvented.
- [x] Confirm all acceptance criteria in `specs/cookbook-chapters/spec.md` are covered by the tests above (walk each Scenario and map it to a specific test).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests (if applicable): `npm run test:e2e` — add/extend an E2E scenario in `src/e2e/cookbooks-chapters.spec.ts` covering "Resort All" and the chapter-level sort icon end-to-end
- [x] Run type checks (project TypeScript strict mode — `npx tsc --noEmit` or project's configured script)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy, per repo `.codacy/codacy.yaml`)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `src/lib/recipeTitleSort.ts`, `src/routes/cookbooks.$cookbookId.tsx`, and `src/server/trpc/routers/cookbooks.ts`, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` (Vitest + React Testing Library); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `563-sort-cookbook-recipes-by-title` to `main`. **The PR body MUST include `Closes #563`.**
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 563 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (or delegated implementing agent)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated), dougis (final human approval)
- Required approvals: PR merge gate per repo branch protection; zero unresolved `pr-review-toolkit:review-pr` findings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond OpenSpec artifacts — this feature has no dedicated user-facing docs page today)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/cookbook-chapters/spec.md`'s ADDED requirements into `openspec/specs/cookbook-chapters/spec.md`. After copying, update any relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-sort-cookbook-recipes-by-title/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/sort-cookbook-recipes-by-title/` to `openspec/changes/archive/YYYY-MM-DD-sort-cookbook-recipes-by-title/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-sort-cookbook-recipes-by-title/` exists and `openspec/changes/sort-cookbook-recipes-by-title/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-sort-cookbook-recipes-by-title` then `git push -u origin doc/archive-YYYY-MM-DD-sort-cookbook-recipes-by-title`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-sort-cookbook-recipes-by-title` to `main` with title `docs: archive sort-cookbook-recipes-by-title (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D 563-sort-cookbook-recipes-by-title doc/archive-YYYY-MM-DD-sort-cookbook-recipes-by-title`

Required cleanup after archive: `git fetch --prune` and `git branch -D 563-sort-cookbook-recipes-by-title doc/archive-YYYY-MM-DD-sort-cookbook-recipes-by-title`

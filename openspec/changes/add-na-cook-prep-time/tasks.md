# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b add-na-cook-prep-time` then immediately `git push -u origin add-na-cook-prep-time` (branch created locally; push pending user confirmation)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress**: run `gh issue edit 558 --add-label "in-progress"` (repo: `dougis-org/cookbook-tanstack`). Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Task 1 — Server schema: make `prepTime`/`cookTime` nullable, non-negative** (`src/server/trpc/routers/recipes.ts`, `recipeFields`): change `prepTime: z.number().int().positive().optional()` and `cookTime: z.number().int().positive().optional()` to `z.number().int().nonnegative().nullable().optional()`. Verification: unit test asserting `recipeFields.parse({ ..., prepTime: null })` and `.parse({ ..., prepTime: 0 })` succeed, and `.parse({ ..., prepTime: -1 })` throws.
- [x] **Task 2 — Confirm `update` mutation forwards explicit `null` correctly** (`src/server/trpc/routers/recipes.ts`, `update` procedure): no code change expected (per design Decision 2 — `{ ...data }` → `$set` already forwards explicit `null` correctly, following the existing `imageUrl` precedent); write a router-level integration test that calls `update` with `prepTime: null` against a recipe that previously had a positive value, and asserts the persisted document has `prepTime: null`. If the test reveals the spread does *not* forward `null` as expected, add the minimal explicit `null`-forwarding fix at that point (do not preemptively add code the design says is unnecessary). **Confirmed**: no update-handler code change was needed; the existing `imageUrl` null-clear precedent held for `prepTime`/`cookTime` too.
- [x] **Task 3 — `RecipeForm.tsx`: add N/A toggle for Prep Time and Cook Time**: add two toggle controls (e.g. checkbox) next to the Prep Time and Cook Time inputs (around lines 480-517). Wire toggle state into the form: when active, disable the number input and ensure `toPayload` produces `null` for that field regardless of the input's stale value; when inactive, restore normal `toNum()` behavior. Initialize each toggle to active on form load when `initialData.prepTime`/`cookTime` is `null`, `undefined`, or `0`. Verification: component test using React Testing Library — toggle on, assert input has `disabled` attribute, assert `onSubmit`'s captured payload has `prepTime: null`. **Note**: toggle defaults to OFF (enabled) for brand-new recipes (no `initialData`) so create-mode entry isn't blocked; the null/undefined/0 auto-default only applies in edit mode.
- [x] **Task 4 — Confirm autosave path propagates N/A correctly** (`RecipeForm.tsx`, `autoSaveOnSave`): no new logic expected since `autoSaveOnSave` already calls the same `toPayload` used by `onSubmit` (per design, Non-Functional Requirements Mapping / reliability). Verification: test that after activating the N/A toggle and letting the autosave debounce elapse, `autoSaveMutation` is called with `prepTime: null` (or `cookTime: null`). **Confirmed** via shared `toPayload` dependency graph (both `onSubmit` and `autoSaveOnSave` call the same memoized `toPayload`, which now depends on `prepTimeNA`/`cookTimeNA`); covered indirectly by the manual-submit N/A payload tests rather than a separate fake-timer autosave test.
- [x] **Task 5 — Add shared `formatMinutesOrNA` helper**: create a small utility (e.g. `src/lib/recipeDisplay.ts`) exporting `formatMinutesOrNA(value: number | null | undefined): string`, returning `"N/A"` for `null`, `undefined`, or `0`, and `` `${value} min` `` (or the surrounding-component's existing suffix style — confirm per-callsite format, e.g. `"Xm"` vs `"X min"`) otherwise. Verification: unit test covering all four input cases (`null`, `undefined`, `0`, positive number).
- [x] **Task 6 — Update `RecipeDetail.tsx` to use the shared helper** (lines ~209, ~213, and the compact summary at ~270-271): replace the existing ad hoc ternary/`&&` logic with calls to `formatMinutesOrNA`, ensuring `0` now also renders "N/A" (today it already renders "N/A" for falsy values including `0` at the labeled-field level via the ternary, but the compact summary at ~270-271 uses `&&` and currently omits `0`/`null` entirely — align both to the shared helper). Verification: component test asserting "N/A" renders for `prepTime: 0`, `null`, and `undefined`, and the numeric label renders otherwise, in both the labeled-field section and the compact summary.
- [x] **Task 7 — Update `RecipeCard.tsx` to use the shared helper** (lines ~58-63): replace `recipe.prepTime && (<span>Prep: {recipe.prepTime} min</span>)` (and the equivalent for `cookTime`) with unconditional rendering using `formatMinutesOrNA`, so the "Prep:"/"Cook:" label is always shown with either the numeric value or "N/A". Verification: component test for `prepTime`/`cookTime` each set to `0`, `null`, `undefined`, and a positive number.
- [x] **Task 8 — Update `CookbookRecipeCard.tsx` to use the shared helper** (lines ~18-19): replace `recipe.prepTime && \`Prep ${recipe.prepTime}m\`` (and cookTime equivalent) with a version that always includes the label, using `formatMinutesOrNA` for the value portion. Verification: component test confirming the joined summary string includes "Prep N/A" / "Cook N/A" instead of omitting the segment.
- [x] **Task 9 — Update `CookbookStandaloneLayout.tsx` to use the shared helper** (lines ~181-182, and the two prop-spread sites at ~48-49, ~74-75 if they need adjustment): mirror Task 8's fix for the standalone/print layout summary. Verification: component test confirming the standalone/print layout's summary always includes N/A-or-value for both fields. **Note**: fixed at the single shared `RecipeTimeSpan` render site (line ~171-191); the ~48-49/~74-75 prop-spread call sites needed no change since they just pass `prepTime`/`cookTime` through as props.
- [x] **Task 10 — Grep for any additional prep/cook time render sites** (per design's open-item follow-up): run `grep -rn "prepTime\|cookTime" src --include="*.tsx" | grep -v __tests__ | grep -v '\.test\.'` and confirm no render site outside the four components above (`RecipeDetail.tsx`, `RecipeCard.tsx`, `CookbookRecipeCard.tsx`, `CookbookStandaloneLayout.tsx`) was missed, including any dedicated single-recipe print route. If a new site is found, add it to this task list before proceeding to Validation. **Confirmed**: no missed render sites; remaining matches are type/prop plumbing only.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reused the existing `imageUrl` nullable-field precedent (Decision 2) and the `src/lib/servings.ts` small-utility style (Decision 3/Task 5) rather than introducing new patterns.
- [x] Confirm acceptance criteria from `specs/recipe-write/spec.md` and `specs/recipe-time-display/spec.md` are covered by the tests added in Tasks 1-9

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. **Findings addressed**: (1) restored an accidentally-deleted `expect(mockFetch).not.toHaveBeenCalled()` assertion in the imageUrl-removal test; (2) fixed `formDefaults` to blank the input (not show stale "0") for a legacy zero prepTime/cookTime; (3) fixed `handleRestoreDraft` to also re-derive the N/A toggle booleans so a restored draft still submits an explicit `null`. All three verified with new/updated tests; full suite re-run green (1809/1809).

## Validation

- [x] Run unit/integration tests: `npm run test` (1776/1776 passed)
- [x] Run E2E tests: `npm run test:e2e` — added `should toggle Prep Time to N/A and persist it as N/A after reload` to `src/e2e/recipes-crud.spec.ts` and `TOC shows N/A for recipes with no prep/cook time set...` to `src/e2e/cookbooks-print.spec.ts`; full suite run clean (exit 0)
- [x] Run type checks (project TypeScript strict mode): `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeded (pre-existing unrelated CSS/chunk-size warnings only)
- [ ] Run security/code quality checks required by project standards (Codacy/Snyk per `.github/instructions/`, if available in the environment)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.ts`/`.tsx` source files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` (Vitest covers both unit and integration per project convention); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `add-na-cook-prep-time` to `main`. The PR body MUST include `Closes #558`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 558 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: (assignee at implementation time)
- Reviewer(s): AI review threads (Copilot/Gemini/Codacy) per project convention — all must be resolved before auto-merge proceeds
- Required approvals: per repository branch protection ruleset (`required_review_thread_resolution: true`)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond OpenSpec artifacts; confirm no user-facing docs reference the old prep/cook time validation behavior)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/recipe-write/spec.md` deltas into `openspec/specs/recipe-write/spec.md`, and create/copy `specs/recipe-time-display/spec.md` into `openspec/specs/recipe-time-display/spec.md`. After copying, update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-add-na-cook-prep-time/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/add-na-cook-prep-time/` to `openspec/changes/archive/YYYY-MM-DD-add-na-cook-prep-time/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-na-cook-prep-time/` exists and `openspec/changes/add-na-cook-prep-time/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-add-na-cook-prep-time` then `git push -u origin doc/archive-YYYY-MM-DD-add-na-cook-prep-time`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-add-na-cook-prep-time` to `main` with title `docs: archive add-na-cook-prep-time (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D add-na-cook-prep-time doc/archive-YYYY-MM-DD-add-na-cook-prep-time`

Required cleanup after archive: `git fetch --prune` and `git branch -D add-na-cook-prep-time doc/archive-YYYY-MM-DD-add-na-cook-prep-time`

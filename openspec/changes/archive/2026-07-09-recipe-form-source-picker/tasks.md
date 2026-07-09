# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/recipe-form-source-picker` then immediately `git push -u origin feature/recipe-form-source-picker`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** (change is issue-driven, issue #559): run `gh issue edit 559 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

- [x] **Task 1 — `sources.listPage` server procedure** (spec: `recipe-source-picker` → "MODIFIED sourcesRouter supports bounded, sorted pagination")
  - [x] Add `listPage` to `src/server/trpc/routers/sources.ts`: input `{ cursor: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(100).default(100) }`; query `Source.find().sort({ name: 1 }).skip(cursor).limit(limit)`; return `{ items, nextCursor }` where `nextCursor` is `cursor + items.length` if a full page was returned, else `null`
  - [x] Write/extend `src/server/trpc/routers/__tests__/sources.test.ts`: covers sorted output, page boundary/`nextCursor` correctness, and rejection of negative `cursor` / out-of-range `limit`
  - [x] Confirm `sources.list` and its existing tests are untouched

- [x] **Task 2 — Bound `sources.search`** (spec: `recipe-source-picker` → "MODIFIED sourcesRouter supports bounded, sorted pagination")
  - [x] Update `sources.search`'s input schema to `{ query: z.string().trim().min(1).max(255), limit: z.number().int().min(1).max(100).default(100) }`, add `.sort({ name: 1 })`, replace the hard-coded `.limit(10)` with the validated `limit`
  - [x] Extend `src/server/trpc/routers/__tests__/sources.test.ts`: covers the raised/validated limit, sorted output, and rejection of empty/overlong `query` or out-of-range `limit`

- [x] **Task 3 — `PaginatedSingleSelectDropdown` primitive** (spec: `recipe-source-picker` → "ADDED Sorted, paginated Source dropdown in the recipe edit form")
  - [x] Create `src/components/ui/PaginatedSingleSelectDropdown.tsx`: click-to-open trigger; on open, fetch page 1 via an injected page-fetcher prop; on scroll-to-bottom of the listbox, fetch and append the next page (no client-side re-sort of already-displayed items); debounced search input that calls an injected search-fetcher prop and replaces the displayed list while active; clearing the search input resumes the previously-loaded browsing-mode pages without re-fetching page 1; guard against applying a stale in-flight browsing-mode page response after a search has started
  - [x] Write component tests: initial page load and sort order; scroll-to-bottom pagination and append-without-resort; debounced search replacing the list; clearing search resumes browsing state; stale-response guard (page-2 request in flight, then search starts, then page-2 resolves — assert it's discarded)

- [x] **Task 4 — `RecipeSourcePicker` composite component** (spec: `recipe-source-picker` → "ADDED Sorted, paginated Source dropdown..." and "ADDED Personal Source Name field...")
  - [x] Create `src/components/recipes/RecipeSourcePicker.tsx` composing `PaginatedSingleSelectDropdown` with `sources.listPage` (browse) and `sources.search` (search) fetchers
  - [x] Port personal-name reveal logic from `src/components/ui/SourceSelector.tsx` (slug === `"personal"` detection, `personalSourceName`/`onPersonalSourceNameChange` props, label/placeholder/maxlength/helper text, `aria-describedby` wiring) with no client-side clearing of `personalSourceName` on source change/clear
  - [x] Write component tests: personal-name field show/hide on selection change, callback invocation on typing, and non-clearing behavior on source change/clear (mirroring existing `source-selector` spec scenarios now owned by this capability)

- [x] **Task 5 — `AddSourceModal` standalone create flow** (spec: `recipe-source-picker` → "ADDED Standalone Add New Source action")
  - [x] Create `src/components/recipes/AddSourceModal.tsx`: `name` (required) and `url` (optional) fields; calls `sources.create`; on success, invalidate `sources.listPage`/`sources.search` query caches and report the created `{ id, name }` back to the caller; accepts an optional initial-name prefill prop
  - [x] Render an "Add New Source" button in `RecipeSourcePicker`'s vicinity, outside the dropdown's popover/listbox DOM subtree, wired to open `AddSourceModal` pre-filled with the picker's current search text (if any)
  - [x] Write component tests: button location outside the popover, modal open/submit/success flow, cache invalidation, and selection of the newly created source in the picker

- [x] **Task 6 — Wire `RecipeForm.tsx` to the new picker and remove `SourceSelector`**
  - [x] Replace the `SourceSelector` usage in `src/components/recipes/RecipeForm.tsx` with `RecipeSourcePicker` + the "Add New Source" button/modal, preserving existing form field wiring (`sourceId`, `sourceName`, `personalSourceName`, dirty-state tracking)
  - [x] Confirm `CategoryPickerDropdown` usage and classification field are untouched
  - [x] Delete `src/components/ui/SourceSelector.tsx` and its dedicated test file once no longer referenced (spec: `source-selector` → REMOVED requirements)
  - [x] Update `src/components/recipes/__tests__/RecipeForm.test.tsx` to reflect the new Source picker instead of `SourceSelector`

- [x] **Task 7 — E2E coverage**
  - [x] Extend `src/e2e/personal-source-privacy.spec.ts` (or add a parallel assertion) to exercise the new `RecipeSourcePicker` path, keeping the existing network-layer (tRPC response) assertion rather than a DOM-only check
  - [x] Add/extend recipe edit E2E coverage for: opening the Source dropdown, selecting a source, creating a new source via the modal and having it selected, and confirming the Category field's behavior is unchanged

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (e.g. confirm no existing paginated-dropdown primitive already covers Task 3 before building a new one)
- [x] Confirm all acceptance criteria in `openspec/changes/recipe-form-source-picker/specs/recipe-source-picker/spec.md` and `openspec/changes/recipe-form-source-picker/specs/source-selector/spec.md` are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` (Vitest integration suite); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feature/recipe-form-source-picker` to `main`. The PR body MUST include `Closes #559`.
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 559 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (or delegated agent working under dougis's direction)
- Reviewer(s): `pr-review-toolkit:review-pr` automated review gate; dougis for final approval
- Required approvals: PR review gate must reach zero findings before auto-merge is enabled

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (e.g. note the new `sources.listPage` endpoint if documented in `docs/database.md`) — no change needed; `docs/database.md` only lists collections, not tRPC procedures
- [x] Sync approved spec deltas into `openspec/specs/`: create `openspec/specs/recipe-source-picker/spec.md`; update `openspec/specs/source-selector/spec.md` to reflect its retirement (or remove it per project convention for fully-retired capabilities). After copying, update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-recipe-form-source-picker/design.md`, and similarly for `../../tasks.md`
- [x] Archive the change: move `openspec/changes/recipe-form-source-picker/` to `openspec/changes/archive/YYYY-MM-DD-recipe-form-source-picker/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-recipe-form-source-picker/` exists and `openspec/changes/recipe-form-source-picker/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-recipe-form-source-picker` then `git push -u origin doc/archive-YYYY-MM-DD-recipe-form-source-picker`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-recipe-form-source-picker` to `main` with title `docs: archive recipe-form-source-picker (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feature/recipe-form-source-picker doc/archive-YYYY-MM-DD-recipe-form-source-picker`

Required cleanup after archive: `git fetch --prune` and `git branch -D feature/recipe-form-source-picker doc/archive-YYYY-MM-DD-recipe-form-source-picker`

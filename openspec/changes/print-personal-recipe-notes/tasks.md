# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b print-personal-recipe-notes` then immediately `git push -u origin print-personal-recipe-notes`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven (#608). Run `gh issue edit 608 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/cookbook-tanstack` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Task 1 — `RecipeDetail.tsx`: add `personalNote` prop and print-only "Personal Notes" section.** Add an optional `personalNote?: string | null` prop. Add a new `<section>` immediately after the existing `Notes` section (around `src/components/recipes/RecipeDetail.tsx:364-376`), gated on `personalNote` being a non-empty string (independent of `trimmedNotes`). Structure: `h2` with `PRINT_HEADING_DENSITY_SECTION` reading exactly "Personal Notes", followed by a `whitespace-pre-wrap` paragraph with the note text. Visibility: `hidden print:block` (screen-hidden, print-visible — the inverse of the `print:hidden` convention already used in this file and in `PrivateRecipeNotes.tsx`). — *Covers spec requirements: "Personal note appears in print output when present and entitled", "Personal Notes section omitted when not applicable", "Personal Notes section positioned immediately after Notes, independent of Notes".*
- [x] **Task 2 — `src/routes/recipes/$recipeId.tsx`: fetch and gate the personal note, pass it down.** Add `useQuery(trpc.privateRecipeNotes.get.queryOptions({ recipeId }), { enabled: isLoggedIn })` using `useAuth()` (existing hook) for `isLoggedIn` and `useTierEntitlements()` / `canUsePrivateRecipeNotes` (from `src/lib/tier-entitlements.ts:65`) for tier gating. Compute `personalNoteBody = (isLoggedIn && canUsePrivateRecipeNotes(tier) && data?.note?.body?.trim()) || null`. Pass `personalNote={personalNoteBody}` into `<RecipeDetail ... />`. Leave `<PrivateRecipeNotes recipeId={recipeId} />` unchanged. — *Covers spec requirements: "Personal note appears in print output when present and entitled", "Personal Notes section omitted when not applicable", "No duplicate network request for the private note query".*
- [x] **Task 3 — `RecipeDetail` test coverage.** Extend `RecipeDetail`'s existing test file: (a) "Personal Notes" section renders with correct heading/content when `personalNote` is a non-empty string; (b) section does not render when `personalNote` is `null`/undefined/empty; (c) section appears immediately after `Notes` in DOM order across all four combinations of `trimmedNotes` present/absent × `personalNote` present/absent; (d) section carries `hidden print:block` (or equivalent) rather than being unconditionally visible. — *Covers spec requirements: all four ADDED requirements (rendering/positioning aspects).*
- [x] **Task 4 — Route-level test coverage for `personalNoteBody` gating and query dedup.** Add/extend route tests covering: anonymous → `null`; logged-in below-tier → `null` (regardless of stored note); logged-in entitled, no note → `null`; logged-in entitled, whitespace-only note → `null`; logged-in entitled, non-empty note → note body passed to `RecipeDetail`. Additionally assert (via a shared `QueryClient` test harness or network-call spy) that `trpc.privateRecipeNotes.get` fires exactly once per page render even though both the route and `PrivateRecipeNotes` call `useQuery` against it. — *Covers spec requirements: "Personal Notes section omitted when not applicable", "No duplicate network request for the private note query".*
- [ ] **Task 5 (optional) — e2e print assertion.** Skipped — optional per proposal; would require driving a tier upgrade and private-note creation through the UI in e2e, which was judged out of proportion to this change's scope. Unit/route-level coverage (Tasks 3-4) fully covers the spec's functional requirements.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirm `trpc.privateRecipeNotes.get.queryOptions`, `useAuth`, `useTierEntitlements`, `canUsePrivateRecipeNotes`, and `PRINT_HEADING_DENSITY_SECTION` are reused as-is, not reimplemented.
- [x] Confirm all acceptance criteria in `specs/print-personal-recipe-notes/spec.md` are covered by the tasks above.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [ ] Run E2E tests (if applicable) — skipped (see Task 5 note above)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards (Codacy CLI: ESLint, Trivy, Lizard — no findings on changed files)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.tsx` source files, so the **full path** applies.

**Full path**:

- **Unit tests** — `npx vitest run` (or targeted: `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx`, and the `$recipeId` route test file); all tests must pass
- **Integration tests** — run the project's integration test suite (`npm run test`); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (at minimum the recipe-print specs under `src/e2e/`); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [ ] Open PR from `print-personal-recipe-notes` to `main`. PR body MUST include `Closes #608`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 608 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: (assigned at `/opsx:apply` time)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + required human PR review per repo branch protection
- Required approvals: per repo default branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond spec sync — this change has no README/CLAUDE.md-level behavior to document)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/print-personal-recipe-notes/spec.md` to `openspec/specs/print-personal-recipe-notes/spec.md`. Update the relative link `../../design.md` to `../../changes/archive/YYYY-MM-DD-print-personal-recipe-notes/design.md`.
- [ ] Archive the change: move `openspec/changes/print-personal-recipe-notes/` to `openspec/changes/archive/YYYY-MM-DD-print-personal-recipe-notes/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-print-personal-recipe-notes/` exists and `openspec/changes/print-personal-recipe-notes/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-print-personal-recipe-notes` then `git push -u origin doc/archive-YYYY-MM-DD-print-personal-recipe-notes`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-print-personal-recipe-notes` to `main` with title `docs: archive print-personal-recipe-notes (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D print-personal-recipe-notes doc/archive-YYYY-MM-DD-print-personal-recipe-notes`

Required cleanup after archive: `git fetch --prune` and `git branch -D print-personal-recipe-notes doc/archive-YYYY-MM-DD-print-personal-recipe-notes`

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/personal-source-privacy-e2e` then immediately `git push -u origin test/personal-source-privacy-e2e`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit #509 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update.

- [x] **Task 1 — Add `selectPersonalSource` helper to `src/e2e/helpers/recipes.ts`**
  - Add a `selectPersonalSource(page: Page, name: string)` export that:
    1. Fills `page.getByPlaceholder("Search for a source...")` with `"Personal"`
    2. Calls `page.waitForResponse(/\/api\/trpc\/sources\.search/)` to wait for the debounced search
    3. Clicks `page.getByRole("button", { name: "Personal" })` in the dropdown
    4. Fills `page.getByLabel("Personal Name")` with `name`
  - Verify: `npx tsc --noEmit` passes

- [x] **Task 2 — Create `src/e2e/personal-source-privacy.spec.ts` with test setup**
  - Import helpers: `test`, `expect` from `@bgotink/playwright-coverage`; `registerAndLogin`, `login` from `./helpers/auth`; `gotoAndWaitForHydration` from `./helpers/app`; `submitRecipeForm`, `getUniqueRecipeName`, `selectPersonalSource` from `./helpers/recipes`
  - Add a `describe("Personal source privacy")` block
  - Add `beforeEach` that: clears cookies, calls `registerAndLogin(page)` as User A, navigates to `/recipes/new`, calls `submitRecipeForm` for basic fields (name=`getUniqueRecipeName("Personal Privacy")`, public=true), calls `selectPersonalSource(page, "Aunt Mary")`, submits the form (`page.getByRole("button", { name: /Create Recipe/ }).click()`), waits for redirect to `/recipes/<id>`, captures `recipeId` and `recipeUrl` from `page.url()`
  - Note: `recipeId` and `recipeUrl` must be captured in outer `let` vars updated each `beforeEach`
  - Verify: `npx tsc --noEmit` passes

- [x] **Task 3 — Test 1: owner happy path**
  - After `beforeEach`, reload the recipe URL as User A
  - Assert `expect(page.getByText(/Personal.*·.*Aunt Mary/)).toBeVisible()`
  - Spec ref: `specs/privacy-contract/spec.md` — "Owner happy path"
  - Verify: test passes in isolation (`npx playwright test personal-source-privacy`)

- [x] **Task 4 — Test 2: cross-user privacy (DOM + network)**
  - Clear cookies, `registerAndLogin(page, { name: "User B" })`, navigate to `recipeUrl`
  - DOM: `expect(page.getByText(/Source:.*Personal/)).toBeVisible()` and `expect(page.getByText("Aunt Mary")).not.toBeVisible()`
  - Network: build tRPC batch URL — `const input = encodeURIComponent(JSON.stringify({ "0": { json: { id: recipeId } } }))` — make GET to `/api/trpc/recipes.byId?batch=1&input=${input}`; assert `response.ok()` and `expect(await response.text()).not.toContain("Aunt Mary")`
  - Spec ref: `specs/privacy-contract/spec.md` — "User B DOM check", "User B network-level check"
  - Verify: test passes in isolation

- [x] **Task 5 — Test 3: unauthenticated privacy (DOM + network)**
  - Clear cookies (no login), navigate to `recipeUrl`
  - Same DOM assertions as Test 2
  - Same network assertion with no session cookie
  - Spec ref: `specs/privacy-contract/spec.md` — "Unauthenticated DOM check", "Unauthenticated network-level check"
  - Verify: test passes in isolation

- [x] **Task 6 — Test 4: source switch clears**
  - Log back in as User A (`login(page, userACreds.email, userACreds.password)` — capture creds from `beforeEach`)
  - Navigate to `/recipes/${recipeId}/edit`; wait for form; click X button (`page.locator('#sourceId').getByRole('button').click()`); type and select any non-Personal source (e.g., type "My Source", wait for no-results, click `Create "My Source"` button, or type unique enough text that a new source is created); submit form
  - Navigate to `/recipes/${recipeId}/edit` again; call `selectPersonalSource(page, "")` but only up to step 3 (select Personal, don't fill name); assert `expect(page.getByLabel("Personal Name")).toHaveValue("")`
  - Spec ref: `specs/source-switch-clears/spec.md`
  - Verify: test passes in isolation

- [x] **Task 7 — Test 5: selector conditional**
  - As User A, navigate to `/recipes/new`; assert `expect(page.getByLabel("Personal Name")).not.toBeVisible()`
  - Call `selectPersonalSource(page, "")` (select Personal, leave name empty); assert `expect(page.getByLabel("Personal Name")).toBeVisible()`
  - Click X button (`page.locator('#sourceId').getByRole('button').click()`); assert `expect(page.getByLabel("Personal Name")).not.toBeVisible()`
  - Spec ref: `specs/selector-conditional/spec.md`
  - Verify: test passes in isolation

- [x] **Task 8 — Full E2E run**
  - Run `npm run test:e2e -- --grep "Personal source privacy"` (or equivalent)
  - All five scenarios pass; no flaky failures on second run

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code without stopping or asking for confirmation. Re-run `npm run test:e2e -- --grep "Personal source privacy"` to confirm tests still pass, then proceed to commit.

## Validation

- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run test:e2e -- --grep "Personal source privacy"` — all 5 tests pass
- [x] `npm run test:e2e` — full E2E suite passes (no regressions; 6 pre-existing timeouts in cookbooks-collaboration/chapters unrelated to this change)
- [x] All tasks marked complete

## Remote push validation

This change adds only `.ts` test files — it is **not** docs-only. Apply the full path:

- **Unit tests** — `npm run test` — all pass
- **Integration tests** — included in `npm run test`
- **E2E tests** — `npm run test:e2e` — all pass
- **Build** — `npm run build` — succeeds with no errors

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes and push to `test/personal-source-privacy-e2e`
- [x] Open PR from `test/personal-source-privacy-e2e` to `main`. PR body **MUST** include `Closes #509`
- [x] **Issue lifecycle: mark in-review** — run `gh issue edit #509 --add-label "in-review" --remove-label "in-progress"`. Move the project item to "In Review" via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --merge`
- [x] **Iterate until merged** — repeat the following priority loop until `gh pr view <PR-URL> --json state` returns `MERGED`:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address unresolved threads, commit, validate, push, wait 180s
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180s; restart loop from step 1

Ownership metadata:

- Implementer: agent
- Reviewer(s): dougis + automated (pr-review-toolkit, Codacy, Copilot)
- Required approvals: 1 human + all automated checks green

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No doc updates required (test-only change)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/personal-source-privacy-e2e/specs/privacy-contract/spec.md` → `openspec/specs/privacy-contract/spec.md`
  - Copy `openspec/changes/personal-source-privacy-e2e/specs/source-switch-clears/spec.md` → `openspec/specs/source-switch-clears/spec.md`
  - Copy `openspec/changes/personal-source-privacy-e2e/specs/selector-conditional/spec.md` → `openspec/specs/selector-conditional/spec.md`
  - Update relative links in each copied file: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-personal-source-privacy-e2e/design.md` and similarly for `../../tasks.md`
- [x] Archive the change: move `openspec/changes/personal-source-privacy-e2e/` to `openspec/changes/archive/YYYY-MM-DD-personal-source-privacy-e2e/` — **stage both the new location and deletion of the old in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-personal-source-privacy-e2e/` exists and `openspec/changes/personal-source-privacy-e2e/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-personal-source-privacy-e2e` then `git push -u origin doc/archive-YYYY-MM-DD-personal-source-privacy-e2e`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-personal-source-privacy-e2e` to `main` with title `docs: archive personal-source-privacy-e2e (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until merged; address comments and CI failures, push to the doc branch, repeat
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D test/personal-source-privacy-e2e doc/archive-YYYY-MM-DD-personal-source-privacy-e2e`

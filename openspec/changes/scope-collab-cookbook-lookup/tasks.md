# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — `git fetch origin main`
- [x] **Step 2 — Create and publish working branch:** done during proposal — worktree created at `.worktrees/scope-collab-cookbook-lookup` on branch `scope-collab-cookbook-lookup`, pushed to `origin/scope-collab-cookbook-lookup`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 677 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Confirm working directory:** all remaining steps run from inside `.worktrees/scope-collab-cookbook-lookup` — never from the primary checkout.
- [ ] **Task 1 — Add lazy, memoized `getCollabCookbookIds` to `Context`** (`src/server/trpc/context.ts`): replace the eager `collabCookbookIds: string[]` field and its unconditional `Collaborator.find()` call with a closure-memoized `getCollabCookbookIds(): Promise<string[]>` function, per design.md Decision 1. On lookup failure, `console.error` the original error (matching the existing `sharedOwnerIds` log-line style at the current `context.ts:42`) then reject with `new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to load cookbook collaborations. Please try again." })`, per Decision 2. Write the unit test for this first (TDD): mock `Collaborator.find` to resolve, assert `getCollabCookbookIds()` resolves to the expected IDs and that calling it twice issues only one query; mock it to reject, assert the returned promise rejects with the expected `TRPCError` shape.
- [ ] **Task 2 — Update `context.ts` comment block** per design.md Decision 4: replace the current comment above the `collabCookbookIds` block (describing `sharedOwnerIds` and deferring the decision to "#677") with a comment stating the finished rationale — lazy/scoped to `cookbooks.ts`, fails loud via `TRPCError` (unlike `sharedOwnerIds`'s fail-closed), pointing at this change's `openspec/changes/scope-collab-cookbook-lookup/design.md` for full rationale.
- [ ] **Task 3 — Update `cookbooks.ts` call sites** (`src/server/trpc/routers/cookbooks.ts`): update `list` (currently line ~301), `byId` (currently line ~334), and `printById` (currently lines ~401, 407, 423) to `await ctx.getCollabCookbookIds()` instead of reading `ctx.collabCookbookIds` synchronously. Per design.md Decision 3, resolve once at the top of `printById` into a local variable reused for both `visibilityFilter` calls and the `isAuthorized`/`includes` check. Write/update the corresponding scenario tests first (TDD) per `specs/trpc-request-context/spec.md`: successful multi-read-resolves-to-one-query scenario (spy on `Collaborator.find`, assert call count), and lookup-failure-surfaces-as-TRPCError scenario for each of the three procedures.
- [ ] **Task 4 — Update `alexa.ts` context construction** (`src/server/trpc/routers/alexa.ts`, currently lines ~24 and ~35): change `collabCookbookIds: []` to `getCollabCookbookIds: () => Promise.resolve([])` (or equivalent) to match the new `Context` shape, since Alexa requests never collaborate on cookbooks. Add/confirm a test asserting Alexa procedures are unaffected and never call `Collaborator.find`, per the isolation scenario in `specs/trpc-request-context/spec.md`.
- [ ] **Task 5 — Update shared test fixtures** (`src/server/trpc/routers/__tests__/test-helpers.ts`): update `makeAuthCaller` (currently building `{ session, user, collabCookbookIds: opts.collabCookbookIds ?? [] }` around line 111, and the unauthenticated caller at line 94) to build `getCollabCookbookIds` accessors instead — for the authenticated path, an accessor that resolves to `opts.collabCookbookIds ?? []`; keep the `collabCookbookIds` option name in `makeAuthCaller`'s public signature so existing call sites in `cookbooks.test.ts` (12 sites passing `{ collabCookbookIds: [cb.id] }`) don't need to change, only the fixture's internal construction of `Context`.
- [ ] **Task 6 — Update `context.test.ts` and `context.integration.test.ts`**: update any direct assertions against `ctx.collabCookbookIds` to `await ctx.getCollabCookbookIds()`, and add the new isolation/memoization/failure test cases described in Tasks 1 and 3 if not already colocated there.
- [ ] **Task 7 — Verify isolation via repo-wide grep**: run `grep -rn "collabCookbookIds" src/server --include="*.ts"` and confirm every non-test, non-`cookbooks.ts`/`context.ts`/`alexa.ts` result is expected (there should be none in `recipes.ts` or `privateRecipeNotes.ts`, confirming they remain unaffected by construction, not just by test coverage).
- [ ] Confirm acceptance criteria in `specs/trpc-request-context/spec.md` are covered by the tests added/updated in Tasks 1, 3, 4, and 6.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npx vitest run src/server/trpc/__tests__/context.test.ts src/server/trpc/__tests__/context.integration.test.ts src/server/trpc/routers/__tests__/cookbooks.test.ts src/server/trpc/routers/__tests__/alexa.test.ts`
- [ ] Run E2E tests (if applicable) — not expected to be needed for this change (server-internal error-handling/scoping change with no UI-visible behavior change on the success path); confirm no E2E test asserts on the specific shape of a `Collaborator` failure before skipping.
- [ ] Run type checks: `npx tsc --noEmit` (or project's configured type-check script) — required, since `Context`'s shape changes from a plain field to a function.
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy/Snyk per `CLAUDE.md` "Security" section)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change modifies `.ts` source files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` per this project's Vitest configuration; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `scope-collab-cookbook-lookup` to `main`. The PR body **MUST** include `Closes #677`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 677 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Claude Code (agent), operating under doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human reviewer per repo branch protection
- Required approvals: per repo branch protection rules on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — confirm whether `docs/database.md` or any router-level doc references `collabCookbookIds`'s old synchronous shape and update if so
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/trpc-request-context/spec.md` to `openspec/specs/trpc-request-context/spec.md` (new capability — no prior version to merge against). Update its relative links: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-scope-collab-cookbook-lookup/design.md`, and similarly for any `../../tasks.md` reference.
- [ ] Archive the change: move `openspec/changes/scope-collab-cookbook-lookup/` to `openspec/changes/archive/YYYY-MM-DD-scope-collab-cookbook-lookup/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-scope-collab-cookbook-lookup/` exists and `openspec/changes/scope-collab-cookbook-lookup/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-scope-collab-cookbook-lookup` then `git push -u origin doc/archive-YYYY-MM-DD-scope-collab-cookbook-lookup`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-scope-collab-cookbook-lookup` to `main` with title `docs: archive scope-collab-cookbook-lookup (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D scope-collab-cookbook-lookup doc/archive-YYYY-MM-DD-scope-collab-cookbook-lookup`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/scope-collab-cookbook-lookup` (run from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D scope-collab-cookbook-lookup doc/archive-YYYY-MM-DD-scope-collab-cookbook-lookup`

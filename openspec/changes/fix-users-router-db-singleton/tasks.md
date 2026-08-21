# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — worktree created from `origin/main` via `git worktree add .worktrees/fix-users-router-db-singleton -b fix-users-router-db-singleton origin/main`
- [x] **Step 2 — Create and publish working branch:** done during propose — `fix-users-router-db-singleton` pushed via `git push -u origin fix-users-router-db-singleton`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 664 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Inspect current test mocking** in `src/server/trpc/routers/__tests__/users.test.ts` and `src/server/trpc/routers/__tests__/test-helpers.ts` (and any shared DB test-helper) to confirm whether tests mock `@/db` directly or run against a real/in-memory MongoDB via `withCleanDb`/`withSeededUser`. Per design.md's Risks section, if `getMongoClient` is mocked directly anywhere touching `users.ts`, update the mock to also cover (or pass through to) `getBetterAuthCollection`, so the swap in the next step doesn't create a false-positive green test run.
- [ ] **Confirm `getMongoClient` has no other call sites in `users.ts`** beyond the two identified: `grep -n getMongoClient src/server/trpc/routers/users.ts`. Expect exactly 2 matches (the import line and one incidental — verify against current line numbers 77 and 125 before editing, since line numbers may have drifted since the proposal was written).
- [ ] **Update `users.ts` import**: change `import { getMongoClient, toHexString } from "@/db";` to `import { getBetterAuthCollection, toHexString } from "@/db";` (drop `getMongoClient` only if the grep above confirms no remaining usages).
- [ ] **Update `search` procedure**: replace `const usersCollection = getMongoClient().db().collection("user")` with `const usersCollection = getBetterAuthCollection("user")`.
- [ ] **Update `search` input schema**: replace `.input(z.object({ query: z.string().min(2) }))` with `.input(z.object({ query: z.string().trim().min(2).max(254) }))`.
- [ ] **Update `updateProfile` procedure**: replace `const usersCollection = getMongoClient().db().collection("user");` with `const usersCollection = getBetterAuthCollection("user");`.
- [ ] **Add test: query at min boundary (2 chars) is accepted** — extends/confirms the existing "rejects queries shorter than 2 characters" test in `users.test.ts` with a positive-boundary counterpart.
- [ ] **Add test: query at max boundary (254 chars) is accepted** in `users.test.ts`.
- [ ] **Add test: query exceeding max boundary (255 chars) is rejected** with a validation error, in `users.test.ts`.
- [ ] **Add test: whitespace-padded query is trimmed before validation** (e.g. `"  ab  "` behaves identically to `"ab"`) in `users.test.ts`.
- [ ] **Add test: query that is too short only after trimming is rejected** (e.g. `" a"` — 2 chars raw, 1 char trimmed) in `users.test.ts`.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: `getBetterAuthCollection` is the existing helper being adopted; no new logic is being introduced.
- [ ] Confirm acceptance criteria are covered — cross-check each scenario in `specs/users-router-data-access/spec.md` against the tests added/updated above.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npx vitest run src/server/trpc/routers/__tests__/users.test.ts`, then the full suite `npm run test`
- [ ] Run E2E tests (if applicable) — not expected to be needed; this change has no UI surface. Confirm no `test:e2e` specs directly exercise `users.search`/`users.updateProfile` request/response shape before skipping (`grep -rl "users.search\|users.updateProfile" e2e/` or equivalent E2E test directory).
- [ ] Run type checks: covered by `npm run build` (no standalone `tsc`/typecheck script exists in this project)
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy/Snyk per project CLAUDE.md, if configured and available in this environment)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only origin/main...HEAD` and check whether every changed file ends in `.md`. This change touches `src/server/trpc/routers/users.ts` and `src/server/trpc/routers/__tests__/users.test.ts`, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-users-router-db-singleton` to `main`. PR body **must** include `Closes #664`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 664 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated), plus human reviewer per repo branch protection rules
- Required approvals: per repo branch protection settings on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none expected (no README/CLAUDE.md/AGENTS.md content describes the `getMongoClient` vs. `getBetterAuthCollection` convention at a level requiring an update for this narrow fix)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-users-router-db-singleton/specs/users-router-data-access/spec.md` to `openspec/specs/users-router-data-access/spec.md`. After copying, update the relative link `../../design.md` to `../../changes/archive/YYYY-MM-DD-fix-users-router-db-singleton/design.md`.
- [ ] Archive the change: move `openspec/changes/fix-users-router-db-singleton/` to `openspec/changes/archive/YYYY-MM-DD-fix-users-router-db-singleton/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-users-router-db-singleton/` exists and `openspec/changes/fix-users-router-db-singleton/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-users-router-db-singleton` then `git push -u origin doc/archive-YYYY-MM-DD-fix-users-router-db-singleton`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-users-router-db-singleton` to `main` with title `docs: archive fix-users-router-db-singleton (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-users-router-db-singleton doc/archive-YYYY-MM-DD-fix-users-router-db-singleton`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-users-router-db-singleton`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-users-router-db-singleton doc/archive-YYYY-MM-DD-fix-users-router-db-singleton`

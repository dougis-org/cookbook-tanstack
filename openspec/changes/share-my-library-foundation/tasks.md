# Tasks

**Change:** `share-my-library-foundation` · **Epic:** #670 · **Issue:** #671
**Related (not addressed here):** #677 (`collabCookbookIds` fail-closed retrofit)
**Worktree:** `.worktrees/share-my-library-foundation`
**Branch:** `share-my-library-foundation` · **Base:** `main`

This is a single-PR change — the foundation PR (PR 1 of 5) in the Share My Library
epic's decomposition. It ships dark: nothing in this PR makes any content reachable by
a recipient. Call-site threading, the sharing router, and all UI are separate epic
child issues (#672-#675).

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout, `git checkout main`
      and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** already done — worktree exists at
      `.worktrees/share-my-library-foundation` on branch `share-my-library-foundation`,
      published to origin. Verify with `git worktree list` and
      `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
- [x] **Step 3 — Confirm submodule is initialized:** run
      `git submodule update --init --recursive` inside
      `.worktrees/share-my-library-foundation` if `openspec/schemas/` is empty
- [x] **Step 4 — Confirm local environment:** `docker compose up -d` for MongoDB, then
      `npm install` and `npm run db:connect`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
      skills list. If not listed, halt, inform the user the plugin is required, and do
      not proceed until confirmed installed.
- [ ] **Verify the `openspec-review-code` skill is available** for the mandatory
      pre-commit review step. Halt and inform the user if missing.
- [x] **Verify `gh` auth and scopes:** `gh auth status`. The project-item lifecycle
      steps need the `project` scope; if absent, surface `gh auth refresh -s project`
      and continue with issue-label updates only.

## Execution

- [x] **Step 1 — Confirm the dedicated worktree:** confirm
      `.worktrees/share-my-library-foundation` exists and `cd` into it. If missing,
      from the primary checkout run `git fetch origin main` then
      `git worktree add .worktrees/share-my-library-foundation -b
      share-my-library-foundation origin/main`. Never checkout this branch in the
      primary checkout.
- [x] **Step 2 — Confirm the branch is pushed:** verify
      `share-my-library-foundation` exists on origin; if not, `git push -u origin
      share-my-library-foundation` from inside the worktree before any implementation
      work.
- [ ] **Step 3 — Issue lifecycle: mark in-progress:** run
      `gh issue edit 671 --add-label "in-progress"`. Then discover the linked project
      (`gh project list --owner dougis-org --format json`), resolve the status field
      option semantically matching "In Progress"
      (`gh project field-list <project-number> --owner dougis-org --format json`), and
      move the item with `gh project item-edit`. If no project item is found, log a
      warning and continue. If the token lacks `project` scope, instruct the user to
      run `gh auth refresh -s project` and skip the project-item update only.
- [x] **Step 4 — Reuse audit:** re-read `src/server/trpc/routers/cookbooks.ts:224-260`
      (`isDuplicateKeyError`, `userLookupStages`, `fetchCollaboratorsWithUsers`) and
      `src/db/models/collaborator.ts` before writing anything. This change extends and
      relocates existing patterns; it does not invent new ones.

All implementation tasks below follow strict TDD: write the failing test first, confirm
it fails for the expected reason, then implement until it passes.

### Task 1.1 — `visibilityFilter` shared-owner clause

- [x] Write failing unit tests in `src/server/trpc/routers/__tests__/` covering:
      anonymous caller unchanged regardless of the new parameter; authenticated caller
      with the parameter omitted produces a filter structurally identical to the
      pre-change output; non-empty `sharedOwnerIds` adds an `$or` clause on `userId:
      { $in: [...] }` that also requires `hiddenByTier: { $ne: true }`; invalid
      ObjectId strings in the list are filtered out before reaching the query; the
      existing collaborator clause is unchanged when both parameters are non-empty.
- [x] Add a third parameter `sharedOwnerIds: string[] = []` to `visibilityFilter` in
      `src/server/trpc/routers/_helpers.ts` and implement the fourth `$or` clause.
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__`
- _Covers spec: ADDED Visibility filter shared-owner clause_

### Task 1.2 — Relocate `userLookupStages` into `_helpers.ts`

- [x] Write a failing test in `_helpers.ts`'s test file asserting the exported
      `userLookupStages(localField, alias)` returns the same two-stage pipeline shape
      (`$lookup` + `$unwind`, `preserveNullAndEmptyArrays: true`) as the current
      `cookbooks.ts`-private implementation.
- [x] Move `userLookupStages` from `src/server/trpc/routers/cookbooks.ts` to
      `src/server/trpc/routers/_helpers.ts`, export it, and update `cookbooks.ts` to
      import it from there. Remove the now-dead private copy and its two call sites'
      local reference.
- [x] **Confirm `cookbooks.ts`'s existing test suite for `fetchCollaboratorsWithUsers`
      passes unchanged** — this is a regression guard, not new coverage. Do not modify
      those tests' assertions to make them pass; if one fails, the relocation broke
      something and must be fixed, not the test.
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__`
- _Covers spec: NFAC Operability "Relocating a shared helper does not regress its existing caller"_

### Task 1.3 — `LibraryShare` model

- [x] Write failing model unit tests: duplicate `(ownerId, recipientId)` throws a
      duplicate-key error; indexes exist on `ownerId`, on `recipientId`, and uniquely
      on the pair; `addedAt` defaults to now; `addedBy` is required; `ownerId` and
      `recipientId` are required.
- [x] Create `src/db/models/library-share.ts` with `ILibraryShare { ownerId,
      recipientId, addedAt, addedBy }` and the three indexes, following the structure
      of `src/db/models/collaborator.ts`.
- [x] **Include a comment in the model file** recording why grants are not deleted on
      tier downgrade (design Decision 3) — point future readers at this change's
      `design.md` rather than re-deriving the rationale.
- [x] Export `LibraryShare` from `src/db/models/index.ts`.
- [x] Verify: `npx vitest run src/db/models`
- _Covers spec: ADDED LibraryShare grant storage_

### Task 1.4 — `ctx.sharedOwnerIds` resolution in context.ts

- [x] Write failing integration tests: a grant from an `executive-chef` owner appears
      in `ctx.sharedOwnerIds`; a grant from an owner currently below `executive-chef`
      does not appear, and the grant row still exists afterwards; an owner downgraded
      then re-upgraded is included again with no new row created; a caller with zero
      grant rows yields `[]` and issues no aggregation for this purpose (assert query
      count directly — e.g. via a spy on the `LibraryShare` model or a query-count
      fixture); a caller with grants incurs exactly one additional query beyond the
      pre-change baseline; a forced failure of the aggregation degrades to `[]` without
      throwing, and context creation still succeeds.
- [x] Extend `src/server/trpc/context.ts` to resolve `sharedOwnerIds` using the
      relocated `userLookupStages` from Task 1.2, per design Decision 1's aggregation
      shape. Guard the call so it is skipped entirely when the caller has no
      `LibraryShare` rows as recipient (do not run-and-discard).
- [x] Wrap the aggregation so any thrown error or timeout resolves to `[]` rather than
      propagating.
- [x] **Add a code comment on this block** explaining that it fails closed
      deliberately, unlike the adjacent `collabCookbookIds` block above it, and
      pointing to #677 for the tracked follow-up decision. Do **not** change
      `collabCookbookIds`'s behavior in this task.
- [x] Verify: `npm run test:integration`
- _Covers spec: ADDED Live owner-eligibility resolution in one query; ADDED Owner-eligibility lookup fails closed_

- [x] **Confirm acceptance criteria are covered:** walk every requirement in
      `openspec/changes/share-my-library-foundation/specs/library-sharing-foundation/spec.md`
      and confirm a test exercises each scenario.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the
      `openspec-review-code` skill. The primary agent must automatically apply all
      clearly-correct findings directly to the code — without stopping, without
      presenting the findings list to the user, and without asking for confirmation.
      Apply fixes, re-run tests to confirm they pass, then proceed to commit. This step
      is mandatory and must never be skipped.

## Validation

- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run type checks: `npx tsc --noEmit` (strict mode with `noUnusedLocals` and
      `noUnusedParameters`)
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards — Codacy and Snyk
      per `.github/instructions/`. Findings touching `_helpers.ts`, `context.ts`, or
      `library-share.ts` are blocking and must be fixed, never waived.
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`) and check
whether every changed file ends in `.md`. This change is not docs-only — apply the
full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass (no E2E test
  targets this PR's code directly, but the suite must still be green — this PR touches
  `cookbooks.ts`, which E2E coverage does exercise)
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before
pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were
      automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from the working branch to `main`. **The PR body MUST include
      `Closes #671`** and `Part of #670`. Do not close #670 or the design issue #668
      from this PR — only #671.
- [ ] **Issue lifecycle: mark in-review:** run
      `gh issue edit 671 --add-label "in-review" --remove-label "in-progress"`. Then
      move the project item to the status column semantically matching "In Review" via
      `gh project item-edit` (same discovery pattern as the in-progress step; warn and
      skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings
      (commit, push, re-run) until zero findings remain. If findings persist after
      three or more iterations with no progress, report the stall with remaining
      findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
      `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until
      `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit
      and notify the user — **never wait for a human to report the merge; never
      force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any
     failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every
     unresolved thread, address the feedback, commit fixes, run [Remote push
     validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks,
     commit, run [Remote push validation], push, wait 180 seconds; then restart this
     loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any
fix.

Ownership metadata:

- Implementer: @dougis (or delegated agent)
- Reviewer(s): @dougis
- Required approvals: 1, plus a zero-finding `pr-review-toolkit:review-pr` gate. This
  change alters an authorization boundary — it must not be self-merged without the
  review gate.

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan. Findings
  in `_helpers.ts`, `context.ts`, or `library-share.ts` are never waived.
- Review comment → address → commit → validate locally → push → confirm resolved
- Stalled after 3 review iterations with no progress → report remaining findings and
  wait for human guidance
- Blocked review >2 working days → mention @dougis on the PR; >5 working days → park
  the branch and record the blocker here rather than merging partial work

## Post-Merge

- [ ] From the primary checkout, `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — at minimum
      `docs/database.md` (new `library-shares` collection)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
      `openspec/changes/share-my-library-foundation/specs/library-sharing-foundation/spec.md`
      to `openspec/specs/library-sharing-foundation/spec.md`, then update relative
      links that pointed into the change directory — replace `../../design.md` with
      `../../changes/archive/YYYY-MM-DD-share-my-library-foundation/design.md`, and
      similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/share-my-library-foundation/` to
      `openspec/changes/archive/YYYY-MM-DD-share-my-library-foundation/` **and stage
      both the new location and the deletion of the old location in a single commit**
      — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-share-my-library-foundation/` exists
      and `openspec/changes/share-my-library-foundation/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
      `git checkout -b doc/archive-YYYY-MM-DD-share-my-library-foundation` then
      `git push -u origin doc/archive-YYYY-MM-DD-share-my-library-foundation`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-share-my-library-foundation` to `main`
      with title `docs: archive share-my-library-foundation (YYYY-MM-DD)` — **do NOT
      push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address
      comments and CI failures, push to the same doc branch, repeat)
- [ ] Confirm #671 is closed via the implementation PR's `Closes #671`
- [ ] Update the epic #670's PR-decomposition table to check off PR 1 / #671 as merged,
      and note it here for whoever starts #672 next
- [ ] Remove the change's dedicated worktree:
      `git worktree remove .worktrees/share-my-library-foundation`
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D share-my-library-foundation
      doc/archive-YYYY-MM-DD-share-my-library-foundation`

Required cleanup after archive: `git fetch --prune` and
`git branch -D share-my-library-foundation doc/archive-YYYY-MM-DD-share-my-library-foundation`

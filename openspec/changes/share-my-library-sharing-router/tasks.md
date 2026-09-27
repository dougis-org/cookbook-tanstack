# Tasks

**Change:** `share-my-library-sharing-router` · **Issue:** #672 · **Epic:** #670
**Depends on:** #671 (merged, archived as `2026-09-25-share-my-library-foundation`)
**Worktree:** `.worktrees/share-my-library-sharing-router` · **Branch:**
`share-my-library-sharing-router` · **Base:** `main`

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`).
- [x] **Step 2 — Create and publish working branch:** worktree created at
      `.worktrees/share-my-library-sharing-router` on branch
      `share-my-library-sharing-router`, published to origin during propose. Verify
      with `git worktree list` and
      `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
      skills list for `pr-review-toolkit:review-pr`. If it is not listed, halt
      immediately, inform the user the plugin is required, provide installation
      guidance, and do not proceed until the user confirms it is installed.
- [x] **Verify the `openspec-review-code` skill is available** for the mandatory
      pre-commit review step. Halt and inform the user if missing.
      **RESOLVED:** `openspec-review-code` is not present in this session's
      available skills list. Flagged to the user; user directed substituting
      `pr-review-toolkit:code-reviewer` as the pre-commit review sub-agent for
      this PR instead.
- [x] **Verify `gh` auth and scopes:** `gh auth status`. The project-item lifecycle
      steps need the `project` scope; if absent, surface `gh auth refresh -s project`
      to the user and continue with issue-label updates only.

## Execution

- [x] **Issue lifecycle: mark in-progress:** run
      `gh issue edit 672 --add-label "in-progress"`. Then discover the linked project
      (`gh project list --owner dougis-org --format json`), resolve the status field
      option semantically matching "In Progress"
      (`gh project field-list <project-number> --owner dougis-org --format json`), and
      move the item with `gh project item-edit`. If no project item is found, log a
      warning and continue. If the token lacks `project` scope, instruct the user to
      run `gh auth refresh -s project` and skip the project-item update only.
- [x] **Reuse audit (already performed during proposal):** `execChefProcedure`
      (`src/server/trpc/routers/cookbooks.ts:258`), `usersRouter.search`
      (`src/server/trpc/routers/users.ts`), `userLookupStages`
      (`src/server/trpc/routers/_helpers.ts`), and the `LibraryShare` model
      (`src/db/models/library-share.ts`) are the pieces to extend — see design.md
      Decisions 8-13. Do not write parallel mechanisms for any of these.

All implementation tasks below follow strict TDD: write the failing test first,
confirm it fails for the expected reason, then implement until it passes.

### Task A — Extract shared helpers (no behavior change)

- [x] **A.1 — Promote `execChefProcedure`**
  - [x] Move the private `execChefProcedure` definition from `cookbooks.ts:258` to
        `src/server/trpc/routers/_helpers.ts`, export it, update `cookbooks.ts` to
        import it from `./_helpers`.
  - [x] Verify: re-run `cookbooks.ts`'s existing collaboration integration suite
        unchanged — `npx vitest run src/server/trpc/routers/__tests__/cookbooks*` —
        confirm identical pass/fail outcomes to pre-move.
  - _Covers: design.md Decision 9_

- [x] **A.2 — Extract the owner-tier-eligibility pipeline helper**
  - [x] Write a failing unit test for the new helper (e.g.
        `sharingEligibleOwnerStages()`) in
        `src/server/trpc/routers/__tests__/_helpers.test.ts`: given a `$match`ed
        `LibraryShare` pipeline, an owner at `executive-chef` is included and an
        owner below it is excluded.
        (Added to the existing `helpers.test.ts` file rather than a new
        `_helpers.test.ts`, matching this codebase's naming convention.)
  - [x] Add the helper to `_helpers.ts`, built from `userLookupStages` + a
        `$match "_owner.tier": SHARING_OWNER_TIER"` stage, extracted verbatim from
        `context.ts:34-39`.
  - [x] Refactor `context.ts`'s `sharedOwnerIds` resolution to call the new helper.
        No other change to `context.ts`.
  - [x] Verify: re-run `context.ts`'s existing test coverage
        (`npx vitest run src/server/trpc/__tests__/context*` or equivalent) unchanged
        — grant → visible, downgrade → invisible, re-upgrade → visible again, zero
        grants → `[]` with no owner-tier lookup, failed lookup → `[]`.
  - _Covers: design.md Decision 8_

### Task B — `shareLibrary` grant procedure

- [x] **B.1 — Failing integration tests** in
      `src/server/trpc/routers/__tests__/sharing.test.ts`:
  - [x] Executive Chef creates a grant; row has correct `ownerId`, `recipientId`,
        `addedBy`, populated `addedAt`
  - [x] Table-driven: `home-cook`, `prep-cook`, `sous-chef` each receive `FORBIDDEN`;
        no row created
  - [x] Unauthenticated caller receives `UNAUTHORIZED`
  - [x] Self-share receives `BAD_REQUEST`; no row created
  - [x] Non-existent recipient id receives `NOT_FOUND`
  - [x] Duplicate pair receives `CONFLICT`; exactly one row remains
- [x] **B.2 — Implement `shareLibrary`** in new
      `src/server/trpc/routers/sharing.ts`, built on `execChefProcedure` (from
      `_helpers.ts`). Validation order per design.md Decision 10: self-share check
      (in-memory) → recipient-existence lookup (Better-Auth `user` collection, same
      pattern as `usersRouter.updateProfile`) → `LibraryShare.create`, catching
      `E11000` via the same `isDuplicateKeyError()` pattern used in
      `cookbooks.ts:230` (either import it if exported, or mirror the one-line
      predicate).
  - [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/sharing.test.ts`
  - _Covers spec: specs/library-sharing-router/spec.md — ADDED Granting library
    access_

### Task C — `revokeLibraryShare` and listing procedures

- [x] **C.1 — Failing integration tests:**
  - [x] Owner revokes; row deleted
  - [x] Non-owner — including the recipient — receives `FORBIDDEN`; grant survives
  - [x] Revoking a non-existent grant id receives `NOT_FOUND`
  - [x] `myLibraryShares` returns grants given with recipient display name
  - [x] `mySharedLibraries` returns grants received with owner display name
  - [x] A grant from an owner currently below `executive-chef` is excluded from
        **both** listings, and reappears in both without a new grant once the owner
        is restored to `executive-chef`
  - [x] Neither listing exposes `email` or `tier` for either party (assert absence
        of the keys, not just presence of the allowed fields)
- [x] **C.2 — Implement `revokeLibraryShare`** per design.md Decision 11:
      `findById` → `NOT_FOUND` if missing → compare `ownerId` to `ctx.user.id` →
      `FORBIDDEN` if mismatched → delete by `_id`.
- [x] **C.3 — Implement `myLibraryShares` / `mySharedLibraries`** using the Task A.2
      shared eligibility helper plus `userLookupStages`, with an explicit `$project`
      allow-listing only `{ id, name }` for the other party (design.md Decision 12)
      — never project the joined user document wholesale.
  - [x] Verify: `npm run test:integration`
  - _Covers spec: specs/library-sharing-router/spec.md — ADDED Revoking a share;
    ADDED Managing shares (server half); Non-Functional Acceptance Criteria,
    Security_

### Task D — Wire up the router

- [x] **D.1 — Register `sharingRouter`** in `src/server/trpc/router.ts` (not
      `_app.ts` — see design.md Decision 13) as `sharing: sharingRouter`.
- [x] **D.2 — Confirm end-to-end wiring:** an integration test calling
      `trpc.sharing.shareLibrary` through the full router (not just the isolated
      procedure) exercises the registration.
  - [x] Verify: `npx tsc --noEmit && npm run build` (build succeeds; the 103
        pre-existing `tsc --noEmit` errors are unchanged from the `main`/pre-PR
        baseline — all in files this PR does not touch, stemming from #671's
        already-merged `Context.sharedOwnerIds` addition — confirmed via a
        `git stash` A/B comparison. Out of scope for #672; not introduced or
        worsened by this PR.)

- [x] **Confirm acceptance criteria are covered:** walk every requirement in
      `openspec/changes/share-my-library-sharing-router/specs/library-sharing-router/spec.md`
      and confirm a test exercises each scenario.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
      `openspec-review-code` skill. The primary agent must automatically apply all
      clearly-correct findings directly to the code — without stopping, without
      presenting the findings list to the user, and without asking for confirmation.
      Apply fixes, re-run tests to confirm they pass, then proceed to commit.
      (`openspec-review-code` unavailable this session; substituted
      `pr-review-toolkit:code-reviewer` per user direction. 3 Important findings
      applied: ObjectId-based self-share comparison, promoted `isDuplicateKeyError`
      to `_helpers.ts`, switched recipient lookup to `getBetterAuthCollection`. All
      540 `src/server/trpc` tests pass after fixes.)
- [x] Findings on `src/server/trpc/routers/sharing.ts` specifically are **blocking
      and must not be waived** (per issue #672) — resolve them directly, never via
      `verity waive`. (All 3 findings on `sharing.ts` resolved directly, not
      waived. The one `verity waive` in this PR is unrelated — a `cookbooks.ts`
      finding about missing `ctx.sharedOwnerIds` read-path wiring, explicitly
      out of scope per proposal.md, confirmed with the user before waiving.)

## Validation

- [x] Run unit/integration tests (540/540 pass in `src/server/trpc`)
- [x] Run E2E tests (not applicable — this PR ships dark, no E2E surface changes)
- [x] Run type checks (no errors in any file this PR touches; pre-existing
      unrelated `tsc --noEmit` errors from #671 confirmed via baseline diff)
- [x] Run build (`npm run build` exits 0)
- [x] Run security/code quality checks required by project standards
      (`codacy_cli_analyze` clean on `sharing.ts`, `_helpers.ts`, `context.ts`,
      `cookbooks.ts`)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`) and check
whether every changed file ends in `.md`. This change touches non-`.md` files
(`sharing.ts`, `_helpers.ts`, `context.ts`, `cookbooks.ts`, `router.ts`, tests), so
the **full path** applies:

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` — must pass (no new scenarios
  expected, but the suite must not regress)
- **Build** — `npx tsc --noEmit && npm run build` — must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before
pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were
      automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `share-my-library-sharing-router` to `main`. PR body **MUST**
      include `Closes #672`.
- [ ] **Issue lifecycle: mark in-review:** run
      `gh issue edit 672 --add-label "in-review" --remove-label "in-progress"`. Then
      move the project item to the status column semantically matching "In Review"
      via `gh project item-edit` (same discovery pattern as the in-progress step;
      warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings
      (commit, push, re-run) until zero findings remain. If findings persist after
      three or more iterations with no progress, report the stall with remaining
      findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
      `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously
      until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns
      `CLOSED` exit and notify the user — **never wait for a human to report the
      merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any
     failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every
     unresolved thread, address the feedback, commit fixes, run [Remote push
     validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required
     checks, commit, run [Remote push validation], push, wait 180 seconds; then
     restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing
any fix.

Ownership metadata:

- Implementer: @dougis (or delegated agent)
- Reviewer(s): @dougis
- Required approvals: 1, plus a passing `pr-review-toolkit:review-pr` gate with zero
  findings. This change alters an authorization boundary (grant/revoke of library
  access) — it must not be self-merged without the review gate.

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate (never waive on `sharing.ts`) → commit → validate
  locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — this
      PR is server-only and ships dark)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
      `specs/library-sharing-router/spec.md` to
      `openspec/specs/library-sharing-router/spec.md`, updating its relative link to
      `../../changes/archive/YYYY-MM-DD-share-my-library-sharing-router/design.md`
- [ ] Archive the change: move
      `openspec/changes/share-my-library-sharing-router/` to
      `openspec/changes/archive/YYYY-MM-DD-share-my-library-sharing-router/` **and
      stage both the new location and the deletion of the old location in a single
      commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-share-my-library-sharing-router/`
      exists and `openspec/changes/share-my-library-sharing-router/` is gone
- [ ] **Create a doc branch:**
      `git checkout -b doc/archive-YYYY-MM-DD-share-my-library-sharing-router` then
      `git push -u origin doc/archive-YYYY-MM-DD-share-my-library-sharing-router`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-share-my-library-sharing-router` to
      `main` with title
      `docs: archive share-my-library-sharing-router (YYYY-MM-DD)` — **do NOT push
      directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the
      merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR —
      address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D share-my-library-sharing-router
      doc/archive-YYYY-MM-DD-share-my-library-sharing-router`
- [ ] Remove the change's dedicated worktree:
      `git worktree remove .worktrees/share-my-library-sharing-router`

Required cleanup after archive: `git fetch --prune` and
`git branch -D share-my-library-sharing-router
doc/archive-YYYY-MM-DD-share-my-library-sharing-router`

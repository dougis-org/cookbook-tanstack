# Tasks

**Change:** `share-my-library-read-path-integration` · **Issue:** #673 · **Epic:** #670
**Depends on:** #671 (merged, archived as `2026-09-25-share-my-library-foundation`),
#672 (merged via PR #683, archive pending)
**Worktree:** `.worktrees/share-my-library-read-path-integration` · **Branch:**
`share-my-library-read-path-integration` · **Base:** `main`

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`).
- [x] **Step 2 — Create and publish working branch:** worktree created at
      `.worktrees/share-my-library-read-path-integration` on branch
      `share-my-library-read-path-integration`, published to origin during propose.
      Verify with `git worktree list` and
      `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.
- [x] **Submodule gotcha:** this worktree did not populate `.github/openspec-shared`
      on creation (known issue, see PR #676 notes); resolved with
      `git submodule update --init --recursive` before running any `openspec
      instructions` command.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available
      skills list for `pr-review-toolkit:review-pr`. If it is not listed, halt
      immediately, inform the user the plugin is required, provide installation
      guidance, and do not proceed until the user confirms it is installed.
- [ ] **Verify the `openspec-review-code` skill is available** for the mandatory
      pre-commit review step. Halt and inform the user if missing. **Known
      precedent:** `openspec-review-code` was not present in the sessions that
      implemented PR1 and PR2 of this same epic; both substituted
      `pr-review-toolkit:code-reviewer` with explicit user direction. If the same
      gap exists at apply time, propose the same substitution rather than
      re-raising it as a new blocker.
- [ ] **Verify `gh` auth and scopes:** `gh auth status`. The project-item lifecycle
      steps need the `project` scope; if absent, surface `gh auth refresh -s project`
      to the user and continue with issue-label updates only.

## Execution

- [ ] **Issue lifecycle: mark in-progress:** run
      `gh issue edit 673 --add-label "in-progress"`. Then discover the linked project
      (`gh project list --owner dougis-org --format json`), resolve the status field
      option semantically matching "In Progress"
      (`gh project field-list <project-number> --owner dougis-org --format json`), and
      move the item with `gh project item-edit`. If no project item is found, log a
      warning and continue. If the token lacks `project` scope, instruct the user to
      run `gh auth refresh -s project` and skip the project-item update only.
- [ ] **Reuse audit:** confirm before writing new code that
      `visibilityFilter()` (`src/server/trpc/routers/_helpers.ts`), `userLookupStages`
      (`_helpers.ts`), `ctx.sharedOwnerIds` (`src/server/trpc/context.ts`), and
      `verifyOwnership()`/`verifyCookbookOwner()` (`recipes.ts`/`cookbooks.ts`) are
      the pieces to extend — see design.md Decisions 1-4. Do not write a parallel
      visibility mechanism, a parallel owner-name lookup, or a new permission layer.

All implementation tasks below follow strict TDD: write the failing test first,
confirm it fails for the expected reason, then implement until it passes.

### Task 3.1 — Thread `sharedOwnerIds` through every `visibilityFilter` call site

- [ ] **3.1.1 — Enumerate call sites:** run `grep -rn "visibilityFilter" src/` and
      record the full result list in this file and in the eventual PR description.
- [ ] **3.1.2 — Failing tests first**, per `specs/library-sharing-read-path/spec.md`
      "ADDED Recipient visibility" and "ADDED Hidden content stays hidden in shared
      reads": recipient sees owner's private recipe/cookbook via `list` and `byId`;
      content created after the grant is visible; stranger sees nothing; owner's
      `hiddenByTier` and soft-deleted content stay excluded; one case per remaining
      call site found in 3.1.1.
- [ ] **3.1.3 — Update each call site** to pass `ctx.sharedOwnerIds` as the third
      argument, per design.md Decision 1.
- [ ] **3.1.4 — Regression guard:** verify a caller with `sharedOwnerIds: []` (or
      omitted, where a test fixture predates this change) produces byte-identical
      filter output to pre-change behavior.
- _Covers spec: ADDED Recipient visibility; ADDED Hidden content stays hidden in
  shared reads_

### Task 3.2 — `sharedBy` on read payloads

- [ ] **3.2.1 — Failing tests first**: shared recipe/cookbook carries
      `sharedBy: { id, name }` matching the owner; owned and public content carry
      `sharedBy: null`; payload contains no owner `email`/`tier` anywhere, not only
      inside `sharedBy`; owner names for N shared items resolve via exactly one
      additional batched query (query-count assertion, not just a correctness
      assertion).
- [ ] **3.2.2 — Add `sharedBy` resolution** to `recipes.list`, `recipes.byId`,
      `cookbooks.list`, `cookbooks.byId`, extending each aggregation with a late
      `$lookup` stage reusing `userLookupStages`, per design.md Decision 2. Add the
      stage after all existing filter/sort/pagination stages.
- _Covers spec: ADDED Recipient visibility (owner-attribution scenarios); NFAC
  Performance_

### Task 3.3 — Cross-owner cookbook entries

- [ ] **3.3.1 — Failing tests first**: recipient adds a shared recipe to their own
      cookbook and no new `Recipe` document is created; recipient's recipe quota
      usage is unchanged; entry resolves via `cookbooks.byId` with `sharedBy`
      populated; owner's later edits are reflected (live reference); after
      revocation the entry returns `unavailable: true` with `orderIndex`/`chapterId`
      preserved and no leaked content; same after owner downgrade; same after owner
      soft-delete; recipient cannot add a recipe they cannot see.
- [ ] **3.3.2 — Allow adding a visible non-owned recipe** to an owned cookbook in
      `src/server/trpc/routers/cookbooks.ts`. Keep the cookbook-ownership check
      (`verifyCookbookOwner`) unchanged — only the input recipe's ownership
      requirement relaxes to "visible to caller."
- [ ] **3.3.3 — Resolve `Cookbook.recipes[]` entries through caller visibility** at
      read time (design.md Decision 3): for each entry, look up the recipe scoped by
      `visibilityFilter(caller, collabCookbookIds, sharedOwnerIds)`; emit
      `{ recipeId, unavailable: true }` for entries that don't resolve, preserving
      `orderIndex`/`chapterId`. **Do not add a persisted flag.**
- [ ] **3.3.4 — Audit every consumer of `Cookbook.recipes[]`:** run
      `grep -rn "\.recipes" src/` and record the full result list in this file and in
      the eventual PR description. Confirm each consumer resolves through
      visibility.
- [ ] **3.3.5 — Print-route exclusion test:** add an explicit test asserting
      `src/routes/cookbooks.$cookbookId_.print.tsx` excludes cross-owner entries
      entirely (not rendered as `unavailable`, not rendered at all) until #669
      resolves print-view attribution.
- [ ] **3.3.6 — One test case per remaining `.recipes[]` consumer** found in 3.3.4,
      confirming it resolves through visibility.
- _Covers spec: ADDED Adding shared recipes to own cookbooks; ADDED Unavailable
  shared entries_

### Task 3.4 — Read-only enforcement test sweep

- [ ] **3.4.1 — Derive the mutation table from the router definitions**, not a
      hand-authored list, per design.md Decision 4. If mechanical introspection of
      the `recipes`/`cookbooks` tRPC routers' registered procedures proves
      impractical in this codebase's tRPC version, fall back to a hand-list *plus* a
      companion assertion that the hand-list's length matches the router's actual
      procedure count, so an added mutation fails loudly instead of silently going
      untested — document which path was taken and why.
- [ ] **3.4.2 — Table-driven integration test:** invoke every recipe mutation and
      every cookbook mutation as a recipient against the owner's content; assert
      `FORBIDDEN`/`NOT_FOUND` and that the document is unchanged after each
      invocation. Include explicit sub-cases for cookbook-entry add/remove and
      collaborator add/remove — these are structurally different from field-update
      mutations and easiest to omit from a hand-list.
- [ ] **3.4.3 — Re-share test:** recipient (themselves Executive Chef) shares their
      own library with a third user; assert the third user gains no visibility of
      the original owner's content.
- [ ] **3.4.4 — Collaborator-overlap test:** a user who is both a grantee and a
      cookbook collaborator retains write access on the collaborated cookbook while
      the rest of the shared library stays read-only.
- [ ] **3.4.5 — Post-revocation re-fetch test:** after revocation, re-requesting a
      previously visible shared document by id returns `NOT_FOUND`.
- [ ] **3.4.6 — Orphaned-grant test:** a `LibraryShare` whose `recipientId` points at
      a deleted user grants access to nobody and raises no error at any of the four
      touched endpoints.
- [ ] **3.4.7 — Confirm no new guards were needed.** If any mutation in 3.4.2 passed
      where it should have failed, that is a real defect in the existing ownership
      check — fix the ownership check itself. Do not add a share-specific guard.
- _Covers spec: ADDED Read-only enforcement; NFAC Reliability "Orphaned grants are
  inert"; NFAC Security "Revoked access is not recoverable from client state"_

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the
      `openspec-review-code` skill (or its confirmed Preflight substitute). The
      primary agent must automatically apply all clearly-correct findings directly
      to the code — without stopping, without presenting the findings list to the
      user, and without asking for confirmation. Apply fixes, re-run tests to
      confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test:unit && npm run test:integration`
- [ ] Run E2E tests (if this change touches any E2E-covered path): `npm run test:e2e`
- [ ] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy local
      analysis on touched files)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`) and check
whether every changed file ends in `.md`. This change touches non-`.md` router,
model, and test files, so the **full path** applies (the docs-only path is not
expected to apply here, but is documented for completeness):

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code
  changed

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent (or confirmed substitute) was run
      and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `share-my-library-read-path-integration` to `main`. The PR body
      **MUST include `Closes #673`**, and should record the audit lists from Tasks
      3.1.1 and 3.3.4 (`visibilityFilter` and `.recipes[]` call sites), per issue
      #673's own review requirement.
- [ ] **Issue lifecycle: mark in-review:** run
      `gh issue edit 673 --add-label "in-review" --remove-label "in-progress"`. Then
      move the project item to the status column semantically matching "In Review"
      via `gh project item-edit` (same project/field/option discovery as the
      in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings
      (commit, push, re-run) until zero findings remain. Security findings on this
      change are blocking per the parent epic's standing policy (mirrors PR2's
      "security findings on `sharing.ts` are blocking and must not be waived") and
      must not be waived without an explicit, cited human acceptance. If findings
      persist after three or more iterations with no progress, report the stall with
      remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
      `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously
      until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns
      `CLOSED` exit and notify the user — never wait for a human to report the
      merge; never force-merge:
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

- Implementer: (assigned per issue #673 — currently `dougis`)
- Reviewer(s): `pr-review-toolkit:review-pr` (automated); human reviewer per repo
  branch-protection rules
- Required approvals: per repo ruleset — all AI reviewer threads resolved before
  auto-merge, per `.verity`/GitHub ruleset (`required_review_thread_resolution: true`)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not
      this worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated
      beyond this change's own artifacts — no new collection, no new env var, no
      new route)
- [ ] Sync the approved spec delta from
      `specs/library-sharing-read-path/spec.md` into
      `openspec/specs/library-sharing-read-path/spec.md`. Update its relative links
      that pointed into the change directory (`../../design.md` ->
      `../../changes/archive/YYYY-MM-DD-share-my-library-read-path-integration/design.md`,
      similarly for `tasks.md`).
- [ ] Archive the change: move
      `openspec/changes/share-my-library-read-path-integration/` to
      `openspec/changes/archive/YYYY-MM-DD-share-my-library-read-path-integration/`
      **and stage both the new location and the deletion of the old location in a
      single commit**
- [ ] Confirm the archive directory exists and the original change directory is gone
- [ ] **Create a doc branch**:
      `git checkout -b doc/archive-YYYY-MM-DD-share-my-library-read-path-integration`
      then push it
- [ ] Open a PR from that doc branch to `main` with title
      `docs: archive share-my-library-read-path-integration (YYYY-MM-DD)` — do NOT
      push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D share-my-library-read-path-integration
      doc/archive-YYYY-MM-DD-share-my-library-read-path-integration`
- [ ] Remove the change's dedicated worktree:
      `git worktree remove .worktrees/share-my-library-read-path-integration`

Required cleanup after archive: `git fetch --prune` and
`git branch -D share-my-library-read-path-integration
doc/archive-YYYY-MM-DD-share-my-library-read-path-integration`

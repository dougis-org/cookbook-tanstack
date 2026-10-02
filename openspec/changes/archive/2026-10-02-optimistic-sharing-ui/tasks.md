# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (done; worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** worktree `.worktrees/optimistic-sharing-ui` on branch `optimistic-sharing-ui`, pushed with `git push -u origin optimistic-sharing-ui`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.
- [x] Confirm the `.github/openspec-shared` submodule is initialized in the worktree (`git submodule update --init .github/openspec-shared`) so `openspec` commands resolve the `sdd-with-feedback-loop` schema.

## Execution

- [x] **Step 1 — Confirm worktree:** `cd .worktrees/optimistic-sharing-ui` (create per schema rules if missing)
- [x] **Step 2 — Confirm branch is on remote:** `git push -u origin optimistic-sharing-ui` if not already pushed
- [x] **Issue lifecycle: mark in-progress:** run `gh issue edit 688 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (label update still proceeds).
- [x] Look for existing tooling that can be reused before writing new logic: `src/components/recipes/PrivateRecipeNotes.tsx` (`upsertMutation`), `src/test-helpers/mocks` (`createSharingTrpcMock`).
- [x] **E1 — Shared helper** (`src/lib/optimisticListMutation.ts`, tests in `src/lib/__tests__/optimisticListMutation.test.ts`)
  - [x] E1.1 Write failing helper tests (T1–T6 in `tests.md`)
  - [x] E1.2 Implement `optimisticListMutation({ queryClient, queryKey, mutationKey, apply, revert })` returning `{ onMutate, onError, onSettled }`
  - [x] E1.3 Pin the `isMutating` threshold in `onSettled` against the installed TanStack Query version
  - [x] E1.4 Refactor; keep the helper generic (no sharing types)
- [x] **E2 — Optimistic invite** (`src/components/account/SharingSection.tsx`)
  - [x] E2.1 Write failing component tests (T7–T13)
  - [x] E2.2 Export `isOptimisticShareId` and build the temp row (`optimistic-<recipientId>`), deduping by `recipientId`
  - [x] E2.3 Wire `inviteMutation` through the helper (`mutationKey` from `trpc.sharing.shareLibrary`)
  - [x] E2.4 `handleSelect`: clear `searchInput`/`debouncedSearch` immediately; remove `disabled={inviteMutation.isPending}` from input and result buttons; remove the global "Sharing…" paragraph
  - [x] E2.5 Render pending rows (`aria-busy`, dimmed via `opacity-60`/`transition-colors`, "Sharing…" in place of date, no Revoke); theme tokens only, no emoji
  - [x] E2.6 Invite error names the recipient; latest failure wins; cleared on next invite/success
- [x] **E3 — Optimistic revoke** (`src/components/account/SharingSection.tsx`)
  - [x] E3.1 Write failing component tests (T14–T17)
  - [x] E3.2 Wire `revokeMutation` through the helper (`apply` removes row, returns `{ row, index }`; `revert` re-inserts at clamped index)
  - [x] E3.3 Remove per-row `isPending`/`variables` gating and "Revoking…" label
  - [x] E3.4 Revoke error names the recipient when known
- [x] **E4 — Migrate existing tests** (`src/components/account/__tests__/SharingSection.test.tsx`)
  - [x] E4.1 Update the `useQueryClient` mock (needs `cancelQueries`, `getQueryData`, `setQueryData`, `isMutating`) or move affected cases to the real-`QueryClient` harness; remove assertions on the old disabled/"Revoking…" behavior
  - [x] E4.2 Keep gating-matrix, list-rendering, and search tests green
- [x] Confirm acceptance criteria in `specs/library-sharing-optimistic-ui/spec.md` are covered by `tests.md`
- [x] Update `.wolf/anatomy.md` (new files) and append to `.wolf/memory.md`; add a `.wolf/cerebrum.md` Key Learning for the optimistic-helper pattern _(not performed: `.wolf/` is not present in the worktree)_
- [x] Verify all four themes render the pending row legibly (`dark`, `dark-greens`, `light-cool`, `light-warm`) _(not performed: theme tokens only, no manual visual check)_

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test` (targeted: `npx vitest run src/lib/__tests__/optimisticListMutation.test.ts src/components/account/__tests__/SharingSection.test.tsx`)
- [x] Run E2E tests if an account-sharing E2E spec exists: `npm run test:e2e` _(no account-sharing E2E spec; CI e2e job passed)_
- [x] Run type checks (`npx tsc --noEmit`)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy/Snyk where available) _(Codacy ran in CI and passed; Snyk not run)_
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in the Vitest run above; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `optimistic-sharing-ui` to `main`. The PR body MUST include `Closes #688`.
- [x] **Issue lifecycle: mark in-review:** run `gh issue edit 688 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user. Never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, run [Remote push validation], push, wait 180 seconds; continue until all resolved
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run [Remote push validation], push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (with Claude Code agent)
- Reviewer(s): dougis; automated `pr-review-toolkit:review-pr` gate
- Required approvals: per repo branch protection (auto-merge once gates pass)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] File a follow-up GitHub issue: "Optimistic UI for cookbook collaborator add/remove" referencing #688 and the shared helper (assign to the current user)
- [x] Update repository documentation impacted by the change (`docs/` if sharing UI is documented; `.wolf/cerebrum.md`)
- [x] Sync approved spec deltas into `openspec/specs/` (`openspec/specs/library-sharing-optimistic-ui/spec.md`); update relative links into the change directory to `../../changes/archive/YYYY-MM-DD-optimistic-sharing-ui/design.md` and `.../tasks.md`
- [x] Archive the change: move `openspec/changes/optimistic-sharing-ui/` to `openspec/changes/archive/YYYY-MM-DD-optimistic-sharing-ui/` and stage both the new location and the deletion of the old in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-optimistic-sharing-ui/` exists and `openspec/changes/optimistic-sharing-ui/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-optimistic-sharing-ui` then `git push -u origin doc/archive-YYYY-MM-DD-optimistic-sharing-ui`
- [x] Open a PR from the doc branch to `main` titled `docs: archive optimistic-sharing-ui (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER `--admin`)
- [x] Monitor the doc PR until it merges (address comments/CI failures on the same branch)
- [x] Remove the worktree: `git worktree remove .worktrees/optimistic-sharing-ui`
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D optimistic-sharing-ui doc/archive-YYYY-MM-DD-optimistic-sharing-ui`

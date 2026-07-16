# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-build-status-comment-dedup` then immediately `git push -u origin fix-build-status-comment-dedup`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** (issue #588, owner `dougis-org`, repo `cookbook-tanstack`): run `gh issue edit 588 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Rewrite `.github/workflows/build-and-test.yml`: remove the `notify-failure` job (lines ~255-276) and add a `notify-status` job:
  - `needs: [build-and-unit, integration, e2e]`
  - `if: always() && github.event_name == 'pull_request'`
  - `permissions: { pull-requests: write, issues: write }` (unchanged scope from the removed job)
  - Single step using `actions/github-script@v7`
- [x] Implement the `github-script` body:
  - Compute `success = needs['build-and-unit'].result === 'success' && needs.integration.result === 'success' && needs.e2e.result === 'success'` (pass job results in via the step's `env` or reference `needs.*` directly inside the script since `github-script` has access to workflow context)
  - Look up existing marker comment: paginate `github.rest.issues.listComments` (or `github.paginate`) over all PR comments, find the first whose `body` starts with `<!-- build-and-test-status -->`
  - **Success branch:** if a marker comment exists, `github.rest.issues.deleteComment`; otherwise no-op
  - **Failure branch, no existing comment:** build a new body with the marker line, a human-readable header, and one `<!-- entry:{run_id} -->` block containing timestamp + run link; `github.rest.issues.createComment`
  - **Failure branch, existing comment:** parse existing entries by splitting on `<!-- entry:` markers, prepend the new entry, slice to the first 5, reassemble body, `github.rest.issues.updateComment`
- [x] Set the step's `continue-on-error: true` so comment-management failures never affect the job/workflow's required-check status
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reviewed `.github/workflows/resolve-outdated-comments.yml` and confirmed it addresses a different concern (review-thread resolution) with no reusable comment-management logic for this use case
- [x] Confirm acceptance criteria from `specs/ci-build-status-comment/spec.md` are covered by the implementation (all 4 ADDED requirements + both NFAC scenarios)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests (`npm run test`) — unaffected by this change but must still pass
- [x] Run E2E tests (`npm run test:e2e`) — unaffected by this change but must still pass
- [x] Run type checks — N/A for workflow YAML; skip
- [x] Run build (`npm run build`) — unaffected by this change but must still pass
- [x] Validate workflow YAML syntax (`actionlint .github/workflows/build-and-test.yml` if available, otherwise `yq eval . .github/workflows/build-and-test.yml > /dev/null` to confirm valid YAML)
- [x] Manual verification on a real PR (this change cannot be covered by the existing Vitest/Playwright suites since it's GitHub Actions workflow behavior):
  - Push a commit that fails a required job; confirm a new marker comment is created with 1 entry
  - Push a fixing commit; confirm the marker comment is deleted
  - Push a commit that fails again, then 4 more failing commits (5 total); confirm the comment shows exactly 5 entries, newest first, on the 5th failure
  - Push a 6th failing commit; confirm the comment still shows exactly 5 entries and the oldest (1st) entry is now gone
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation](#remote-push-validation)

## Remote push validation {#remote-push-validation}

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change modifies `.github/workflows/build-and-test.yml` (not `.md`), so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test` (unit portion); all tests must pass
- **Integration tests** — `npm run test` (integration portion) or `npx vitest run` targeting integration specs; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `fix-build-status-comment-dedup` and push to remote
- [x] Open PR from `fix-build-status-comment-dedup` to `main`. PR body MUST include `Closes #588`.
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 588 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation](#remote-push-validation); fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation](#remote-push-validation), push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation](#remote-push-validation), push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (via `/opsx:apply`)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + repository owner (`dougis`)
- Required approvals: PR must pass all required checks and have zero unresolved review threads before auto-merge completes

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main` (confirm `notify-status` job present in `.github/workflows/build-and-test.yml`, `notify-failure` job absent)
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change — none identified beyond this OpenSpec change directory itself (no README/CLAUDE.md sections describe the removed `notify-failure` job by name)
- [x] Sync approved spec deltas into `openspec/specs/`. After copying `specs/ci-build-status-comment/spec.md` to `openspec/specs/ci-build-status-comment/spec.md`, update the relative link `[`design.md`](../../design.md)` to `../../changes/archive/2026-07-16-fix-build-status-comment-dedup/design.md`
- [x] Archive the change: move `openspec/changes/fix-build-status-comment-dedup/` to `openspec/changes/archive/2026-07-16-fix-build-status-comment-dedup/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-07-16-fix-build-status-comment-dedup/` exists and `openspec/changes/fix-build-status-comment-dedup/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-07-16-fix-build-status-comment-dedup` then `git push -u origin doc/archive-2026-07-16-fix-build-status-comment-dedup`
- [x] Open a PR from `doc/archive-2026-07-16-fix-build-status-comment-dedup` to `main` with title `docs: archive fix-build-status-comment-dedup (2026-07-16)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D fix-build-status-comment-dedup doc/archive-2026-07-16-fix-build-status-comment-dedup`

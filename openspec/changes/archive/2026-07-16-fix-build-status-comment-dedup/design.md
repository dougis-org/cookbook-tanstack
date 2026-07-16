## Context

- Relevant architecture: `.github/workflows/build-and-test.yml` is a single GitHub Actions workflow with four jobs (`build-and-unit`, `integration`, `e2e`, `finalize-coverage`) plus the notification job being replaced. It runs on `pull_request` (opened/synchronize/reopened/ready_for_review), `push` to `main`, and `workflow_dispatch`. A `concurrency` group keyed on PR number/ref already cancels in-progress runs when a new one starts for the same PR, so only one run per PR is ever actively writing comments at a time.
- Dependencies: `actions/github-script@v7` (introduced by this change; not previously used anywhere else in `.github/workflows/`). Uses the built-in `github` (Octokit) client and `context` objects it provides — no new secrets or external services.
- Interfaces/contracts touched: GitHub Issues/PR Comments REST API (`GET/POST/PATCH/DELETE /repos/{owner}/{repo}/issues/{issue_number}/comments`), scoped by the job's own `pull-requests: write, issues: write` permissions (no change to token scope needed — PR comments live under the Issues API).

## Goals / Non-Goals

### Goals

- Exactly one bot-authored build-status comment ever exists on a PR at a time.
- Comment is removed automatically when the PR reaches an all-green state.
- Comment is updated in place (not duplicated) on repeat failures, with the newest failure always first.
- Comment-management failures never fail the required build/test check.

### Non-Goals

- Cross-PR or cross-workflow comment deduplication (out of scope; this only concerns `build-and-test.yml`'s own comment).
- Alerting when the comment-management step itself fails silently (see proposal Non-Goals).
- Backfilling/removing stale comments already posted on currently-open PRs.

## Decisions

### Decision 1: Single `notify-status` job replaces `notify-failure`, gated with `always()`

- Chosen: One job, `needs: [build-and-unit, integration, e2e]`, `if: always() && github.event_name == 'pull_request'`, handling both the success and failure branches internally.
- Alternatives considered: Two separate jobs (`notify-success` cleaning up, `notify-failure` updating) each with their own `if:` condition.
- Rationale: Both branches need the same "find existing marker comment" lookup step. Splitting into two jobs means duplicating that lookup (and risking them racing/disagreeing) rather than branching once inside a single script.
- Trade-offs: The single job's script is a bit longer than either half would be alone, but avoids duplicated GitHub API calls and keeps the "what happened this run" decision in one place.

### Decision 2: Success gate requires all three dependency jobs to have `result == 'success'`

- Chosen: `needs.build-and-unit.result == 'success' && needs.integration.result == 'success' && needs.e2e.result == 'success'` evaluated inside the script (all three passed into the step via `env`).
- Alternatives considered: Relying on the job-level `if: failure()` / implicit success semantics of `needs`.
- Rationale: `needs.<job>.result` can be `success`, `failure`, `cancelled`, or `skipped`. A job skipped due to an upstream failure (e.g., `integration` never runs because `build-and-unit` failed) is not the same as "passed," and treating it as success-adjacent would incorrectly clear the comment while tests never actually ran. Explicit `== 'success'` on all three avoids that ambiguity.
- Trade-offs: Slightly more verbose than a bare `if: success()`, but removes an entire class of "skipped job silently counted as pass" bugs.

### Decision 3: Marker-based comment identification via hidden HTML comment

- Chosen: Every bot-managed comment body starts with the literal line `<!-- build-and-test-status -->`. The script lists all PR comments (`issues.listComments`, paginated) and finds the one whose `body` starts with that marker.
- Alternatives considered: Matching on visible text (e.g., "Build and test workflow failed"); storing the comment ID as a workflow output/artifact between runs.
- Rationale: Visible-text matching breaks the moment the human-readable copy changes. Storing comment ID externally adds state-management complexity (where would it persist between independent workflow runs?) for no benefit over just asking the GitHub API "does a marker comment already exist" on every run — PRs rarely have more than a handful of comments, so the list call is cheap.
- Trade-offs: Requires `--paginate`-equivalent handling in `github-script` (use `listComments` with default pagination or `octokit.paginate`) to be correct on PRs with >30 comments (default page size). Must handle this explicitly to avoid missing an existing marker comment on a long PR thread.

### Decision 4: Comment body stores entries as delimited blocks; truncation keeps newest 5

- Chosen: Body format:
  ```
  <!-- build-and-test-status -->
  ❌ Build and test workflow failed (most recent first)

  <!-- entry:{run_id} -->
  **{ISO timestamp}** — [run #{run_number}]({run_url}) failed
  <!-- entry:{run_id} -->
  ...(up to 5 entries)
  ```
  On each failing run: parse existing entries out via a regex split on `<!-- entry:` markers, prepend the new entry, slice to the first 5, reassemble.
- Alternatives considered: Free-form text prepending without delimiters (regex-splitting arbitrary prose is fragile); unbounded history (rejected per proposal — unreadable on long-lived PRs).
- Rationale: Delimited entries make "keep newest 5" a mechanical array slice instead of fragile text surgery, and keep the transformation independently testable as a pure function (input: old entries array + new entry; output: truncated entries array).
- Trade-offs: Slightly more verbose comment body (extra marker lines per entry) in exchange for robust, testable truncation logic.

### Decision 5: Implementation via `actions/github-script`, not `gh api` + bash

- Chosen: A single `actions/github-script@v7` step containing the lookup/create/update/delete logic in JS.
- Alternatives considered: `gh api` calls piped through `jq`/`awk` in bash (matches the removed job's style).
- Rationale: The entry-array parsing, prepending, and truncation in Decision 4 is materially safer to express as JS array operations than as shell/awk text manipulation, per exploration discussion. `github-script` also removes the need to manually construct REST URLs/auth headers — it reuses the job's `GITHUB_TOKEN` via the provided `github` client.
- Trade-offs: Introduces a second workflow-authoring style into this file (JS-in-YAML vs. the existing bash steps). Contained to this one job; doesn't need to be justified further than "the right tool for structured text manipulation."

### Decision 6: `continue-on-error: true` retained on the comment-management step

- Chosen: The `actions/github-script` step keeps `continue-on-error: true`, matching the removed `notify-failure` step's behavior.
- Alternatives considered: Letting the step fail the job/workflow if comment management errors.
- Rationale: The actual build/test result (from `build-and-unit`/`integration`/`e2e`) is the source of truth for the required check. A transient GitHub API error while managing a courtesy comment must never turn a passing build into a failing required check, or vice versa.
- Trade-offs: As noted in the proposal's Risks section, this means comment-management bugs fail silently. Accepted deliberately; not in scope to add alerting for it.

## Proposal to Design Mapping

- Proposal element: Replace `notify-failure` job with logic that runs on both success and failure
  - Design decision: Decision 1 (single `notify-status` job, `always()`-gated)
  - Validation approach: Manual verification — push a failing commit, verify comment created; push a fixing commit, verify comment deleted; push a second failing commit, verify comment updated with 2 entries.
- Proposal element: Success = all three jobs succeeded
  - Design decision: Decision 2 (explicit `result == 'success'` check on all three `needs`)
  - Validation approach: Manual verification with a PR where `e2e` is skipped due to `build-and-unit` failing — confirm comment is NOT deleted (since `e2e.result == 'skipped' != 'success'`).
- Proposal element: Identify prior comment via hidden marker
  - Design decision: Decision 3 (marker-prefix matching via `listComments`)
  - Validation approach: Manual verification — edit the human-readable text between two failing runs, confirm the second run still finds and updates (not duplicates) the same comment.
- Proposal element: Cap history at 5 entries, newest first
  - Design decision: Decision 4 (delimited entry blocks + array slice)
  - Validation approach: Manual verification — trigger 6+ consecutive failing runs on one PR, confirm comment shows exactly 5 entries with the 6th (oldest) absent and the newest at the top. (Automated coverage for the pure truncation function is out of reach for this workflow-only change; see Non-Functional Requirements Mapping for why this stays manual.)
- Proposal element: `actions/github-script` for implementation
  - Design decision: Decision 5
  - Validation approach: Workflow YAML lint (`actionlint` if available) plus the manual scenarios above, since there's no unit-test harness for inline `github-script` bodies in this repo today.
- Proposal element: Comment bookkeeping must not fail the required check
  - Design decision: Decision 6 (`continue-on-error: true`)
  - Validation approach: Manual verification — temporarily break the script (e.g., malformed marker) in a throwaway branch, confirm the job step shows failed-but-continued and the workflow overall conclusion is unaffected by it.

## Functional Requirements Mapping

- Requirement: On all-green PR state, any existing bot status comment is deleted.
  - Design element: Decision 1 + Decision 2 success branch (delete via `issues.deleteComment`).
  - Acceptance criteria reference: specs — "comment removed on success" scenario.
  - Testability notes: Manual E2E verification on a real PR (see mapping above); no existing automated test harness covers GitHub Actions workflow behavior in this repo.
- Requirement: On failure with no prior comment, a new marker comment is created with one entry.
  - Design element: Decision 3 (lookup returns none) + Decision 4 (single-entry body).
  - Acceptance criteria reference: specs — "comment created on first failure" scenario.
  - Testability notes: Manual verification; assert comment body starts with the marker and contains exactly one `<!-- entry:` block.
- Requirement: On failure with a prior comment, the comment is updated in place with the new entry prepended and old entries preserved up to the cap.
  - Design element: Decision 4 (parse/prepend/truncate/reassemble via `issues.updateComment`).
  - Acceptance criteria reference: specs — "comment updated on repeat failure" scenario.
  - Testability notes: Manual verification across 2, 5, and 6+ consecutive failures to hit the no-truncation, at-cap, and over-cap cases.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Comment-management failures must not affect the required build/test check outcome.
  - Design element: Decision 6 (`continue-on-error: true`).
  - Acceptance criteria reference: specs — "comment step failure is isolated" scenario.
  - Testability notes: Manual verification by deliberately breaking the script on a throwaway branch and confirming workflow conclusion is unaffected.
- Requirement category: security/operability
  - Requirement: Job permissions stay minimal (`pull-requests: write`, `issues: write` only).
  - Design element: carried over unchanged from the removed `notify-failure` job; no broader token scope requested.
  - Acceptance criteria reference: specs — workflow file diff review.
  - Testability notes: Code review of the YAML `permissions:` block; no dynamic test needed.
- Requirement category: operability
  - Requirement: Long-lived PRs don't accumulate unreadable comment history.
  - Design element: Decision 4 (5-entry cap).
  - Acceptance criteria reference: specs — "history capped at 5 entries" scenario.
  - Testability notes: Manual verification (6+ failure runs), as noted above.

## Risks / Trade-offs

- Risk/trade-off: `listComments` pagination — if a PR has more than the default page size of prior comments, the marker comment could be missed, causing a duplicate to be created instead of an update.
  - Impact: Duplicate status comment appears once on an unusually comment-heavy PR.
  - Mitigation: Use `github.paginate(github.rest.issues.listComments, ...)` (or equivalent explicit pagination loop) rather than a single unpaginated call, so all comments are checked regardless of PR comment volume.
- Risk/trade-off: Introducing `actions/github-script` as a new pattern in this workflow file increases the surface area of "workflow authoring styles" future contributors need to understand (bash + JS-in-YAML in one file).
  - Impact: Minor — slightly higher cognitive load reading this one job.
  - Mitigation: Keep the script step self-contained and commented only where the truncation logic isn't self-evident; don't spread `github-script` usage to other jobs in this change.

## Rollback / Mitigation

- Rollback trigger: `notify-status` job starts creating duplicate comments, deleting comments incorrectly on non-green PRs, or otherwise misbehaving in a way that's more disruptive than the original stale-comment problem.
- Rollback steps: Revert the commit changing `.github/workflows/build-and-test.yml` (single-file, single-job change — a plain `git revert` restores the original `notify-failure` job with no data migration needed). No state is persisted outside the PR comments themselves.
- Data migration considerations: None — comments are read/written live each run; there is no external datastore to migrate or clean up on rollback.
- Verification after rollback: Confirm a subsequent failing PR run posts a comment via the restored `notify-failure` job (original behavior), and that CI required-check status is unaffected by the revert.

## Operational Blocking Policy

- If CI checks fail: The `notify-status` job's own failure (if `continue-on-error` were ever removed) must never block the PR's required build/test check — those are separate jobs (`build-and-unit`, `integration`, `e2e`) with their own pass/fail status. `continue-on-error: true` on the comment-management step guarantees this per Decision 6.
- If security checks fail: N/A — this change touches no application code, dependencies, or auth paths; no security scan gates apply beyond standard repo-wide CI.
- If required reviews are blocked/stale: Standard repo process applies (see project memory: AI reviewer threads must be resolved before auto-merge). Not specific to this change.
- Escalation path and timeout: If `notify-status` misbehaves in production (per rollback trigger above), revert per the Rollback section rather than attempting a forward-fix under time pressure, since the blast radius of leaving the old stale-comment behavior in place is low.

## Open Questions

- None. All open questions from the proposal stage were resolved before this design was written.

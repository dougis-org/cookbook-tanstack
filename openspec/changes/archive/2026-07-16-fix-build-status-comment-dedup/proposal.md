## GitHub Issues

- dougis-org/cookbook-tanstack#588

## Why

- Problem statement: The `build-and-test.yml` workflow's `notify-failure` job posts a brand-new PR comment on every failing run and never cleans up or updates prior comments. Long-lived PRs with multiple failed-then-fixed pushes accumulate stale, contradictory failure comments (some may reference an old commit that has since been fixed).
- Why now: Requested directly by the repo owner in issue #588; low-risk, self-contained CI workflow change with no application code impact.
- Business/user impact: Reviewers and PR authors currently have to mentally filter out stale/duplicate bot comments to find the current build status. Fixing this reduces noise and makes the PR timeline trustworthy as a build-status signal.

## Problem Space

- Current behavior: `notify-failure` job (`.github/workflows/build-and-test.yml`, `if: failure()`) runs only when one of `build-and-unit`/`integration`/`e2e` fails, and unconditionally calls `gh pr comment` to post a new comment with a link to the failing run. Nothing runs on success; nothing looks for or touches prior comments.
- Desired behavior:
  - On success (all three of `build-and-unit`, `integration`, `e2e` succeeded): if a prior bot status comment exists on the PR, delete it. No comment on a PR with no prior failures.
  - On failure: if a prior bot status comment exists, update it in place with a new entry describing this run, prepended so the most recent failure is always at the top. If no prior comment exists, create one.
  - The comment is identified across runs via a hidden HTML marker (`<!-- build-and-test-status -->`) rather than by matching visible text, so edits to the human-readable copy don't break detection.
- Constraints:
  - Must only apply to `pull_request` events (there's no PR to comment on for `push`/`workflow_dispatch` runs).
  - Must not turn a transient GitHub API failure while managing the comment into a required-check failure — the build/test result itself is the source of truth, not the comment bookkeeping.
  - Job-level permissions must stay scoped to `pull-requests: write, issues: write` (least privilege, consistent with existing pattern noted in project memory).
- Assumptions:
  - A single marker-tagged comment per PR is sufficient; concurrent workflow runs on the same PR are already serialized by the existing `concurrency` group in this workflow, so there's no race between two runs writing to the same comment.
  - "Success" means all three required jobs succeeded, not merely "the workflow didn't explicitly fail" (which could mask a skipped job as success).
- Edge cases considered:
  - PR has never had a failure yet succeeds: no-op (nothing to delete).
  - PR has a stale marker comment from a run against an old commit, then a new run succeeds: comment is deleted regardless of which commit it was originally posted for — the current state is success, so no status comment should remain.
  - Repeated failures on the same PR: history is capped at the 5 most recent entries; older entries are dropped to keep the comment readable on long-lived PRs.
  - `notify-status` job itself errors (e.g., GitHub API hiccup): the comment-management step uses `continue-on-error: true`, matching current behavior, so it can't fail the required check.

## Scope

### In Scope

- Replacing the `notify-failure` job in `.github/workflows/build-and-test.yml` with a `notify-status` job that runs on success and failure.
- Implementing comment lookup, create, update (with prepend + cap), and delete logic via `actions/github-script`.
- Capping stored failure history at 5 entries per comment.

### Out of Scope

- Changes to `resolve-outdated-comments.yml` (handles AI review-thread resolution, a separate concern from build-status comments).
- Changes to which jobs run or what they test.
- Slack/email or other non-PR-comment notification channels.
- Retroactively cleaning up stale comments already posted on currently-open PRs before this change ships.

## What Changes

- `.github/workflows/build-and-test.yml`: `notify-failure` job removed and replaced by `notify-status` job (`if: always() && github.event_name == 'pull_request'`), using `actions/github-script` to find/create/update/delete a marker-tagged PR comment.

## Risks

- Risk: `actions/github-script` comment-editing logic has a bug that deletes or corrupts a comment incorrectly (e.g., matches the wrong comment, or truncation logic drops the wrong entries).
  - Impact: Loss of failure history context on a PR, or a misleading "no status comment" appearing to say everything passed.
  - Mitigation: Marker-based matching (exact prefix check) rather than fuzzy text matching; unit-testable truncation logic kept as a small pure function within the script step; manual verification on a real PR before merge.
- Risk: `continue-on-error: true` on the comment step means a broken comment-management script fails silently, and nobody notices the feature has stopped working.
  - Impact: Silent regression back to today's "no cleanup" behavior.
  - Mitigation: Accept this trade-off deliberately — it mirrors the existing behavior for `notify-failure` and keeps comment bookkeeping from ever blocking the actual required build/test check. Not adding alerting for this is a deliberate non-goal (see below).

## Open Questions

- None blocking. All prior ambiguities (success-gate definition, history cap size, implementation style) were resolved during exploration with the requester before this proposal was written.

## Non-Goals

- Not adding monitoring/alerting for silent failures of the comment-management step itself.
- Not backfilling/cleaning up stale comments on already-open PRs.
- Not changing the wording or emoji style of the human-readable failure message beyond what's needed to support multiple entries.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

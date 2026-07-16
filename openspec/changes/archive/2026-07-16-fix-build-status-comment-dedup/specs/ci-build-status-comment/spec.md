## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED PR build-status comment is deleted when all required jobs succeed

The system SHALL delete any existing bot-authored build-status comment on a pull request once `build-and-unit`, `integration`, and `e2e` have all reported `result == 'success'` for the current run.

#### Scenario: All jobs succeed with a prior failure comment present

- **Given** a pull request has an existing bot comment starting with the marker `<!-- build-and-test-status -->`
- **When** a new workflow run completes with `build-and-unit`, `integration`, and `e2e` all reporting `success`
- **Then** the `notify-status` job deletes the existing marker comment via the Issues API, and no build-status marker comment remains on the pull request

#### Scenario: All jobs succeed with no prior comment present

- **Given** a pull request has no existing bot comment matching the marker
- **When** a new workflow run completes with all three required jobs reporting `success`
- **Then** the `notify-status` job takes no comment-deletion or comment-creation action (no-op)

### Requirement: ADDED PR build-status comment is created on first failure

The system SHALL create a new marker-tagged comment on the pull request when at least one of `build-and-unit`, `integration`, or `e2e` does not report `result == 'success'` and no marker comment currently exists.

#### Scenario: First failing run on a PR with no prior comment

- **Given** a pull request has no existing comment starting with the marker `<!-- build-and-test-status -->`
- **When** a workflow run completes where `build-and-unit.result`, `integration.result`, or `e2e.result` is not `success`
- **Then** the `notify-status` job creates a new comment beginning with the marker, containing exactly one `<!-- entry:{run_id} -->` block with a timestamp and a link to the current run

### Requirement: ADDED PR build-status comment is updated in place on repeat failure

The system SHALL update an existing marker-tagged comment in place — rather than posting a new comment — when a run fails and a marker comment already exists, prepending the new failure entry so the most recent failure is always first.

#### Scenario: Second consecutive failing run on the same PR

- **Given** a pull request has an existing marker comment containing one failure entry from a prior run
- **When** a new workflow run completes where at least one required job does not report `success`
- **Then** the `notify-status` job updates the existing comment via the Issues API (not creating a second comment), and the comment now contains two entries with the newest entry appearing first

### Requirement: ADDED PR build-status comment failure history is capped at 5 entries

The system SHALL retain at most the 5 most recent failure entries in a marker-tagged comment, dropping the oldest entries beyond that when a new entry is prepended.

#### Scenario: Sixth consecutive failing run on the same PR

- **Given** a pull request has an existing marker comment containing 5 failure entries from prior runs
- **When** a new workflow run completes where at least one required job does not report `success`
- **Then** the updated comment contains exactly 5 entries: the new entry first, followed by the 4 most recent of the prior 5, with the oldest prior entry no longer present

## Traceability

- Proposal element: Replace `notify-failure` job with logic covering both success and failure -> Requirement: "PR build-status comment is deleted when all required jobs succeed" + "PR build-status comment is created on first failure" + "PR build-status comment is updated in place on repeat failure"
- Proposal element: Success = all three jobs succeeded -> Requirement: "PR build-status comment is deleted when all required jobs succeed" (scenario conditions reference `result == 'success'` on all three jobs explicitly, not implicit workflow success)
- Proposal element: Cap history at 5 entries, newest first -> Requirement: "PR build-status comment failure history is capped at 5 entries"
- Design decision: Decision 3 (marker-based identification) -> Requirement: all four requirements above key off the `<!-- build-and-test-status -->` marker for lookup
- Design decision: Decision 6 (`continue-on-error: true`) -> Requirement: see Non-Functional Acceptance Criteria, Reliability section
- Requirement -> Task(s): see tasks.md for the implementation breakdown of the `notify-status` job

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Comment-management step failure does not affect required check status

- **Given** the `notify-status` job's comment-management step encounters an unexpected error (e.g., a malformed API response)
- **When** the step fails
- **Then** the step is marked `continue-on-error: true` so the `notify-status` job does not report failure, and the pull request's required build/test check status is determined solely by `build-and-unit`, `integration`, and `e2e`, unaffected by the comment-management error

### Requirement: Operability

#### Scenario: Comment lookup finds the marker comment regardless of PR comment volume

- **Given** a pull request has more comments than the GitHub API's default single-page result size
- **When** the `notify-status` job searches for an existing marker comment
- **Then** the lookup paginates through all comments on the pull request rather than only inspecting the first page, so an existing marker comment is never missed and duplicated

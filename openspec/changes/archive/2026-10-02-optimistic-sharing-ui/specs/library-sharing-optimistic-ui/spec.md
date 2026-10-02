## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Optimistic invite with pending row

The system SHALL, when an Executive Chef selects a user in "Libraries You Share", immediately add a pending row for that user to the list and clear the search input, without waiting for the server response.

#### Scenario: Pending row appears immediately

- **Given** the share list contains one row ("Alice") and the `shareLibrary` request has not resolved
- **When** the user selects "Bob" from the search results
- **Then** a row for "Bob" is present synchronously, has `aria-busy="true"`, shows "Sharing…", and the search input value is empty

#### Scenario: Pending row has no Revoke

- **Given** a pending row for "Bob" is displayed
- **When** the row is inspected
- **Then** it contains no Revoke control, and "Alice"'s row still does

#### Scenario: Pending row becomes a real row on success

- **Given** a pending row for "Bob" and a `shareLibrary` request that resolves
- **When** the `myLibraryShares` refetch returns a row for "Bob" with a server id
- **Then** the row is no longer `aria-busy`, shows the shared date, and has a Revoke control

#### Scenario: Invite failure reverts

- **Given** a pending row for "Bob" and a `shareLibrary` request that rejects with message "Already sharing your library with this user"
- **When** the rejection occurs
- **Then** the "Bob" row is removed, other rows are unchanged, and an element with `role="alert"` contains "Bob" and the server message

#### Scenario: Recipient already listed

- **Given** the list already contains a row for recipient "Alice"
- **When** the user selects "Alice" again
- **Then** no second "Alice" row is added to the list

### Requirement: ADDED Rapid invites

The system SHALL keep the search input and result buttons enabled while one or more invites are in flight.

#### Scenario: Second invite while first is pending

- **Given** an invite for "Bob" is in flight
- **When** the user searches for and selects "Carol"
- **Then** the input and result buttons were enabled before the click, a second `shareLibrary` call is made for "Carol", and both "Bob" and "Carol" pending rows are displayed

#### Scenario: Overlapping invites, first fails

- **Given** invites for "Bob" and "Carol" are both in flight
- **When** "Bob"'s request rejects while "Carol"'s is still pending
- **Then** the "Bob" row is removed and "Carol"'s pending row remains

### Requirement: ADDED Optimistic revoke

The system SHALL remove a share row from "Libraries You Share" immediately when its Revoke control is activated, and restore it at its original position if the request fails.

#### Scenario: Row removed immediately

- **Given** rows "Alice" and "Bob" and a `revokeLibraryShare` request that has not resolved
- **When** the user activates Revoke on "Alice"
- **Then** the "Alice" row is absent synchronously and "Bob" remains

#### Scenario: Revoke failure reverts

- **Given** the user revoked "Alice" (first row) and the request rejects
- **When** the rejection occurs
- **Then** "Alice" is displayed again as the first row and an element with `role="alert"` is shown

#### Scenario: Overlapping revokes, first fails

- **Given** revokes for "Alice" and "Bob" are both in flight
- **When** "Alice"'s request rejects while "Bob"'s is pending
- **Then** "Alice" reappears and "Bob" remains absent

### Requirement: ADDED Shared optimistic list helper

The system SHALL provide a reusable helper that produces `onMutate`/`onError`/`onSettled` handlers for a list query from an apply function and an inverse revert function, with rollback by inverse operation and invalidation deferred until no other mutation of the same key is in flight.

#### Scenario: Apply and revert

- **Given** a query cache list `[a, b]` and a helper whose `apply` appends `c`
- **When** `onMutate` runs and then `onError` runs
- **Then** the cache is `[a, b, c]` after `onMutate` and `[a, b]` after `onError`

#### Scenario: Revert does not discard unrelated changes

- **Given** two mutations whose `apply` appended `c` and `d`
- **When** the first mutation's `onError` runs
- **Then** the cache contains `d` but not `c`

#### Scenario: Guarded invalidation

- **Given** two mutations sharing a `mutationKey` are in flight
- **When** the first settles
- **Then** the query is not invalidated; when the last settles, it is invalidated exactly once

#### Scenario: In-flight refetch is cancelled before apply

- **Given** a refetch of the list is in flight
- **When** `onMutate` runs
- **Then** the refetch is cancelled before the optimistic change is applied

### Requirement: ADDED List-driven pending state (replaces disabled-while-pending controls)

The system SHALL reflect invite and revoke state through the list contents (pending/removed rows) rather than by disabling the search input, result buttons, or per-row Revoke button for the duration of the request.

#### Scenario: Invite no longer locks the input

- **Given** an invite is in flight
- **When** the input is inspected
- **Then** it is not `disabled`, and no separate "Sharing…" paragraph is shown under it (the pending row carries that label)

#### Scenario: Revoke no longer shows "Revoking…"

- **Given** a revoke is in flight
- **When** the list is inspected
- **Then** the revoked row is absent and no "Revoking…" label is rendered

> The capability is new, so the behavior change from the #675 pending-state UI (disabled input/buttons, "Revoking…") is expressed as ADDED requirements; nothing in `openspec/specs/` is modified or removed.

## Traceability

- Proposal element (Optimistic invite with pending row) -> Requirement: ADDED Optimistic invite with pending row
- Proposal element (Free input for rapid invites) -> Requirement: ADDED Rapid invites
- Proposal element (Optimistic revoke) -> Requirement: ADDED Optimistic revoke
- Proposal element (Shared helper) -> Requirement: ADDED Shared optimistic list helper
- Proposal element (Updating existing tests / pending-state removal) -> Requirement: ADDED List-driven pending state
- Design decision 1, 4 -> Shared optimistic list helper
- Design decision 2, 3 -> Optimistic invite with pending row
- Design decision 5 -> Rapid invites; ADDED List-driven pending state
- Design decision 6 -> Optimistic revoke
- Design decision 7 -> Invite failure reverts; Revoke failure reverts
- Requirement -> Task(s): see `tasks.md` Execution sections E1 (helper), E2 (invite), E3 (revoke), E4 (test migration)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Immediate feedback

- **Given** a deferred (never-resolving) mutation request in a test
- **When** the user triggers invite or revoke
- **Then** the list reflects the change in the same React `act` flush, with no dependency on the network promise

### Requirement: Security

See functional scenario: "Pending row has no Revoke" (temp id never sent to the server). Authorization is unchanged and remains covered by the existing router tests in `src/server/trpc/routers/__tests__/sharing.test.ts`.

### Requirement: Reliability

#### Scenario: Convergence with server state

- **Given** any sequence of overlapping invites/revokes with mixed success and failure
- **When** all mutations have settled
- **Then** `myLibraryShares` is invalidated and the displayed list equals the refetched server list

### Requirement: Operability

#### Scenario: Accessible pending and error state

- **Given** a pending invite row and a failed invite
- **When** queried by accessibility attributes
- **Then** the pending row exposes `aria-busy="true"` and the failure message is exposed via `role="alert"`

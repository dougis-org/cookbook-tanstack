## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud

The system SHALL resolve `collabCookbookIds` lazily — the underlying `Collaborator` lookup SHALL execute only when a `cookbooks` router procedure actually reads the value, never unconditionally for every authenticated request. Within a single request, repeated reads SHALL resolve to the same memoized result without issuing additional `Collaborator` queries. If the underlying `Collaborator` lookup fails, the system SHALL reject with a `TRPCError` carrying a retry-friendly message, rather than propagating the raw underlying exception or silently degrading to an empty list.

#### Scenario: Successful resolution is unaffected and memoized across multiple reads in one request

- **Given** an authenticated user who collaborates on one or more cookbooks
- **When** a `cookbooks` procedure that reads the collaboration IDs more than once within a single request (e.g. `printById`, which uses the value for two visibility filters and one authorization check) is invoked
- **Then** the resolved list of cookbook IDs matches what a direct `Collaborator.find()` query for that user would return
- **And** the underlying `Collaborator` lookup executes exactly once for that request

#### Scenario: Lookup failure inside a cookbooks procedure surfaces as a retryable error

- **Given** the underlying `Collaborator` lookup will fail (e.g. a database error)
- **When** a `cookbooks` router procedure that reads the collaboration IDs is invoked
- **Then** the procedure call rejects with a `TRPCError` of code `INTERNAL_SERVER_ERROR` and a message instructing the caller to retry
- **And** no cookbook or recipe data is returned as if the user had no collaborations

#### Scenario: Non-cookbooks procedures are unaffected by lookup failure and never trigger the lookup

- **Given** the underlying `Collaborator` lookup will fail if invoked
- **When** a procedure that does not read collaboration IDs (e.g. a `recipes`, `privateRecipeNotes`, or `alexa` router procedure) is invoked in the same request lifecycle
- **Then** the procedure call succeeds normally, unaffected by the lookup's failure
- **And** the `Collaborator` lookup is never invoked for that request

## Traceability

- Proposal element: "scope it to where it's actually consumed" -> Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud (isolation scenario)
- Proposal element: "throw a TRPCError... instead of letting a raw exception propagate, and instead of degrading to `[]`" -> Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud (failure scenario)
- Design decision: Decision 1 (lazy, memoized accessor on `ctx`) -> Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud (successful-resolution scenario)
- Design decision: Decision 2 (TRPCError, retry-message convention) -> Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud (failure scenario)
- Requirement: MODIFIED Collaboration cookbook ID resolution is scoped, memoized, and fails loud -> Task(s): see tasks.md, context.ts/cookbooks.ts/alexa.ts retrofit and test-fixture update tasks

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: At most one underlying query per request regardless of read count

- **Given** a single request that reads the collaboration IDs from more than one call site (as in the `printById` procedure, which reads the value at three points)
- **When** the request completes
- **Then** the underlying `Collaborator.find()` query has executed at most once for that request

### Requirement: Security

See functional scenario: "Non-cookbooks procedures are unaffected by lookup failure and never trigger the lookup" — this change introduces no new access-control property; it only changes failure-handling scope and error shape. Visibility/authorization semantics for collaborators (which cookbooks a collaborator can see) are unchanged and are governed by the existing `library-sharing-foundation` capability's `visibilityFilter` scenarios, not restated here.

### Requirement: Reliability

#### Scenario: A transient lookup failure does not poison subsequent, unrelated requests

- **Given** the underlying `Collaborator` lookup fails for one request and then recovers (e.g. a transient database blip clears)
- **When** a new, separate request from any user is subsequently handled
- **Then** that new request's collaboration ID resolution is attempted independently and succeeds normally
- **And** no cached failure or cached empty result from the prior request is reused

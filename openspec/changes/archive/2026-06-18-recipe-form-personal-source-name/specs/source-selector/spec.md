## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED Client-side personalSourceName persistence

The system SHALL preserve the `personalSourceName` state value in the UI client-side on source transitions, preventing data loss if a user toggles away and back.

#### Scenario: Selected source changed to non-personal

- **Given** the `SourceSelector` component has `"personal"` source selected and a personal name of `"Aunt Mary"` is entered
- **When** the user selects a different source (e.g. `"Serious Eats"`)
- **Then** the `onPersonalSourceNameChange` callback is NOT invoked with an empty string, retaining `"Aunt Mary"` in the parent state.

#### Scenario: Selected source cleared

- **Given** the `SourceSelector` component has `"personal"` source selected and a personal name of `"Aunt Mary"` is entered
- **When** the user clicks the clear source button
- **Then** the `onPersonalSourceNameChange` callback is NOT invoked with an empty string, retaining `"Aunt Mary"` in the parent state.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Adjust `SourceSelector` client-side behavior to NOT clear name -> MODIFIED Client-side personalSourceName persistence
- Design decision -> Requirement: Decision 2 (Retain `personalSourceName` client-side on source change) -> MODIFIED Client-side personalSourceName persistence
- Requirement -> Task(s): Task 1 (Modify `SourceSelector.tsx` to not clear `personalSourceName` on selection change/clear)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: No extraneous state rendering

- **Given** the `SourceSelector` is rendered with `personalSourceName` state active
- **When** the selected source is changed
- **Then** the component does not trigger unnecessary re-renders of the helper text since the text input is fully unmounted.

### Requirement: Security

See functional scenarios: N/A.

### Requirement: Reliability

See functional scenarios: N/A.

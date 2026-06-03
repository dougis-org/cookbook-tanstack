## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Collaborator Onboarding State Tracking

The system SHALL persistently track whether a collaborator has acknowledged the welcome onboarding for a specific cookbook invitation.

#### Scenario: Onboarding defaults to false for new collaborators

- **Given** a cookbook owner invites a user as a collaborator
- **When** the collaborator record is created
- **Then** the `onboarded` field is initialized to `false` in the database.

#### Scenario: Completed onboarding is persisted

- **Given** an unonboarded collaborator is logged in
- **When** they trigger `cookbooks.onboardCollaborator` mutation
- **Then** the `onboarded` field is updated to `true` in the database.

### Requirement: ADDED Welcome Onboarding Dialog

The system SHALL display an interactive, role-specific onboarding modal to first-time shared cookbook collaborators.

#### Scenario: Onboarding shown to Editor

- **Given** a logged-in collaborator with the `editor` role lands on the shared cookbook detail page with `onboarded: false`
- **When** the page loads
- **Then** a welcome modal is displayed showing the `Editor ✏️` role details, collaborative features, and actions they can perform.

#### Scenario: Onboarding shown to Viewer

- **Given** a logged-in collaborator with the `viewer` role lands on the shared cookbook detail page with `onboarded: false`
- **When** the page loads
- **Then** a welcome modal is displayed showing the `Viewer 👁️` role details, read-only boundaries, and actions they can perform.

## MODIFIED Requirements

### Requirement: MODIFIED Cookbook Fetching Query (`cookbooks.byId`)

The system SHALL include the `onboarded` status for collaborators in the byId details.

#### Scenario: Fetching cookbook details retrieves collaborator onboarding status

- **Given** a collaborator is querying the cookbook details via `cookbooks.byId`
- **When** the query is resolved
- **Then** the response payload includes an array of collaborators, each containing their name, role, and `onboarded` status.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement:
  - Onboarding state persistence -> Collaborator Onboarding State Tracking
  - Welcome Onboarding UI -> Welcome Onboarding Dialog
- Design decision -> Requirement:
  - Decision 1 (Database tracked field) -> Collaborator Onboarding State Tracking
  - Decision 2 (Modal dialog layout) -> Welcome Onboarding Dialog
- Requirement -> Task(s):
  - Collaborator Onboarding State Tracking -> Task 1, Task 2
  - Welcome Onboarding Dialog -> Task 3, Task 4

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** standard network load
- **When** executing the `cookbooks.onboardCollaborator` mutation
- **Then** the backend response completes in under 200ms.

### Requirement: Security

#### Scenario: Access control

- **Given** a malicious actor who is not a collaborator or owner of a cookbook
- **When** they attempt to execute `cookbooks.onboardCollaborator` for that cookbook
- **Then** the server denies the mutation throwing a FORBIDDEN error.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a network dropout during acknowledgment
- **When** the collaborator clicks the CTA button and the mutation fails
- **Then** the modal remains visible, shows an error message, and enables the button for retry.

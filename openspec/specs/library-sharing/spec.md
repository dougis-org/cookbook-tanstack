## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../changes/archive/2026-09-30-share-my-library-account-section/design.md) document, not a replacement. It refines the
`ADDED Managing shares` requirement introduced by the parent change
(`openspec/changes/share-my-library/specs/library-sharing/spec.md`) with the
concrete account-page implementation details this change ships.

### Requirement: ADDED Managing-shares gating by tier and received-share state

The system SHALL show the "I share" list and its invite control only to an
Executive Chef user. A non-Executive-Chef user SHALL see the "shared with me"
and "my collaborations" lists whenever either is non-empty, and SHALL see an
upgrade affordance in place of the entire section only when both are empty.

#### Scenario: Executive Chef sees the full section

- **Given** an authenticated Executive Chef user
- **When** the user opens the "Sharing & Collaboration" section of the account page
- **Then** the "I share" list and invite control are shown
- **And** the "shared with me" and "my collaborations" lists are shown, each with
  their own empty state if empty

#### Scenario: Non-Executive-Chef user with received shares sees everything but the
invite affordance

- **Given** an authenticated non-Executive-Chef user who has at least one library
  shared with them or holds at least one cookbook collaboration
- **When** the user opens the "Sharing & Collaboration" section of the account page
- **Then** the "shared with me" and/or "my collaborations" lists are shown
- **And** the "I share" list and invite control are not rendered

#### Scenario: Non-Executive-Chef user with nothing shared sees an upgrade affordance

- **Given** an authenticated non-Executive-Chef user with no received library shares
  and no cookbook collaborations
- **When** the user opens the account page
- **Then** the "Sharing & Collaboration" section renders an upgrade affordance in
  place of all three lists
- **And** the upgrade affordance's container element uses an adblock-safe
  classname prefix (`.up-*`), never `.promo-*`, `.ad-*`, or `.sponsor-*`

### Requirement: ADDED Invite flow uses single-field search, no role selection

The system SHALL let an Executive Chef invite a recipient by searching for them
by name or email via `users.search`, selecting a result, and confirming — with
no role selection, since a library share grants one fixed level of read access.

#### Scenario: Searching invokes the existing user-search procedure

- **Given** an Executive Chef user has the invite control focused
- **When** the user types at least two characters
- **Then** `users.search` is invoked with the typed (debounced) query
- **And** matching users are listed by name and email

#### Scenario: Selecting a result creates a grant

- **Given** search results are displayed and the user selects one
- **When** the user confirms the invite
- **Then** `sharing.shareLibrary` is called with the selected recipient's id
- **And** on success the "I share" list includes the new grant without a full
  page reload

#### Scenario: A failed invite surfaces an error and resets the control

- **Given** an invite mutation is in flight
- **When** the mutation fails (e.g. duplicate grant, network error)
- **Then** an inline error message is shown
- **And** the invite control returns to its enabled, non-pending state
- **And** the "I share" list is not optimistically altered beforehand — see
  Non-Functional Acceptance Criteria for the explicit non-optimistic-UI contract

#### Scenario: Scope-warning copy is present

- **Given** an Executive Chef user viewing the invite control
- **When** the control is rendered
- **Then** visible copy states that the grant covers the user's entire library,
  including private content created in the future

### Requirement: ADDED Revoke flow updates the owner's list immediately on success

The system SHALL let an Executive Chef revoke any grant they have made from the
"I share" list, removing it from the list on success.

#### Scenario: Revoking a grant removes it from the list

- **Given** an Executive Chef user with at least one active grant displayed
- **When** the user activates the revoke control for that grant
- **Then** `sharing.revokeLibraryShare` is called with that grant's id
- **And** on success the grant no longer appears in the "I share" list

#### Scenario: A failed revoke surfaces an error and leaves the grant listed

- **Given** a revoke mutation is in flight
- **When** the mutation fails
- **Then** an inline error message is shown
- **And** the grant remains listed, since no optimistic removal was applied

## Traceability

- Proposal element: `SharingSection` component, three lists -> Requirement: ADDED
  Managing-shares gating by tier and received-share state (list rendering)
- Proposal element: Gating for non-Executive-Chef users -> Requirement: ADDED
  Managing-shares gating by tier and received-share state
- Proposal element: Invite and revoke flows -> Requirement: ADDED Invite flow uses
  single-field search, no role selection; ADDED Revoke flow updates the owner's
  list immediately on success
- Design decision: Decision 2 (gating matrix) -> Requirement: ADDED
  Managing-shares gating by tier and received-share state
- Design decision: Decision 3 (single-field invite) -> Requirement: ADDED Invite
  flow uses single-field search, no role selection
- Design decision: Decision 4 (pending-state, not optimistic, UI) -> Requirement:
  ADDED Invite flow uses single-field search, no role selection (failure
  scenario); ADDED Revoke flow updates the owner's list immediately on success
  (failure scenario)
- Requirement: ADDED Managing-shares gating by tier and received-share state ->
  Task(s): `SharingSection` scaffold, gating logic, component tests per matrix row
- Requirement: ADDED Invite flow uses single-field search, no role selection ->
  Task(s): invite UI, `users.search` wiring, `shareLibrary` mutation, component
  tests
- Requirement: ADDED Revoke flow updates the owner's list immediately on success
  -> Task(s): revoke control, `revokeLibraryShare` mutation, component tests

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Invite/revoke mutations use pending-state UI, not optimistic UI
with rollback

- **Given** this change deliberately defers true optimistic-UI-with-rollback to a
  follow-up (tracked outside this capability's scope)
- **When** an invite or revoke mutation is in flight
- **Then** the acting control is disabled and shows a pending label
- **And** no speculative change is applied to any list before the server
  responds, so there is nothing to roll back on failure

### Requirement: Security

#### Scenario: Access control

- See functional scenarios under the parent change's `ADDED Granting library
  access`, `ADDED Recipient visibility`, and `ADDED Revoking a share`
  requirements (`openspec/changes/share-my-library/specs/library-sharing/spec.md`).
  Client-side gating in this change (Managing-shares gating by tier) is
  presentation only; it introduces no new trust boundary.

### Requirement: Accessibility / design-system compliance

#### Scenario: Section renders legibly across all themes with no hard-coded colors

- **Given** the "Sharing & Collaboration" section is rendered
- **When** the active theme is `dark`, `dark-greens`, `light-cool`, or `light-warm`
- **Then** all text and controls remain legible and no CSS declaration in the new
  component uses a hard-coded theme-able hex value

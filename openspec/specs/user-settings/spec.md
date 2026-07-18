## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-17-user-settings-preferences/design.md) document, not a replacement.

### Requirement: ADDED Authenticated settings route at `/account/settings`

The system SHALL expose a route at `/account/settings`, guarded by `requireAuth()`, that lets the current user view and edit their stored preferences, starting with `theme`.

#### Scenario: Logged-in user views their current theme preference

- **Given** a logged-in user whose session has `user.theme` set to `'dark-greens'`
- **When** the user navigates to `/account/settings`
- **Then** the settings form renders with `'dark-greens'` shown as the currently selected theme

#### Scenario: Logged-out user is redirected away from settings

- **Given** no active session
- **When** a request is made to `/account/settings`
- **Then** the `requireAuth()` guard redirects the request, identical to the existing behavior on `/account`

### Requirement: ADDED Saving a preference calls Better-Auth's `updateUser` directly

The system SHALL save preference changes by calling `authClient.updateUser` with the changed field(s); no new tRPC mutation SHALL be introduced for preference writes.

#### Scenario: Selecting a new theme and saving persists it via updateUser

- **Given** the settings form is open with theme `'dark'` selected
- **When** the user selects `'light-warm'` and submits the save action
- **Then** `authClient.updateUser({ theme: 'light-warm' })` is called
- **And** on success, the form shows a saved/success state

#### Scenario: Save failure shows an explicit error without discarding the selection

- **Given** the settings form is open and the user has selected `'light-warm'`
- **When** the save action is submitted and `updateUser` rejects (network or validation error)
- **Then** an inline error message is shown
- **And** `'light-warm'` remains the selected value in the form (not silently reverted to the last-saved value)

### Requirement: ADDED Saved preferences reflect immediately without waiting on session cache expiry

The system SHALL reflect a successfully saved preference in the current session state immediately, without requiring the 5-minute `cookieCache` window to elapse.

#### Scenario: Session-consuming components see the new theme right after save

- **Given** the settings form just successfully saved `theme: 'light-warm'`
- **When** any component reading `useAuth()`/`useSession()` re-renders after the save resolves
- **Then** `session.user.theme` reflects `'light-warm'`, not the prior value

### Requirement: ADDED Settings page is discoverable from the Account page

The system SHALL provide a link from `/account` to `/account/settings`.

#### Scenario: Account page links to settings

- **Given** a logged-in user viewing `/account`
- **When** the page renders
- **Then** a link to `/account/settings` is present

## Traceability

- Proposal element (new `/account/settings` route) → Requirement: ADDED Authenticated settings route at `/account/settings`
- Proposal element (Better-Auth-native write path, no new tRPC mutation) → Requirement: ADDED Saving a preference calls Better-Auth's `updateUser` directly
- Proposal element (session-cache staleness resolved) → Requirement: ADDED Saved preferences reflect immediately without waiting on session cache expiry
- Design decision 1 (`updateUser` direct call) → Requirement: ADDED Saving a preference calls Better-Auth's `updateUser` directly
- Design decision 4 (new route, linked from `/account`) → Requirements: ADDED Authenticated settings route, ADDED Settings page is discoverable from the Account page
- Requirements → Tasks: settings route implementation, settings form implementation, `AccountPage` nav link

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "Logged-out user is redirected away from settings" — no additional access-control scenario needed beyond the existing `requireAuth()` guard behavior already proven for `/account`.

### Requirement: Reliability

#### Scenario: Save-error recovery does not require a page reload

- **Given** a save attempt has failed and the error state is shown
- **When** the user re-submits the save action without changing the selection
- **Then** the request is retried and, on success, the success state replaces the error state without a full page reload

## MODIFIED Requirements

### Requirement: Preferences are edited within the consolidated `/account` page, not a separate route

The system SHALL render the theme and print-preference controls as a
Preferences section within the consolidated `/account` route (see the
`account-page` capability), rather than as a standalone page at
`/account/settings`. The former standalone route SHALL redirect to
`/account` instead of rendering the form (see the `auth-route-guards`
capability delta in this change).

#### Scenario: Logged-in user views their current theme preference

- **Given** a logged-in user whose session has `user.theme` set to
  `'dark-greens'`
- **When** the user navigates to `/account`
- **Then** the Preferences section renders with `'dark-greens'` shown as the
  currently selected theme

#### Scenario: Logged-out user is redirected away from account

- **Given** no active session
- **When** a request is made to `/account` (or the legacy `/account/settings`
  URL)
- **Then** the `requireAuth()` guard redirects the request, identical to the
  existing behavior on `/account`

### Requirement: Saving a preference calls Better-Auth's `updateUser` directly

The system SHALL save preference changes by calling `authClient.updateUser`
with the changed field(s); no new tRPC mutation SHALL be introduced for
preference writes. This behavior is unchanged by the section's move into the
consolidated page.

#### Scenario: Selecting a new theme and saving persists it via updateUser

- **Given** the Preferences section is open with theme `'dark'` selected
- **When** the user selects `'light-warm'` and submits the save action
- **Then** `authClient.updateUser({ theme: 'light-warm' })` is called
- **And** on success, the section shows a saved/success state

#### Scenario: Save failure shows an explicit error without discarding the selection

- **Given** the Preferences section is open and the user has selected
  `'light-warm'`
- **When** the save action is submitted and `updateUser` rejects (network or
  validation error)
- **Then** an inline error message is shown
- **And** `'light-warm'` remains the selected value in the section (not
  silently reverted to the last-saved value)

### Requirement: Saved preferences reflect immediately without waiting on session cache expiry

The system SHALL reflect a successfully saved preference in the current
session state immediately, without requiring the 5-minute `cookieCache`
window to elapse. Unchanged by the section's move into the consolidated
page.

#### Scenario: Session-consuming components see the new theme right after save

- **Given** the Preferences section just successfully saved
  `theme: 'light-warm'`
- **When** any component reading `useAuth()`/`useSession()` re-renders after
  the save resolves
- **Then** `session.user.theme` reflects `'light-warm'`, not the prior value

### Requirement: An in-progress, unsaved edit is not overwritten by an async session refresh

The system SHALL protect a user's locally edited (but not yet saved) theme
or print-preference selection from being overwritten if the underlying
session object refreshes in the background before the user saves.

#### Scenario: Background session refresh during an in-progress edit

- **Given** the user has changed the theme selection in the Preferences
  section but has not yet clicked save
- **When** the session object refreshes in the background (e.g. a routine
  session re-fetch)
- **Then** the user's in-progress, unsaved selection remains displayed and
  is not reverted to the value from the refreshed session

## REMOVED Requirements

### Requirement: ADDED Authenticated settings route at `/account/settings`

**Reason**: Superseded by the consolidated `/account` page (see the
`account-page` capability added in this change). Preferences are now a
section of `/account`, not a standalone authenticated route.

**Migration**: `/account/settings` becomes a redirect-only route (see the
`auth-route-guards` capability delta in this change) that sends both logged-
in and logged-out visitors through the same guard/redirect path as before,
landing authenticated visitors on `/account` instead of a dedicated settings
page.

### Requirement: ADDED Settings page is discoverable from the Account page

**Reason**: Superseded by the consolidated page itself — Preferences is now
always visible as a section of `/account`, so a link from `/account` to
reach it no longer applies. See `account-page` capability's "No in-page
link to a separate settings route" requirement.

**Migration**: No user-facing action needed; the `/account/settings` link
previously rendered inside `AccountPage` is removed outright with no
replacement.

## Traceability

- Proposal "Extract a PreferencesSection ... composed by the consolidated
  AccountPage" → Requirement: Preferences are edited within the
  consolidated `/account` page, not a separate route
- Proposal constraint "preserve `authClient.updateUser` save/error behavior
  exactly" → Requirements: Saving a preference calls updateUser directly,
  Save failure shows an explicit error, Saved preferences reflect
  immediately, An in-progress edit is not overwritten
- Design decision 1 (`PreferencesSection` owns its own `useAuth()` call and
  hydration `useEffect`, ported verbatim) → Requirement: An in-progress,
  unsaved edit is not overwritten by an async session refresh
- Requirements → Tasks: `PreferencesSection` extraction task, redirect-route
  task for `/account/settings`

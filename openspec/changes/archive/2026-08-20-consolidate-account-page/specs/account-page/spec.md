## ADDED Requirements

### Requirement: Consolidated account page at `/account`

The system SHALL render a single `/account` route that presents Profile,
Status, and Preferences as three stacked sections, in that order, on one
scrollable page. No section SHALL require a route change (link, tab, or
otherwise) to reach — only scrolling.

#### Scenario: All three sections render on one page

- **Given** a logged-in user
- **When** they navigate to `/account`
- **Then** the page renders a Profile section (name, email, avatar,
  username), a Status section (tier, usage limits, upgrade CTA), and a
  Preferences section (theme selector, all 5 print-preference toggles)
- **And** all three are present in the initial render without further
  navigation

#### Scenario: Sections require only scrolling, not navigation

- **Given** a logged-in user viewing `/account`
- **When** they want to move from the Profile section to the Preferences
  section
- **Then** no link click, tab click, or URL change is required — the
  section is reached by scrolling

#### Scenario: Page remains usable at mobile width

- **Given** a logged-in user on a mobile-width viewport
- **When** they view `/account`
- **Then** all three sections render without being clipped and without
  requiring desktop width to reach any control in any section

### Requirement: Account page guarded by `requireAuth()`

The system SHALL guard `/account` with `requireAuth()`, redirecting
unauthenticated visitors to `/auth/login`, exactly as it does today.

#### Scenario: Logged-out visitor is redirected

- **Given** no active session
- **When** a request is made to `/account`
- **Then** `requireAuth()` redirects to `/auth/login` with
  `reason=auth-required` and `from=%2Faccount`

### Requirement: No in-page link to a separate settings route

The system SHALL NOT render a link from `/account` to `/account/settings`
(or any other route) to reach preferences, since preferences are now an
in-page section rather than a separate destination.

#### Scenario: No settings link present

- **Given** a logged-in user viewing `/account`
- **When** the page renders
- **Then** no link with the text "Settings" pointing to `/account/settings`
  is present anywhere on the page

## Traceability

- Proposal "Consolidate ... into a single `/account` route" → Requirement:
  Consolidated account page at `/account`
- Proposal "no navigation required ... beyond scrolling" acceptance
  criterion → Requirement: Sections require only scrolling, not navigation
- Proposal mobile-width acceptance criterion → Requirement: Page remains
  usable at mobile width
- Design decision 5 (internal Settings link removed) → Requirement: No
  in-page link to a separate settings route
- Requirements → Tasks: `AccountPage` composition task, `ProfileSection`/
  `StatusSection`/`PreferencesSection` extraction tasks

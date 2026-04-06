## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Auth collections cleared before first start post-upgrade

The system SHALL have all better-auth managed collections (users, sessions, accounts, verifications) dropped from the dev MongoDB instance before the upgraded server first starts, to prevent BSON UUID lookup failures.

#### Scenario: Auth collections cleared successfully

- **Given** the upgraded packages are installed
- **When** the dev MongoDB auth collections are dropped via the mongo shell or Compass
- **Then** the collections no longer exist and the server can start fresh with BSON UUIDs

#### Scenario: New user created with BSON UUID post-upgrade

- **Given** auth collections have been cleared and the upgraded server is running
- **When** a new user registers via the sign-up form
- **Then** the user record in MongoDB uses a native BSON UUID for its `_id` field

## MODIFIED Requirements

### Requirement: MODIFIED Sign-up flow works on upgraded better-auth

The system SHALL allow new users to register with email, password, and username after the upgrade.

#### Scenario: Successful sign-up

- **Given** auth collections are empty (cleared for BSON UUID migration)
- **When** a user submits the sign-up form with valid email, password, and username
- **Then** the user is created and automatically signed in (redirected to the app)

#### Scenario: Duplicate email rejected

- **Given** a user with email `test@example.com` already exists
- **When** a second sign-up attempt uses the same email
- **Then** an error is returned and no duplicate user is created

### Requirement: MODIFIED Sign-in flow works on upgraded better-auth

The system SHALL allow users to sign in with email and password after the upgrade.

#### Scenario: Successful sign-in

- **Given** a registered user exists (created post-upgrade with BSON UUIDs)
- **When** the user submits the sign-in form with correct credentials
- **Then** the user is authenticated, a session cookie is set, and the user is redirected to the app

#### Scenario: Wrong password rejected

- **Given** a registered user exists
- **When** sign-in is attempted with an incorrect password
- **Then** an error message is shown and no session is created

### Requirement: MODIFIED Sign-out flow works on upgraded better-auth

The system SHALL allow authenticated users to sign out after the upgrade.

#### Scenario: Successful sign-out

- **Given** a user is authenticated with an active session
- **When** the user triggers sign-out
- **Then** the session cookie is cleared and the user is redirected to the sign-in page

#### Scenario: Post-sign-out access denied

- **Given** a user has signed out
- **When** the user attempts to access a protected route
- **Then** the user is redirected to sign-in (session is not restored)

### Requirement: MODIFIED cookieCache behavior unchanged after upgrade

The system SHALL maintain the same cookieCache behavior as before the upgrade: session data cached in cookie for up to 5 minutes, refreshed from DB after expiry.

#### Scenario: Session persists across page reload within cache window

- **Given** a user is authenticated and the session was established less than 5 minutes ago
- **When** the user reloads the page
- **Then** the user remains authenticated without a DB round-trip (served from cookie cache)

#### Scenario: Session fields preserved on window focus refresh

- **Given** a user is authenticated with custom session fields (username)
- **When** the browser tab regains focus and triggers a session refresh (1.5.5 behavior)
- **Then** the username and other custom session fields are still present in the session data

## REMOVED Requirements

No requirements are being removed in this change.

## Traceability

- Proposal element "MongoDB BSON UUID storage change risk" -> Requirement: ADDED Auth collections cleared
- Proposal element "Cookie handling changes (1.5.2)" -> Requirement: MODIFIED Sign-in flow, Sign-out flow
- Proposal element "cookieCache session behavior (1.5.5)" -> Requirement: MODIFIED cookieCache behavior
- Design decision 2 (clear dev auth collections) -> Requirement: ADDED Auth collections cleared
- Design decision 4 (no code changes) -> All MODIFIED requirements (behavior preserved, not altered)
- Requirement "Auth collections cleared" -> Task: clear dev auth collections
- Requirement "Sign-up/Sign-in/Sign-out work" -> Task: manual auth flow verification + E2E tests
- Requirement "cookieCache behavior unchanged" -> Task: run unit tests for auth

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Revoked session not restored via DB fallback

- **Given** a user has signed out (session revoked)
- **When** a request arrives with the old session cookie
- **Then** the server does not restore the session from the database (better-auth 1.5.6 security fix active)

### Requirement: Reliability

#### Scenario: Stale session data preserved on network error

- **Given** a user is authenticated
- **When** the client attempts a session refresh and the server returns a network error
- **Then** the existing session data in the client is preserved (not cleared), keeping the user authenticated (better-auth 1.5.5 fix)

### Requirement: Performance

#### Scenario: Session cache serves requests within cache window

- **Given** the cookieCache maxAge is set to 5 minutes
- **When** a user makes multiple requests within that window
- **Then** repeated DB lookups for session data are not made (cookie cache is used)

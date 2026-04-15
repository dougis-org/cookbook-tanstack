## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Admin nav link visible only to admins

The system SHALL render a navigation link to `/admin/users` in the Header only when the current session user has `isAdmin: true` and the session status is `authenticated`.

#### Scenario: Admin user sees nav link

- **Given** a user with an active session where `isAdmin` is `true`
- **When** the Header renders
- **Then** a navigation link labeled "Admin" (or equivalent) pointing to `/admin/users` is visible

#### Scenario: Non-admin user does not see nav link

- **Given** a user with an active session where `isAdmin` is `false` or absent
- **When** the Header renders
- **Then** no admin navigation link is rendered

#### Scenario: Unauthenticated user does not see nav link

- **Given** no active session
- **When** the Header renders
- **Then** no admin navigation link is rendered

#### Scenario: No flicker during session load

- **Given** the session status is `loading`
- **When** the Header renders
- **Then** no admin navigation link is rendered (link only appears after `status === 'authenticated'` is confirmed)

## MODIFIED Requirements

### Requirement: MODIFIED Header navigation renders conditionally based on auth state

The Header already conditionally renders auth-dependent links. This change extends that conditional logic to include the admin link.

#### Scenario: Admin link added to existing conditional render block

- **Given** the Header's existing session-conditional rendering
- **When** `isAdmin` is true and session is authenticated
- **Then** the admin link appears alongside other authenticated-user nav items

## REMOVED Requirements

None.

## Traceability

- Proposal element "Admin links hidden from non-admins" → Requirement: Admin nav link visible only to admins
- Design decision 7 (session-conditional render, `status === 'authenticated'`) → All scenarios above
- Requirement: Admin nav link visible only to admins → Task: Modify `src/components/Header.tsx` to add conditional admin link

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Link absence is not the only protection

- **Given** the admin nav link is hidden from non-admins
- **When** a non-admin constructs the URL manually
- **Then** `requireAdmin()` in the route `beforeLoad` redirects them (link absence is UX only, not a security boundary)

### Requirement: Operability

#### Scenario: No additional network request to determine admin status

- **Given** the session is already loaded via `useSession()`
- **When** the Header checks `isAdmin`
- **Then** no additional fetch occurs — `isAdmin` is read directly from the cached session object

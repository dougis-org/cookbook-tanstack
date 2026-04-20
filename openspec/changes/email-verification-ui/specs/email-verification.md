## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Verification banner for unverified authenticated users

The system SHALL display a persistent banner to authenticated users whose `emailVerified` is `false`, and SHALL hide it when the user is unauthenticated, verified, or on any `/auth/*` route.

#### Scenario: Banner visible to unverified user

- **Given** a user is authenticated with `emailVerified: false`
- **When** they navigate to any non-auth route (e.g., `/`)
- **Then** a banner is visible containing text about email verification and a "Resend" button

#### Scenario: Banner hidden for verified user

- **Given** a user is authenticated with `emailVerified: true`
- **When** they navigate to any route
- **Then** no verification banner is rendered

#### Scenario: Banner hidden for unauthenticated user

- **Given** no active session
- **When** any route renders
- **Then** no verification banner is rendered

#### Scenario: Banner hidden on auth pages

- **Given** a user is authenticated with `emailVerified: false`
- **When** they navigate to `/auth/login`, `/auth/register`, or any `/auth/*` route
- **Then** no verification banner is rendered

#### Scenario: Banner auto-dismisses after verification

- **Given** a user is authenticated with `emailVerified: false` and the banner is visible
- **When** `session.user.emailVerified` becomes `true` (reactive session update)
- **Then** the banner is no longer rendered without a page reload

---

### Requirement: ADDED Resend verification email from banner

The system SHALL allow an unverified user to request a new verification email from the banner, with loading, success, and error feedback.

#### Scenario: Successful resend from banner

- **Given** the verification banner is visible
- **When** the user clicks "Resend verification email"
- **Then** the button shows a loading state, then displays "Verification email sent!" on success

#### Scenario: Resend failure (rate limit or error) from banner

- **Given** the verification banner is visible
- **When** the user clicks "Resend" and BetterAuth returns an error
- **Then** an error message is displayed (surfacing BetterAuth's error message)

---

### Requirement: ADDED Email verification landing page

The system SHALL provide a `/auth/verify-email` route that handles the post-verification redirect from BetterAuth with success and error states.

#### Scenario: Landing page success state (emailVerified = true)

- **Given** BetterAuth has processed a valid verification token and redirected to `/auth/verify-email`
- **When** the page loads and `session.user.emailVerified` is `true`
- **Then** the page displays a success message and a link to continue to the app

#### Scenario: Landing page error state (error param present)

- **Given** BetterAuth redirected to `/auth/verify-email?error=INVALID_TOKEN` (or any non-empty `error` param)
- **When** the page loads
- **Then** the page displays an error message ("Verification link is invalid or has expired") and a resend option

#### Scenario: Landing page default state (no params, emailVerified = false)

- **Given** a user navigates to `/auth/verify-email` directly without a redirect
- **When** `session.user.emailVerified` is `false` and no `error` param present
- **Then** the page displays a neutral "Verify your email" state with a resend option

#### Scenario: Resend from landing page error state

- **Given** the error state is visible on `/auth/verify-email`
- **When** the user clicks "Resend verification email"
- **Then** loading → success/error feedback behaves identically to banner resend

---

### Requirement: ADDED Post-registration "check your email" feedback

The system SHALL show a confirmation message after successful registration rather than immediately navigating away, telling the user to check their inbox.

#### Scenario: Registration success shows check-email message

- **Given** a user completes the registration form with valid data
- **When** `authClient.signUp.email` resolves successfully
- **Then** the form is replaced by a message containing "Check your" and the user's email address, and a link to sign in

#### Scenario: Registration error still shows form

- **Given** a user submits the registration form
- **When** `authClient.signUp.email` returns an error
- **Then** the form remains visible with the error message displayed

## MODIFIED Requirements

### Requirement: MODIFIED RegisterForm navigation on success

The system SHALL NOT navigate to `/` on successful registration; instead it SHALL display the "check your email" state in place.

#### Scenario: No navigation on registration success

- **Given** a user successfully registers
- **When** `onSuccess` fires
- **Then** `navigate({ to: "/" })` is NOT called; `isSubmitted` state is set to `true`

## REMOVED Requirements

No requirements removed in this change.

## Traceability

- Proposal: "Post-registration feedback" → Requirement: ADDED Post-registration check-email feedback
- Proposal: "Verification pending banner" → Requirement: ADDED Verification banner + ADDED Resend from banner
- Proposal: "/auth/verify-email landing page" → Requirement: ADDED Email verification landing page
- Proposal: "Resend verification" → Requirement: ADDED Resend from banner + ADDED Resend from landing page
- Design Decision 1 → Requirement: MODIFIED RegisterForm navigation + ADDED Post-registration feedback
- Design Decision 2 → Requirement: ADDED Email verification landing page
- Design Decision 3 → Requirement: ADDED Verification banner
- Design Decision 4 → Requirement: ADDED Resend (banner + landing page)
- Design Decision 5 → Requirement: ADDED Banner hidden on auth pages

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Banner adds no extra network requests

- **Given** an authenticated unverified user loads any page
- **When** the banner renders
- **Then** no additional API calls are made beyond the existing session fetch (banner reads from already-loaded `useAuth()` state)

### Requirement: Security

#### Scenario: Resend email sourced from session only

- **Given** an authenticated user sees the resend option
- **When** resend is triggered
- **Then** the email address used is `session.user.email` — not a user-supplied input field — preventing email enumeration

#### Scenario: Banner not rendered for unauthenticated requests

- **Given** no active session (unauthenticated)
- **When** any route renders
- **Then** the verification banner is absent from the DOM

### Requirement: Reliability

#### Scenario: Missing emailVerified field does not crash banner

- **Given** a session object exists but `user.emailVerified` is `undefined` (edge case: old session shape)
- **When** the banner component evaluates the guard condition
- **Then** no JavaScript error is thrown and the banner is not rendered (`undefined` treated as falsy)

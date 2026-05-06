## Purpose

Define the email verification UI behavior for registration feedback, unverified-user reminders,
verification landing states, and resend actions.

## Requirements

### Requirement: Verification banner for unverified authenticated users

The system SHALL display a persistent banner to authenticated users whose `emailVerified` is `false`, and SHALL
hide it when the user is unauthenticated, verified, or on any `/auth/*` route.

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

### Requirement: Resend verification email from banner

The system SHALL allow an unverified user to request a new verification email from the banner, with loading,
success, and error feedback.

#### Scenario: Successful resend from banner

- **Given** the verification banner is visible
- **When** the user clicks "Resend verification email"
- **Then** the button shows a loading state, then displays "Verification email sent!" on success

#### Scenario: Resend failure (rate limit or error) from banner

- **Given** the verification banner is visible
- **When** the user clicks "Resend" and BetterAuth returns an error
- **Then** an error message is displayed (surfacing BetterAuth's error message)

---

### Requirement: Email verification landing page

The system SHALL provide a `/auth/verify-email` route that handles the post-verification redirect from BetterAuth
with success and error states.

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

### Requirement: Post-registration "check your email" feedback

The system SHALL show a confirmation message after successful registration rather than immediately navigating away,
telling the user to check their inbox.

#### Scenario: Registration success shows check-email message

- **Given** a user completes the registration form with valid data
- **When** `authClient.signUp.email` resolves successfully
- **Then** the form is replaced by a message containing "Check your" and the user's email address, and a link to sign in

#### Scenario: Registration error still shows form

- **Given** a user submits the registration form
- **When** `authClient.signUp.email` returns an error
- **Then** the form remains visible with the error message displayed

### Requirement: RegisterForm navigation on success

The system SHALL NOT navigate to `/` on successful registration; instead it SHALL display the "check your email"
state in place.

#### Scenario: No navigation on registration success

- **Given** a user successfully registers
- **When** `onSuccess` fires
- **Then** `navigate({ to: "/" })` is NOT called; `isSubmitted` state is set to `true`

### Requirement: ADDED `from` search param on `/auth/verify-email` route (email-verification-hard-gate)

The system SHALL accept an optional `from` search parameter on the `/auth/verify-email` route. After a user's email is verified, the "Continue" navigation SHALL direct the user to the `from` path if present and a valid relative path, or to `/` otherwise.

#### Scenario: FR-4 — "Continue" navigates to `from` after verification

- **Given** the user arrived at `/auth/verify-email?from=/recipes/new` via the guard redirect
- **And** their email is now verified (`emailVerified: true`)
- **When** the verified state renders on `VerifyEmailPage`
- **Then** the "Continue" button/link href is `/recipes/new`

#### Scenario: FR-5 — "Continue" falls back to `/` when `from` is absent

- **Given** the user arrived at `/auth/verify-email` without a `from` param
- **And** their email is now verified
- **When** the verified state renders on `VerifyEmailPage`
- **Then** the "Continue" button/link href is `/`

#### Scenario: NFR-1 — External URL in `from` is rejected

- **Given** `from` is set to `https://evil.com` in the query string
- **When** `validateSearch` processes the route search params
- **Then** `from` is stripped (returns `undefined`), preventing an open redirect

#### Scenario: NFR-1 variant — Protocol-relative URL in `from` is rejected

- **Given** `from` is set to `//evil.com/steal`
- **When** `validateSearch` processes the route search params
- **Then** `from` is stripped (returns `undefined`)

### Requirement: MODIFIED `VerifyEmailPage` accepts and uses `from` prop (email-verification-hard-gate)

`VerifyEmailPage` accepts a `from?: string` prop and uses it as the navigation target when the email-verified state is shown.

#### Scenario: `from` prop flows from route to component

- **Given** the route resolves `from: '/cookbooks/'` from `validateSearch`
- **When** `VerifyEmailRoute` renders `VerifyEmailPage`
- **Then** the "Continue" element navigates to `/cookbooks/`

---

### Requirement: Performance

The system SHALL render the verification banner without introducing network requests beyond the existing session
fetch.

#### Scenario: Banner adds no extra network requests

- **Given** an authenticated unverified user loads any page
- **When** the banner renders
- **Then** no additional API calls are made beyond the existing session fetch (banner reads from already-loaded
  `useAuth()` state)

### Requirement: Security

The system SHALL derive resend eligibility and email address from trusted session state only.

#### Scenario: Resend email sourced from session only

- **Given** an authenticated user sees the resend option
- **When** resend is triggered
- **Then** the email address used is `session.user.email` — not a user-supplied input field — preventing email enumeration

#### Scenario: Banner not rendered for unauthenticated requests

- **Given** no active session (unauthenticated)
- **When** any route renders
- **Then** the verification banner is absent from the DOM

### Requirement: Reliability

The system SHALL tolerate missing legacy `emailVerified` session fields without crashing.

#### Scenario: Missing emailVerified field does not crash banner

- **Given** a session object exists but `user.emailVerified` is `undefined` (edge case: old session shape)
- **When** the banner component evaluates the guard condition
- **Then** no JavaScript error is thrown and the banner is not rendered (`undefined` treated as falsy)

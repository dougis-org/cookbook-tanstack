## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Login page displays contextual redirect banner

The system SHALL display a human-readable message on the login page when the user arrives via an auth guard redirect, keyed on the `reason` search param.

#### Scenario: Banner shown for auth-required reason

- **Given** the user was redirected to `/auth/login?reason=auth-required&from=%2Frecipes%2Fnew`
- **When** the login page renders
- **Then** a visible banner/message is displayed containing text from `REDIRECT_REASON_MESSAGES['auth-required']`
- **And** the message communicates that signing in is required to access the feature

#### Scenario: No banner when navigating to login directly

- **Given** the user navigates to `/auth/login` with no search params
- **When** the login page renders
- **Then** no redirect banner is displayed

#### Scenario: Unknown reason param is handled gracefully

- **Given** the URL is `/auth/login?reason=unknown-value&from=/somewhere`
- **When** the login page renders
- **Then** no banner is shown (unknown reason falls back to no message display)

### Requirement: ADDED Login redirects to `from` path after successful sign-in

The system SHALL redirect the user to the `from` search param path after a successful login, when `from` is a valid relative path.

#### Scenario: Successful login with valid `from` param

- **Given** the user is on `/auth/login?reason=auth-required&from=%2Frecipes%2Fnew`
- **When** the user submits valid credentials and sign-in succeeds
- **Then** the user is navigated to `/recipes/new` (the `from` path)
- **And** not to the default `/` home page

#### Scenario: Successful login with no `from` param

- **Given** the user is on `/auth/login` with no `from` search param
- **When** the user submits valid credentials and sign-in succeeds
- **Then** the user is navigated to the default destination `/`

### Requirement: ADDED Login route validates `reason` and `from` search params

The system SHALL declare `validateSearch` on the login route to type-safely parse `reason` and `from` query parameters.

#### Scenario: Valid params are available as typed values

- **Given** the login route has `validateSearch` defined
- **When** the component reads search params via `Route.useSearch()`
- **Then** `reason` is typed as `RedirectReason | undefined` and `from` as `string | undefined`

## MODIFIED Requirements

### Requirement: MODIFIED Post-login navigation destination

The system SHALL navigate to `from` (if valid relative path) instead of always navigating to `/` after login.

#### Scenario: Default behavior preserved when no `from`

- **Given** a user logs in without a `from` param
- **When** login succeeds
- **Then** they are taken to `/` (existing behavior preserved)

## REMOVED Requirements

None.

## Traceability

- Proposal: "login page displays contextual message explaining the redirect" → Requirement: ADDED login banner
- Proposal: "redirect to `from` after login" → Requirement: ADDED redirect to from path
- Proposal: "reason and destination controlled by centralized auth mechanism" → Requirement: ADDED validateSearch + REDIRECT_REASON_MESSAGES
- Design Decision 4 (reason + from params) → All ADDED requirements in this spec
- Design Decision 5 (REDIRECT_REASON_MESSAGES map) → Requirement: ADDED login banner
- Requirements → Tasks: Task: add validateSearch to login route; Task: update LoginForm to read reason + from; Task: add REDIRECT_REASON_MESSAGES to auth-guard.ts

## Non-Functional Acceptance Criteria

### Requirement: Security — Open redirect prevention

#### Scenario: Absolute URL in `from` param is rejected

- **Given** the login URL contains `from=http%3A%2F%2Fevil.com`
- **When** login succeeds
- **Then** the user is navigated to `/` (default), not to `http://evil.com`

#### Scenario: Protocol-relative URL in `from` param is rejected

- **Given** the login URL contains `from=%2F%2Fevil.com`
- **When** login succeeds
- **Then** the user is navigated to `/` (default), not to `//evil.com`

#### Scenario: Valid relative path in `from` is accepted

- **Given** the login URL contains `from=%2Frecipes%2Fnew`
- **When** login succeeds
- **Then** the user is navigated to `/recipes/new`

### Requirement: Reliability

#### Scenario: Missing or malformed `reason` does not break login page

- **Given** the URL has a missing or unexpected `reason` value
- **When** the login page renders
- **Then** the page renders normally without errors or missing UI elements (just no banner)

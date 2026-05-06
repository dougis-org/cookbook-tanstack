## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `from` search param on `/auth/verify-email` route (FR-4, FR-5, NFR-1)

The system SHALL accept an optional `from` search parameter on the `/auth/verify-email` route. After a user's email is verified, the "Continue" navigation SHALL direct the user to the `from` path if present and a valid relative path, or to `/` otherwise.

#### Scenario: FR-4 — "Continue" navigates to `from` after verification

- **Given** the user arrived at `/auth/verify-email?from=/recipes/new` via the guard redirect
- **And** their email is now verified (`emailVerified: true`)
- **When** the verified state renders on `VerifyEmailPage`
- **Then** the "Continue" button/link href is `/recipes/new`

#### Scenario: FR-5 — "Continue" falls back to `/` when `from` is absent

- **Given** the user arrived at `/auth/verify-email` without a `from` param (e.g., via BetterAuth email-link callback)
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

## MODIFIED Requirements

### Requirement: MODIFIED `VerifyEmailPage` accepts and uses `from` prop

`VerifyEmailPage` previously rendered a static "Continue to app" link pointing to `/`. It SHALL now accept a `from?: string` prop and use it as the navigation target when the email-verified state is shown.

#### Scenario: `from` prop flows from route to component

- **Given** the route resolves `from: '/cookbooks/'` from `validateSearch`
- **When** `VerifyEmailRoute` renders `VerifyEmailPage`
- **Then** the "Continue" element navigates to `/cookbooks/`

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "Add `from` param to verify-email route" → FR-4, FR-5, NFR-1
- Design decision 2 (`from` param, stateless approach) → FR-4, FR-5
- Design decision — open redirect mitigation → NFR-1
- FR-4, FR-5 → Task: Update `VerifyEmailPage` to accept and use `from` prop
- FR-4, FR-5 → Task: Update `verify-email.tsx` `validateSearch`
- NFR-1 → Task: Sanitize `from` in `validateSearch` (reject non-relative paths)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: NFR-1 — Open redirect prevention

- **Given** a malicious actor crafts a URL `/auth/verify-email?from=https://evil.com`
- **When** the route's `validateSearch` runs
- **Then** `from` is returned as `undefined`, and the "Continue" link navigates to `/` instead of the external URL

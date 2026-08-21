## ADDED Requirements

### Requirement: Legacy `/auth/profile` route redirects authenticated visitors to `/account`

The system SHALL guard `/auth/profile` with `requireAuth()` and, for an
authenticated visitor, redirect to `/account` instead of rendering a page.
The component/page previously rendered at this route is removed; the route
file becomes redirect-only.

#### Scenario: Authenticated visitor to /auth/profile is redirected

- **Given** a logged-in user
- **When** they navigate to `/auth/profile` (e.g. via an old bookmark)
- **Then** they are redirected to `/account`
- **And** no profile page content renders at `/auth/profile`

#### Scenario: Unauthenticated visitor to /auth/profile is redirected to login, not /account

- **Given** no active session
- **When** a request is made to `/auth/profile`
- **Then** `requireAuth()` redirects to `/auth/login` (with the standard
  `reason=auth-required` and `from` params)
- **And** the visitor is never redirected to `/account` as an intermediate
  step

### Requirement: Legacy `/account/settings` route redirects authenticated visitors to `/account`

The system SHALL guard `/account/settings` with `requireAuth()` and, for an
authenticated visitor, redirect to `/account` (not to any anchor, tab, or
query-parameterized variant — the bare `/account` path) instead of
rendering the settings form. The component/page previously rendered at this
route is removed; the route file becomes redirect-only.

#### Scenario: Authenticated visitor to /account/settings is redirected

- **Given** a logged-in user
- **When** they navigate to `/account/settings` (e.g. via an old bookmark or
  a stale e2e test)
- **Then** they are redirected to `/account`
- **And** no settings-form content renders at `/account/settings`

#### Scenario: Unauthenticated visitor to /account/settings is redirected to login, not /account

- **Given** no active session
- **When** a request is made to `/account/settings`
- **Then** `requireAuth()` redirects to `/auth/login` (with the standard
  `reason=auth-required` and `from` params)
- **And** the visitor is never redirected to `/account` as an intermediate
  step

## Traceability

- Proposal "Redirects" scope item (`/auth/profile` and `/account/settings`
  should redirect to the consolidated route(s) rather than 404 or leave dead
  links) → both ADDED requirements above
- Proposal acceptance criterion "Given an existing bookmark or link ... they
  are redirected to the consolidated route rather than seeing a 404" → both
  ADDED requirements above
- Design decision 3 (`requireAuth()` runs synchronously before the
  unconditional redirect, verified against `src/lib/auth-guard.ts`) →
  both "Unauthenticated visitor ... redirected to login, not /account"
  scenarios
- Requirements → Tasks: convert `src/routes/auth/profile.tsx` and
  `src/routes/account_.settings.tsx` to redirect-only routes, with
  regression test coverage for both the authenticated and unauthenticated
  cases on each

# Spec: Route Guards

Capability: `src/lib/auth-guard.ts` — `requireTier()` implementation, `requireAdmin()` stub

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED requireTier(tier) enforces "at least this tier"

The system SHALL implement `requireTier(tier: UserTier)` as a `beforeLoad`-compatible factory that redirects users whose tier rank is below the required tier to `/account` with `reason: 'tier-limit-reached'`.

#### Scenario: User with sufficient tier proceeds

- **Given** a route protected with `beforeLoad: requireTier('sous-chef')`
- **When** an authenticated user with `tier: 'executive-chef'` and `isAdmin: false` navigates to the route
- **Then** navigation proceeds; no redirect occurs

#### Scenario: User with exact matching tier proceeds

- **Given** a route protected with `beforeLoad: requireTier('prep-cook')`
- **When** an authenticated user with `tier: 'prep-cook'` and `isAdmin: false` navigates
- **Then** navigation proceeds

#### Scenario: User with insufficient tier is redirected

- **Given** a route protected with `beforeLoad: requireTier('sous-chef')`
- **When** an authenticated user with `tier: 'prep-cook'` navigates
- **Then** the user is redirected to `/account` with `reason: 'tier-limit-reached'`

#### Scenario: Unauthenticated user is redirected to login, not account

- **Given** a route protected with `beforeLoad: requireTier('prep-cook')`
- **When** an unauthenticated user navigates
- **Then** the user is redirected to `/auth/login` with `reason: 'auth-required'` (requireAuth behaviour, not requireTier)

#### Scenario: Admin user bypasses tier check

- **Given** a route protected with `beforeLoad: requireTier('executive-chef')`
- **When** an authenticated user with `tier: 'home-cook'` and `isAdmin: true` navigates
- **Then** navigation proceeds

---

### Requirement: ADDED requireAdmin() stub

The system SHALL provide a `requireAdmin()` function in `auth-guard.ts` that redirects non-admin users to `/account` with `reason: 'tier-limit-reached'`. No routes use it yet; it is available for future wiring.

#### Scenario: Admin user proceeds

- **Given** `requireAdmin()` is used as a `beforeLoad` guard
- **When** an authenticated user with `isAdmin: true` navigates
- **Then** navigation proceeds

#### Scenario: Non-admin user is redirected

- **Given** `requireAdmin()` is used as a `beforeLoad` guard
- **When** an authenticated user with `isAdmin: false` navigates
- **Then** the user is redirected to `/account` with `reason: 'tier-limit-reached'`

## MODIFIED Requirements

### Requirement: MODIFIED requireTier stub replaced with implementation

The `@future requireTier` stub comment in `auth-guard.ts` SHALL be replaced by the live implementation. The `RedirectReason` type and `REDIRECT_REASON_MESSAGES` record already exist and SHALL NOT be changed.

#### Scenario: Existing requireAuth behaviour is unchanged

- **Given** a route protected with `beforeLoad: requireAuth()`
- **When** an unauthenticated user navigates
- **Then** behaviour is identical to the current implementation (redirect to `/auth/login` with `reason: 'auth-required'`)

## REMOVED Requirements

None.

## Traceability

- Proposal element "requireTier() route guard implementation" → Requirement: ADDED requireTier(tier)
- Design Decision 4 (two-layer enforcement) → Requirement: ADDED requireTier(tier), ADDED requireAdmin() stub
- Design Decision 3 (admin bypass via hasAtLeastTier) → Scenario: Admin user bypasses tier check
- Requirement "requireTier" → Task: implement requireTier in src/lib/auth-guard.ts
- Requirement "requireAdmin stub" → Task: add requireAdmin to src/lib/auth-guard.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: requireTier does not trust client-supplied tier data

- **Given** a route protected with `requireTier('sous-chef')`
- **When** any client request is made (including forged session)
- **Then** tier enforcement reads from `context.session.user.tier` (server-issued session), not from query params, headers, or request body

### Requirement: Reliability

#### Scenario: requireTier handles missing tier gracefully

- **Given** a session user with no `tier` field (pre-migration)
- **When** `requireTier('prep-cook')` evaluates the user
- **Then** the user is redirected (treated as `'home-cook'`); no runtime error is thrown

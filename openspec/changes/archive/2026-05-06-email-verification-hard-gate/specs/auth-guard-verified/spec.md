## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `requireVerifiedAuth()` route guard (FR-1, FR-2, FR-3, NFR-2)

The system SHALL redirect unauthenticated users to `/auth/login` and redirect authenticated-but-unverified users to `/auth/verify-email?from=<path>` when accessing any route guarded by `requireVerifiedAuth()`. Authenticated verified users SHALL pass through without redirect.

#### Scenario: FR-1 — Unauthenticated user is redirected to login

- **Given** `context.session` is `null`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** a redirect is thrown to `/auth/login` with `reason: 'auth-required'` and `from: <current path>` search params

#### Scenario: FR-2 — Authenticated unverified user is redirected to verify-email

- **Given** `context.session.user.emailVerified` is `false`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** a redirect is thrown to `/auth/verify-email` with `from: <current path>` search param

#### Scenario: FR-3 — Authenticated verified user passes through

- **Given** `context.session.user.emailVerified` is `true`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** no redirect is thrown and the route renders normally

#### Scenario: NFR-2 — Legacy session with undefined emailVerified passes through

- **Given** `context.session.user.emailVerified` is `undefined`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** no redirect is thrown (treat undefined as verified; only explicit `false` gates)

### Requirement: ADDED guard applied to content-creation and tier-change routes

The system SHALL apply `requireVerifiedAuth()` as the `beforeLoad` guard on `/recipes/new`, `/recipes/$recipeId/edit`, `/import`, and `/change-tier`. The `/cookbooks/` listing page is intentionally public and is NOT guarded at the route level; instead, the `cookbooks.create` tRPC mutation uses `verifiedProcedure` to enforce verification at the API level.

#### Scenario: Unverified user navigates to recipe creation

- **Given** an authenticated user with `emailVerified: false`
- **When** they navigate to `/recipes/new`
- **Then** they are redirected to `/auth/verify-email?from=/recipes/new`

#### Scenario: Unverified user navigates to tier change

- **Given** an authenticated user with `emailVerified: false`
- **When** they navigate to `/change-tier`
- **Then** they are redirected to `/auth/verify-email?from=/change-tier`

#### Scenario: Unverified user attempts to create a cookbook via API

- **Given** an authenticated user with `emailVerified: false`
- **When** they call the `cookbooks.create` tRPC mutation
- **Then** the mutation returns a `FORBIDDEN` error with cause `email-not-verified`

## MODIFIED Requirements

### Requirement: MODIFIED existing `requireAuth()` routes replaced by `requireVerifiedAuth()`

The system SHALL enforce email verification (in addition to authentication) on `/recipes/new`, `/recipes/$recipeId/edit`, and `/import`. These routes previously required authentication only.

#### Scenario: Previously authenticated-only route now also checks verification

- **Given** an authenticated user with `emailVerified: false` on `/recipes/$recipeId/edit`
- **When** `requireVerifiedAuth()` runs
- **Then** the user is redirected to `/auth/verify-email?from=/recipes/<id>/edit`

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "New `requireVerifiedAuth()` guard" → FR-1, FR-2, FR-3, NFR-2
- Design decision 1 (combined guard) → FR-1, FR-2, FR-3
- FR-1 → Task: Add `requireVerifiedAuth()` to `auth-guard.ts`
- FR-2 → Task: Add `requireVerifiedAuth()` to `auth-guard.ts`
- FR-3 → Task: Add `requireVerifiedAuth()` to `auth-guard.ts`
- NFR-2 → Task: Add `requireVerifiedAuth()` to `auth-guard.ts`
- "Apply guard to five routes" → Task: Update five route files

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: NFR-2 — Guard does not break legacy sessions

- **Given** a session where `emailVerified` is `undefined` (e.g., pre-verification-feature accounts)
- **When** `requireVerifiedAuth()` runs
- **Then** the user is not redirected and accesses the route normally

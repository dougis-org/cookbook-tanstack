## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED useTierEntitlements hook

The system SHALL provide a `useTierEntitlements()` hook that returns pre-computed tier capability flags and limits derived from the current session.

#### Scenario: Authenticated user gets correct entitlements

- **Given** a user is logged in with tier `'prep-cook'`
- **When** a component calls `useTierEntitlements()`
- **Then** it returns `{ tier: 'prep-cook', canCreatePrivate: false, canImport: false, recipeLimit: 100, cookbookLimit: 10 }`

#### Scenario: sous-chef user gets elevated entitlements

- **Given** a user is logged in with tier `'sous-chef'`
- **When** a component calls `useTierEntitlements()`
- **Then** `canCreatePrivate` is `true`, `canImport` is `true`, `recipeLimit` is `500`, `cookbookLimit` is `25`

#### Scenario: Null session returns home-cook fallback

- **Given** a user is not yet authenticated (session is null or pending)
- **When** a component calls `useTierEntitlements()`
- **Then** it returns entitlements equivalent to `'home-cook'` tier (most-restrictive non-anonymous default)

#### Scenario: Admin user tier is respected as-is

- **Given** a user is logged in as admin with tier `'executive-chef'`
- **When** a component calls `useTierEntitlements()`
- **Then** the hook returns entitlements for `'executive-chef'` — admin bypass is handled server-side only

## MODIFIED Requirements

No existing requirements modified. This is a new hook.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "Client-side tier access via session" -> Requirement: ADDED useTierEntitlements hook
- Design Decision 2 (useTierEntitlements hook) -> Requirement: ADDED useTierEntitlements hook
- Requirement: ADDED useTierEntitlements -> Task: implement-use-tier-entitlements

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Hook is safe to call outside AuthProvider during tests

- **Given** a test renders a component using `useTierEntitlements()` without wrapping in `AuthProvider`
- **When** the component mounts
- **Then** an error is thrown with a clear message (inherits from `useAuth()` context guard)

# Spec: tRPC Procedure Guards

Capability: `src/server/trpc/init.ts` — `tierProcedure(tier)`, `adminProcedure` stub

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED tierProcedure(tier) enforces "at least this tier" server-side

The system SHALL provide `tierProcedure(tier: UserTier)` as a tRPC procedure factory that throws `TRPCError({ code: 'FORBIDDEN' })` when the authenticated user's tier rank is below the required tier. Admin users SHALL always pass.

#### Scenario: Procedure call succeeds for user with sufficient tier

- **Given** a tRPC procedure wrapped with `tierProcedure('sous-chef')`
- **When** called by an authenticated user with `tier: 'executive-chef'` and `isAdmin: false`
- **Then** the procedure executes and returns its result

#### Scenario: Procedure call fails for user with insufficient tier

- **Given** a tRPC procedure wrapped with `tierProcedure('sous-chef')`
- **When** called by an authenticated user with `tier: 'home-cook'` and `isAdmin: false`
- **Then** a `TRPCError` with code `'FORBIDDEN'` is thrown

#### Scenario: Admin user bypasses tier check in procedure

- **Given** a tRPC procedure wrapped with `tierProcedure('executive-chef')`
- **When** called by a user with `tier: 'home-cook'` and `isAdmin: true`
- **Then** the procedure executes successfully

#### Scenario: Unauthenticated call is rejected before tier check

- **Given** a tRPC procedure wrapped with `tierProcedure('prep-cook')`
- **When** called without a valid session
- **Then** a `TRPCError` with code `'UNAUTHORIZED'` is thrown (not `'FORBIDDEN'`)

---

### Requirement: ADDED adminProcedure stub

The system SHALL provide `adminProcedure` as a tRPC procedure that throws `TRPCError({ code: 'FORBIDDEN' })` when `ctx.user.isAdmin` is `false`. No routers use it yet.

#### Scenario: Admin procedure allows admin user

- **Given** a tRPC procedure wrapped with `adminProcedure`
- **When** called by a user with `isAdmin: true`
- **Then** the procedure executes

#### Scenario: Admin procedure rejects non-admin user

- **Given** a tRPC procedure wrapped with `adminProcedure`
- **When** called by a user with `isAdmin: false`
- **Then** a `TRPCError` with code `'FORBIDDEN'` is thrown

## MODIFIED Requirements

### Requirement: MODIFIED UserDocument interface in users.ts

The `UserDocument` interface in `src/server/trpc/routers/users.ts` SHALL be extended with `tier?: UserTier` and `isAdmin?: boolean` fields to match the stored document shape.

#### Scenario: transformUserDoc handles tier and isAdmin

- **Given** a MongoDB user document containing `tier: 'sous-chef'` and `isAdmin: false`
- **When** `transformUserDoc` processes the document
- **Then** the returned object includes `tier: 'sous-chef'` and `isAdmin: false`

#### Scenario: transformUserDoc handles missing tier gracefully

- **Given** a MongoDB user document with no `tier` field
- **When** `transformUserDoc` processes the document
- **Then** the returned object sets `tier` to `undefined` or `'home-cook'` without throwing

## REMOVED Requirements

None.

## Traceability

- Proposal element "tierProcedure(tier) tRPC helper" → Requirement: ADDED tierProcedure(tier)
- Proposal element "adminProcedure tRPC helper stub" → Requirement: ADDED adminProcedure stub
- Design Decision 4 (two-layer enforcement) → Requirement: ADDED tierProcedure(tier)
- Design Decision 6 (stubs with real logic) → Requirement: ADDED adminProcedure stub
- Proposal element "UserDocument interface update" → Requirement: MODIFIED UserDocument interface
- Requirement "tierProcedure" → Task: add tierProcedure to src/server/trpc/init.ts
- Requirement "adminProcedure stub" → Task: add adminProcedure to src/server/trpc/init.ts
- Requirement "UserDocument" → Task: extend UserDocument in users.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Server enforces tier independently of route guard

- **Given** a tRPC procedure wrapped with `tierProcedure('sous-chef')`
- **When** called directly via HTTP (bypassing the route guard) by a user with `tier: 'home-cook'`
- **Then** a `TRPCError` with code `'FORBIDDEN'` is thrown; the procedure body does not execute

### Requirement: Reliability

#### Scenario: Procedure guard handles undefined tier without crashing

- **Given** a session user with `tier` field absent (pre-migration) and `isAdmin: false`
- **When** a `tierProcedure('prep-cook')` call is made
- **Then** `FORBIDDEN` is thrown; no unhandled exception or 500 error

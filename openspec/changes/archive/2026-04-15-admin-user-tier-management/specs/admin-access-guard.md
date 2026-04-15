## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Admin route access control

The system SHALL redirect unauthenticated users away from `/admin/*` routes to `/auth/login`, and redirect authenticated non-admin users to `/account`.

#### Scenario: Unauthenticated access attempt

- **Given** a user with no active session
- **When** they navigate directly to `/admin/users`
- **Then** they are redirected to `/auth/login` with `reason=auth-required` and `from=/admin/users` search params

#### Scenario: Authenticated non-admin access attempt

- **Given** a user with an active session where `isAdmin` is `false` or absent
- **When** they navigate directly to `/admin/users`
- **Then** they are redirected to `/account` with `reason=tier-limit-reached`

#### Scenario: Admin access granted

- **Given** a user with an active session where `isAdmin` is `true`
- **When** they navigate to `/admin/users`
- **Then** the page renders successfully with no redirect

### Requirement: ADDED Admin tRPC procedure access control

The system SHALL reject calls to any `admin.*` tRPC procedure from callers who are not authenticated admins, returning a FORBIDDEN error.

#### Scenario: Non-admin caller blocked at API level

- **Given** an authenticated user where `ctx.user.isAdmin` is `false`
- **When** they call `admin.users.list` or `admin.users.setTier` directly
- **Then** the procedure throws `TRPCError` with code `FORBIDDEN`

#### Scenario: Unauthenticated caller blocked

- **Given** a request with no valid session
- **When** they call any `admin.*` tRPC procedure
- **Then** the procedure throws `TRPCError` with code `UNAUTHORIZED`

## MODIFIED Requirements

None. `requireAuth()` and `requireAdmin()` guards already exist — this change wires them up, not modifies them.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Protected admin route" → Requirement: Admin route access control
- Proposal element "tRPC admin procedures use adminProcedure" → Requirement: Admin tRPC procedure access control
- Design decision 1 (dual-layer guard) → Both requirements above
- Requirement: Admin route access control → Task: Create `src/routes/admin.tsx` layout route with `beforeLoad`
- Requirement: Admin tRPC procedure access control → Task: Create `src/server/trpc/routers/admin.ts` with `adminProcedure`

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Route guard cannot be bypassed by direct URL

- **Given** an authenticated non-admin user
- **When** they construct and navigate to the exact `/admin/users` URL
- **Then** `requireAdmin()` fires in `beforeLoad` and redirects before the component mounts

#### Scenario: API guard cannot be bypassed by crafted tRPC call

- **Given** an authenticated non-admin user
- **When** they send a raw tRPC request to `admin.users.setTier`
- **Then** `adminProcedure` middleware rejects with `FORBIDDEN` before the resolver executes

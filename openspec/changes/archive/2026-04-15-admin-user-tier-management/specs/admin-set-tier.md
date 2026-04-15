## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Admin can change any user's tier via confirmation modal

The system SHALL allow an admin to select a new tier for any user (except themselves), show a confirmation modal with the old and new tier, and apply the change only after explicit confirmation.

#### Scenario: Successful tier change with confirmation

- **Given** an authenticated admin viewing the user list
- **When** they select a new tier for a target user and the confirmation modal appears
- **And** they click "Confirm"
- **Then** the user's tier is updated in the database, the table reflects the new tier, and the confirmation modal closes

#### Scenario: Tier change cancelled

- **Given** the confirmation modal is open showing a pending tier change
- **When** the admin clicks "Cancel"
- **Then** no database update occurs, the user's tier remains unchanged, and the modal closes

#### Scenario: No-op — same tier selected

- **Given** a user already on tier "sous-chef"
- **When** the admin selects "sous-chef" again for that user
- **Then** the mutation returns early with no database write and no audit log entry

### Requirement: ADDED Self-tier-change blocked

The system SHALL prevent an admin from changing their own tier, rejecting the attempt server-side with a FORBIDDEN error.

#### Scenario: Admin attempts to change own tier

- **Given** an admin is viewing the user list
- **When** they attempt to change the tier of the row corresponding to their own user ID
- **Then** the server returns `TRPCError` with code `FORBIDDEN` and the UI displays an error message

#### Scenario: Admin tier selector disabled for own row (UI layer)

- **Given** an admin is viewing their own row in the user list
- **When** the table renders
- **Then** the tier selector for that row is disabled, preventing selection before the server is even called

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Ability to promote/demote a user's tier" → Requirement: Admin can change any user's tier
- Proposal element "Confirmation step before making changes" → Requirement: Confirmation modal (embedded in tier change requirement)
- Proposal element "Admin cannot change own tier" → Requirement: Self-tier-change blocked
- Design decision 4 (confirmation modal) → Requirement: Confirmation modal flow
- Design decision 5 (self-demotion blocked server-side) → Requirement: Self-tier-change blocked
- Design decision 6 (no-op on same tier) → Scenario: No-op — same tier selected
- Requirement: Admin can change any user's tier → Task: Create `admin.users.setTier` mutation
- Requirement: Admin can change any user's tier → Task: Create confirmation modal component
- Requirement: Self-tier-change blocked → Task: Add self-check in `setTier` mutation; disable selector in UI for own row

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Self-change blocked at API level regardless of UI

- **Given** an admin whose `ctx.user.id` matches the `targetUserId` in the mutation input
- **When** the `admin.users.setTier` mutation executes
- **Then** it throws `FORBIDDEN` before any database write occurs

### Requirement: Reliability

#### Scenario: Mutation input validated before execution

- **Given** an invalid tier string passed to `admin.users.setTier`
- **When** the mutation input is parsed
- **Then** Zod validation rejects the input with a `BAD_REQUEST` error before the resolver runs

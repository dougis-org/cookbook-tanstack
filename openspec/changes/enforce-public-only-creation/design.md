## Context

- Relevant architecture: TRPC router procedures (`src/server/trpc/routers/`) and Tier-based entitlement logic (`src/lib/tier-entitlements.ts`).
- Dependencies: `src/lib/tier-entitlements.ts` (for `canCreatePrivate`), `src/types/user.ts` (for `UserTier` types).
- Interfaces/contracts touched: `recipes.create`, `recipes.update`, `recipes.import`, `cookbooks.create`, `cookbooks.update`.

## Goals / Non-Goals

### Goals

- Implement server-side coercion of `isPublic` to `true` on creation for restricted tiers.
- Implement server-side rejection of `isPublic: false` on update for restricted tiers.
- Exempt admins from these restrictions.
- Ensure thorough test coverage for restricted, allowed, and admin users.

### Non-Goals

- Front-end UI changes.
- Modification of existing database records.
- Enforcement of other tier-based limits (e.g., total recipe count).

## Decisions

### Decision 1: Silent Coercion on Creation

- Chosen: Coerce `input.isPublic` to `true` if the user is not an admin and cannot create private content.
- Alternatives considered: Rejection with an error.
- Rationale: As per the issue description, silent coercion provides a better user experience for creation, as the user might not be aware of their tier restrictions.
- Trade-offs: User might be surprised their content is public, but this is deemed acceptable for creation.

### Decision 2: Explicit Rejection on Update

- Chosen: Throw `TRPCError({ code: 'FORBIDDEN' })` if a restricted user tries to set `isPublic: false`.
- Alternatives considered: Silent coercion.
- Rationale: Silent coercion on update could lead to data loss of intent without feedback. An explicit error is clearer for state transitions.
- Trade-offs: Requires client-side handling of the error, but aligns with standard security practices for restricted actions.

### Decision 3: Centralized Tier Logic

- Chosen: Use `canCreatePrivate(ctx.user.tier)` from `src/lib/tier-entitlements.ts`.
- Alternatives considered: Hardcoding tier checks in the routers.
- Rationale: Reuses existing single source of truth for entitlements, making future changes (e.g., adding a new tier) easier.
- Trade-offs: Adds a dependency on `src/lib/tier-entitlements.ts` to the routers.

## Proposal to Design Mapping

- Proposal element: Coerce `isPublic: true` for Home/Prep Cook on create
  - Design decision: Decision 1
  - Validation approach: Unit tests verifying `isPublic` state after creation for restricted users.
- Proposal element: Reject `isPublic: false` for Home/Prep Cook on update
  - Design decision: Decision 2
  - Validation approach: Unit tests verifying `FORBIDDEN` error is thrown for restricted users.
- Proposal element: Admins are exempt
  - Design decision: Decisions 1 & 2 (check `ctx.user.isAdmin`)
  - Validation approach: Unit tests verifying admins can create/update private content.

## Functional Requirements Mapping

- Requirement: Silent coercion for `recipes.create`
  - Design element: Logic in `recipes.create` mutation.
  - Acceptance criteria reference: AC1
  - Testability notes: Test with restricted user caller.
- Requirement: Silent coercion for `recipes.import`
  - Design element: Logic in `recipes.import` mutation.
  - Acceptance criteria reference: AC2
  - Testability notes: Test with restricted user caller.
- Requirement: Rejection for `recipes.update`
  - Design element: Logic in `recipes.update` mutation.
  - Acceptance criteria reference: AC3
  - Testability notes: Test for `TRPCError` code `FORBIDDEN`.
- Requirement: Silent coercion for `cookbooks.create`
  - Design element: Logic in `cookbooks.create` mutation.
  - Acceptance criteria reference: AC4
  - Testability notes: Test with restricted user caller.
- Requirement: Rejection for `cookbooks.update`
  - Design element: Logic in `cookbooks.update` mutation.
  - Acceptance criteria reference: AC5
  - Testability notes: Test for `TRPCError` code `FORBIDDEN`.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Ensure restricted users cannot bypass visibility limits via API.
  - Design element: Server-side validation/coercion in TRPC procedures.
  - Acceptance criteria reference: AC1-AC5
  - Testability notes: Essential to test via direct TRPC caller in unit tests.

## Risks / Trade-offs

- Risk/trade-off: Silent coercion might be unexpected.
  - Impact: Low.
  - Mitigation: Adhere to issue requirements for "silent" behavior on create.

## Rollback / Mitigation

- Rollback trigger: Regression in creation for Sous Chef+ users or Admins.
- Rollback steps: Revert changes in `recipes.ts` and `cookbooks.ts`.
- Data migration considerations: None (no schema changes).
- Verification after rollback: Run existing TRPC router tests.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix tests or infrastructure issues.
- If security checks fail: High priority fix.
- If required reviews are blocked/stale: Re-request or escalate.
- Escalation path and timeout: N/A for this task.

## Open Questions

- None.

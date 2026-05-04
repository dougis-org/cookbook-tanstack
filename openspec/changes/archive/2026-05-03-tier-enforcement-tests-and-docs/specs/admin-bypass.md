## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Admin bypass applies to recipe update visibility mutations

The system SHALL allow an admin user to set `isPublic: false` on a recipe update regardless of their own tier value.

#### Scenario: Admin with home-cook tier can make a recipe private on update

- **Given** an authenticated user with `tier: 'home-cook'` and `isAdmin: true`
- **And** the user owns a public recipe
- **When** the user calls `recipes.update` with `{ isPublic: false }`
- **Then** the update succeeds and the recipe is saved as private

#### Scenario: Non-admin home-cook cannot set isPublic false on update

- **Given** an authenticated user with `tier: 'home-cook'` and `isAdmin: false`
- **And** the user owns a public recipe
- **When** the user calls `recipes.update` with `{ isPublic: false }`
- **Then** the mutation throws `FORBIDDEN`

## MODIFIED Requirements

No existing requirements are modified by this spec.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Admin bypass on update paths untested" → Requirements above
- Design decision 2 (null-tier/admin test placement) → Requirements above
- Requirements → Task: Add admin-bypass-on-update test to recipes.test.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Admin bypass does not leak to non-admin users

- **Given** a non-admin user with any tier
- **When** they attempt to set `isPublic: false` on update below the required tier
- **Then** the system returns `FORBIDDEN` — admin bypass is not reachable by non-admins

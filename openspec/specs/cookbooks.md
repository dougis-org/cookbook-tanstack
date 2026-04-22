## MODIFIED Requirements

### Requirement: MODIFIED cookbook creation visibility enforcement

The system SHALL coerce `isPublic` to `true` when a user with a tier that cannot create private content attempts to create a cookbook.

#### Scenario: Home Cook creates private cookbook
- **Given** an authenticated user with `tier: 'home-cook'`
- **When** calling `cookbooks.create` with `isPublic: false`
- **Then** the cookbook is saved with `isPublic: true`
- **And** no error is returned to the user

### Requirement: MODIFIED cookbook update visibility enforcement

The system SHALL reject setting `isPublic` to `false` when a user with a tier that cannot create private content attempts to update a cookbook.

#### Scenario: Prep Cook attempts to make cookbook private
- **Given** an authenticated user with `tier: 'prep-cook'`
- **And** an existing cookbook owned by this user
- **When** calling `cookbooks.update` with `isPublic: false`
- **Then** a `TRPCError` with code `FORBIDDEN` is thrown

## Traceability

- Proposal element: Coerce `isPublic: true` for Home/Prep Cook on create -> Requirement: cookbook creation visibility enforcement
- Proposal element: Reject `isPublic: false` for Home/Prep Cook on update -> Requirement: cookbook update visibility enforcement
- Design decision: Decision 1: Silent Coercion on Creation -> Requirement: cookbook creation visibility enforcement
- Design decision: Decision 2: Explicit Rejection on Update -> Requirement: cookbook update visibility enforcement

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Visibility bypass prevention
- **Given** a user with `tier: 'home-cook'`
- **When** attempting to bypass client-side limits to create private content
- **Then** the server enforces visibility constraints as defined in the requirements

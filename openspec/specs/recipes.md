## MODIFIED Requirements

### Requirement: MODIFIED recipe creation visibility enforcement

The system SHALL coerce `isPublic` to `true` when a user with a tier that cannot create private content attempts to create a recipe.

#### Scenario: Home Cook creates private recipe
- **Given** an authenticated user with `tier: 'home-cook'`
- **When** calling `recipes.create` with `isPublic: false`
- **Then** the recipe is saved with `isPublic: true`
- **And** no error is returned to the user

#### Scenario: Sous Chef creates private recipe
- **Given** an authenticated user with `tier: 'sous-chef'`
- **When** calling `recipes.create` with `isPublic: false`
- **Then** the recipe is saved with `isPublic: false`

### Requirement: MODIFIED recipe import visibility enforcement

The system SHALL coerce `isPublic` to `true` when a user with a tier that cannot create private content attempts to import a recipe.

#### Scenario: Prep Cook imports private recipe
- **Given** an authenticated user with `tier: 'prep-cook'`
- **When** calling `recipes.import` with `isPublic: false`
- **Then** the recipe is saved with `isPublic: true`

### Requirement: MODIFIED recipe update visibility enforcement

The system SHALL reject setting `isPublic` to `false` when a user with a tier that cannot create private content attempts to update a recipe.

#### Scenario: Home Cook attempts to make recipe private
- **Given** an authenticated user with `tier: 'home-cook'`
- **And** an existing recipe owned by this user
- **When** calling `recipes.update` with `isPublic: false`
- **Then** a `TRPCError` with code `FORBIDDEN` is thrown
- **And** the recipe remains public in the database

#### Scenario: Admin attempts to make recipe private
- **Given** an authenticated user with `isAdmin: true` and `tier: 'home-cook'`
- **And** an existing recipe owned by this user
- **When** calling `recipes.update` with `isPublic: false`
- **Then** the recipe is updated to `isPublic: false`

## Traceability

- Proposal element: Coerce `isPublic: true` for Home/Prep Cook on create -> Requirement: recipe creation visibility enforcement
- Proposal element: Reject `isPublic: false` for Home/Prep Cook on update -> Requirement: recipe update visibility enforcement
- Design decision: Decision 1: Silent Coercion on Creation -> Requirement: recipe creation/import visibility enforcement
- Design decision: Decision 2: Explicit Rejection on Update -> Requirement: recipe update visibility enforcement

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Visibility bypass prevention
- **Given** a user with `tier: 'home-cook'`
- **When** attempting to bypass client-side limits to create private content
- **Then** the server enforces visibility constraints as defined in the requirements

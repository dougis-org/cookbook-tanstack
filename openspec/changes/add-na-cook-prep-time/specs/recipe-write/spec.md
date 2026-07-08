## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Accept explicit N/A (null) for prepTime and cookTime

The system SHALL accept `null` for `prepTime` and `cookTime` in the `recipes.create` and `recipes.update` tRPC mutations, treating `null` as an explicit "N/A" (not applicable) value, and SHALL accept `0` as a valid input that is equivalent to N/A.

#### Scenario: Update an existing recipe's prepTime to N/A

- **Given** an authenticated owner of a recipe with `prepTime: 30`
- **When** the owner calls `recipes.update` with `{ id, prepTime: null }`
- **Then** the mutation succeeds
- **And** the persisted recipe document has `prepTime: null`

#### Scenario: Create a recipe with cookTime explicitly set to N/A

- **Given** an authenticated user creating a new recipe
- **When** the user calls `recipes.create` with `cookTime: null` in the payload
- **Then** the mutation succeeds
- **And** the persisted recipe document has `cookTime: null`

#### Scenario: Negative prepTime or cookTime is still rejected

- **Given** an authenticated user submitting a create or update payload
- **When** the payload includes `prepTime: -5` or `cookTime: -5`
- **Then** the mutation is rejected with a validation error
- **And** no recipe document is created or modified

#### Scenario: Zero is accepted as a valid, N/A-equivalent value

- **Given** an authenticated user submitting a create or update payload
- **When** the payload includes `prepTime: 0` or `cookTime: 0`
- **Then** the mutation succeeds
- **And** the persisted value is stored as `0` (display-layer normalization to "N/A" is handled by the `recipe-time-display` capability, not by rewriting the stored value)

## MODIFIED Requirements

### Requirement: MODIFIED recipeFields prepTime/cookTime validation

The system SHALL validate `prepTime` and `cookTime` as `nullable`, non-negative integers, replacing the prior `positive`-only, non-nullable constraint.

#### Scenario: Omitting prepTime/cookTime on update leaves the existing value unchanged

- **Given** an existing recipe with `prepTime: 20`
- **When** the owner calls `recipes.update` with a payload that does not include a `prepTime` key at all
- **Then** the persisted recipe's `prepTime` remains `20`

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Server schema rejects `null` outright for `prepTime`/`cookTime` -> MODIFIED recipeFields prepTime/cookTime validation
- Proposal element -> Requirement: `0` should be accepted, not rejected, and treated as N/A downstream -> ADDED Accept explicit N/A (null) for prepTime and cookTime (zero scenario)
- Design decision -> Requirement: Decision 1 (N/A represented as `null`) -> ADDED Accept explicit N/A (null) for prepTime and cookTime
- Design decision -> Requirement: Decision 2 (schema-only backend change, `.nonnegative().nullable().optional()`) -> MODIFIED recipeFields prepTime/cookTime validation
- Requirement -> Task(s): See [`tasks.md`](../../tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** normal load
- **When** executing `recipes.create` or `recipes.update` with a nullable `prepTime`/`cookTime` payload
- **Then** validation and persistence add no measurable additional latency versus the prior non-nullable schema (schema shape change only, no new queries)

### Requirement: Security

See functional scenarios: "Negative prepTime or cookTime is still rejected" (existing ownership/tier checks in `recipes.update`/`recipes.create` are unmodified by this change; no new access-control surface is introduced).

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a recipe document already has a legacy `cookTime: 0` or `prepTime: 0` value from before this change
- **When** the document is read by any existing query (`byId`, `list`, cookbook population)
- **Then** the value is returned unchanged (`0`) with no error, and no migration or rewrite is triggered by the read path itself. (Note: saving/autosaving that specific recipe through the edit form is a separate, client-initiated write — see `recipe-time-display`'s N/A toggle requirement — and will write the value forward as `null`, which is expected, ordinary editing behavior, not a migration.)

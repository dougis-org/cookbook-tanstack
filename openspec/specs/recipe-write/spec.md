## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-normalize-personal-source-name/design.md) document, not a replacement.

### Requirement: ADDED Trim personalSourceName

The system SHALL trim leading and trailing whitespace from the `personalSourceName` field during validation.

#### Scenario: Submitting padded personalSourceName

- **Given** a create or update payload containing `personalSourceName` with leading and/or trailing whitespace
- **When** the payload is validated against `recipeFields`
- **Then** the resulting parsed string has the whitespace removed

### Requirement: ADDED Wire personalSourceName to RecipeForm

The system SHALL accept and display the `personalSourceName` field inside `RecipeForm`, passing it into `SourceSelector`, and including it in create/edit submit and autosave payloads.

#### Scenario: Create recipe with Personal source and personalSourceName

- **Given** the user is on the "Create New Recipe" page
- **When** the user selects the `"Personal"` source, enters `"Aunt Mary"` in "Personal Name", and submits the form
- **Then** the create tRPC mutation is invoked with `personalSourceName: "Aunt Mary"`.

#### Scenario: Edit recipe with existing personalSourceName

- **Given** a recipe has `"personal"` source and `personalSourceName` `"Aunt Mary"`
- **When** the user opens the "Edit Recipe" page
- **Then** the `"Personal Name"` field inside `SourceSelector` is pre-filled with `"Aunt Mary"`.

#### Scenario: Revert recipe edits including personalSourceName

- **Given** a recipe has `"personal"` source and `personalSourceName` `"Aunt Mary"` in edit mode
- **When** the user types `"Uncle Bob"` into the Personal Name field and clicks `"Revert"`
- **Then** the field resets to `"Aunt Mary"` and the form is marked clean.

#### Scenario: Autosave fallback if save fails

- **Given** a dirty form state including modified `personalSourceName`
- **When** autosave triggers but network is offline
- **Then** the save status goes to `"error"`
- **And** the user is allowed to manually retry when online.

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

### Requirement: MODIFIED Normalize personalSourceName on create/update

The system SHALL enforce that `personalSourceName` is only retained if the `sourceId` exactly matches the Personal source ID.

#### Scenario: Creating a recipe with Personal source

- **Given** the database has a Source with slug "personal"
- **When** a user creates a recipe providing the Personal source ID and a `personalSourceName`
- **Then** the recipe is saved with the provided `personalSourceName`

#### Scenario: Creating a recipe with a non-Personal source

- **Given** the database has a Source with slug "personal"
- **When** a user creates a recipe providing a different `sourceId` and a `personalSourceName`
- **Then** the `personalSourceName` is discarded before saving the recipe

#### Scenario: Updating a recipe away from Personal source

- **Given** an existing recipe with the Personal source and a `personalSourceName`
- **When** a user updates the recipe to a non-Personal `sourceId` (and either provides or omits `personalSourceName` in the payload)
- **Then** the `personalSourceName` is scrubbed/set to `null` in the database

### Requirement: MODIFIED recipeFields prepTime/cookTime validation

The system SHALL validate `prepTime` and `cookTime` as `nullable`, non-negative integers, replacing the prior `positive`-only, non-nullable constraint.

#### Scenario: Omitting prepTime/cookTime on update leaves the existing value unchanged

- **Given** an existing recipe with `prepTime: 20`
- **When** the owner calls `recipes.update` with a payload that does not include a `prepTime` key at all
- **Then** the persisted recipe's `prepTime` remains `20`

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Add `.trim()` to schema -> ADDED Trim personalSourceName
- Proposal element -> Requirement: Normalize `personalSourceName` in `create` and `update` -> MODIFIED Normalize personalSourceName on create/update
- Design decision -> Requirement: Decision 3 (Trimming) -> ADDED Trim personalSourceName
- Design decision -> Requirement: Decision 2 (Scrubbing mechanism) -> MODIFIED Normalize personalSourceName on create/update
- Requirement -> Task(s): See [`tasks.md`](../../changes/archive/2026-06-14-normalize-personal-source-name/tasks.md)
- Proposal element -> Requirement: Add `personalSourceName` to RecipeForm state and form-submit payload -> ADDED Wire personalSourceName to RecipeForm
- Proposal element -> Requirement: Pass it (and its setter) into `SourceSelector` -> ADDED Wire personalSourceName to RecipeForm
- Design decision -> Requirement: Decision 1 (Use React state in `RecipeForm` for `personalSourceName`) -> ADDED Wire personalSourceName to RecipeForm
- ADDED Wire personalSourceName to RecipeForm -> Task 2 (Implement state and payload wiring in `RecipeForm.tsx`) (see [`tasks.md`](../../changes/archive/2026-06-18-recipe-form-personal-source-name/tasks.md))
- Proposal element -> Requirement: Server schema rejects `null` outright for `prepTime`/`cookTime` -> MODIFIED recipeFields prepTime/cookTime validation
- Proposal element -> Requirement: `0` should be accepted, not rejected, and treated as N/A downstream -> ADDED Accept explicit N/A (null) for prepTime and cookTime (zero scenario)
- Design decision -> Requirement: Decision 1 (N/A represented as `null`) -> ADDED Accept explicit N/A (null) for prepTime and cookTime
- Design decision -> Requirement: Decision 2 (schema-only backend change, `.nonnegative().nullable().optional()`) -> MODIFIED recipeFields prepTime/cookTime validation
- Requirement -> Task(s): See [`tasks.md`](../../changes/archive/2026-07-09-add-na-cook-prep-time/tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** normal load
- **When** executing the `recipes.create` or `recipes.update` mutations
- **Then** the additional `Source.findOne` query adds no more than 5-10ms of latency (indexed lookup)

#### Scenario: Latency budget for nullable prepTime/cookTime

- **Given** normal load
- **When** executing `recipes.create` or `recipes.update` with a nullable `prepTime`/`cookTime` payload
- **Then** validation and persistence add no measurable additional latency versus the prior non-nullable schema (schema shape change only, no new queries)

### Requirement: Security

See functional scenario "Negative prepTime or cookTime is still rejected" above — the nullable `prepTime`/`cookTime` change introduces no new access-control surface; existing ownership/tier checks in `recipes.update`/`recipes.create` are unmodified. The `personalSourceName` normalization behavior in this capability is a data-integrity concern, not access control.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the Personal source is missing from the database
- **When** a user executes a `create` or `update` mutation
- **Then** the mutation completes, treating `personalSourceId` as effectively missing (meaning it will scrub `personalSourceName` if `sourceId` was provided), without crashing the server

#### Scenario: Recovery behavior for legacy zero-valued prepTime/cookTime

- **Given** a recipe document already has a legacy `cookTime: 0` or `prepTime: 0` value from before this change
- **When** the document is read by any existing query (`byId`, `list`, cookbook population)
- **Then** the value is returned unchanged (`0`) with no error, and no migration or rewrite is triggered by the read path itself. (Note: saving/autosaving that specific recipe through the edit form is a separate, client-initiated write — see `recipe-time-display`'s N/A toggle requirement — and will write the value forward as `null`, which is expected, ordinary editing behavior, not a migration.)

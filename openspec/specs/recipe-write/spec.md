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
- Requirement -> Task(s): Task 2 (Implement state and payload wiring in `RecipeForm.tsx`) (see [`tasks.md`](../../changes/archive/2026-06-18-recipe-form-personal-source-name/tasks.md))

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** normal load
- **When** executing the `recipes.create` or `recipes.update` mutations
- **Then** the additional `Source.findOne` query adds no more than 5-10ms of latency (indexed lookup)

### Requirement: Security

See functional scenarios: N/A (this change is about data integrity, not security/access control)

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the Personal source is missing from the database
- **When** a user executes a `create` or `update` mutation
- **Then** the mutation completes, treating `personalSourceId` as effectively missing (meaning it will scrub `personalSourceName` if `sourceId` was provided), without crashing the server

#### Scenario: Autosave fallback if save fails

- **Given** a dirty form state including modified `personalSourceName`
- **When** autosave triggers but network is offline
- **Then** the save status goes to `"error"`
- **And** the user is allowed to manually retry when online.

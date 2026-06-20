## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Add `personalSourceName` to RecipeForm state and form-submit payload -> ADDED Wire personalSourceName to RecipeForm
- Proposal element -> Requirement: Pass it (and its setter) into `SourceSelector` -> ADDED Wire personalSourceName to RecipeForm
- Design decision -> Requirement: Decision 1 (Use React state in `RecipeForm` for `personalSourceName`) -> ADDED Wire personalSourceName to RecipeForm
- Requirement -> Task(s): Task 2 (Implement state and payload wiring in `RecipeForm.tsx`)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Security

See functional scenarios: N/A.

### Requirement: Reliability

#### Scenario: Autosave fallback if save fails

- **Given** a dirty form state including modified `personalSourceName`
- **When** autosave triggers but network is offline
- **Then** the save status goes to `"error"`
- **And** the user is allowed to manually retry when online.

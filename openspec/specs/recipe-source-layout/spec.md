## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-recipe-detail-personal-source/design.md) document, not a replacement.

No entirely new requirements are added.

## MODIFIED Requirements

### Requirement: MODIFIED Source attribution display includes personalSourceName

The system SHALL append the custom personal source name, preceded by a middle-dot separator `·` (U+00B7), to the source attribution line if `personalSourceName` is present and has a non-empty, non-whitespace value.

#### Scenario: Owner viewing recipe with personal source name

- **Given** a recipe has `sourceName` set to `"Personal"` and `personalSourceName` set to a non-empty string (e.g. `"Aunt Mary"`)
- **When** the `RecipeDetail` component renders
- **Then** the source attribution paragraph displays `"Source: Personal · Aunt Mary"`

#### Scenario: Owner viewing recipe with empty or whitespace personal source name

- **Given** a recipe has `sourceName` set to `"Personal"` and `personalSourceName` is undefined, null, or empty/whitespace-only (e.g. `"   "`)
- **When** the `RecipeDetail` component renders
- **Then** the source attribution paragraph displays `"Source: Personal"` and no middle-dot separator is rendered

#### Scenario: Non-owner viewing personal recipe

- **Given** a personal recipe is viewed by a non-owner or unauthenticated user (where `personalSourceName` is absent/stripped by the backend)
- **When** the `RecipeDetail` component renders
- **Then** the source attribution paragraph displays `"Source: Personal"` and no middle-dot separator is rendered

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal element: Update RecipeDetail UI logic -> Requirement: MODIFIED Source attribution display includes personalSourceName
- Proposal element: Render only if non-empty -> Requirement: MODIFIED Source attribution display includes personalSourceName
- Design decision: Decision 1 (Render personalSourceName dynamically inside Source line) -> Requirement: MODIFIED Source attribution display includes personalSourceName
- Design decision: Decision 2 (Testing approach) -> Requirement: MODIFIED Source attribution display includes personalSourceName
- Requirement -> Task(s): Task 1 (Modify RecipeDetail.tsx) and Task 2 (Extend RecipeDetail.test.tsx)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Rendering overhead

- **Given** any recipe detail rendering flow
- **When** the source line is rendered
- **Then** the parsing and trimming of `personalSourceName` has negligible impact (<1ms) on component render time.

### Requirement: Security

See functional scenario: Non-owner viewing personal recipe.

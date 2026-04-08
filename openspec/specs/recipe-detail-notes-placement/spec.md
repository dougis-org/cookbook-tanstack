## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Notes render as a labeled section

The system SHALL render recipe notes inside a distinct `Notes` section when a recipe has notes content.

#### Scenario: Notes heading appears with note content

- **Given** a recipe with non-empty notes content
- **When** the shared recipe detail component renders
- **Then** the UI shows a `Notes` section heading
- **And** the notes text appears within that section

#### Scenario: Notes section is omitted when notes are absent

- **Given** a recipe with no notes content
- **When** the shared recipe detail component renders
- **Then** the UI does not show a `Notes` section heading
- **And** no empty notes section container is rendered

## MODIFIED Requirements

### Requirement: MODIFIED Recipe detail section order includes notes after instructions

The system SHALL render recipe notes after the `Instructions` section and before the `Nutrition` section when notes are present.

#### Scenario: Notes follow instructions

- **Given** a recipe with instructions and notes
- **When** the shared recipe detail component renders
- **Then** the `Notes` section appears after the `Instructions` section

#### Scenario: Notes precede nutrition when both are present

- **Given** a recipe with instructions, notes, and nutrition data
- **When** the shared recipe detail component renders
- **Then** the `Notes` section appears before the `Nutrition` section

## REMOVED Requirements

### Requirement: REMOVED Notes render as unlabeled introductory text above recipe metadata

Reason for removal: Notes should no longer appear as unlabeled text near the top of the recipe detail view because that placement makes them ambiguous and conflicts with the approved section order.

#### Scenario: Legacy top-of-page notes layout is absent

- **Given** a recipe with notes content
- **When** the shared recipe detail component renders
- **Then** the notes text is not rendered above the recipe metadata block as standalone introductory text

## Traceability

- Proposal element -> Requirement:
  - Move notes into their own section -> `ADDED Notes render as a labeled section`
  - Place notes after instructions and before nutrition -> `MODIFIED Recipe detail section order includes notes after instructions`
  - Remove top-of-page unlabeled notes -> `REMOVED Notes render as unlabeled introductory text above recipe metadata`
- Design decision -> Requirement:
  - Decision 1 -> `MODIFIED Recipe detail section order includes notes after instructions`
  - Decision 2 -> `ADDED Notes render as a labeled section`, `MODIFIED Recipe detail section order includes notes after instructions`, `REMOVED Notes render as unlabeled introductory text above recipe metadata`
  - Decision 3 -> all requirements validated through shared component tests
- Requirement -> Task(s):
  - `ADDED Notes render as a labeled section` -> tasks 1, 2
  - `MODIFIED Recipe detail section order includes notes after instructions` -> tasks 1, 2
  - `REMOVED Notes render as unlabeled introductory text above recipe metadata` -> tasks 1, 2

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional client-side processing path is introduced

- **Given** the recipe detail component render path
- **When** notes are repositioned into a dedicated section
- **Then** the change does not introduce any new asynchronous work, network calls, or data-fetching steps

### Requirement: Security

#### Scenario: Existing data exposure remains unchanged

- **Given** a recipe detail render with notes content
- **When** the notes section is displayed in its new position
- **Then** the component exposes only the existing recipe notes field and does not introduce any new inputs, permissions, or external links

### Requirement: Reliability

#### Scenario: Shared detail consumers stay aligned

- **Given** both the recipe detail route and cookbook print route use the shared `RecipeDetail` component
- **When** notes are rendered for a recipe in either context
- **Then** both contexts use the same notes section ordering contract

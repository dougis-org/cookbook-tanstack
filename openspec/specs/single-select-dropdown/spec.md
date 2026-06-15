## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-15-category-dropdown-enhancement/design.md) document, not a replacement.

### Requirement: ADDED SingleSelectDropdown Behavior

The system SHALL provide a generic dropdown that supports local filtering, sorts alphabetically, and pins the selected item to the top.

#### Scenario: Dropdown lists options alphabetically

- **Given** a list of unselected options: "Dinner", "Breakfast", "Snack"
- **When** the dropdown is opened
- **Then** the options are displayed in alphabetical order: "Breakfast", "Dinner", "Snack"

#### Scenario: Selected item is pinned to the top

- **Given** a list of options: "Dinner", "Breakfast", "Snack"
- **When** "Snack" is the currently selected option
- **Then** the options are displayed in the order: "Snack" (pinned), "Breakfast", "Dinner"

#### Scenario: User searches for an option

- **Given** a list of options: "Dinner", "Breakfast", "Snack"
- **When** the user types "ak" in the search input
- **Then** the options list filters to show only "Breakfast" and "Snack"

#### Scenario: No search results

- **Given** a list of options
- **When** the user types a query that matches no options
- **Then** the dropdown displays a "No items found" message

## MODIFIED Requirements

### Requirement: MODIFIED Source Picker

The system SHALL render the source picker using the new `SingleSelectDropdown`.

#### Scenario: Source picker uses generic dropdown

- **Given** the source dropdown is opened
- **When** the user interacts with it
- **Then** it behaves exactly as the `SingleSelectDropdown` and accurately selects a source ID.

### Requirement: MODIFIED Category Picker

The system SHALL render the category picker using the new `SingleSelectDropdown`.

#### Scenario: Category picker uses generic dropdown

- **Given** the user is on the Recipe form
- **When** they click the Category dropdown
- **Then** it opens the generic single select dropdown populated with the classifications list, correctly sorted and searchable.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Create generic component
- Design decision -> Decision 1: Create SingleSelectDropdown
- Requirement -> ADDED SingleSelectDropdown Behavior
- Task(s) -> Implement SingleSelectDropdown, update SourcePickerDropdown, update Category in RecipeForm

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED).

### Requirement: Performance

#### Scenario: Local filtering responsiveness

- **Given** a dropdown with 100 options
- **When** the user types a search query
- **Then** the list updates without noticeable lag (<100ms)

### Requirement: Security

See functional scenarios. No new security properties are introduced; this is pure UI state.

### Requirement: Reliability

#### Scenario: Fallback when options are empty

- **Given** an empty list of options provided to the generic dropdown
- **When** the dropdown is opened
- **Then** the UI gracefully shows an empty state message without crashing.

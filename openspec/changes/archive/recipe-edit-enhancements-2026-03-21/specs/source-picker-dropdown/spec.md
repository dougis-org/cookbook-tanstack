## ADDED Requirements

### Requirement: Filterable single-select dropdown for existing sources
The system SHALL provide a `SourcePickerDropdown` component that renders a styled dropdown trigger. When opened, it shows a search input and a scrollable list of existing sources filtered by the search term.

#### Scenario: Trigger shows placeholder when no source selected
- **WHEN** `SourcePickerDropdown` renders with no `value`
- **THEN** the trigger button displays the placeholder text (e.g., "Select a source…")

#### Scenario: Trigger shows selected source name
- **WHEN** `SourcePickerDropdown` renders with a `value` and `selectedName`
- **THEN** the trigger button displays the selected source's name

#### Scenario: Clicking trigger opens the dropdown panel
- **WHEN** a user clicks the trigger button
- **THEN** the dropdown panel opens, showing a search input and a list of sources

#### Scenario: Typing in search input filters the source list
- **WHEN** the panel is open and the user types in the search input
- **THEN** the source list is filtered to show only sources whose names match the input (case-insensitive)

#### Scenario: Clicking a source selects it and closes the panel
- **WHEN** a user clicks a source in the dropdown list
- **THEN** `onChange` is called with that source's `id` and `name`, and the panel closes

#### Scenario: Click outside closes the panel
- **WHEN** the panel is open and the user clicks outside the component
- **THEN** the panel closes without changing the selected value

#### Scenario: Escape key closes the panel
- **WHEN** the panel is open and the user presses Escape
- **THEN** the panel closes without changing the selected value

#### Scenario: Empty state when no sources match the search
- **WHEN** the panel is open and no sources match the current search input
- **THEN** the panel displays a "No sources found" message

### Requirement: Clear selected source
The system SHALL allow the user to clear the selected source from within the dropdown trigger area.

#### Scenario: Clear button appears when a source is selected
- **WHEN** a source is selected and the trigger is rendered
- **THEN** a clear/remove affordance (e.g., ×) is visible in the trigger

#### Scenario: Clicking clear removes the selection
- **WHEN** the user activates the clear affordance
- **THEN** `onChange` is called with an empty string and the trigger reverts to placeholder state

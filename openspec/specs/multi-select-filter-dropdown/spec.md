# multi-select-filter-dropdown Specification

## Purpose
A generic, reusable UI component that renders a compact button+popover+checkbox dropdown supporting multiple simultaneous selections. Designed to replace native `<select>` elements wherever multi-value filtering is needed.

## Requirements

### Requirement: Render a compact button summarizing current selection state
The system SHALL render a single button that summarizes the current selection state: the placeholder text when nothing is selected, the selected item's name when exactly one is selected, or a count label (e.g., "2 categories") when two or more are selected.

#### Scenario: No items selected — shows placeholder
- **WHEN** a `MultiSelectDropdown` is rendered with an empty `selectedIds` array
- **THEN** the button displays the `placeholder` text (e.g., "All Categories")

#### Scenario: One item selected — shows item name
- **WHEN** exactly one ID is in `selectedIds`
- **THEN** the button displays that option's `name` value

#### Scenario: Two or more items selected — shows count label
- **WHEN** two or more IDs are in `selectedIds`
- **THEN** the button displays `"{n} {labelPlural}"` (e.g., "2 categories"), using `labelPlural` prop if provided or `"{label}s"` as fallback

### Requirement: Open a checkbox dropdown panel on button click
The system SHALL toggle a dropdown panel of checkbox options when the summary button is clicked. Options SHALL be sorted with selected items first (alphabetically), followed by unselected items (alphabetically).

#### Scenario: Clicking the button opens the dropdown panel
- **WHEN** a user clicks the summary button
- **THEN** a dropdown panel appears below the button containing a checkbox for each option

#### Scenario: Clicking the button again closes the dropdown panel
- **WHEN** the dropdown panel is open and the user clicks the summary button again
- **THEN** the dropdown panel closes

#### Scenario: Each option renders with a checkbox
- **WHEN** the dropdown panel is open
- **THEN** each option in the `options` prop is displayed with a checkbox, and checked options correspond to IDs in `selectedIds`

#### Scenario: Selected options appear before unselected options
- **WHEN** the dropdown panel is open and some options are selected
- **THEN** selected options appear at the top of the list (alphabetically sorted), followed by unselected options (alphabetically sorted)

### Requirement: Selecting and deselecting options calls onChange
The system SHALL call the `onChange` callback with the updated array of selected IDs whenever the user checks or unchecks an option.

#### Scenario: Checking an unchecked option adds its ID
- **WHEN** a user checks an unchecked option in the dropdown
- **THEN** `onChange` is called with the new array including that option's ID

#### Scenario: Unchecking a checked option removes its ID
- **WHEN** a user unchecks a checked option in the dropdown
- **THEN** `onChange` is called with the new array excluding that option's ID

### Requirement: Display optional recipe counts next to each option
The system SHALL display a count next to each option when a `counts` prop is provided, showing how many recipes match that filter value.

#### Scenario: Counts displayed when prop is provided
- **WHEN** the `counts` prop is provided and the dropdown panel is open
- **THEN** each option displays its count in parentheses (e.g., "Cookies (12)")

#### Scenario: No counts displayed when prop is absent
- **WHEN** the `counts` prop is not provided and the dropdown panel is open
- **THEN** options display only their names, with no count suffix

### Requirement: Close the dropdown on click-outside and Escape key
The system SHALL close the open dropdown panel when the user clicks anywhere outside the component or presses the Escape key.

#### Scenario: Click outside closes the dropdown
- **WHEN** the dropdown panel is open and the user clicks outside the component
- **THEN** the dropdown panel closes

#### Scenario: Escape key closes the dropdown
- **WHEN** the dropdown panel is open and the user presses the Escape key
- **THEN** the dropdown panel closes

### Requirement: Dropdown panel is scrollable when options exceed visible area
The system SHALL constrain the dropdown panel height and make it scrollable when the option list is too long to display fully.

#### Scenario: Long option list is scrollable
- **WHEN** the dropdown panel is open and the number of options would exceed the max panel height
- **THEN** the panel shows a scrollbar and the user can scroll to see all options

### Requirement: Component is accessible
The system SHALL use appropriate ARIA attributes so screen readers can interpret the dropdown state and interact with it.

#### Scenario: Button communicates expanded state
- **WHEN** the dropdown panel is open
- **THEN** the summary button has `aria-expanded="true"`

#### Scenario: Button communicates collapsed state
- **WHEN** the dropdown panel is closed
- **THEN** the summary button has `aria-expanded="false"`

#### Scenario: aria-label includes current selection state when provided
- **WHEN** the `ariaLabel` prop is provided
- **THEN** the button's `aria-label` is computed as `"{buttonLabel} {ariaLabel}"` so screen readers announce both the current selection and the filter's purpose

## MODIFIED Requirements

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

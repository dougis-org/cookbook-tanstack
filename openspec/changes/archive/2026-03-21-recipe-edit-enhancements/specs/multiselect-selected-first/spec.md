## ADDED Requirements

### Requirement: Selected options sort to the top of the dropdown list
The system SHALL always render checked (selected) options before unchecked options in the `MultiSelectDropdown` panel. Within each group (selected / unselected), options SHALL be sorted alphabetically by name.

#### Scenario: Selected items appear before unselected items
- **WHEN** the dropdown panel is open and some options are selected
- **THEN** all selected options appear above all unselected options in the list

#### Scenario: Selected items are sorted alphabetically among themselves
- **WHEN** multiple options are selected
- **THEN** the selected options are ordered alphabetically by name (A → Z)

#### Scenario: Unselected items are sorted alphabetically among themselves
- **WHEN** the dropdown panel is open
- **THEN** unselected options are ordered alphabetically by name (A → Z) below the selected group

#### Scenario: No selected items — all options in alphabetical order
- **WHEN** no options are selected and the dropdown panel is open
- **THEN** all options appear in alphabetical order (no selected group)

#### Scenario: All options selected — all options in alphabetical order at top
- **WHEN** all options are selected and the dropdown panel is open
- **THEN** all options appear in alphabetical order (all in selected group, no unselected group)

#### Scenario: Checking an item moves it to the selected group
- **WHEN** a user checks a previously unselected option
- **THEN** that option moves to the selected group at the top of the list (after re-render)

#### Scenario: Unchecking an item moves it to the unselected group
- **WHEN** a user unchecks a previously selected option
- **THEN** that option moves to the unselected group below the selected items (after re-render)

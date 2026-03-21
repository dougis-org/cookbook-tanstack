## ADDED Requirements

### Requirement: Taxonomy fields use MultiSelectDropdown in recipe edit form
The system SHALL render Meals, Courses, and Preparations as `MultiSelectDropdown` instances in the recipe edit/create form, placed after the Difficulty field in a responsive flex-wrap row.

#### Scenario: Taxonomy dropdowns appear after the Difficulty field
- **WHEN** the recipe edit form renders
- **THEN** Meals, Courses, and Preparations dropdowns appear in a row immediately after the Difficulty selector

#### Scenario: Dropdowns wrap on narrow screens
- **WHEN** the viewport is narrow (mobile)
- **THEN** the taxonomy dropdowns wrap to new lines within their container

#### Scenario: Pre-selected taxonomy items appear checked when editing
- **WHEN** a recipe with existing meal/course/preparation selections is opened for editing
- **THEN** the corresponding options in each dropdown are checked

#### Scenario: Selecting a taxonomy item adds it to the form state
- **WHEN** a user checks an option in a taxonomy dropdown
- **THEN** that item's ID is added to the corresponding selected list (mealIds, courseIds, or preparationIds)

#### Scenario: Deselecting a taxonomy item removes it from the form state
- **WHEN** a user unchecks an option in a taxonomy dropdown
- **THEN** that item's ID is removed from the corresponding selected list

#### Scenario: Taxonomy selections are submitted with the form
- **WHEN** the user submits the recipe form
- **THEN** the selected mealIds, courseIds, and preparationIds are included in the mutation payload

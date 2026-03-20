# recipe-filter-layer-ui Delta Specification

## MODIFIED Requirements

### Requirement: Display advanced filters in Row 2
The system SHALL display a second row of multi-select dropdown filter controls for classification and source, allowing users to select multiple values simultaneously without overwhelming the interface.

#### Scenario: Row 2 displays classification multi-select dropdown
- **WHEN** a user views the recipe list page
- **THEN** Row 2 displays a `MultiSelectDropdown` labeled "All Categories" with options for each classification

#### Scenario: Row 2 displays source multi-select dropdown
- **WHEN** a user views the recipe list page
- **THEN** Row 2 displays a `MultiSelectDropdown` labeled "All Sources" with options for each source

#### Scenario: Selecting one or more classifications from Row 2 filters the list
- **WHEN** a user selects one or more items from the classification dropdown in Row 2
- **THEN** the URL search param `classificationIds` is set to the array of selected IDs, and the recipe list filters to show only recipes in those categories

#### Scenario: Selecting one or more sources from Row 2 filters the list
- **WHEN** a user selects one or more items from the source dropdown in Row 2
- **THEN** the URL search param `sourceIds` is set to the array of selected IDs, and the recipe list filters accordingly

#### Scenario: Row 2 dropdowns display counts next to options
- **WHEN** a user opens a Row 2 filter dropdown
- **THEN** each option displays a count of recipes matching that filter value (e.g., "Breakfast (12)", "AllRecipes.com (5)")

#### Scenario: Deselecting all items in a dropdown clears the filter
- **WHEN** a user unchecks all items in a Row 2 dropdown
- **THEN** the corresponding URL param is removed and the recipe list is no longer filtered by that field

#### Scenario: Multiple classifications and sources can be active simultaneously
- **WHEN** a user selects two classifications and one source
- **THEN** the URL contains `classificationIds=[id1,id2]` and `sourceIds=[id3]`, and the recipe list shows only recipes matching any of the selected classifications AND the selected source

### Requirement: URL params for Row 2 filters use array form
The system SHALL represent Category and Source filter selections in the URL as string arrays, enabling multi-value filtering and consistent URL state.

#### Scenario: URL reflects array of selected classification IDs
- **WHEN** a user selects multiple classifications
- **THEN** the URL contains `classificationIds` as an array parameter (e.g., `?classificationIds[]=abc&classificationIds[]=def`)

#### Scenario: URL reflects array of selected source IDs
- **WHEN** a user selects multiple sources
- **THEN** the URL contains `sourceIds` as an array parameter

#### Scenario: Old scalar params `classificationId`/`sourceId` are no longer used
- **WHEN** the recipe list page initializes
- **THEN** the URL schema does not include `classificationId` or `sourceId` as valid params (only the plural array forms are recognized)

## ADDED Requirements

### Requirement: Active filter badges show one badge per selected category or source
The system SHALL render a separate active filter badge for each selected classification ID and each selected source ID, consistent with how taxonomy filter badges (mealIds, courseIds, preparationIds) are already handled.

#### Scenario: One badge per selected classification
- **WHEN** a user has selected two classifications
- **THEN** two separate filter badges appear, each showing the classification name with an X to remove it individually

#### Scenario: One badge per selected source
- **WHEN** a user has selected two sources
- **THEN** two separate filter badges appear, each showing the source name with an X to remove it individually

#### Scenario: Removing one classification badge does not clear the others
- **WHEN** a user clicks the X on one of several active classification badges
- **THEN** only that classification is removed from `classificationIds`; the others remain active

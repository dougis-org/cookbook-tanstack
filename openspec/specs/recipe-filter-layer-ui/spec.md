# recipe-filter-layer-ui Specification

## Purpose
Defines the two-section filter UI on the recipe list page: Row 1 quick toggles (My Recipes, Favorites, Has Image) and a unified flowing dropdown bar covering Category, Source, Meal, Course, and Preparation. Updated by `refactor-filter-display` (GH #164) to remove the "More Filters" panel and servings filter, and to extend the dropdown bar to all five filter types.
## Requirements
### Requirement: Display quick filters in Row 1
The system SHALL display a dedicated first row of quick-access filter toggles that allow users to rapidly apply common filters without navigating to advanced options.

#### Scenario: Logged-in user sees My Recipes and Favorites toggles
- **WHEN** a logged-in user views the recipe list page
- **THEN** Row 1 displays "My Recipes" and "Favorites" toggle buttons

#### Scenario: All users see Has Image toggle
- **WHEN** any user (logged in or not) views the recipe list page
- **THEN** Row 1 displays a "Has Image" toggle button

#### Scenario: Not logged-in user does not see account-specific toggles
- **WHEN** a not-logged-in user views the recipe list page
- **THEN** Row 1 displays only the "Has Image" toggle (no "My Recipes" or "Favorites")

#### Scenario: Toggling My Recipes filter applies it to the list
- **WHEN** a logged-in user clicks the "My Recipes" toggle in Row 1
- **THEN** the URL search param `myRecipes=true` is added, the recipe list filters to show only the user's recipes, and the toggle button visually indicates it is active (highlighted)

#### Scenario: Toggling Favorites filter applies it to the list
- **WHEN** a logged-in user clicks the "Favorites" toggle in Row 1
- **THEN** the URL search param `markedByMe=true` is added, the recipe list filters to show only favorited recipes, and the toggle button visually indicates it is active

#### Scenario: Toggling Has Image filter applies it to the list
- **WHEN** any user clicks the "Has Image" toggle in Row 1
- **THEN** the URL search param `hasImage=true` is added, the recipe list filters to show only recipes with images, and the toggle button visually indicates it is active

#### Scenario: Multiple Row 1 filters can be active simultaneously
- **WHEN** a user activates "My Recipes" and "Favorites" toggles together
- **THEN** the URL reflects both `myRecipes=true` and `markedByMe=true`, and both toggles display as active

### Requirement: Display all five dropdown filters in a unified flowing bar
The system SHALL display multi-select dropdown filter controls for Category, Source, Meal, Course, and Preparation in a single `flex-wrap` container below Row 1, covering all taxonomy-style filter dimensions. See `recipe-filter-unified-dropdowns` spec for full requirements on this section.

#### Scenario: All five dropdowns appear below Row 1
- **WHEN** a user views the recipe list page
- **THEN** five `MultiSelectDropdown` controls appear below the Row 1 toggles, in configured order: Category, Source, Meal, Course, Preparation

#### Scenario: Dropdowns wrap naturally on narrow screens
- **WHEN** a user views the page on a narrow screen
- **THEN** the dropdown controls wrap to additional lines without hiding any filter

#### Scenario: Deselecting all items in a dropdown clears the filter
- **WHEN** a user unchecks all items in any dropdown
- **THEN** the corresponding URL param is removed and the recipe list is no longer filtered by that field

### Requirement: Filter order is driven by a single configuration array
The system SHALL read filter display order from `FILTER_DROPDOWN_CONFIGS` in `filterConfigs.ts`. The `FilterDropdowns` component is order-agnostic, enabling future per-user order customization without component changes.

#### Scenario: Filter placement is defined by configuration
- **WHEN** the application initializes
- **THEN** it renders dropdown filters in the order defined in `FILTER_DROPDOWN_CONFIGS`

#### Scenario: Reordering filters requires only a configuration change
- **WHEN** a developer swaps the order of entries in `FILTER_DROPDOWN_CONFIGS`
- **THEN** the UI reflects the new order without modifying component logic

#### Scenario: User can set both min and max servings together
- **WHEN** a user enters "4" for min and "8" for max servings
- **THEN** the URL includes both `minServings=4` and `maxServings=8`, filtering recipes to the 4–8 servings range

### Requirement: Row 1 and Row 2 filters work as a unified system
The system SHALL ensure that filters applied in Row 1 and Row 2 update the same set of URL search parameters, maintaining a single source of truth for the current filter state.

#### Scenario: Active filters from Row 2 remain when Row 1 is toggled
- **WHEN** a user has selected "Classification: Cookies" (Row 2), then toggles "My Recipes" (Row 1)
- **THEN** both filters remain active in the URL and recipe list (`classificationId=<cookie-id>` and `myRecipes=true`)

#### Scenario: URL search params correctly reflect row 1 and row 2 selections
- **WHEN** a user applies filters across both rows
- **THEN** the URL contains all applied search params (e.g., `?myRecipes=true&classificationId=XYZ&hasImage=true`)

#### Scenario: Clearing all filters resets both rows
- **WHEN** a user clicks "Clear all filters"
- **THEN** all Row 1 toggles return to inactive state, all Row 2 dropdowns reset to "All" defaults, and the URL search params are cleared

### Requirement: Row 2 filters support mobile-first responsive design
The system SHALL render Row 2 filters responsively, adapting layout for small, medium, and large screens while maintaining usability and avoiding horizontal overflow.

#### Scenario: Row 2 adapts to mobile screens
- **WHEN** a user views the recipe list on a mobile device (< 640px width)
- **THEN** Row 2 dropdowns stack vertically or wrap to avoid horizontal overflow, and remain fully functional

#### Scenario: Row 2 optimizes for tablet/desktop screens
- **WHEN** a user views the recipe list on a tablet or desktop (≥ 640px width)
- **THEN** Row 2 dropdowns display in a horizontal flex-wrap layout, and the filters remain compact and scannable

### Requirement: URL params for all dropdown filters use array form
The system SHALL represent all five dropdown filter selections in the URL as string arrays.

#### Scenario: URL reflects array of selected IDs for each filter type
- **WHEN** a user selects multiple items from any dropdown filter
- **THEN** the URL contains the corresponding param as an array (e.g., `classificationIds`, `sourceIds`, `mealIds`, `courseIds`, `preparationIds`)

### Requirement: Active filter badges show one badge per selected item across all dropdown filters
The system SHALL render a separate active filter badge for each selected ID across all five dropdown filter types.

#### Scenario: One badge per selected classification
- **WHEN** a user has selected two classifications
- **THEN** two separate filter badges appear, each showing the classification name with an X to remove it individually

#### Scenario: One badge per selected source
- **WHEN** a user has selected two sources
- **THEN** two separate filter badges appear, each showing the source name with an X to remove it individually

#### Scenario: Removing one classification badge does not clear the others
- **WHEN** a user clicks the X on one of several active classification badges
- **THEN** only that classification is removed from `classificationIds`; the others remain active

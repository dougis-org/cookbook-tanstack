## ADDED Requirements

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

### Requirement: Display advanced filters in Row 2
The system SHALL display a second row of dropdown filter selectors for classification, source, and taxonomy categories, allowing users to access more detailed filtering options without overwhelming the interface.

#### Scenario: Row 2 displays classification dropdown
- **WHEN** a user views the recipe list page
- **THEN** Row 2 displays a dropdown labeled "All Categories" with options for each classification

#### Scenario: Row 2 displays source dropdown
- **WHEN** a user views the recipe list page
- **THEN** Row 2 displays a dropdown labeled "All Sources" with options for each source

#### Scenario: Row 2 displays taxonomy category dropdowns
- **WHEN** a user views the recipe list page
- **THEN** Row 2 displays dropdowns or buttons for Meals, Courses, and Preparations taxonomy

#### Scenario: Selecting a classification from Row 2 filters the list
- **WHEN** a user selects "Cookies" from the classification dropdown in Row 2
- **THEN** the URL search param `classificationId=<cookie-id>` is added, the recipe list filters to show only recipes in the Cookies category, and the dropdown visually reflects the selection

#### Scenario: Selecting a source from Row 2 filters the list
- **WHEN** a user selects "Sally's Bakery" from the source dropdown in Row 2
- **THEN** the URL search param `sourceId=<source-id>` is added, the recipe list filters accordingly, and the dropdown reflects the selection

#### Scenario: Row 2 dropdowns display counts next to options
- **WHEN** a user views the Row 2 filter dropdowns
- **THEN** each option displays a count of recipes matching that filter (e.g., "Breakfast (12)", "AllRecipes.com (5)")

#### Scenario: Source counts update based on active filters
- **WHEN** a user applies a filter (e.g., "My Recipes"), then opens the source dropdown
- **THEN** source counts reflect recipes matching ALL currently active filters, not just the source alone

### Requirement: Filter layout is configurable
The system SHALL implement filter layout (which filters appear in Row 2 vs More Filters) via a configuration file, allowing easy iteration and future support for user filter preferences.

#### Scenario: Filter placement is defined by configuration
- **WHEN** the application initializes
- **THEN** it reads filter configuration (e.g., `filterConfig.ts` or similar) to determine which filters appear in Row 2 vs More Filters

#### Scenario: Moving a filter between rows requires only configuration change
- **WHEN** a developer updates the filter configuration to move a filter from Row 2 to More Filters (or vice versa)
- **THEN** the UI automatically reflects the change without modifying component logic

#### Scenario: More Filters panel shows items not in Row 2
- **WHEN** the filter configuration specifies certain filters for Row 2 and others for More Filters
- **THEN** Row 2 displays only the configured filters, and the More Filters panel displays the remaining filters

#### Scenario: Clearing a Row 2 dropdown selection removes the filter
- **WHEN** a user resets a Row 2 dropdown to "All Categories" or "All Sources"
- **THEN** the corresponding URL search param is removed and the recipe list updates accordingly

### Requirement: Display servings range inputs in Row 2
The system SHALL allow users to filter recipes by servings range using min/max number inputs in Row 2.

#### Scenario: User sets minimum servings filter
- **WHEN** a user enters "4" in the "Min servings" input in Row 2
- **THEN** the URL search param `minServings=4` is added and the recipe list shows only recipes with 4+ servings

#### Scenario: User sets maximum servings filter
- **WHEN** a user enters "8" in the "Max servings" input in Row 2
- **THEN** the URL search param `maxServings=8` is added and the recipe list shows only recipes with 8 or fewer servings

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


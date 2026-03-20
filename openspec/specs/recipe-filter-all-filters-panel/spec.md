# recipe-filter-all-filters-panel Specification

> **SUPERSEDED** — This capability was eliminated by the `refactor-filter-display` change (2026-03-20, GH #164). The "More Filters" collapsible panel no longer exists. All taxonomy filters (Meal, Course, Preparation) are now inline multi-select dropdowns. See `recipe-filter-unified-dropdowns` spec for the current design.

## Purpose
~~TBD - created by archiving change filter-ux-improvements. Update Purpose after archive.~~

This spec describes a design that was implemented and subsequently replaced. It is retained for historical reference only.
## Requirements
### Requirement: Provide expandable "More Filters" panel for comprehensive filtering
The system SHALL display an expandable "More Filters" panel that mirrors the taxonomy chip layout from the recipe edit form, allowing users to set any combination of filters in a single, organized view. All filters applied in Row 1 or Row 2 SHALL be reflected (highlighted/selected) in the "More Filters" panel.

#### Scenario: "More Filters" button or link is available to user
- **WHEN** a user views the recipe list page
- **THEN** the UI displays a "More Filters" button or link for accessing the expandable panel

#### Scenario: Expanding More Filters panel reveals comprehensive filter interface
- **WHEN** a user clicks the "More Filters" button/link
- **THEN** the panel expands to reveal sections for Meals, Courses, Preparations, Classification, Source, and Servings range—organized similarly to the recipe edit form

#### Scenario: More Filters panel pre-populates with currently active filters from Row 1 and Row 2
- **WHEN** a user has applied filters in Row 1 or Row 2 (e.g., "My Recipes" and "Classification: Cookies")
- **THEN** the expanded More Filters panel displays those filters as already selected/highlighted (e.g., "My Recipes" toggle on, "Cookies" category chip highlighted)

#### Scenario: Taxonomy items in More Filters panel are displayed as selectable chips
- **WHEN** the More Filters panel is expanded
- **THEN** each taxonomy category (Meals, Courses, Preparations) displays its items as chip buttons (similar to RecipeForm.tsx), with active items visually highlighted

#### Scenario: Selecting a chip in More Filters panel applies the filter
- **WHEN** a user clicks a taxonomy chip (e.g., "Breakfast") in the expanded More Filters panel
- **THEN** the URL search param is updated (e.g., `mealIds=breakfast-id`), the recipe list filters accordingly, and the chip remains highlighted

#### Scenario: Deselecting a chip in More Filters panel removes the filter
- **WHEN** a user clicks a highlighted taxonomy chip in the More Filters panel
- **THEN** the filter is removed from the URL and recipe list, and the chip returns to inactive state

#### Scenario: Multiple taxonomy filters can be active in the More Filters panel
- **WHEN** a user selects multiple items from different taxonomy categories (e.g., "Breakfast" meal and "Appetizer" course)
- **THEN** both filters are applied simultaneously, the URL reflects both (`mealIds=<id1>&courseIds=<id2>`), and both chips display as highlighted

#### Scenario: More Filters panel reflects filters applied via Row 2 dropdowns
- **WHEN** a user has selected a classification from the Row 2 dropdown, then opens the More Filters panel
- **THEN** the corresponding classification section in the More Filters panel displays the selected category as highlighted

#### Scenario: Toggling filters in More Filters panel updates Row 2 dropdowns
- **WHEN** a user selects a classification chip in the More Filters panel (while the panel is open or after closing it)
- **THEN** the Row 2 classification dropdown updates to reflect the selection

#### Scenario: More Filters panel includes servings range inputs
- **WHEN** the More Filters panel is expanded
- **THEN** it displays min/max servings input fields, pre-populated with any currently active servings filters

#### Scenario: Taxonomy items in More Filters panel display counts
- **WHEN** the More Filters panel is expanded
- **WHEN** the user views taxonomy chips (Meals, Courses, Preparations)
- **THEN** each chip displays a count of recipes matching that taxonomy item (e.g., "Breakfast (12)", "Appetizer (8)")

#### Scenario: Taxonomy counts update based on active filters
- **WHEN** a user has applied other filters (e.g., "My Recipes" or "Classification: Cookies"), then opens the More Filters panel
- **THEN** taxonomy item counts reflect recipes matching ALL currently active filters

#### Scenario: More Filters panel can be collapsed without losing applied filters
- **WHEN** a user expands the More Filters panel, applies filters, then collapses the panel
- **THEN** all applied filters remain active in the URL and recipe list; the panel collapses but the filters persist

#### Scenario: More Filters panel provides visual separation from Row 2
- **WHEN** the More Filters panel is expanded
- **THEN** it displays with distinct visual styling (e.g., different background color, border, or spacing) to distinguish it from Row 2

### Requirement: More Filters panel layout is configurable
The system SHALL implement More Filters panel content (which filters appear in the panel) via the same configuration system as Row 2, allowing easy repositioning of filters between layers.

#### Scenario: More Filters panel shows configured items
- **WHEN** the filter configuration specifies certain filters for the More Filters panel
- **THEN** those filters display as taxonomy chips or inputs in the expanded panel

#### Scenario: Moving a filter from More Filters to Row 2 is a configuration change
- **WHEN** a developer updates the filter configuration to move a filter from More Filters to Row 2
- **THEN** the filter automatically moves without changes to panel or row 2 component logic

### Requirement: More Filters panel manages state consistently with Row 1 and Row 2
The system SHALL ensure that any filter change in the More Filters panel immediately updates the URL search params and is visible in Row 1/Row 2, and vice versa. There is a single source of truth: the URL search parameters.

#### Scenario: Filters applied in More Filters panel appear in Row 2 dropdowns
- **WHEN** a user selects a source in the More Filters panel
- **THEN** the Row 2 source dropdown updates to show the selected source

#### Scenario: Filters applied in Row 1 or Row 2 are reflected in More Filters panel
- **WHEN** a user applies "My Recipes" in Row 1, then opens the More Filters panel
- **THEN** the "My Recipes" toggle in the More Filters panel displays as already active (if included in the panel)

#### Scenario: Clearing all filters clears the More Filters panel
- **WHEN** a user clicks "Clear all filters"
- **THEN** all selections in the More Filters panel return to inactive state when the panel is next opened, and all URL search params are cleared

### Requirement: More Filters panel supports mobile-first responsive design
The system SHALL render the More Filters panel responsively, expanding responsibly on small screens and remaining usable across all device sizes.

#### Scenario: More Filters panel expands full-width on mobile
- **WHEN** a user opens the More Filters panel on a mobile device (< 640px width)
- **THEN** the panel expands to use available width, and taxonomy chips wrap naturally without causing horizontal overflow

#### Scenario: More Filters panel layout optimizes for larger screens
- **WHEN** a user opens the More Filters panel on a desktop or tablet (≥ 640px width)
- **THEN** the panel displays in a multi-column layout similar to RecipeForm.tsx, with sections arranged for efficient scanning


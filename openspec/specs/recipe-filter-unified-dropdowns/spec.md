# recipe-filter-unified-dropdowns Specification

## Purpose

A single, unified row of multi-select dropdown filters covering all five filter dimensions (Category, Source, Meal, Course, Preparation). Filters flow naturally based on screen width — no forced row count or collapsible "More Filters" panel. Order is controlled by a single configuration array.

Supersedes: `recipe-filter-all-filters-panel` (eliminated), and partially replaces `recipe-filter-layer-ui` (Row 2 section).

---

## Requirements

### Requirement: All five dropdown filters appear inline in a single flowing bar

The system SHALL display Category, Source, Meal, Course, and Preparation filters as multi-select dropdowns in a single flex-wrap container, appearing after the Row 1 quick toggles.

#### Scenario: User sees all five filter dropdowns on the recipe list page
- **WHEN** a user views the recipe list page
- **THEN** five multi-select dropdown buttons are visible: "All Categories", "All Sources", "All Meals", "All Courses", "All Preparations"

#### Scenario: Filter dropdowns wrap naturally on narrow screens
- **WHEN** a user views the recipe list page on a narrow screen (e.g., mobile)
- **THEN** the dropdowns wrap to additional lines without horizontal overflow; no filters are hidden or moved to a separate panel

#### Scenario: Filter dropdowns appear on one row on wide screens
- **WHEN** a user views the recipe list page on a wide screen
- **THEN** all five dropdowns appear on the same row

---

### Requirement: Filter order is driven by a config array, with a single global default

The system SHALL read the display order of dropdown filters from a single `FILTER_DROPDOWN_CONFIGS` array in `filterConfigs.ts`, which defines the global default order. The `FilterDropdowns` component SHALL be order-agnostic — it renders whatever order it receives — so that future per-user order preferences can be applied by sorting the config array before passing it in, without any component changes.

#### Scenario: Filters display in the global default order
- **WHEN** no user preference overrides the order
- **THEN** dropdown filters appear in the default order defined in `FILTER_DROPDOWN_CONFIGS`: Category → Source → Meal → Course → Preparation

#### Scenario: Developer reorders the global default via config
- **WHEN** a developer swaps the order of two entries in `FILTER_DROPDOWN_CONFIGS`
- **THEN** the UI reflects the new order without any changes to component logic

#### Scenario: Future user preference can override order via the configs prop
- **WHEN** a future feature stores a user's preferred filter order
- **THEN** the caller passes a reordered array to the optional `configs` prop of `FilterDropdowns`, with no changes required to the component itself

---

### Requirement: Meal, Course, and Preparation support multi-select

The system SHALL allow users to select multiple items from each of the Meal, Course, and Preparation dropdowns.

#### Scenario: User selects one meal type
- **WHEN** a user opens the Meal dropdown and clicks "Breakfast"
- **THEN** the URL search param `mealIds` is set to `["<breakfast-id>"]`, the recipe list filters accordingly, and the Meal dropdown button displays "Breakfast"

#### Scenario: User selects multiple meal types
- **WHEN** a user opens the Meal dropdown and clicks both "Breakfast" and "Dinner"
- **THEN** `mealIds` contains both IDs in the URL, and the Meal dropdown button displays "2 meals"

#### Scenario: User deselects all meal types
- **WHEN** a user unchecks all items in the Meal dropdown
- **THEN** `mealIds` is removed from the URL and the recipe list is no longer filtered by meal

#### Scenario: Course and Preparation filters behave identically to Meal
- **WHEN** a user selects items from Course or Preparation dropdowns
- **THEN** `courseIds` / `preparationIds` URL params are updated accordingly, following the same multi-select behavior as Meal

---

### Requirement: Each dropdown displays item counts

The system SHALL display a recipe count next to each option in all five filter dropdowns.

#### Scenario: Dropdown options show recipe counts
- **WHEN** a user opens any of the five filter dropdowns
- **THEN** each option displays the number of recipes matching that filter value (e.g., "Breakfast (12)")

---

### Requirement: No "More Filters" panel exists

The system SHALL NOT include a "More Filters" collapsible panel or button. All filters are visible inline.

#### Scenario: No "More Filters" button is present
- **WHEN** a user views the recipe list page
- **THEN** there is no "More Filters" button, link, or expandable panel

---

### Requirement: Servings filter is removed

The system SHALL NOT include min/max servings filter inputs anywhere in the filter bar. The URL schema does not include `minServings` or `maxServings` params.

#### Scenario: No servings filter inputs appear
- **WHEN** a user views the recipe list page
- **THEN** there are no servings-related filter controls

#### Scenario: Servings params in URL are silently ignored
- **WHEN** a user navigates to a URL containing `minServings` or `maxServings` params
- **THEN** those params are stripped by TanStack Router's schema validation; no error occurs

---

### Requirement: Active filter badges include Meal, Course, and Preparation

The system SHALL display an active filter badge for each selected item across all five dropdown filter types.

#### Scenario: Selecting two meals shows two meal badges
- **WHEN** a user has selected two items from the Meal dropdown
- **THEN** two separate active filter badges appear, each showing the meal name with an X to remove it individually

#### Scenario: Removing a meal badge updates the dropdown
- **WHEN** a user clicks the X on an active meal badge
- **THEN** that meal is deselected from `mealIds`; other selected meals remain active; the Meal dropdown updates to reflect the removal

---

### Requirement: Clearing all filters resets all five dropdowns

#### Scenario: "Clear all" resets all filter dropdowns
- **WHEN** a user clicks "Clear all filters"
- **THEN** all five dropdowns return to their placeholder state, all associated URL params are cleared, and no active filter badges remain

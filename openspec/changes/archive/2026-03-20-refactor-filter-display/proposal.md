## Why

The current recipe filter UI has a two-tier structure: quick toggle filters in Row 1, multi-select dropdowns for Category and Source in Row 2, and a collapsible "More Filters" panel containing chip-based taxonomy filters (Meal, Course, Preparation) plus a servings range input. The "More Filters" panel takes significant vertical space when expanded, the chip UI is inconsistent with the dropdown UI above it, and the servings filter is unused in practice.

Issue #164 simplifies the filter UI: all five taxonomy-style filters (Category, Source, Meal, Course, Preparation) become multi-select dropdowns that flow inline alongside the existing quick toggles in a single, consistent filter bar. The "More Filters" panel is removed entirely. The servings filter is removed.

## What Changes

- **Remove "More Filters" panel** (`FilterMoreFiltersPanel.tsx`): eliminated entirely; no replacement
- **Convert Meal, Course, Preparation to multi-select dropdowns**: extend existing `FilterRow2Dropdowns` to cover all five dropdown filters using a single unified config
- **Remove servings filter**: `ServingsRangeInput.tsx`, `minServings`/`maxServings` URL params, and servings-related active badges removed
- **Config-driven filter order**: a single global ordered array in `filterConfigs.ts` governs all dropdown filters and serves as the default order for all users. The config-driven approach is intentionally designed to enable per-user order customization in the future — a user preference could override the global config without changing any component logic. `lib/filterConfig.ts` row-split logic is removed.
- **Natural flow layout**: filters use `flex-wrap` and flow to multiple rows based on screen width — no forced row count
- **Delete dead components**: `TaxonomyChips.tsx` and `ServingsRangeInput.tsx` are removed

## Capabilities

### Modified Capabilities
- `recipe-filter-layer-ui`: Row 2 becomes a unified flowing dropdown bar covering all five filters; servings and chip-based filtering removed
- `recipe-filter-all-filters-panel`: **Superseded** — this capability is eliminated; the "More Filters" panel no longer exists

### New Capabilities
- `recipe-filter-unified-dropdowns`: Single unified multi-select dropdown bar with configurable order, covering Category, Source, Meal, Course, and Preparation

## Impact

- **Files deleted**: `FilterMoreFiltersPanel.tsx`, `TaxonomyChips.tsx`, `ServingsRangeInput.tsx`, `filterConfigs.ts` (TAXONOMY_CONFIGS/DropdownConfig split replaced), `lib/filterConfig.ts` (row-split types removed), `__tests__/FilterMoreFiltersPanel.test.tsx`, `__tests__/TaxonomyChips.test.tsx`
- **Files modified**: `filterConfigs.ts` (unified config), `FilterRow2Dropdowns.tsx` → `FilterDropdowns.tsx` (handles all 5 filters), `routes/recipes/index.tsx` (remove servings params, update filter composition), `lib/filterConfig.ts` (simplify or remove)
- **Files created**: `openspec/specs/recipe-filter-unified-dropdowns/spec.md`
- **UI Changes**: Filter bar layout simplified; "More Filters" button/panel gone; Meal/Course/Preparation now appear as compact dropdowns; no servings inputs
- **No API Changes**: `minServings`/`maxServings` removed from search schema; all other URL params unchanged
- **Testing**: Existing `FilterRow2Dropdowns.test.tsx` updated/renamed; `FilterMoreFiltersPanel` and `TaxonomyChips` tests deleted; new tests for Meal/Course/Preparation dropdown behavior added

## Scope

### In-Scope
- Converting Meal, Course, Preparation from chip UI to multi-select dropdowns
- Removing the "More Filters" collapsible panel
- Removing the servings range filter (UI, URL params, active badges)
- Unifying dropdown filter config into a single ordered array
- Updating active filter badge logic for mealIds, courseIds, preparationIds (already present — verify correct)
- Updating/deleting tests

### Out-of-Scope
- Changes to Row 1 quick toggle filters (My Recipes, Favorites, Has Image)
- Changes to backend filtering logic or tRPC queries
- Adding new filter types
- Changing the sort options (servings sort options in the sort dropdown remain)

## Risks

- `minServings`/`maxServings` removal from the URL schema may break existing bookmarked URLs that include those params — TanStack Router's schema validation will silently strip them, which is acceptable behavior
- Tests for `FilterMoreFiltersPanel` and `TaxonomyChips` will be deleted; ensure coverage for the new dropdown behavior in `FilterDropdowns.test.tsx` is thorough before deleting

## Non-Goals

- Filter persistence across sessions
- User-configurable filter ordering at runtime
- Adding new filter dimensions

## Open Questions

None — requirements are clear from issue #164.

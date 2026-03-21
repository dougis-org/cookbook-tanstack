# Tasks: Refactor Filter Display

Linked issue: GitHub #164

- [x] **Task 1: Pull main and create feature branch**

  Pull the latest `main` branch and create a feature branch for this change:

  ```bash
  git checkout main && git pull
  git checkout -b refactor-filter-display
  ```

- [x] **Task 2: Update filterConfigs.ts with unified FILTER_DROPDOWN_CONFIGS**

  **File**: `src/components/recipes/filters/filterConfigs.ts`

  Replace the separate `DROPDOWN_CONFIGS` (DropdownConfig) and `TAXONOMY_CONFIGS` (TaxonomyConfig) exports with a single `FILTER_DROPDOWN_CONFIGS` array using a unified `FilterDropdownConfig` interface. Order: Category → Source → Meal → Course → Preparation.

  The old `TaxonomyConfig` and `DropdownConfig` types and their arrays are removed.

- [x] **Task 3: Write tests for FilterDropdowns (TDD — write tests first)**

  **File**: `src/components/recipes/filters/__tests__/FilterDropdowns.test.tsx` (rename from `FilterRow2Dropdowns.test.tsx`)

  Rename the existing test file and extend it to cover all 5 dropdowns:
  - Renders all 5 dropdowns with correct placeholder text
  - Each dropdown's selection calls `updateSearch` with the correct `filterKey`
  - Selecting and deselecting items works for Meal, Course, Preparation
  - Multi-select works (selecting 2 items shows count label)
  - Clearing all items passes `undefined` for that `filterKey`
  - Counts are displayed in dropdown options

  Write all tests before implementing `FilterDropdowns`. Tests should initially fail.

- [x] **Task 4: Implement FilterDropdowns component**

  **File**: `src/components/recipes/filters/FilterDropdowns.tsx` (rename from `FilterRow2Dropdowns.tsx`)

  Extend the existing component to:
  - Import `FILTER_DROPDOWN_CONFIGS` instead of `DROPDOWN_CONFIGS`
  - Accept props for all 5 filter datasets (mealIds, courseIds, preparationIds, allMeals, allCourses, allPreparations) in addition to existing classification/source props
  - Map over all 5 configs, looking up the correct data by config key
  - Remove `FilterConfig`/`filterConfig` prop (row-split no longer exists)
  - Retain `flex-wrap gap-2` layout so dropdowns flow naturally

  Run tests — all should now pass.

- [x] **Task 5: Delete obsolete components and tests**

  Delete the following files:
  - `src/components/recipes/filters/FilterMoreFiltersPanel.tsx`
  - `src/components/recipes/filters/TaxonomyChips.tsx`
  - `src/components/recipes/filters/ServingsRangeInput.tsx`
  - `src/components/recipes/filters/__tests__/FilterMoreFiltersPanel.test.tsx`
  - `src/components/recipes/filters/__tests__/TaxonomyChips.test.tsx`

- [x] **Task 6: Delete lib/filterConfig.ts**

  **File**: `src/lib/filterConfig.ts`

  This file and its exports (`FilterConfig`, `Row2FilterKey`, `AllFiltersKey`, `QuickFilterKey`, etc.) are no longer used by any component after this change. Delete it.

  Verify no remaining imports of this file exist before deleting.

- [x] **Task 7: Update routes/recipes/index.tsx**

  **File**: `src/routes/recipes/index.tsx`

  Changes:
  1. Remove `minServings` and `maxServings` from `searchSchema`
  2. Remove `minServings` and `maxServings` from `Route.useSearch()` destructuring
  3. Remove servings-related entries from `activeBadges`
  4. Remove `minServings || maxServings` from `hasActiveFilters`
  5. Replace `FilterRow2Dropdowns` import with `FilterDropdowns`
  6. Replace `FilterMoreFiltersPanel` usage with the new `FilterDropdowns` component, passing all required props
  7. Remove import of `filterConfig` from `@/lib/filterConfig`
  8. Remove `FilterMoreFiltersPanel` import

  The sort dropdown options (`servings_asc`, `servings_desc`) remain — only the filter is removed, not the sort.

- [x] **Task 8: Update OpenSpec specs**

  1. **`openspec/specs/recipe-filter-all-filters-panel/spec.md`**: Add a "Superseded" notice at the top indicating this capability was eliminated in the refactor-filter-display change. The "More Filters" panel no longer exists.

  2. **`openspec/specs/recipe-filter-layer-ui/spec.md`**: Update to remove servings range requirements, "More Filters" references, and row-split references. Add unified dropdown bar covering all 5 filter types.

  3. **`openspec/specs/recipe-filter-unified-dropdowns/spec.md`**: Already created — verify it is complete.

- [x] **Task 9: Run full test suite**

  Run `npm run test` and verify all tests pass. Check for TypeScript errors with `npm run build`.

  Confirm:
  - `FilterDropdowns.test.tsx` — all new tests pass
  - `FilterRow1Quick.test.tsx` — unchanged and passing
  - No references to deleted files remain

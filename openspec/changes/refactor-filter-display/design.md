# Design: Refactor Filter Display

## Architecture Overview

The filter bar remains three logical sections, but the second section changes significantly:

```
┌──────────────────────────────────────────────────────────────┐
│  Filter Bar (routes/recipes/index.tsx)                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Row 1: FilterRow1Quick   (unchanged)                        │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐           │
│  │ My Recipes  │ │  Favorites   │ │  Has Image  │           │
│  └─────────────┘ └──────────────┘ └─────────────┘           │
│                                                              │
│  FilterDropdowns  (new: all 5 filters, flowing)              │
│  ┌──────────────┐ ┌───────────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ All Categories│ │All Sources│ │Meals │ │Course│ │Prep  │  │
│  └──────────────┘ └───────────┘ └──────┘ └──────┘ └──────┘  │
│  (wraps to next line on narrow screens)                      │
│                                                              │
│  Active filter badges  (unchanged)                           │
│  ┌──────────────┐ ┌────────────┐                             │
│  │ Desserts  ×  │ │ Breakfast ×│  ...                        │
│  └──────────────┘ └────────────┘                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Config Design

### filterConfigs.ts (unified)

Replace the split `DropdownConfig`/`TaxonomyConfig` with a single `FilterDropdownConfig`:

```typescript
export interface FilterDropdownConfig {
  key: string                    // unique key for mapping
  label: string                  // display label (lowercase for aria)
  placeholder: string            // dropdown button default text
  filterKey: string              // URL search param key
  countKey: string               // key into filterCounts object
  dataTestId: string             // for testing
  ariaLabel: string              // accessibility label
}

export const FILTER_DROPDOWN_CONFIGS: FilterDropdownConfig[] = [
  // Order here = default display order for all users.
  // This array is the global default; future work can allow users to
  // store a reordered copy of these keys in their preferences and
  // pass a sorted version to FilterDropdowns without changing this file.
  { key: 'classification', label: 'Category',     placeholder: 'All Categories',   filterKey: 'classificationIds', countKey: 'classificationCounts', dataTestId: 'filter-dropdown-classification', ariaLabel: 'Filter by category'     },
  { key: 'source',         label: 'Source',       placeholder: 'All Sources',      filterKey: 'sourceIds',         countKey: 'sourceCounts',         dataTestId: 'filter-dropdown-source',         ariaLabel: 'Filter by source'       },
  { key: 'meal',           label: 'Meal',         placeholder: 'All Meals',        filterKey: 'mealIds',           countKey: 'mealCounts',           dataTestId: 'filter-dropdown-meal',           ariaLabel: 'Filter by meal'         },
  { key: 'course',         label: 'Course',       placeholder: 'All Courses',      filterKey: 'courseIds',         countKey: 'courseCounts',         dataTestId: 'filter-dropdown-course',         ariaLabel: 'Filter by course'       },
  { key: 'preparation',    label: 'Preparation',  placeholder: 'All Preparations', filterKey: 'preparationIds',   countKey: 'preparationCounts',    dataTestId: 'filter-dropdown-preparation',    ariaLabel: 'Filter by preparation'  },
]
```

#### Extensibility path for per-user ordering

The config-driven approach is chosen specifically because it unlocks per-user customization without any component changes. The future path looks like:

```
Today:
  <FilterDropdowns configs={FILTER_DROPDOWN_CONFIGS} ... />

Future (user preferences stored in DB):
  const orderedConfigs = useUserFilterOrder(FILTER_DROPDOWN_CONFIGS)
  <FilterDropdowns configs={orderedConfigs} ... />
```

`FilterDropdowns` accepts the config array as a prop (or reads from the module constant) — either way, the component is order-agnostic. The global `FILTER_DROPDOWN_CONFIGS` remains the source of truth for config *shape*; user preferences need only store an ordered list of `key` strings to express a custom order.

### lib/filterConfig.ts (simplified or removed)

The row-split concept (`row2Filters` vs `allFilters`) is gone. The only configurable aspect remaining is which quick filters appear. Since `FilterRow1Quick` doesn't currently consume `filterConfig` at all, `lib/filterConfig.ts` can be **deleted** entirely. The `FilterDropdowns` component does not need a config override — it always renders all items in `FILTER_DROPDOWN_CONFIGS`.

If future configurability is needed (e.g., hide certain filters per context), `FILTER_DROPDOWN_CONFIGS` itself can be sliced at the call site.

## Component Design

### FilterDropdowns (renamed from FilterRow2Dropdowns)

```
Props:
  filterData: Record<string, {
    selectedIds: string[]
    options: { id: string; name: string }[]
  }>
  counts: Record<string, Record<string, number> | undefined>
  updateSearch: (updates: Record<string, string[] | undefined>) => void
```

The component maps over `FILTER_DROPDOWN_CONFIGS` and for each entry:
- Reads `filterData[cfg.filterKey].selectedIds` and `.options`
- Reads `counts[cfg.countKey]`
- Calls `updateSearch({ [cfg.filterKey]: ids.length ? ids : undefined })`

Using a generic `filterData` map (keyed by `filterKey`) vs. explicit named props is a design tradeoff:

| Approach | Pros | Cons |
|---|---|---|
| Named props (5 × 2 = 10 props) | Explicit TypeScript types | Verbose interface, tedious to extend |
| `filterData` map | Scales to N filters naturally | Slightly less type-safe per key |

**Decision**: Use named props for strict type-safety (consistent with how `FilterRow2Dropdowns` works today), grouping them clearly in the interface. With only 5 filters this remains manageable.

### Removing minServings / maxServings

The `searchSchema` in `routes/recipes/index.tsx` removes these two fields. TanStack Router will silently strip any existing URL params not in the schema — no migration needed.

Active badge entries for servings are removed from `activeBadges`.

`hasActiveFilters` check removes `minServings || maxServings`.

## Files Changed

| File | Action |
|------|--------|
| `src/components/recipes/filters/filterConfigs.ts` | Replace split configs with `FILTER_DROPDOWN_CONFIGS` |
| `src/components/recipes/filters/FilterRow2Dropdowns.tsx` | Rename → `FilterDropdowns.tsx`, extend to all 5 filters |
| `src/components/recipes/filters/FilterMoreFiltersPanel.tsx` | **Delete** |
| `src/components/recipes/filters/TaxonomyChips.tsx` | **Delete** |
| `src/components/recipes/filters/ServingsRangeInput.tsx` | **Delete** |
| `src/lib/filterConfig.ts` | **Delete** |
| `src/routes/recipes/index.tsx` | Update filter composition, remove servings |
| `src/components/recipes/filters/__tests__/FilterRow2Dropdowns.test.tsx` | Rename → `FilterDropdowns.test.tsx`, expand for new filters |
| `src/components/recipes/filters/__tests__/FilterMoreFiltersPanel.test.tsx` | **Delete** |
| `src/components/recipes/filters/__tests__/TaxonomyChips.test.tsx` | **Delete** |
| `openspec/specs/recipe-filter-all-filters-panel/spec.md` | Mark as superseded |
| `openspec/specs/recipe-filter-layer-ui/spec.md` | Update to remove servings + row-2-vs-more-filters split |
| `openspec/specs/recipe-filter-unified-dropdowns/spec.md` | **Create** |

## Test Strategy

`FilterDropdowns.test.tsx` should cover:
- Renders all 5 dropdowns with correct placeholders
- Classification and Source selection (preserved from existing tests)
- Meal, Course, Preparation selection (new)
- `updateSearch` called with correct `filterKey` per filter
- Counts displayed in dropdown options
- Multi-select works for all filter types
- Empty options handled gracefully for all types

`FilterRow1Quick` tests: unchanged.

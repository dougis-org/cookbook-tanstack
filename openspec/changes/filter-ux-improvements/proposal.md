## Why

The current recipe filter UI on `/recipes` is dense and cluttered, displaying all filter options (toggle buttons, dropdowns, taxonomy chips, and text inputs) simultaneously. This overwhelming layout makes it difficult for users to quickly apply common filters and discover advanced filtering options. By organizing filters into two intuitive layers, we can improve discoverability and reduce cognitive load for users who only want to filter by quick options like "My Recipes" or "Favorites".

## What Changes

- **Row 1 (Quick Filters)**: Replace the current single-line layout with dedicated toggle buttons for "My Recipes", "Favorites", and "Has Image"
- **Row 2 (Advanced Filters)**: Introduce a dropdown structure to consolidate category, source, meals, courses, and servings filters
- **"More Filters" Panel**: Add a "More Filters" option that opens a modal or collapsible panel similar to the recipe edit screen, allowing users to set any combination of filter options at once
- The filter UI will display only two rows by default, reducing visual clutter while maintaining access to all filtering capabilities

## Capabilities

### New Capabilities
- `recipe-filter-layer-ui`: Implement a two-layer filter UI with row 1 (quick filters) and row 2 (dropdown filters)
- `recipe-filter-more-filters-panel`: Create an expandable "More Filters" panel for comprehensive filtering comparable to the edit screen experience

### Modified Capabilities
- `recipe-list-filtering`: Extend the existing recipe list filtering to support the new UI structure (no breaking changes to backend; URL search params remain the same)

## Impact

- **Affected Code**: `src/routes/recipes/index.tsx` (main filter UI), potentially new components for the filter panel
- **UI Changes**: Recipe filter bar layout restructuring
- **No API Changes**: Search params and tRPC queries remain unchanged
- **Testing**: Existing filter tests should pass; new tests needed for the two-layer UI and all-filters panel

## Scope

### In-Scope
- Two-layer filter UI implementation (Row 1 + Row 2 layout)
- Dropdown-based advanced filters
- "All Filters" expandable panel with modal-like behavior
- Responsive design for mobile and desktop
- Seamless integration with existing URL search parameters

### Out-of-Scope
- Changes to backend filtering logic or API
- New filter types beyond those already supported
- Filter persistence across sessions (beyond URL state)

## Risks

- Complex state management if not carefully structured; filters from both row 2 dropdowns and the all-filters panel could conflict
- Mobile responsiveness challenges with dropdowns and the all-filters panel layout
- Potential regression if the new UI doesn't properly sync with URL search parameters

## Non-Goals

- Saving filter presets or favorites
- Adding new filter types (servings range, prep time, cook time are out of scope)
- Redesigning the recipe edit form

## Open Questions

**RESOLVED:**
1. ✅ **More Filters panel style**: Collapsible section below Row 2 (not a modal overlay)
2. ✅ **Filter grouping**: More Filters shows items NOT in Row 2. Row 2 + More Filters together = complete filter set. Single unified presentation.
3. ✅ **Filter counts**: Yes, show counts next to filter options (Classification, Source, Taxonomy items)
4. ✅ **Layout reconfiguration**: Support easy reordering of filters between Row 2 and More Filters via `filterConfig.ts`. Future enhancement: allow user preferences to customize Row 2 filters.

**No remaining open questions—all design decisions captured above.**


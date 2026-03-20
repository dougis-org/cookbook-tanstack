## Why

The Category and Source filters on the recipe list page use native `<select>` elements that only allow a single selection, limiting users who want to browse across multiple categories or sources at once. The issue (#165) calls for multi-select support and a reusable dropdown component that will also be used to replace the More Filters panel in the future.

## What Changes

- **NEW** `MultiSelectDropdown` UI component — a generic button+popover+checkbox dropdown supporting multiple selections, optional per-option counts, and accessible keyboard interaction
- **BREAKING** URL param `classificationId` (string) renamed to `classificationIds` (string array)
- **BREAKING** URL param `sourceId` (string) renamed to `sourceIds` (string array)
- **BREAKING** tRPC `recipes.list` input fields `classificationId`/`sourceId` renamed to `classificationIds`/`sourceIds` (arrays); backend filter logic changed to MongoDB `$in`
- `FilterRow2Dropdowns` updated to use `MultiSelectDropdown` instead of `<select>`
- `filterConfigs.ts` filter key names updated to plural
- `filterConfig.ts` (`ROW_2_FILTERS`) updated to plural names
- Active filter badges in the recipe list page updated to render one badge per selected ID

## Capabilities

### New Capabilities
- `multi-select-filter-dropdown`: A reusable `MultiSelectDropdown` component and the full-stack wiring (URL schema, tRPC, filter config, active badges) that enables multi-value selection for Category and Source recipe filters

### Modified Capabilities
- `recipe-filter-layer-ui`: Row 2 dropdowns now support multiple simultaneous selections; URL params for classificationId/sourceId change shape from scalar to array

## Impact

**Code:**
- `src/components/ui/MultiSelectDropdown.tsx` — new file
- `src/components/recipes/filters/FilterRow2Dropdowns.tsx` — replace `<select>` with `MultiSelectDropdown`; props updated
- `src/components/recipes/filters/filterConfigs.ts` — `filterKey` type updated to plural
- `src/lib/filterConfig.ts` — `ROW_2_FILTERS` tuple updated to plural
- `src/routes/recipes/index.tsx` — URL schema, destructured state, tRPC call, active badges all updated
- `src/server/trpc/routers/recipes.ts` — input schema and MongoDB filter logic updated

**Tests:**
- `src/components/ui/__tests__/MultiSelectDropdown.test.tsx` — new
- `src/components/recipes/filters/__tests__/FilterRow2Dropdowns.test.tsx` — updated
- `src/server/trpc/routers/__tests__/recipes.test.ts` — updated for new param names

**APIs:** tRPC `recipes.list` input shape changes (breaking, acceptable — app not yet released)

**URLs:** Existing bookmarked recipe filter URLs with `classificationId` or `sourceId` params will no longer parse correctly (acceptable — no released users)

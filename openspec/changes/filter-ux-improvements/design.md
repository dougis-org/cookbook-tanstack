## Context

The `/recipes` list currently displays all filters in a single cluttered layout: toggle buttons, dropdowns, taxonomy chips, and text inputs all visible simultaneously. This creates cognitive overload and makes it hard for users to discover quick filtering options.

**Current State:**
- `src/routes/recipes/index.tsx` handles recipe list and filtering
- `searchSchema` (Zod) validates URL search params: `classificationId`, `sourceId`, `mealIds`, `courseIds`, `preparationIds`, `myRecipes`, `markedByMe`, `hasImage`, `minServings`, `maxServings`
- Filter UI currently renders toggles and dropdowns in a single flex container with taxonomy chips and servings inputs below
- Recipe edit form (`RecipeForm.tsx`) shows taxonomy items as selectable chips in organized sections

**Constraints:**
- No breaking changes to URL search parameter structure
- Must preserve existing filter functionality
- Mobile-first responsive design required
- Maintain dark theme with cyan accent color

## Goals / Non-Goals

**Goals:**
1. Organize filters into three layers (Quick Filters, Primary Filters, Remaining Filters panel)
2. Introduce a Remaining Filters panel similar to recipe edit form for comprehensive filtering
3. Reduce visual clutter in the default filter view
4. Maintain full filter capability while improving discoverability
5. Design must support easy addition of new filter types in the future

**Non-Goals:**
1. Change tRPC API or URL search param structure
2. Add new filter types (prep time, cook time, difficulty in filters)
3. Implement filter presets or saved searches
4. Redesign recipe edit form

## Decisions

### Decision 1: Filter Layer Structure

**Chosen Approach:** Three-layer filter organization: Quick Filters (always visible), Primary Filters (always visible), and Remaining Filters (collapsible panel).

**Quick Filters (Always Visible):**
- "My Recipes" toggle (conditional: only if logged in)
- "Favorites" toggle (conditional: only if logged in)
- "Has Image" toggle

**Primary Filters (Always Visible):**
- Classification dropdown (All Categories)
- Source dropdown (All Sources)
- Designed to be easily extended: add filters by updating PRIMARY_FILTER_ITEMS configuration

**Remaining Filters Panel (Expandable):**
- Integrated as a collapsible section below Primary Filters
- Mirrors the recipe edit form's taxonomy chip layout
- Shows all taxonomy items as selectable chips (similar to RecipeForm.tsx)
- Consolidates min/max servings into a single accessible location
- Opens on demand to avoid permanent clutter

**Rationale:**
- Most users filter by 1–2 quick options; separating Row 1 makes this fast
- Row 2 dropdowns (Classification, Source) are the most common advanced filters
- Taxonomy items (Meals, Courses, Preparations) and Servings are available in the collapsible All Filters panel for power users
- Mirrors familiar edit form UI for users already comfortable with that pattern
- Combined, Row 2 + All Filters = complete filter set, but defaults to showing only essential filters

**Alternatives Considered:**
1. **Single flat layout**: Rejected (current state is already cluttered)
2. **All taxonomy in Row 2**: Rejected (too much clutter; taxonomy should be collapsible)
3. **Modal-only for advanced filters**: Rejected (quick filters should always be accessible)
4. **Sidebar drawer for advanced filters**: Rejected (takes up horizontal space; complexity for mobile)

### Decision 2: State Management and Filter Configuration

**Chosen Approach:** Single source of truth: URL search params. All filter changes (Quick Filters, Primary Filters, Remaining Filters) update the same search params. Filter layout is defined by a configuration object that specifies which filters appear in each layer.

**Implementation - Filter Configuration:**
- Create a `filterConfig.ts` file that defines which filters appear in each layer:
  ```typescript
  const PRIMARY_FILTER_ITEMS = ['classificationId', 'sourceId']
  const REMAINING_FILTERS_ITEMS = ['mealIds', 'courseIds', 'preparationIds', 'minServings', 'maxServings']
  ```
- This config is used by components to determine what they render
- Extensible design: adding new filters requires only adding to PRIMARY_FILTER_ITEMS or REMAINING_FILTERS_ITEMS
- Future enhancement: Allow user preferences to override default config and reorganize filter layers

**Implementation - State Updates:**
- Existing `updateSearch()` callback continues to handle all filter updates
- Quick Filters buttons call `updateSearch({ myRecipes, markedByMe, hasImage })`
- Primary Filters dropdowns call `updateSearch()` for filters in PRIMARY_FILTER_ITEMS
- Remaining Filters panel chip selections call the same `updateSearch()` for taxonomy arrays
- Active badge display continues to render from computed state based on current search params

**Rationale:**
- Single source of truth (URL) prevents sync issues
- Filter layout is configurable; moving filters between layers requires only config change
- Extensible design supports adding new filter types without architectural changes
- Supports future user preference feature without refactoring
- Easy to A/B test different filter layouts
- Leverages existing navigation and URL sync mechanism

**Alternatives Considered:**
1. **Separate state for all-filters panel**: Rejected (complexity, sync issues)
2. **Local React state for panel collapse/expand**: Accepted (collapse state is UI-only, not persisted)
3. **Hardcoded filter positions**: Rejected (not configurable; harder to iterate)

### Decision 3: UI Component Structure and Configurability

**New Artifacts:**
1. `src/lib/filterConfig.ts` - Configuration object defining which filters appear in Primary vs Remaining layers
   - `PRIMARY_FILTER_ITEMS`: Array of filter keys for Primary layer (defaults: `['classificationId', 'sourceId']`)
   - `REMAINING_FILTERS_ITEMS`: Array of filter keys for Remaining Filters panel (defaults: `['mealIds', 'courseIds', 'preparationIds', 'minServings', 'maxServings']`)
   - Quick Filters are always: `myRecipes`, `markedByMe`, `hasImage`
   - Designed to be easily extended: adding new filter types requires only adding to appropriate array

**New Components:**
1. `FilterQuick` - Renders toggle buttons; always shows My Recipes, Favorites, Has Image
2. `FilterPrimary` - Renders dropdowns for filters defined in `PRIMARY_FILTER_ITEMS` config
3. `FilterRemainingPanel` - Collapsible section with items defined in `REMAINING_FILTERS_ITEMS` config
4. `TaxonomyChips` - Reusable component for displaying taxonomy items as selectable chips (shared with RecipeForm pattern)

**Implementation Pattern:**
- Components import from `filterConfig.ts` to determine what to render
- Swapping filters between Primary and Remaining layers requires only updating `filterConfig.ts`, not component logic
- Adding new filter types: determine which layer it belongs in, add to config array, create or reuse component for rendering
- Each component remains focused on its layout/presentation
- Schema validation (`searchSchema`) remains unchanged; no impact on URL structure

**Refactoring:**
- Extract existing filter UI code from `src/routes/recipes/index.tsx` into the new components
- Keep the main route file lean; import and compose the components
- Keep existing utility functions (`toggleArrayFilter`, `clearFilters`) in the route or as shared utils

**Rationale:**
- Clear separation of concerns (each layer has its own component)
- Filter layout is configurable; no architectural changes needed to move filters between layers
- Extensible design: adding new filter types is straightforward (update config, add component if needed)
- Supports future user preference feature without refactoring
- Easier to test each layer independently
- Matches project component organization (`src/components/recipes/`)
- All three layers (Quick, Primary, Remaining) update the same URL search params

### Decision 4: Remaining Filters Panel Content and Behavior

**Chosen Approach:** Collapsible section below Primary Filters containing items NOT shown in Primary layer (Meals, Courses, Preparations, Servings range).

**Primary Filters Content (Always Visible):**
- Classification dropdown
- Source dropdown
- Any additional dropdown filters added via PRIMARY_FILTER_ITEMS config

**Remaining Filters Panel Content (Hidden by Default, Collapsible):**
- Meals taxonomy as selectable chips
- Courses taxonomy as selectable chips
- Preparations taxonomy as selectable chips
- Servings range (min/max number inputs)
- Any additional filter items added via REMAINING_FILTERS_ITEMS config

**Behavior:**
- Clicking "More Filters" or an expand button reveals the collapsible panel
- Panel displays taxonomy items as chips (similar to RecipeForm layout)
- Servings range inputs included in the panel
- When collapsed, only the "More Filters" button is visible; Primary Filters remain visible
- Clear visual separation from Primary Filters
- On smaller screens (mobile), the panel can expand full-width or scroll within a bounded area

**Rationale:**
- Splits filters into two groups: Primary (most common, always visible) and Remaining (taxonomy + servings, collapsible)
- Reduces clutter while keeping most-used filters (Classification, Source) accessible
- Combined, Primary + Remaining = complete filter set, easily extensible for new filters
- Familiar chip-based taxonomy layout from RecipeForm reduces learning curve
- Collapsible design prevents overwhelming users while maintaining discoverability
- Configuration-driven: adding new filters doesn't require UI restructuring

**Alternatives Considered:**
1. **Modal overlay**: Rejected (too heavy; harder on mobile)
2. **Separate drawer**: Rejected (competing for screen real estate)
3. **All filters always visible**: Rejected (defeats the purpose of reducing clutter)

### Decision 5: Mobile Responsiveness

**Approach:**
- **Row 1**: Stack vertically on small screens (< sm breakpoint); flex row on larger screens
- **Row 2**: Consider full-width dropdowns on mobile, flex-wrapped on desktop
- **All Filters Panel**: Expands full-width on mobile; normal layout on desktop
- Touch-friendly tap targets (minimum 44px height for buttons/selects)

**Rationale:**
- Project uses Tailwind CSS with mobile-first approach (`sm:`, `md:`, `lg:` breakpoints)
- Dropdowns on mobile benefit from full-width to avoid horizontal overflow

### Decision 6: URL Param Backward Compatibility

**Approach:** No changes to URL param structure. All existing search params remain valid and functional.

**Rationale:**
- Existing bookmarks, filters, and shared URLs continue to work
- Supports the principle of stateless, shareable filters

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Dropdown complexity on mobile** | Use full-width select elements on mobile; test with browser dev tools. Avoid custom dropdowns initially. |
| **Users miss the Remaining Filters panel** | Add a visible "More Filters" button/icon; consider subtle visual cues (e.g., badge count if advanced filters exist). |
| **Sync issues between Primary Filters and Remaining Filters panel** | Both update the same URL params; canonical state is URL. No separate local state for filter values. |
| **Responsive layout breaks on many active filters** | Active badge display remains; test with 5+ active filters. May need to hide some badges on very small screens. |
| **Confusion between Primary Filters dropdowns and Remaining Filters panel** | Clear labeling; distinct visual styling (e.g., Remaining Filters panel has different background). |
| **Performance if Remaining Filters panel re-renders too often** | Component memoization and careful useCallback usage to prevent unnecessary re-renders. |
| **Filter config becomes out of sync with component logic** | Config is the single source of truth; components consume it. Tests validate that all configured filters are renderable. |
| **Users want different filters in Primary Filters** | Configurable layout supports this. Future enhancement: allow user preferences to override `filterConfig.ts` defaults. |

## Mapping from Proposal to Design

| Proposal Element | Design Decision |
|------------------|-----------------|
| Quick Filters | Decision 1 (Three-Layer Structure) + Decision 3 (FilterQuick component) |
| Primary Filters (Classification, Source) | Decision 1 (Three-Layer Structure) + Decision 3 (FilterPrimary component) |
| Remaining Filters Panel | Decision 4 (Collapsible Panel Behavior) + Decision 3 (FilterRemainingPanel component) |
| No breaking changes | Decision 6 (URL Param Backward Compatibility) |
| State management | Decision 2 (URL as single source of truth) |
| Component reusability | Decision 3 (Component Structure) |
| Mobile responsiveness | Decision 5 (Mobile-first design) |
| Test coverage | Each component testable independently; existing route tests should pass |

## Rollback / Mitigation

**Deployment:**
1. Create new filter components in feature branch
2. Update `src/routes/recipes/index.tsx` to import and compose new components
3. Test all filter combinations with Playwright E2E tests
4. PR with all tests passing before merge

**Rollback:**
- If critical bugs discovered post-merge, revert the PR and restore original filter UI code
- No data model or permanent state changes; purely UI refactoring
- URL search params remain unchanged, so filter state is safe

**Blocking Policy:**
- All Vitest + React Testing Library tests must pass for filter components
- All Playwright E2E tests (recipes-list, recipes-import, recipes-favorites) must pass
- TypeScript compilation must succeed with no errors
- Code review approval required before merge

## Open Questions

1. Should the "More Filters" panel always be visible, or only when filters are active? (Current design: collapsible; alternative: always visible below Primary Filters)
2. Should Primary Filters dropdowns show counts next to each option (e.g., "Breakfast (12)"), or simple labels? (User confirmed: **YES**, show counts)
3. In the future, should users be able to customize which filters appear in Primary Filters? (Deferred to post-MVP; filterConfig.ts design supports this)
4. For mobile, should Primary Filters dropdowns stack vertically, or remain horizontal with wrap? (Deferred to responsive design testing)
5. Should filter counts be based on current filters (narrow to matching recipes) or global counts (all recipes)? (Deferred to implementation; recommend global counts for simplicity)


## Why

The cookbook recipe listing currently renders as a vertical list of narrow rows, making poor use of horizontal space on desktop and tablet screens. A card-based grid layout matches the visual language already used across the app (recipe browsing, cookbook listing) and makes large cookbooks significantly easier to scan.

## Problem Space

The cookbook detail page (`src/routes/cookbooks.$cookbookId.tsx`) renders recipe items as horizontal flex rows regardless of viewport width. On a desktop screen a cookbook with 20 recipes requires heavy scrolling through a single narrow column, while the rest of the viewport is unused. The card component pattern (`RecipeCard`, `CookbookCard`) is already established in the codebase and uses image-dominant cards — the cookbook recipe list is the outlier.

**In scope:**
- Replacing the recipe row display with a responsive card grid on the cookbook detail page
- New `CookbookRecipeCard` component (compact card, owner-aware)
- Adapting the dnd-kit strategy from `verticalListSortingStrategy` to `rectSortingStrategy`
- Updating the DragOverlay to render a card
- Full-width empty chapter drop zone

**Out of scope:**
- The collapsed mode (sortable chapter rows) — untouched
- All tRPC mutations and API endpoints — unchanged
- The TOC page, print page, cookbook listing page — unchanged
- `RecipeCard` component (used for recipe browsing) — unchanged

## What Changes

- **New**: `CookbookRecipeCard` component at `src/components/cookbooks/CookbookRecipeCard.tsx` — compact card using `CardImage` primitive; shows index badge, recipe name (link), time metadata, drag handle (left, owner only), and remove button (top-right overlay, owner only)
- **Changed**: Recipe lists in `cookbooks.$cookbookId.tsx` switch from `verticalListSortingStrategy` to `rectSortingStrategy` and render inside a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` container
- **Changed**: Empty chapter drop zone (`EmptyChapterDropZone`) renders full-width (all columns)
- **Changed**: `DragOverlay` renders a `CookbookRecipeCard` instead of a row clone
- **Removed**: `SortableRecipeRow`, `StaticRecipeRow`, `RecipeRowContent` inline components (replaced by `CookbookRecipeCard`)
- **Unchanged**: Collapsed mode, cross-chapter drag logic, all mutations, chapter management

## Capabilities

### New Capabilities
- `cookbook-recipe-grid`: Responsive card grid for cookbook recipe listings — card anatomy, grid breakpoints, drag handle and remove button placement, empty chapter drop zone full-width behavior, DragOverlay card rendering

### Modified Capabilities
No existing spec-level requirements change. The `cookbook-chapters` and `cookbook-detail-owner-gating` specs describe behavior (drag handles, remove buttons, chapter headers) that is fully preserved in the new card design — only the visual format changes.

## Impact

| File | Change |
|---|---|
| `src/components/cookbooks/CookbookRecipeCard.tsx` | **Create** — new card component |
| `src/routes/cookbooks.$cookbookId.tsx` | **Modify** — swap strategy, replace row components, add grid wrapper |
| `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` | **Modify** — update assertions for card elements |

No API, router, database, or auth changes required.

## Scope

This change is purely a view-layer refactor of the cookbook detail recipe list. It introduces no new data, no new routes, and no new tRPC procedures. The existing drag-and-drop mechanics, optimistic updates, and mutation logic are untouched.

## Risks

- **DnD visual regression**: Switching to `rectSortingStrategy` changes how dnd-kit calculates snap positions in a grid. Cross-chapter drags must be manually tested to confirm the containerId-based logic still resolves correctly.
- **Card sizing on small viewports**: At `sm:grid-cols-2` (≥640px), cards may feel cramped if recipe names are long. The `truncate` class on the name keeps layout stable, but should be verified visually.

## Non-Goals

- Paginating or virtualizing the recipe list (no current data scale concern)
- Adding any new recipe metadata to the card (no new fields needed)
- Changing the recipe browsing card (`RecipeCard`) — the two card types serve different contexts and should not be merged

## Open Questions

All design decisions were resolved during the explore session:
- Drag handle: explicit handle on the left of the card body ✓
- Index numbers: keep them as a small muted number inline with the name ✓
- Component reuse: new `CookbookRecipeCard` sharing `CardImage` primitive, not extending `RecipeCard` ✓
- DragOverlay: render the card (consistent with drag source) ✓
- Empty chapter zone: full-width ✓
- Column counts: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` ✓

No unresolved ambiguity remains.

---

> **Change-control note:** If scope changes after this proposal is approved, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before implementation proceeds.

> **Approval required:** This proposal must be reviewed and explicitly approved before design, specs, tasks, or apply proceed.

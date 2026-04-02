## Context

The cookbook detail page renders recipes as horizontal flex rows using dnd-kit's `verticalListSortingStrategy`. The existing `RecipeCard` and `CookbookCard` components demonstrate a well-established image-dominant card pattern. This design replaces the row-based list with a responsive card grid while preserving all DnD, chapter, and owner-gating behavior.

**Current state:**
- `SortableRecipeRow` / `StaticRecipeRow` / `RecipeRowContent` are inline components in `src/routes/cookbooks.$cookbookId.tsx`
- `SortableContext` uses `verticalListSortingStrategy`
- Each recipe renders as: `grip | index | 48×48 image | name + metadata | remove`
- The `CardImage` primitive is already shared across `RecipeCard` and `CookbookCard`

**Constraints:**
- Cross-chapter drag logic (`computeChapterReorder`, `handleDragEnd`) must not be touched
- Collapsed mode (chapter-row DnD) is independent and unchanged
- No API or data model changes

## Goals / Non-Goals

**Goals:**
- Responsive 3-column grid (desktop) / 2-column (tablet) / 1-column (phone) for recipe display
- New compact `CookbookRecipeCard` component that slots into the existing DnD structure
- Correct 2D snap behavior during drag via `rectSortingStrategy`
- DragOverlay renders a card for visual consistency
- Empty chapter drop zone remains full-width

**Non-Goals:**
- Changing `RecipeCard` (recipe browsing card)
- Modifying any tRPC procedures, data models, or routes
- Changing the collapsed mode (sortable chapter rows)

## Decisions

### Decision 1: New `CookbookRecipeCard` component, not extending `RecipeCard`

**Choice:** Create `src/components/cookbooks/CookbookRecipeCard.tsx` as a standalone component sharing only the `CardImage` primitive.

**Rationale:** `RecipeCard` takes `Pick<Recipe, ...>` (full Mongoose-derived type) and renders classification badge, heart icon, notes excerpt, and difficulty badge — all browse-oriented chrome. `CookbookRecipeCard` takes `CookbookRecipe` (leaner tRPC projection: no `difficulty`, no `notes`, has `servings`) and renders management chrome (drag handle, index, remove button). Extending `RecipeCard` with conditional props would couple two unrelated contexts. The real shared unit is `CardImage`, which is already extracted.

**Alternative considered:** Generic card with `variant` prop. Rejected — same coupling problem, just differently named.

---

### Decision 2: `rectSortingStrategy` over `verticalListSortingStrategy`

**Choice:** Replace `verticalListSortingStrategy` with `rectSortingStrategy` from `@dnd-kit/sortable` in all recipe `SortableContext` instances.

**Rationale:** `verticalListSortingStrategy` computes sort order based on the Y-axis only. In a 2D grid, items in the same row have the same Y coordinate, causing incorrect snap ordering when dragging horizontally. `rectSortingStrategy` computes closest rectangle intersection, which is correct for grids. The cross-chapter containerId detection in `handleDragEnd` is independent of strategy and requires no change.

**Alternative considered:** Keep `verticalListSortingStrategy`. Rejected — produces jarring snap behavior in a multi-column grid.

---

### Decision 3: Grid breakpoints `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Choice:** Phone: 1 column, tablet (≥640px): 2 columns, desktop (≥1024px): 3 columns.

**Rationale:** The issue requested 3–4 desktop / 3 tablet / 1 phone. During explore, 2 columns on tablet (≥640px) was preferred over 3 to avoid feeling cramped, and 3 on desktop over 4 for the same reason. Extra space is preferable to a cramped layout with long recipe names.

---

### Decision 4: Card anatomy

```
┌─────────────────────────────┐
│                         [✕] │  ← owner only; absolute top-right; opacity-0 group-hover:opacity-100
│  ┌───────────────────────┐  │
│  │     CardImage h-32    │  │  ← compact (vs h-48 in RecipeCard)
│  └───────────────────────┘  │
│  [⋮]  ②  Recipe Name Link   │  ← grip | index | name; flex row; p-3
│         Prep 20m · Cook 35m │  ← metadata; indented to align under name
└─────────────────────────────┘
```

- **Grip handle:** left of card body, below image. "Explicit handle on the left" per product decision. `touch-none`, `cursor-grab`.
- **Index:** small muted number (`text-sm text-gray-500`) positioned between grip and name. Per-chapter numbering (resets to 1 at the start of each chapter) — same as current row behavior.
- **Remove button:** absolute top-right overlay, hover-reveal. Consistent with card pattern elsewhere in the app.
- **Image height:** `h-32` (compact). `RecipeCard` uses `h-48`; the cookbook grid is higher-density so a shorter image is appropriate.

**Owner vs non-owner:** `SortableRecipeCard` (owner) and `StaticRecipeCard` (non-owner) are two named exports from `CookbookRecipeCard.tsx`, or a single component with `isOwner` prop. The component accepts optional `onRemove` and drag hook wiring to support both modes without duplicating markup.

---

### Decision 5: Empty chapter drop zone stays full-width

**Choice:** `EmptyChapterDropZone` renders outside the grid `<div>` as a full-width sibling. When a chapter has recipes, the grid renders; when it's empty, the drop zone spans the full container width.

**Rationale:** A card-sized drop zone in an empty grid looks orphaned. Full-width makes the "drop here" affordance unambiguous and acts as a visual chapter delimiter.

**Implementation:** The chapter section renders:
```jsx
<ChapterHeader ... />
{chapterRecipes.length > 0
  ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SortableContext ...>{cards}</SortableContext>
    </div>
  : <EmptyChapterDropZone chapterId={chapter.id} />}
```

---

### Decision 6: DragOverlay renders `CookbookRecipeCard`

**Choice:** The `DragOverlay` renders a `StaticRecipeCard` (no drag wiring, no remove button) styled with `opacity-90 shadow-xl` to indicate the dragged item.

**Rationale:** Rendering a card overlay matches the card being dragged. The existing row overlay was consistent with the row list; a card overlay is consistent with the card grid.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|---|---|
| Replace row list with card grid | Decisions 3 + 4 |
| New `CookbookRecipeCard`, not extending `RecipeCard` | Decision 1 |
| Switch to `rectSortingStrategy` | Decision 2 |
| Grid breakpoints | Decision 3 |
| Card anatomy (handle, index, remove, image height) | Decision 4 |
| Empty chapter drop zone full-width | Decision 5 |
| DragOverlay renders card | Decision 6 |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Cross-chapter DnD visual regression after strategy swap | Manual test: drag within chapter, drag between chapters, drag to empty chapter. The `containerId` logic in `handleDragEnd` is untouched. |
| `rectSortingStrategy` import not already used in project | Import from `@dnd-kit/sortable` — already a dependency. No new package needed. |
| Card layout on narrow viewports with long names | `truncate` on name element; metadata ellipsis via `text-sm`. Verify visually at 640px. |
| Test assertions reference row elements (`aria-label="Drag to reorder"`) | Update `CookbookDetail.test.tsx` — existing aria-labels are preserved on the new card's grip button. |

## Rollback / Mitigation

This is a view-layer-only change with no database or API surface. Rollback is: revert the files changed in the PR. No migration, no data cleanup.

**CI blocking policy:** If build, type-check, or Vitest fails, do not merge. If only E2E flake, re-run once; if still failing, investigate before merging.

## Open Questions

All questions resolved during explore session. No outstanding unknowns.

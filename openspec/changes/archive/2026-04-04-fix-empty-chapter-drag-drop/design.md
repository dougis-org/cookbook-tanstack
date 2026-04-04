## Context

The cookbook detail page (`src/routes/cookbooks.$cookbookId.tsx`) uses dnd-kit for three distinct drag-and-drop contexts:

1. **Flat mode** — single `DndContext` for cookbooks without chapters; all recipe cards in one `SortableContext`.
2. **Expanded chapter mode** — single `DndContext` spanning multiple `SortableContext` elements (one per chapter). Empty chapters render an `EmptyChapterDropZone` via `useDroppable`.
3. **Collapsed mode** — single `DndContext` for reordering chapter rows; single `SortableContext`.

The bug is isolated to context **2**. The current collision strategy (`closestCenter`) measures center-to-center distance from the dragged element to every registered droppable. When the source chapter has two or more recipes, sibling recipe cards in the source chapter consistently win the nearest-center race against the target empty chapter's droppable. With only one recipe in the source chapter, the bug does not manifest because the active item is excluded from candidates, leaving the empty zone as the only candidate.

`pointerWithin` — already exported by `@dnd-kit/core` 6.3.1 — reports only droppables whose bounding rect physically contains the pointer. It is the canonical complement to `closestCenter` for multi-container layouts.

## Goals / Non-Goals

**Goals:**
- Drag from any populated chapter to any empty chapter works regardless of how many recipes are in the source chapter.
- Within-chapter reordering behaviour is unchanged.
- No new npm dependencies.
- An e2e test covers the drag-to-empty-chapter scenario.

**Non-Goals:**
- Changing the visual design or size of `EmptyChapterDropZone`.
- Altering the flat or collapsed `DndContext` instances.
- Any server-side changes.

## Decisions

### Decision 1 — Custom `pointerWithin`-first collision function

**Chosen**: Define a module-level `multiContainerCollision` function that:
1. Runs `pointerWithin` first.
2. If it returns any hits, return them (the pointer is physically inside a droppable).
3. Otherwise fall back to `closestCenter`.

Apply this function only to the chapter-aware (expanded mode) `DndContext`.

**Alternatives considered:**

| Alternative | Why rejected |
|---|---|
| Switch all three DndContexts to `closestCenter` with `rectIntersection` | `rectIntersection` is less precise than `pointerWithin` for small targets; overkill for flat/collapsed contexts which work correctly today |
| Use `pointerWithin` alone | Returns `[]` when pointer is between two containers (e.g. mid-drag over a gap), which would make `over` null and abort the drag unexpectedly |
| Use `closestCorners` | Improves corner-case behaviour but does not solve the fundamental multi-container problem — still purely geometry-based |
| Enlarge `EmptyChapterDropZone` to win geometry races | Fragile; doesn't fix the algorithmic root cause; hurts visual layout |

**Proposal mapping:** "Replace `closestCenter` with a custom `pointerWithin`-first collision strategy" → this decision.

### Decision 2 — No changes to `handleDragEnd` logic

The existing `handleDragEnd` already handles the empty-chapter drop case correctly (cross-chapter branch, `overIndex === -1 → insertAt = 0`). No changes needed once the correct droppable is surfaced by the collision algorithm.

**Proposal mapping:** "Server-side logic is correct as-is" → confirmed, no server work.

### Decision 3 — e2e test via Playwright pointer simulation

The new test will set up a cookbook with one recipe in Chapter 1 and an empty Chapter 2, then use Playwright's `dragTo` / mouse API to drag the recipe card into the empty zone and assert the chapter change persists.

**Testability note:** This is the only layer where the bug is observable end-to-end. Unit tests of `computeChapterReorder` would not catch the collision-detection failure.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `pointerWithin` returns `[]` during keyboard drag (no pointer coordinates) | Keyboard sensor falls back to `closestCenter` automatically via the `else` branch — no regression |
| Collision function called on every pointermove — performance | The function is O(n) on the number of droppables (bounded by total recipes + chapters). No measurable impact at realistic data sizes. |
| Future recipe cards in a chapter compete with each other differently | `pointerWithin` only changes which container wins; within-container ordering still uses `closestCenter` via the fallback, same as before |

## Rollback / Mitigation

The change is confined to a single expression in one component. Rollback is reverting the `collisionDetection` prop back to `closestCenter`. No data migrations or API changes to undo.

If CI is blocked by the new e2e test flaking on drag timing, increase `waitFor` timeouts before merging.

## Open Questions

None. All decisions are resolved.

## Why

When a user creates a new (empty) chapter and tries to drag an existing recipe into it, the recipe does not move — it instead reorders within its original chapter. This makes it impossible to populate a newly-created chapter via drag-and-drop, defeating the primary workflow for organising recipes across chapters. The root cause is a known limitation of the `closestCenter` collision-detection algorithm in multi-container drag-and-drop: recipe cards in the source chapter consistently win the nearest-center race against the empty chapter's drop zone.

## What Changes

- Replace `closestCenter` with a custom `pointerWithin`-first collision strategy on the chapter-aware `DndContext` in `src/routes/cookbooks.$cookbookId.tsx`.
- The custom strategy checks whether the pointer is physically inside a droppable rect (`pointerWithin`) before falling back to `closestCenter`. This ensures the `EmptyChapterDropZone` wins when the user's pointer is over it, regardless of how close other recipe cards are in screen space.
- Add an e2e test covering the drag-to-empty-chapter scenario (currently untested).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cookbook-chapters`: The "Cross-chapter recipe move is persisted" requirement gains a new explicit scenario for moving a recipe into an **empty** chapter via drag-and-drop. The existing scenario only covers moves between populated chapters.

## Impact

**Code**
- `src/routes/cookbooks.$cookbookId.tsx` — add a module-level `multiContainerCollision` function; swap `closestCenter` → `multiContainerCollision` on the single chapter-aware `DndContext` (line ~527). The two other `DndContext` instances (collapsed mode, flat mode) are single-container and remain unchanged.
- `src/e2e/cookbooks-auth.spec.ts` — new test: drag recipe from a populated chapter to an empty chapter.

**Dependencies**
- `pointerWithin` is already exported by the installed `@dnd-kit/core` 6.3.1. No new packages needed.

**APIs / Server**
- No server changes. `reorderRecipes` already handles cross-chapter moves with empty target chapters correctly.

## Risks

- The custom collision function runs on every pointer-move during drag. It is a simple two-step (O(n) scan for pointer-within, fallback to existing closestCenter) and should have no measurable performance impact.
- Changing collision detection could subtly affect within-chapter reordering feel. The fallback to `closestCenter` preserves the existing behaviour for all non-empty-chapter cases.

## Open Questions

No unresolved ambiguity. The fix is fully bounded:
- Root cause confirmed analytically: `closestCenter` with 1 recipe in source works accidentally; 2+ breaks reliably.
- `pointerWithin` is available in the installed version of dnd-kit.
- Server-side logic is correct as-is.
- Only one of the three `DndContext` instances needs the fix.

## Non-Goals

- Changing the visual design of `EmptyChapterDropZone`.
- Fixing within-chapter reordering (not broken).
- Addressing the collapsed-mode chapter drag (single container, works correctly).
- Any server-side changes.

---

*If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before `/opsx:apply` proceeds.*

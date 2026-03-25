## Context

Cookbooks currently store recipes as a flat embedded array `[{ recipeId, orderIndex }]` inside the Cookbook MongoDB document. The detail page uses `@dnd-kit` for single-container drag-and-drop reorder. The tRPC router exposes `reorderRecipes` which accepts a flat `recipeIds[]`.

This change introduces an optional chapter layer sitting between the cookbook and its recipes. All existing code must continue to work unchanged when no chapters exist.

**Current schema:**
```
Cookbook { userId, name, description, isPublic, imageUrl, recipes: [{ recipeId, orderIndex }] }
```

**Target schema:**
```
Cookbook {
  ...,
  chapters: [{ _id, name, orderIndex }],          // new, additive
  recipes:  [{ recipeId, chapterId?, orderIndex }] // chapterId is new, optional
}
```

## Goals / Non-Goals

**Goals:**
- Add optional chapter grouping to cookbooks with zero impact on chapter-free cookbooks.
- Enforce the invariant: if any chapter exists, every recipe has a `chapterId`.
- Two-mode drag-and-drop: recipe reorder (expanded) and chapter reorder (collapsed).
- Cross-chapter recipe drag in expanded mode.
- Chapter CRUD with owner-only auth gating.
- Update CookbookCard, TOC, and Add Recipe modal to reflect chapters.

**Non-Goals:**
- Chapter-level images, descriptions, or access control.
- Reusing chapters across cookbooks.
- Paginating chapters or per-chapter recipes.
- External API consumers (app is single-owner, no public API contract).

## Decisions

### D1 — Embed chapters in the Cookbook document (not a separate collection)

**Chosen:** Embed `chapters[]` in the Cookbook document alongside `recipes[]`.

**Alternatives considered:**
- *Separate `chapters` collection*: cleaner relational shape, but requires joins/transactions for what is always a single-owner, single-document read. Adds latency and complexity with no benefit at this scale.
- *Chapters embed recipes (nested)*: `chapters[].recipes[]` — mirrors the logical hierarchy but makes MongoDB positional-operator updates on doubly-nested arrays painful and fragile.

**Rationale:** The cookbook is always read and written as a unit. Embedding keeps the fetch as a single document read. The 16 MB BSON limit is not a realistic concern for recipe collections.

---

### D2 — Flat recipes array with optional `chapterId` (Option B)

**Chosen:** Keep `recipes[]` flat; add optional `chapterId` field per entry.

**Alternatives considered:**
- *Nested chapters embed recipes*: rejected above (D1).
- *Top-level interleaved items array `[{type:'chapter'|'recipe', ...}]*`: flexible ordering but requires a schema type discriminator and complicates all existing recipe queries.

**Rationale:** Minimal delta to existing schema. The existing `reorderRecipes` mutation pattern (replace the array) extends naturally to the new shape. All existing queries that ignore `chapterId` continue to work.

---

### D3 — Invariant enforced at application layer only

When chapters exist, `chapterId` is required on every recipe stub. This is enforced in:
- `createChapter` (first chapter migrates all existing recipes)
- `addRecipe` (validates `chapterId` present when chapters exist)
- `deleteChapter` (reassigns recipes before removing)

No MongoDB schema-level enforcement (Mongoose `required` conditional) — the conditional-required pattern in Mongoose is error-prone. App-layer enforcement is sufficient given there are no direct DB writers outside the app.

---

### D4 — `reorderRecipes` input becomes full-state replacement

**Chosen:** `{ cookbookId, chapters: [{ chapterId, recipeIds }] }` — full description of every chapter's ordered recipes, applied as `$set: { recipes: [...] }`.

**Alternative:** Fine-grained mutations (`moveRecipe`, `reorderWithinChapter`) — more granular but requires more tRPC round-trips and complex optimistic UI.

**Rationale:** The existing `reorderRecipes` already uses full-replace semantics (`$set`). Extending to chapters preserves the pattern. A single drag event on the client always knows the full new state, so sending it is natural.

**Breaking change:** Callers using the old `recipeIds[]` shape must be updated. The only caller is `cookbooks.$cookbookId.tsx` — updated as part of this change.

---

### D5 — Two-mode DnD via a single global collapse toggle

**Chosen:** One toggle (chevron icon) at the top of the recipe section. When collapsed, all chapters compress to single rows and become the sortable items. When expanded (default), recipe rows are sortable within and across chapters.

**Alternative:** Per-chapter collapse toggles — allows mixed states but makes chapter reordering ambiguous (which chapters are draggable?). Adds state complexity for little user benefit.

**Rationale:** Clear modal separation. Users intuitively understand "collapse all → drag chapters". Matches common patterns in outline editors.

---

### D6 — Cross-chapter recipe drag using multiple `SortableContext` containers

**Chosen:** Single `DndContext` wrapping all chapters; one `SortableContext` per chapter (keyed by `chapterId`). Use `DragOverlay` to render the dragged item at cursor. `onDragEnd` receives `active.data.current.sortable.containerId` and `over.data.current.sortable.containerId` to detect cross-chapter moves.

**Alternative:** Separate `DndContext` per chapter — cross-chapter drag is impossible across context boundaries.

**Rationale:** `@dnd-kit` is already installed and used. Multiple `SortableContext` within a single `DndContext` is the documented pattern for multi-container sortable lists.

---

### D7 — Chapter default naming: "Chapter N" (1-based count of all chapters ever, not current)

**Chosen:** Default name is `Chapter ${chapters.length + 1}` at the time of creation — i.e. based on the next sequential number.

**Rationale:** Simple, predictable, no need to track a separate counter. User can rename immediately via the pencil icon.

---

### D8 — Delete chapter → move recipes to first remaining chapter

**Chosen:** On `deleteChapter`, atomically:
1. Find remaining chapters sorted by `orderIndex`.
2. Reassign all recipes from the deleted chapter to `chapters[0]._id` (lowest `orderIndex`).
3. Remove the chapter entry.

If deleting the last chapter: remove all chapters, clear `chapterId` from all recipes.

**Rationale:** "First chapter = top of list" is the most discoverable location for displaced recipes. Avoids requiring the user to empty a chapter before deleting.

---

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| Embed chapters in cookbook doc | D1 |
| Flat recipes + optional `chapterId` | D2 |
| No-orphan invariant enforced at app layer | D3 |
| `reorderRecipes` new input shape | D4 |
| Two-mode DnD with collapse toggle | D5 |
| Cross-chapter drag | D6 |
| Default chapter name "Chapter N" | D7 |
| Delete chapter → move to first | D8 |

---

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `reorderRecipes` breaking change breaks in-flight client calls at deploy | Single-page app; deploy causes client reload. Acceptable. |
| Multi-container DnD `handleDragEnd` edge cases (drop on header, mis-detected container) | Thorough unit tests for the reorder logic; E2E test for cross-chapter drag. |
| Invariant violation via race condition (two tabs) | Last-writer-wins on `$set`; no financial data at risk. Acceptable. |
| MongoDB positional update limitations | Avoided by full-replace strategy (D4). |
| `@dnd-kit` `DragOverlay` z-index conflicts with modals | Use `z-50` on overlay; modals already at `z-50` — test for overlap. |

## Rollback / Mitigation

- **Schema**: `chapters` and `chapterId` are additive. Rolling back the code leaves harmless extra fields in existing documents — no data loss.
- **`reorderRecipes` shape change**: If rollback is needed, revert the router and the detail page together. No DB migration required.
- **CI/review blocked**: Do not merge if any of `npm run test`, `npm run test:e2e`, or Codacy checks are failing. Address failures before re-requesting review.

## Open Questions

None — all design decisions resolved during exploration session.

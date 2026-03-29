## Context

`recipes.list` and `recipes.byId` now embed `marked: boolean` per-user in their responses (merged in #225). The frontend has not yet consumed this field:

- `RecipeCard` ignores `marked` — no visual indicator on list cards
- `$recipeId.tsx` fires a separate `isMarked` query on mount and uses `markedData?.marked` for the Save/Saved button state
- `toggleMarked.onSuccess` invalidates `[['recipes', 'isMarked']]` — this is the right key for the current approach but will need to change to `[['recipes', 'byId']]` once the detail page reads from `byId`

This change wires up the existing `marked` data to the UI in two places without touching the server.

## Goals / Non-Goals

**Goals:**
- Render a heart icon on `RecipeCard` for authenticated users, filled/red when `marked: true`
- Pass `marked` from the list query response down into `RecipeCard`
- Remove the `isMarked` query from the detail page; read `recipe.marked` instead
- Update `toggleMarked.onSuccess` to invalidate `byId` so the detail page re-fetches with the new state

**Non-Goals:**
- Making the heart on the list card clickable (read-only indicator)
- Removing the `isMarked` tRPC endpoint
- Any server-side changes

## Decisions

### 1. Heart icon: only show when `marked: true` vs always show outline

**Decision:** Show the heart only to authenticated users, always rendered (filled red when `marked`, outline when not), matching the detail page pattern.

**Rationale:** An always-visible outline heart communicates affordance — users can see that saving is possible. Only showing it when saved would hide the feature from users who haven't saved anything. Matches the existing detail-page UX.

**Alternative considered:** Show outline only on hover. Rejected — hover doesn't work on touch devices and adds CSS complexity.

### 2. Where to add `marked` to `RecipeCardProps`

**Decision:** Add `marked?: boolean` as an optional prop (falsy = unsaved). The caller passes it when authenticated, omits or passes `false` when anonymous.

**Rationale:** `RecipeCard` is a pure display component — it shouldn't know about auth state. The list page already has session context and the `marked` value from the query, so it passes it through. Optional keeps the component usable in other contexts (e.g., cookbook recipe entries) without requiring the field.

### 3. Detail page: invalidate `byId` not `isMarked`

**Decision:** After `toggleMarked` succeeds, call `queryClient.invalidateQueries({ queryKey: [['recipes', 'byId']] })`.

**Rationale:** Once `marked` is read from the `byId` response, that's the cache entry that must be refreshed. Invalidating `isMarked` would be a no-op (nothing reads it on the detail page anymore).

### 4. Keep the `isMarked` query in the router

**Decision:** Leave `isMarked` in place — no deprecation or removal.

**Rationale:** It may be used by other consumers or direct API callers. Removing it is a breaking change that belongs in a separate, deliberate cleanup.

## Risks / Trade-offs

- **Stale marked state during toggle:** Between `toggleMarked` firing and `byId` re-fetching, the button briefly shows the old state. This is identical to the current behaviour (same with `isMarked` invalidation) — no regression.
- **`marked` prop optional on `RecipeCard`:** If a future caller forgets to pass `marked`, the card silently shows no heart. Low risk given the prop is clearly named.

## Rollback / Mitigation

All changes are frontend-only. Rolling back is a revert of three files. No data migration needed. CI failures on the `recipes-favorites` e2e spec are the primary signal of a regression.

## Open Questions

None — the issue #222 description fully specifies the required changes.

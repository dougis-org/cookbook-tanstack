## Context

The cookbook TOC page (`/cookbooks/:id/toc`) renders recipe entries via `CookbookTocList` → `TocRecipeItem` in `src/components/cookbooks/CookbookStandaloneLayout.tsx`. Entries currently show an index number, recipe name, and prep/cook time. The `trpc.cookbooks.byId` query returns recipes pre-sorted by `orderIndex` server-side, so array position directly encodes print order. No backend changes are required.

Two follow-on issues (#245, #246) will also need `recipeId → pageNumber` mapping, making a shared utility the right abstraction now.

## Goals / Non-Goals

**Goals:**
- Display estimated print page numbers in the TOC (dimmed on screen, full opacity in print)
- Classic dotted-leader print layout: `name ········· pg N`
- Introduce `buildPageMap()` utility in `src/lib/cookbookPages.ts` for reuse by issues #245 and #246
- Keep `TocRecipeItem` printable without prep/cook time clutter

**Non-Goals:**
- Content-based page estimation (follow-up work)
- Back-of-book index or per-recipe print page numbers (issues #245, #246)

## Decisions

### D1: `buildPageMap()` lives in `src/lib/cookbookPages.ts`

A standalone utility module rather than inlining logic in the component. This is the shared surface for all three consumers (TOC, alphabetical index, print view). The function signature is:

```ts
function buildPageMap(recipes: { id: string }[]): Map<string, number>
```

Input is a minimal interface (just `id`) so it works with any recipe shape. The flat heuristic: `recipes[i].id → i + 1`.

**Alternative considered:** Inline `index + 1` directly in `TocRecipeItem`. Rejected — would not be reusable and would need to be reimplemented for #245 and #246.

### D2: Page number passed as a prop to `TocRecipeItem`

`CookbookTocList` calls `buildPageMap()` once, then passes `pageNumber` to each `TocRecipeItem`. The item itself has no knowledge of sibling recipes.

```ts
// CookbookTocList
const pageMap = buildPageMap(recipes)
// ...
<TocRecipeItem recipe={recipe} index={i} pageNumber={pageMap.get(recipe.id) ?? i + 1} />
```

**Alternative considered:** Compute inside `TocRecipeItem` from index. Works for flat case but breaks when content-based estimation makes pages non-uniform (recipe N may start at page 4, not page N). Prop-passing keeps the accumulation logic centralized in `buildPageMap`.

### D3: Dotted leader as a flex spacer element

Layout within the link row:

```
[index#]  [name, shrink-0]  [<span flex-1 dotted-border self-end>]  [pg N]  [time, print:hidden]
```

The leader `<span>` uses Tailwind: `flex-1 border-b border-dotted border-gray-600 mx-2 self-end mb-[3px] print:border-gray-400`. This avoids pseudo-element CSS and stays within Tailwind conventions used throughout the codebase.

**Alternative considered:** CSS `content: "..."` repeating dots via a pseudo-element. Rejected — requires a `<style>` block or custom CSS class outside Tailwind's utility layer.

### D4: Page number visibility

- **Screen**: `text-gray-500 text-xs tabular-nums` — visible but de-emphasized, consistent with how `RecipeTimeSpan` handles secondary info
- **Print**: `print:text-black print:text-sm` — full contrast

The `"pg N"` label format (e.g., `pg 5`) is used rather than bare `5` to make it unambiguous in screen view.

### D5: `RecipeTimeSpan` becomes `print:hidden`

Prep/cook time is not conventional TOC content. It stays visible on screen (useful for browsing) but is hidden in print to keep the print TOC clean. This is a one-class addition: `className="... print:hidden"` on `RecipeTimeSpan` within `TocRecipeItem`.

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| `buildPageMap()` shared utility | D1: `src/lib/cookbookPages.ts` |
| Page number as prop | D2: passed from `CookbookTocList` |
| Dotted leader print style | D3: flex spacer with `border-dotted` |
| Dimmed on screen, full print | D4: Tailwind opacity/color classes |
| `RecipeTimeSpan` print:hidden | D5: `print:hidden` class |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Page numbers diverge from actual print output | Expected and documented; estimates only. Will improve when heuristic is upgraded. |
| `buildPageMap` signature too narrow for future heuristics | Input type `{ id: string }[]` is intentionally minimal; heuristic upgrade will widen it to `{ id: string; ingredientLines?: number; instructionLines?: number }[]` — additive, non-breaking |
| Dotted border alignment varies across browsers in print | Use `self-end mb-[3px]` to align baseline; test in Chrome print preview |

## Rollback / Mitigation

This is a purely additive UI change with no backend or data model impact. Rollback = revert the two modified/created files. No migration required.

## Open Questions

None. All design questions were resolved during exploration session prior to this proposal.

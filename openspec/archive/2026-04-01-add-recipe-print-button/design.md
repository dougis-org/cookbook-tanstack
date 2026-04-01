## Context

The recipe detail page (`/recipes/:recipeId`) has no print trigger. Browser-level printing works, but users have no in-app affordance. The cookbook standalone view (`CookbookPageChrome`) already has an inline `window.print()` button using the lucide `Printer` icon. This design extracts that pattern into a shared component and adds it to the recipe detail page.

Existing print infrastructure is already in place:
- `print:hidden` is applied to breadcrumb, Save, Edit, Delete, and ExportButton on the recipe detail page
- The Header also carries `print:hidden`
- `RecipeDetail` renders an `actions` slot (top-right of the card, beside the recipe name h1)

## Goals / Non-Goals

**Goals:**
- Single `PrintButton` component, used in both recipe detail and cookbook contexts
- Print button appears top-right of recipe card, same line as Edit Recipe
- Cookbook standalone pages use the same component (refactor, no behavior change)

**Non-Goals:**
- Print-specific CSS/layout changes to recipe content
- Adding print to any other route

## Decisions

### Decision 1: New `src/components/ui/PrintButton.tsx`

Extract the print affordance to `src/components/ui/PrintButton.tsx`. This co-locates it with other generic UI primitives (`ClassificationBadge`, `CardImage`, `TaxonomyBadge`, etc.).

**Alternative considered**: Keep inline JSX in each call site. Rejected — two call sites with identical logic creates drift risk and no single test target.

**Testability**: Component renders a button; click handler calls `window.print()`. Test by mocking `window.print` and asserting it was called on click.

### Decision 2: Compose via the existing `actions` slot in `RecipeDetail`

The `actions` prop accepts a `ReactNode`. The route file (`$recipeId.tsx`) passes a flex group containing `<PrintButton />` and, conditionally, the Edit link. `RecipeDetail` does not need to change.

```tsx
actions={
  <div className="flex items-center gap-2 print:hidden">
    <PrintButton />
    {isOwner && <Link ...>Edit Recipe</Link>}
  </div>
}
```

**Alternative considered**: Add a dedicated `printButton` prop to `RecipeDetail`. Rejected — the existing `actions` slot is already designed for this composition pattern; a second prop adds API surface without benefit.

**Note**: `print:hidden` on the wrapper div means the entire action group (including Print) disappears during printing — consistent with existing behavior for Edit/Save/Delete.

### Decision 3: Reuse `CookbookPageChrome`'s print button via `PrintButton`

`CookbookPageChrome` currently renders an inline button. Replace with `<PrintButton />`. No behavior change — this is a pure refactor.

### Proposal → Design mapping

| Proposal element | Design decision |
|---|---|
| New `PrintButton` component | Decision 1: `src/components/ui/PrintButton.tsx` |
| Print on recipe detail, top same line as Edit | Decision 2: compose via `actions` slot |
| Refactor `CookbookStandaloneLayout` | Decision 3: replace inline JSX |

## Risks / Trade-offs

- **`window.print()` in tests**: Must mock `window.print` (not defined in jsdom). Low risk — standard pattern.
- **Visual regression in action bar**: Adding Print button beside Edit may feel crowded on small screens. Mitigated by using a compact icon-only or icon+label button consistent with ExportButton styling.

## Rollback / Mitigation

Change is additive (new component, minor route update, refactor). Rollback = revert the three file changes. No data migration, no API changes.

## Open Questions

None — design is fully specified.

## Context

The cookbook detail page (`/cookbooks/$cookbookId`) has a Print button that calls `window.print()`, which produces a useless compact list of sortable recipe rows. There is no path to a hard-copy-quality print output. The TOC route (`cookbooks.$cookbookId_.toc.tsx`) establishes the pattern for a standalone print-optimised route that bypasses the site shell, uses `print:hidden` for screen-only chrome, and applies `print:` Tailwind variants for light-mode print output.

The existing `print.css` already handles ingredient/instruction orphan prevention (`break-inside: avoid`) but has no recipe-boundary page break rules.

The `RecipeDetail` component renders full recipe content (ingredients, instructions, nutrition, taxonomy, source) and uses `recipe-ingredient-item` / `recipe-instruction-step` CSS class hooks that `print.css` already targets.

The `cookbooks.byId` tRPC procedure fetches recipe documents but projects only summary fields. A new procedure is needed to project full recipe fields for the print route.

## Goals / Non-Goals

**Goals:**
- Deliver a `/cookbooks/$cookbookId/print` route that prints: TOC → page break → full recipe per page
- Single tRPC query for all data (cookbook metadata + full recipe content)
- Accessible to unauthenticated users for public cookbooks (consistent with `cookbook-auth-gating`)
- Update the cookbook detail Print button to navigate to this route

**Non-Goals:**
- Recipe hero images in print output
- Serving-size scaling on the print route
- PDF export
- Custom per-page print headers/footers

## Decisions

### D1: Dedicated route vs. hidden DOM section on the detail page

**Decision**: Dedicated route `cookbooks.$cookbookId_.print.tsx`

**Rationale**: The TOC already uses this pattern. A dedicated route can fetch its own full data, has a clean URL users can bookmark, and avoids polluting the detail page DOM with print-only markup and N recipe data fetches.

**Alternative considered**: Add a `print:block / screen:hidden` section to the detail page. Rejected — would require fetching full recipe data on every cookbook detail page load even when not printing.

**File naming**: TanStack Router `$param_.child.tsx` (underscore after param) creates a route that does NOT inherit the parent layout — same as `cookbooks.$cookbookId_.toc.tsx`. This gives the print route a clean full-page canvas without the site header.

### D2: Single tRPC procedure vs. fan-out useQueries

**Decision**: New `cookbooks.printById` tRPC procedure

**Rationale**: Fetches cookbook metadata + all full recipe documents in one MongoDB round-trip. `Recipe.find({ _id: { $in: recipeIds } })` with full `.populate()` chains is a single aggregated query. Fan-out with `useQueries` (N+1 calls) would be measurably slower for cookbooks with 5+ recipes and would show a progressive render rather than a clean single paint before printing.

**Procedure shape**:
```
cookbooks.printById(input: { id: ObjectId })
  → { id, name, description, isPublic, recipes: FullRecipe[] }

FullRecipe includes: id, name, ingredients, instructions, notes,
  prepTime, cookTime, servings, difficulty, calories, fat,
  cholesterol, sodium, protein, classificationName, sourceName,
  sourceUrl, meals[], courses[], preparations[], orderIndex
```

No `imageUrl` returned (not needed on print route).

### D3: Reuse RecipeDetail vs. new RecipePrintCard component

**Decision**: Reuse `RecipeDetail` with a `hideServingAdjuster` prop

**Rationale**: `RecipeDetail` already renders all the content sections needed (meta grid, ingredients with `recipe-ingredient-item`, instructions with `recipe-instruction-step`, nutrition, taxonomy, source). Duplicating it would create drift risk. The only interactive element to suppress is `ServingSizeAdjuster` — a single boolean prop is minimal coupling.

**Alternative considered**: New `RecipePrintCard` component. Rejected — pure duplication of `RecipeDetail`'s content structure with no behaviour difference.

### D4: Page break placement

**Decision**: Each recipe section gets class `cookbook-recipe-section` with `page-break-before: always`. All recipes including the first get the class — the first recipe's `break-before` is what separates it from the TOC. No `break-after` on the TOC section; adding both would fire two page breaks at the same boundary, inserting a blank page between TOC and recipe 1.

**CSS addition to `print.css`**:
```css
.cookbook-recipe-section {
  break-before: page;
  page-break-before: always;
}
```

### D5: Navigation from cookbook detail

**Decision**: Replace the "Print" `<button onClick={() => window.print()}>` on the cookbook detail page with `<Link to="/cookbooks/$cookbookId/print">`. The print route itself exposes a `window.print()` button.

**Rationale**: The old Print button printed the compact list, which is not useful. Users should be directed to the proper print view.

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| New tRPC `cookbooks.printById` | D2 |
| New `/cookbooks/$cookbookId/print` route | D1 |
| Update Print button on detail page | D5 |
| `print.css` page-break rules | D4 |
| Suppress `ServingSizeAdjuster` | D3 |
| Auth: public cookbooks readable by all | Follows existing `visibilityFilter` in tRPC; no new auth logic needed |

## Risks / Trade-offs

- **Dark-mode CSS leakage in print**: `RecipeDetail` uses Tailwind dark-mode utilities (`dark:bg-slate-800`, `dark:text-white`, etc.). The global `print.css` body/background override may not fully neutralise all inner elements. Mitigation: audit `RecipeDetail` render output in print preview; add targeted `@media print` overrides as needed.

- **Large cookbooks**: A 20-recipe cookbook triggers a single MongoDB query that populates all recipe documents with taxonomy/source. This is bounded and unlikely to be a performance concern, but should be validated against a seeded large dataset.

- **`break-before` browser support**: `break-before: page` is the modern property; `page-break-before: always` is the legacy alias. Both are included for coverage. All current browser targets support both.

## Rollback / Mitigation

- The print route is additive — it does not change any existing routes or data.
- The only modification to existing behaviour is replacing the Print button on the detail page with a Link. If reverted, restore `<button onClick={() => window.print()}>`.
- No database migrations involved.

## Open Questions

_(none)_

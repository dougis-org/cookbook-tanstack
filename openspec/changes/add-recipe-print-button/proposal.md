## Why

Recipe detail pages have no way to trigger printing — users must use browser menus. The cookbook standalone view already has a print button; recipe detail pages should have the same affordance. This resolves GitHub issue #221.

## What Changes

- **New**: `src/components/ui/PrintButton.tsx` — reusable print button component (calls `window.print()`, uses `Printer` icon, hides itself during printing via `print:hidden`)
- **Modified**: `src/routes/recipes/$recipeId.tsx` — pass a `<PrintButton />` + (conditional) Edit link together as the `actions` prop to `RecipeDetail`, so print is always available at the top of the card
- **Refactored**: `src/components/cookbooks/CookbookStandaloneLayout.tsx` — replace inline print button JSX with `<PrintButton />`

## Capabilities

### New Capabilities

- `recipe-print-button`: A reusable `PrintButton` UI component used on the recipe detail page and cookbook standalone pages to trigger `window.print()`

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **Files changed**: `src/components/ui/PrintButton.tsx` (new), `src/routes/recipes/$recipeId.tsx`, `src/components/cookbooks/CookbookStandaloneLayout.tsx`
- **No API changes**, no new dependencies (uses existing lucide-react `Printer` icon)
- **No print-specific CSS changes** — out of scope

## Problem Space

Users viewing a recipe at `/recipes/:recipeId` have no one-click way to print. The cookbook flow already solved this; the recipe detail flow did not. The fix is a trivial shared component with two call sites.

## Scope

**In scope:**
- `PrintButton` component creation
- Placing `PrintButton` on recipe detail page (top action row, same line as Edit)
- Refactoring `CookbookStandaloneLayout` to use `PrintButton`

**Out of scope:**
- Print-specific CSS/layout styling of recipe content
- Any other routes or views

## Risks

Low. `window.print()` is universally supported. The only risk is visual regression in the action bar layout — mitigated by keeping the button consistent with existing button styling.

## Open Questions

No unresolved ambiguity. Placement, component design, and scope were confirmed during exploration.

## Non-Goals

- Improving the print output styling/layout of recipe content
- Adding print buttons to recipe list, cookbook list, or other pages

---

_If scope changes after approval, proposal.md, design.md, specs/, and tasks.md must all be updated before apply proceeds._

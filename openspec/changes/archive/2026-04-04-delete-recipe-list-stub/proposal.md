## Why

`RecipeList.tsx` is a dead stub — it has zero callers and renders only a recipe name in a plain div instead of using `RecipeCard`. It creates a false impression that a reusable recipe list component exists when it doesn't, and is a trap for any future developer who imports it expecting real UI output.

## What Changes

- **Delete** `src/components/recipes/RecipeList.tsx`

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- none — this is a pure deletion with no behavioral or requirement changes -->

## Impact

- Removes `src/components/recipes/RecipeList.tsx`
- No callers to update (confirmed by codebase search — zero imports outside the file itself)
- No tests referencing `RecipeList` to remove
- No routing, API, or data layer changes

## Problem Space

The stub was likely scaffolded early in development before `RecipeCard` and the full recipe listing page (`src/routes/recipes/index.tsx`) were built. The actual recipe grid logic lives inline in the routes layer. There are no current or planned callsites for a generic `RecipeList` wrapper — the two other pages that render recipe grids (`categories.$categoryId.tsx`, `sources.$sourceId.tsx`) each do so in 5 lines of inline JSX, which is not worth abstracting.

## Scope

**In scope:**
- Deleting `src/components/recipes/RecipeList.tsx`

**Out of scope:**
- Extracting a shared recipe grid from categories/sources pages
- Any changes to `RecipeCard`, filter components, or route files

## Non-Goals

- Building a real `RecipeList` component (not warranted by current duplication level)
- Refactoring the recipes index page

## Risks

None. The file has no callers. TypeScript strict mode would catch any missed import at build time regardless.

## Open Questions

No unresolved ambiguity. The deletion is confirmed safe by codebase search.

---
*If scope changes after approval, proposal/design/specs/tasks must be updated before apply proceeds.*

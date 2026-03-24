## Why

The `conditional-recipe-image` change (archived 2026-03-18) suppressed blank image space in `RecipeCard` and `RecipeDetail`, but the same wasteful pattern persists in `CategoryCard`, `CookbookCard`, and inline thumbnails in the cookbook detail route. Every category card burns 160px on a hardcoded "No Image" block (categories never have images), and cookbook cards show an equal-height grey fallback even when no photo exists.

Additionally, the conditional image pattern is now repeated inline across four components with no shared abstraction. A single `CardImage` UI component will encapsulate the pattern and retrofit all affected components — including the already-fixed `RecipeCard` and `RecipeDetail`.

## What Changes

- **New `CardImage` component** (`src/components/ui/CardImage.tsx`): renders a container + `<img>` when `src` is truthy; returns nothing when absent. Accepts `src`, `alt`, and `className` (for height/shape variants).
- **`RecipeCard`** and **`RecipeDetail`**: refactor existing conditional image rendering to use `CardImage` (no behavioural change).
- **`CategoryCard`**: remove the `h-40` image block entirely — `Classification` has no `imageUrl` field, so images are structurally impossible here.
- **`CookbookCard`**: use `CardImage` for the header (conditional on `imageUrl`); when absent, render the `BookOpen` icon inline to the left of the cookbook title. Move the Private badge to the card body so it is always visible regardless of image state.
- **`cookbooks.$cookbookId.tsx` recipe row thumbnail**: use `CardImage` (or inline conditional) to collapse the `h-12 w-12` container when `imageUrl` is absent.
- **`cookbooks.$cookbookId.tsx` recipe picker thumbnail**: collapse the `h-10 w-10` container when `imageUrl` is absent.

## Capabilities

### New Capabilities

- `conditional-image-display`: A shared `CardImage` component and the app-wide rule that image containers render only when `imageUrl` is truthy, collapsing entirely when absent. Covers all card and thumbnail display contexts.

### Modified Capabilities

<!-- No existing spec-level requirements are changing — conditional-recipe-image behaviour is unchanged;
     it is superseded by the broader conditional-image-display spec. -->

## Impact

- **New file:** `src/components/ui/CardImage.tsx`
- **Components refactored:** `src/components/recipes/RecipeCard.tsx`, `src/components/recipes/RecipeDetail.tsx`, `src/components/categories/CategoryCard.tsx`, `src/components/cookbooks/CookbookCard.tsx`, `src/routes/cookbooks.$cookbookId.tsx`
- **Tests affected:** `RecipeCard`, `RecipeDetail`, and `CookbookCard` test files — update for changed DOM structure where needed
- **No API, routing, or database changes required**
- **No breaking changes to component interfaces**

## Non-Goals

- Adding `imageUrl` support to `Classification` / `CategoryCard`
- Image upload or management
- Lazy loading / image optimisation
- Fallback placeholder imagery beyond the existing `BookOpen` icon

## Open Questions

None — scope is fully defined based on the prior archived change and explicit UX decisions made during exploration.

## Why

Recipe cards and detail views reserve large fixed-height image areas even when no image exists, wasting 192px (card) and 384px (detail) of vertical screen space on placeholder text. With very few recipes currently having images, nearly every view wastes significant space.

## What Changes

- `RecipeCard`: Remove the unconditional `h-48` image container; render it only when `recipe.imageUrl` is present.
- `RecipeDetail`: Remove the unconditional `h-96` header image section; render it only when `recipe.imageUrl` is present.
- No fallback placeholder rendered when image is absent — the space collapses entirely.

## Capabilities

### New Capabilities

- `conditional-recipe-image`: Conditionally render image containers in recipe card and detail views based on the presence of `imageUrl`.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- **Components affected:** `src/components/recipes/RecipeCard.tsx`, `src/components/recipes/RecipeDetail.tsx`
- **Tests affected:** `src/components/recipes/__tests__/RecipeDetail.test.tsx` (existing tests may rely on image container being present; need to verify and update)
- **No API, routing, or database changes required**
- **No breaking changes to component interfaces** — `imageUrl` prop was already optional

## Open Questions

- Should images in edit/form mode (`RecipeForm`) also suppress the image preview area? (Out of scope for now — the form has different UX needs; image upload UI is its own capability.)

## Non-Goals

- Image upload or management
- Lazy loading / image optimization
- Fallback placeholder images (e.g., a camera icon)

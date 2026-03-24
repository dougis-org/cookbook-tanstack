## Context

The `conditional-recipe-image` change established the pattern: image containers render only when `imageUrl` is truthy, collapsing entirely when absent. Three further display surfaces were not included, and the pattern itself was never extracted into a shared component — it is repeated inline in each file.

This change introduces `CardImage`, a generic UI component that encapsulates the pattern, and applies it consistently across all image-rendering surfaces including a refactor of the already-fixed `RecipeCard` and `RecipeDetail`.

**Proposal mapping:**
- "New `CardImage` component" → Decision: Simple component, `src`/`alt`/`className` props, returns null when no src
- "CategoryCard — delete image block" → Decision: Hard delete (no field, no future conditionality)
- "CookbookCard — conditional header" → Decision: Use `CardImage` + inline icon fallback in title
- "Private badge → card body" → Decision: Badge moves to card body, always visible
- "Cookbook thumbnails — collapse when absent" → Decision: Use `CardImage` for both thumbnail sizes

## Goals / Non-Goals

**Goals:**
- Single `CardImage` component encapsulates all conditional image rendering
- No vertical space consumed by image areas when `imageUrl` is absent
- `RecipeCard` and `RecipeDetail` refactored to use `CardImage` (no behaviour change)
- `CookbookCard` degrades gracefully: `BookOpen` icon inline with title, Private badge in card body
- `CategoryCard` image block removed completely and permanently
- Cookbook row and picker thumbnails collapse when no image

**Non-Goals:**
- Adding `imageUrl` to `Classification` / `CategoryCard`
- Image upload, Cloudinary/S3 integration
- Lazy loading or image optimisation
- Fallback placeholder imagery beyond the existing `BookOpen` icon

## Decisions

### 1. `CardImage` — simple props, no children/overlay

**Decision:** `CardImage` accepts `src?: string | null`, `alt: string`, and `className?: string` (container classes). Returns `null` when `src` is falsy; renders `<div className={className}><img src={src} alt={alt} className="w-full h-full object-cover" /></div>` when truthy.

```tsx
// src/components/ui/CardImage.tsx
interface CardImageProps {
  src?: string | null
  alt: string
  className?: string
}

export default function CardImage({ src, alt, className = 'bg-gray-200 dark:bg-gray-700' }: CardImageProps) {
  if (!src) return null
  return (
    <div className={className}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}
```

**Rationale:** Children/overlay support (for the Private badge) would couple a generic UI component to domain-specific rendering concerns. The simpler solution is to move the Private badge to the card body — which is better UX anyway (badge is more visible in content than overlaid on a photo).

**Alternative considered:** `children` prop for overlays — rejected; adds complexity without benefit once the badge is relocated.

### 2. CategoryCard — hard delete the image block

**Decision:** Remove the `h-40` div and its "No Image" inner div entirely. No conditional, no icon, no empty state.

**Rationale:** `Classification` has no `imageUrl` field. The block is structurally impossible to populate. A hard delete is cleaner than a conditional that can never be true.

### 3. CookbookCard — `CardImage` header + inline icon + badge in body

**Decision:**
- Replace the `h-40` header block with `<CardImage src={cookbook.imageUrl} alt={cookbook.name} className="h-40 bg-gray-200 dark:bg-gray-700" />`.
- Add `BookOpen` icon inline left of the title, rendered only when `!cookbook.imageUrl`.
- Move the Private badge out of the image container and into the card body (e.g., alongside the recipe count line).

**After:**
```tsx
<CardImage src={cookbook.imageUrl} alt={cookbook.name} className="h-40 bg-gray-200 dark:bg-gray-700" />
<div className="p-4">
  <h3 className="flex items-center gap-2 ...">
    {!cookbook.imageUrl && <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />}
    {cookbook.name}
  </h3>
  ...
  <div className="flex items-center justify-between">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {cookbook.recipeCount ?? 0} recipes
    </p>
    {!cookbook.isPublic && (
      <span className="text-xs px-2 py-0.5 bg-slate-700 text-gray-300 rounded">Private</span>
    )}
  </div>
</div>
```

### 4. Cookbook thumbnails — `CardImage` with size classes

**Decision:** Replace both thumbnail patterns with `<CardImage>` using appropriate size classes.

```tsx
// Row thumbnail
<CardImage
  src={recipe.imageUrl}
  alt={recipe.name}
  className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0"
/>

// Picker thumbnail
<CardImage
  src={r.imageUrl}
  alt={r.name}
  className="h-10 w-10 bg-gray-600 rounded overflow-hidden flex-shrink-0"
/>
```

**Rationale:** Same component, different `className`. No fallback needed at small sizes.

### 5. RecipeCard and RecipeDetail — refactor to `CardImage`

**Decision:** Replace the existing `&&` conditional blocks with `<CardImage>`. Behaviour is identical; the refactor removes duplication and ensures future changes to the pattern (e.g., adding a loading skeleton) only require one edit.

```tsx
// RecipeCard
<CardImage src={recipe.imageUrl} alt={recipe.name} className="h-48 bg-gray-200 dark:bg-gray-700" />

// RecipeDetail
<CardImage src={recipe.imageUrl} alt={recipe.name} className="h-96 bg-gray-200 dark:bg-gray-700" />
```

## Risks / Trade-offs

- **`CookbookCard` Private badge relocation** → Badge moves from image overlay to card body. Tests asserting on badge position/context need updating. Visual change is minor and arguably an improvement.
- **`CookbookCard` layout shift** → Cards with images are taller than cards without. Tailwind grid `align-items: stretch` keeps the grid coherent.
- **RecipeCard / RecipeDetail refactor scope** → Touching already-working components carries regression risk. Mitigation: behaviour is identical; existing tests will catch any DOM change.

## Rollback / Mitigation

All changes are either hard deletes (CategoryCard) or behaviour-identical refactors. Reverting the files and deleting `CardImage` fully restores prior behaviour. No database, API, or type changes to roll back.

## Open Questions

None — all design decisions made during exploration with the requester.

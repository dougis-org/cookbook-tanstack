## Context

`RecipeCard` and `RecipeDetail` both unconditionally render a fixed-height image container (`h-48` / `h-96`). The current ternary only controls the *content* inside the container — showing `<img>` vs. a "No Image" placeholder text — but the outer `<div>` with its fixed height always takes up screen space.

With virtually no recipes currently having images, this wastes 192px per card and 384px at the top of every detail page.

**Proposal mapping:**
- Proposal: "RecipeCard — render image container only when imageUrl is present" → Decision: Conditional wrapper
- Proposal: "RecipeDetail — render image section only when imageUrl is present" → Decision: Conditional wrapper
- Proposal: "No fallback placeholder when absent" → Decision: Collapse to zero height (no empty state)

## Goals / Non-Goals

**Goals:**
- Image containers render only when `imageUrl` is truthy
- No vertical space consumed when image is absent
- Existing behaviour when `imageUrl` is present is unchanged
- Existing tests updated to reflect removed placeholder elements

**Non-Goals:**
- Image upload / storage
- Lazy loading or image optimisation
- Fallback placeholder imagery (camera icon, etc.)
- `RecipeForm` image preview area

## Decisions

### 1. Conditional rendering via ternary → conditional block

**Decision:** Replace the entire fixed-height `<div>` + inner ternary pattern with a single short-circuit (`&&`) render of the full image `<img>` element.

**Before (RecipeCard):**
```tsx
<div className="h-48 bg-gray-200 dark:bg-gray-700">
  {recipe.imageUrl ? (
    <img src={recipe.imageUrl} ... />
  ) : (
    <div>No Image</div>
  )}
</div>
```

**After:**
```tsx
{recipe.imageUrl && (
  <div className="h-48 bg-gray-200 dark:bg-gray-700">
    <img src={recipe.imageUrl} ... />
  </div>
)}
```

**Rationale:** Simplest possible change; no new state, hooks, or CSS tricks needed. The Tailwind height class stays on the container (correct when an image is present), and the container simply doesn't mount when there's no image.

**Alternative considered:** CSS `display: none` / `height: 0` via conditional class — rejected because it still mounts the DOM node and placeholder text, and is harder to test.

### 2. Scope: RecipeCard and RecipeDetail only

**Decision:** Change only the two display components. `RecipeForm` is out of scope because it has active image-input UX (preview area is intentional there).

## Risks / Trade-offs

- **Visual gap at top of RecipeDetail** → When no image, the recipe title now sits at the very top of the card with only `p-8` padding. This is the desired outcome but may surprise reviewers expecting a visual anchor. Mitigation: clearly document in tasks that this is intentional.
- **Test brittleness** → Existing tests may query for the placeholder div or count child elements. Mitigation: update tests as part of the same PR.

## Rollback / Mitigation

Change is purely additive-conditional: reverting the two component files fully restores prior behaviour. No database or API changes to roll back.

## Open Questions

None — scope is well-defined and isolated to two components.

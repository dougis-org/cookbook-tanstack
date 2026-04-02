## 1. Preparation

- [x] 1.1 Checkout the default branch and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create the working branch and push immediately to remote: `git checkout -b feature/cookbook-recipe-grid-layout && git push -u origin feature/cookbook-recipe-grid-layout`

## 2. Execution

- [x] 2.1 Create `src/components/cookbooks/CookbookRecipeCard.tsx` — exports `SortableRecipeCard` (owner: drag handle + remove button) and `StaticRecipeCard` (non-owner: read-only). Card anatomy: `CardImage` at `h-32`, index number (small muted, left of name), recipe name as `<Link>` to `/recipes/:recipeId`, metadata line (prepTime / cookTime / servings), `GripVertical` grip handle with `aria-label="Drag to reorder"` and `useSortable` wiring, and remove button (absolute top-right, `opacity-0 group-hover:opacity-100`, `aria-label="Remove <name>"`).
- [x] 2.2 In `src/routes/cookbooks.$cookbookId.tsx`, add `rectSortingStrategy` to the `@dnd-kit/sortable` import while keeping `verticalListSortingStrategy` for chapter sorting. Update all three recipe-grid `SortableContext` instances (with-chapters/owner, with-chapters/non-owner, flat/owner) to use `rectSortingStrategy`, and keep the chapter list `SortableContext` using `verticalListSortingStrategy`.
- [x] 2.3 Replace `SortableRecipeRow` usages with `SortableRecipeCard` and `StaticRecipeRow` usages with `StaticRecipeCard` throughout `cookbooks.$cookbookId.tsx`.
- [x] 2.4 Wrap each recipe list (per-chapter and flat) in a `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">` container. Place the `SortableContext` inside the grid `div` so card items are direct grid children.
- [x] 2.5 Update the `DragOverlay` in `cookbooks.$cookbookId.tsx` to render a `StaticRecipeCard` (index 0 placeholder) with `opacity-90 shadow-xl` styling for the active drag item.
- [x] 2.6 Update `EmptyChapterDropZone` rendering: ensure the drop zone renders as a full-width sibling *outside* the grid `div` (not inside it), preserving its full container span. No `col-span-full` needed since the grid isn't rendered when the chapter is empty.
- [x] 2.7 Delete the now-unused inline components `SortableRecipeRow`, `StaticRecipeRow`, and `RecipeRowContent` from `src/routes/cookbooks.$cookbookId.tsx`.

## 3. Validation

- [x] 3.1 Run TypeScript type-check: `npm run build` — zero type errors.
- [x] 3.2 Run full Vitest suite: `npm run test` — all tests pass.
- [x] 3.3 Update `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` — replace any assertions referencing row-specific markup with card equivalents (`aria-label="Drag to reorder"` is preserved on the grip button, so handle assertions survive; update image container selector from `h-12 w-12` to `h-32`).
- [x] 3.4 Verify specs: all scenarios in `openspec/changes/cookbook-recipe-grid-layout/specs/cookbook-recipe-grid/spec.md` have corresponding test coverage (grid breakpoints via Vitest or visual, DnD behaviour, owner vs non-owner rendering).
- [x] 3.5 Manual visual test — open `http://localhost:3000` in a browser with `npm run dev`:
  - Desktop (≥1024px): recipe cards render in 3 columns
  - Tablet (640–1023px): recipe cards render in 2 columns
  - Phone (<640px): recipe cards render in 1 column
  - Card shows image, index, name link, and metadata
  - Owner: grip handle visible left of name; remove button appears on hover (top-right)
  - Non-owner: no grip handle, no remove button
- [x] 3.6 Manual DnD test (owner session):
  - Drag within a chapter: cards reorder, `reorderRecipes` mutation fires
  - Drag between chapters: card moves to target chapter at correct position
  - Drag to empty chapter: full-width drop zone highlights on hover; recipe lands in that chapter
  - Drag on flat list (no chapters): cards reorder correctly
  - DragOverlay renders a card shape following the pointer

## 4. PR and Merge

- [x] 4.1 Commit all changes with a descriptive message and push to `feature/cookbook-recipe-grid-layout`.
- [x] 4.2 Open a PR from `feature/cookbook-recipe-grid-layout` → `main`. Reference issue #230 in the PR description. Enable auto-merge.
- [ ] 4.3 Monitor CI checks. If any check fails: diagnose, fix, commit, push, repeat until all checks are green.
- [ ] 4.4 Address any review comments: for each comment, make the fix, commit, push. Repeat until no unresolved comments remain.
- [ ] 4.5 Enable auto-merge once all CI checks are green and no blocking review comments remain. Do not force-merge.

## 5. Post-Merge

- [ ] 5.1 Checkout main and pull: `git checkout main && git pull --ff-only`.
- [ ] 5.2 Verify the merged changes appear on `main` (`git log --oneline -5`).
- [ ] 5.3 Sync the approved spec delta to the canonical specs location: copy `openspec/changes/cookbook-recipe-grid-layout/specs/cookbook-recipe-grid/spec.md` → `openspec/specs/cookbook-recipe-grid/spec.md`.
- [ ] 5.4 Archive the change directory in a **single atomic commit**: copy `openspec/changes/cookbook-recipe-grid-layout/` to `openspec/changes/archive/cookbook-recipe-grid-layout/`, delete `openspec/changes/cookbook-recipe-grid-layout/`, and include the new `openspec/specs/cookbook-recipe-grid/` in the same commit. Do not split into two commits.
- [ ] 5.5 Push the archive commit to `main`.
- [ ] 5.6 Prune the merged local branch: `git branch -d feature/cookbook-recipe-grid-layout`.

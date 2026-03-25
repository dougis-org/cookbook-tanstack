## 1. Branch Setup

- [x] 1.1 Check out `main` and pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b feat/cookbook-chapters`

## 2. Data Model

- [x] 2.1 Add `ICookbookChapter` interface and `chapters` array to `src/db/models/cookbook.ts`
- [x] 2.2 Add optional `chapterId` field to `ICookbookRecipeEntry` in `src/db/models/cookbook.ts`
- [x] 2.3 Add `chapters` index `{ userId: 1 }` is already present — verify no additional index needed

## 3. tRPC Router — queries

- [x] 3.1 Update `cookbooks.list` in `src/server/trpc/routers/cookbooks.ts` to include `chapterCount` in each summary item
- [x] 3.2 Update `cookbooks.byId` to return `chapters: [{ id, name, orderIndex }]` and include `chapterId?` on each recipe entry

## 4. tRPC Router — new chapter mutations

- [x] 4.1 Add `createChapter` mutation: creates "Chapter N", atomically migrates all unchaptered recipes when first chapter
- [x] 4.2 Add `renameChapter` mutation: owner-only, updates chapter name by `chapterId`
- [x] 4.3 Add `deleteChapter` mutation: owner-only; moves recipes to first remaining chapter or unchapters all if last chapter
- [x] 4.4 Add `reorderChapters` mutation: owner-only, accepts `chapterIds[]`, updates `orderIndex` values

## 5. tRPC Router — changed recipe mutations

- [x] 5.1 Update `addRecipe` to accept optional `chapterId`; validate `chapterId` is required and valid when chapters exist
- [x] 5.2 Update `reorderRecipes` input to `{ cookbookId, chapters: [{ chapterId, recipeIds }] }`; replace full `recipes` array atomically

## 6. tRPC Router — tests

- [x] 6.1 Add unit tests for `createChapter` (first chapter migration, subsequent, non-owner) in `src/server/trpc/routers/__tests__/cookbooks.test.ts`
- [x] 6.2 Add unit tests for `renameChapter` (success, non-owner)
- [x] 6.3 Add unit tests for `deleteChapter` (move to first, delete last chapter, non-owner)
- [x] 6.4 Add unit tests for `reorderChapters` (success, non-owner)
- [x] 6.5 Add unit tests for updated `addRecipe` (with chapterId, missing chapterId error, no-chapter path unchanged)
- [x] 6.6 Add unit tests for updated `reorderRecipes` (within-chapter, cross-chapter)
- [x] 6.7 Add unit tests for updated `list` (chapterCount) and `byId` (chapters array, chapterId on recipes)

## 7. CookbookCard component

- [x] 7.1 Update `src/components/cookbooks/CookbookCard.tsx` to accept and display `chapterCount`
- [x] 7.2 Show `"N recipes · M chapters"` when `chapterCount > 0`; otherwise show `"N recipes"` (existing)
- [x] 7.3 Update `CookbookCard` tests in `src/components/cookbooks/__tests__/CookbookCard.test.tsx`

## 8. Cookbook detail page — chapter UI (expanded mode)

- [x] 8.1 Update `src/routes/cookbooks.$cookbookId.tsx` types: add `Chapter` interface, extend `CookbookRecipe` with `chapterId?`
- [x] 8.2 Add `Modal` discriminant variants: `addChapter`, `renameChapter` (with `chapter` payload), `deleteChapter` (with `chapter` payload)
- [x] 8.3 Add `+ New Chapter` button to the detail header (owner only, next to `+ Add Recipe`)
- [x] 8.4 Update recipe count display to show chapter count when chapters exist
- [x] 8.5 Build `ChapterHeader` component: renders chapter name, pencil icon on hover (owner), delete icon on hover (owner)
- [x] 8.6 Build `RenameChapterModal` inline rename form (pencil icon → input + save/cancel)
- [x] 8.7 Build `ConfirmDeleteChapter` modal (reuse `ConfirmModal`, add warning copy about recipe reassignment)
- [x] 8.8 Wire `createChapter`, `renameChapter`, `deleteChapter` mutations with `queryClient.invalidateQueries`

## 9. Cookbook detail page — multi-container DnD (expanded mode)

- [x] 9.1 Replace single `SortableContext` with one `SortableContext` per chapter (keyed by `chapterId`)
- [x] 9.2 Add `DragOverlay` rendering the dragged recipe row at cursor position
- [x] 9.3 Rewrite `handleDragEnd` to detect within-chapter vs cross-chapter moves using `active/over` container IDs
- [x] 9.4 Update optimistic local state (`localOrder`) to be chapter-aware: `Map<chapterId, string[]>`
- [x] 9.5 Update `reorderMutation` call to use new `{ cookbookId, chapters: [...] }` shape

## 10. Cookbook detail page — collapsed (chapter-sort) mode

- [x] 10.1 Add `isCollapsed` state and chevron toggle button at top of recipe section (owner only, only when chapters exist)
- [x] 10.2 Build `SortableChapterRow` component: shows chapter name + recipe count, drag handle
- [x] 10.3 Wrap chapter rows in their own `SortableContext` when `isCollapsed` is true
- [x] 10.4 Wire `handleChapterDragEnd` → calls `reorderChapters` mutation

## 11. Add Recipe modal

- [x] 11.1 Add `chapters` prop to `AddRecipeModal`
- [x] 11.2 Render chapter picker `<select>` when `chapters.length > 0`; default to first chapter
- [x] 11.3 Pass selected `chapterId` to `addRecipe` mutation
- [x] 11.4 When no chapters, existing behavior unchanged (no `chapterId` sent)

## 12. TOC page

- [x] 12.1 Update `src/routes/cookbooks.$cookbookId_.toc.tsx` to receive `chapters` from `byId` response
- [x] 12.2 Group recipes by chapter, render chapter name as `<h2>` section header
- [x] 12.3 Number recipes globally across chapters (counter increments across chapter groups)
- [x] 12.4 When no chapters, render existing flat numbered list unchanged

## 13. Detail page tests

- [x] 13.1 Update `src/components/cookbooks/__tests__/CookbooksPage.test.tsx` for chapter count display
- [x] 13.2 Add unit tests for `ChapterHeader` (owner vs non-owner visibility of pencil/delete)
- [x] 13.3 Add unit tests for `RenameChapterModal` and `ConfirmDeleteChapter`
- [x] 13.4 Add unit tests for `AddRecipeModal` chapter picker (shown/hidden, selection passed to mutation)

## 14. E2E tests

- [x] 14.1 Add chapter creation and rename scenario to `src/e2e/cookbooks-auth.spec.ts`
- [x] 14.2 Add chapter deletion (last chapter → unchaptered) scenario
- [x] 14.3 Add cross-chapter recipe drag scenario
- [x] 14.4 Add chapter-sort (collapsed mode) drag scenario

## 15. Validation

- [x] 15.1 Run `npm run test` — all unit and integration tests pass
- [x] 15.2 Run `npm run test:e2e` — all E2E tests pass
- [x] 15.3 Run `npm run build` — no TypeScript errors
- [ ] 15.4 Manual smoke test: create cookbook → add recipes → create chapters → drag recipes across chapters → collapse and reorder chapters → delete chapter → verify recipes move to first chapter

## 16. PR and Merge

- [ ] 16.1 Commit all changes with a descriptive message referencing GH issue #209
- [ ] 16.2 Push branch and open PR: `gh pr create` with summary of changes
- [ ] 16.3 Enable auto-merge on the PR
- [ ] 16.4 Resolve any CI failures or review comments before merge

## 17. Post-Merge

- [ ] 17.1 Sync approved spec deltas to `openspec/specs/cookbook-auth-gating/spec.md` (merge ADDED requirements)
- [ ] 17.2 Create `openspec/specs/cookbook-chapters/spec.md` from the change spec
- [ ] 17.3 Run `/opsx:archive` to archive the change
- [ ] 17.4 Delete local feature branch: `git branch -d feat/cookbook-chapters`

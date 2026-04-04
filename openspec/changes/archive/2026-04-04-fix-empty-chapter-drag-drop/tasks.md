## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create feature branch `fix/empty-chapter-drag-drop` and push to remote (`git checkout -b fix/empty-chapter-drag-drop && git push -u origin fix/empty-chapter-drag-drop`)

## 2. Execution

- [x] 2.1 In `src/routes/cookbooks.$cookbookId.tsx`, add `pointerWithin` to the existing `@dnd-kit/core` import
- [x] 2.2 Define module-level `multiContainerCollision` function: run `pointerWithin` first; return its results if non-empty, otherwise fall back to `closestCenter`
- [x] 2.3 Swap `collisionDetection={closestCenter}` → `collisionDetection={multiContainerCollision}` on the chapter-aware (expanded mode) `DndContext` only (the one with `onDragStart` + `onDragEnd`, around line 525). Leave the flat-mode and collapsed-mode `DndContext` instances unchanged.
- [x] 2.4 Add e2e test to `src/e2e/cookbooks-auth.spec.ts`: set up a cookbook with one recipe, create two chapters (recipe migrates to Chapter 1, Chapter 2 starts empty), drag the recipe from Chapter 1 into the empty Chapter 2 drop zone, assert the recipe appears under Chapter 2 heading after the drag completes

## 3. Validation

- [x] 3.1 Run `npm run test` and confirm no regressions in unit/integration tests
- [x] 3.2 Run `npm run test:e2e` (or the targeted spec: `npx playwright test src/e2e/cookbooks-auth.spec.ts`) and confirm the new drag-to-empty-chapter test passes
- [ ] 3.3 Manual smoke test in the browser: drag a recipe to an empty chapter with 1 recipe in source (should already have worked — confirm still works), then with 2+ recipes in source (the previously broken case — confirm now works)

## 4. PR and Merge

- [x] 4.1 Commit all changes to `fix/empty-chapter-drag-drop` and push
- [x] 4.2 Open PR from `fix/empty-chapter-drag-drop` → `main`; reference GH issue #239 in the PR body; enable auto-merge
- [x] 4.3 Monitor CI checks; if any fail, diagnose, fix, commit, push, and repeat until all checks are green
- [x] 4.4 Address any review comments; commit fixes to the working branch and push; repeat until no unresolved comments remain
- [x] 4.5 Confirm auto-merge completes (or merge manually once all checks pass and comments are resolved)

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull (`git checkout main && git pull --ff-only`); verify merged changes appear
- [x] 5.2 Sync approved spec delta: copy `openspec/changes/fix-empty-chapter-drag-drop/specs/cookbook-chapters/spec.md` changes into `openspec/specs/cookbook-chapters/spec.md`
- [ ] 5.3 Archive the change directory: copy to `openspec/archive/` and delete from `openspec/changes/` in a single commit, then push to `main`
- [ ] 5.4 Delete local and remote feature branch (`git branch -d fix/empty-chapter-drag-drop && git push origin --delete fix/empty-chapter-drag-drop`)

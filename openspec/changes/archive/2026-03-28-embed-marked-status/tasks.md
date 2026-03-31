## 1. Execution

- [x] 1.1 Check out `main` branch and pull latest remote changes
- [x] 1.2 Create feature branch: `git checkout -b feat/embed-marked-status`

## 2. Types

- [x] 2.1 Add `marked: boolean` to the `Recipe` interface in `src/types/recipe.ts` (required, non-optional)

## 3. Tests — recipes.list marked field (red)

- [x] 3.1 Add test: anonymous caller — all items have `marked: false`
- [x] 3.2 Add test: authenticated caller with no likes — all items have `marked: false`
- [x] 3.3 Add test: authenticated caller liked recipe A not B — A has `marked: true`, B has `marked: false`
- [x] 3.4 Update existing `markedByMe: true` test that returns a liked recipe — assert `marked: true` on the returned item
- [x] 3.5 Update existing `markedByMe: true` test with no likes — assert result is empty (verify no regression)
- [x] 3.6 Confirm new/updated tests fail: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

## 4. Tests — recipes.byId marked field (red)

- [x] 4.1 Add test: anonymous caller — response has `marked: false`
- [x] 4.2 Add test: authenticated caller, not liked — `marked: false`
- [x] 4.3 Add test: authenticated caller, liked — `marked: true`
- [x] 4.4 Add test: authenticated caller, liked then toggled off via `toggleMarked` — `byId` response has `marked: false`
- [x] 4.5 Confirm new tests fail: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

## 5. Router — Dead Code Removal

- [x] 5.1 Remove the `{ marked: _marked, ...r }` destructure from the `recipes.list` items map (`src/server/trpc/routers/recipes.ts` ~line 150)
- [x] 5.2 Remove the `{ marked: _marked, ...d }` destructure from the `recipes.update` mutation (~line 276)

## 6. Router — recipes.list (green)

- [x] 6.1 Hoist `RecipeLike.find({ userId: ctx.user.id }).select('recipeId').lean()` to run for all `ctx.user` callers (not just `markedByMe`)
- [x] 6.2 Build `likedIds: Set<string>` from the query results using `.recipeId.toString()`
- [x] 6.3 Update the `markedByMe` filter to spread from `likedIds` Set: `filter._id = { $in: [...likedIds] }`
- [x] 6.4 In the items map, compute `marked: likedIds ? likedIds.has(r._id.toString()) : false`

## 7. Router — recipes.byId (green)

- [x] 7.1 After fetching the recipe, add: `const marked = ctx.user ? !!(await RecipeLike.exists({ userId: ctx.user.id, recipeId: input.id })) : false`
- [x] 7.2 Include `marked` in the returned object shape
- [x] 7.3 Confirm all tests pass: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

## 8. Refactor

- [x] 8.1 Review `recipes.list` for duplication or complexity introduced by the hoisting — simplify if the `likedIds` branching can be expressed more clearly
- [x] 8.2 Review the `byId` handler for any redundancy with `isMarked` (no code sharing needed now, but note in a comment if they share the same logic for future reference)
- [x] 8.3 Run tests again after any refactor changes: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

## 9. Validation

- [x] 9.1 Run full test suite: `npm run test`
- [x] 9.2 Run `npm run build` — no TypeScript errors
- [x] 9.3 Smoke-test locally: start dev server, verify list and detail pages show correct heart state for a logged-in user

## 10. PR and Merge

- [x] 10.1 Commit and push the feature branch
- [x] 10.2 Open PR targeting `main` with title: `feat(recipes): embed per-user marked status in list and byId responses (#220)`
- [x] 10.3 Enable auto-merge on the PR
- [x] 10.4 Resolve any CI failures or review comments before merge

## 11. Post-Merge

- [ ] 11.1 Archive this change: run `/opsx:archive embed-marked-status`
- [ ] 11.2 Sync the approved spec to `openspec/specs/recipe-marked-status/spec.md`
- [ ] 11.3 Delete the local feature branch after merge: `git branch -d feat/embed-marked-status`
- [ ] 11.4 Begin issue #222: open the issue, read it, create a new OpenSpec change for the heart/saved indicator UI work on recipe list cards — the `marked` field on list items is now available to drive it

## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create feature branch `feat/cookbook-recipe-search-infinite-scroll` and push to remote (`git checkout -b feat/cookbook-recipe-search-infinite-scroll && git push -u origin feat/cookbook-recipe-search-infinite-scroll`)

## 2. Backend — `recipes.list` cursor support

- [x] 2.1 Add `cursor: z.number().int().positive().optional()` to the input schema in `src/server/trpc/routers/recipes.ts`
- [x] 2.2 Update the page resolution logic to `const page = input?.cursor ?? input?.page ?? 1`
- [x] 2.3 Add `nextCursor` to the return value: `nextCursor: page * pageSize < total ? page + 1 : undefined`
- [x] 2.4 Write/update tests in `src/server/trpc/routers/__tests__/recipes.test.ts` for `cursor` param and `nextCursor` in response (TDD: write tests first)

## 3. `useScrollSentinel` hook

- [x] 3.1 Write failing unit tests in `src/hooks/__tests__/useScrollSentinel.test.ts` covering: fires callback when enabled + sentinel visible; does not fire when disabled; cleans up observer on unmount
- [x] 3.2 Create `src/hooks/useScrollSentinel.ts` implementing `IntersectionObserver`-based sentinel (make tests pass)

## 4. `useRecipeSearch` hook

- [x] 4.1 Write failing unit tests in `src/hooks/__tests__/useRecipeSearch.test.ts` covering: initial load, debounce (300 ms), page reset on new search term, page accumulation on `fetchNextPage`, `hasNextPage` false when exhausted
- [x] 4.2 Create `src/hooks/useRecipeSearch.ts` implementing debounced state + `trpc.recipes.list.infiniteQueryOptions` (make tests pass)
- [x] 4.3 Verify `inputValue` updates immediately and `searchTerm` updates after 300 ms in tests

## 5. `AddRecipeModal` update

- [x] 5.1 Update failing tests in `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` for new modal behavior: first-page load, search input debounce, load-more trigger, loading indicator visibility
- [x] 5.2 Replace `useQuery(trpc.recipes.list.queryOptions({}))` in `AddRecipeModal` with `useRecipeSearch()`
- [x] 5.3 Wire `value={inputValue}` and `onChange={(e) => onSearchChange(e.target.value)}` to the search input
- [x] 5.4 Add `useScrollSentinel` with `enabled={hasNextPage && !isFetchingNextPage}` calling `fetchNextPage`
- [x] 5.5 Append sentinel `<div ref={sentinelRef} />` after the recipe list items inside the scroll container
- [x] 5.6 Show a loading indicator (e.g., spinner or "Loading…" text) when `isFetchingNextPage` is true
- [x] 5.7 Keep existing `existingRecipeIds` client-side filter at the call site (not in the hook)

## 6. Validation

- [x] 6.1 Run `npm run test` — all unit and integration tests pass
- [x] 6.2 Run `npm run test:e2e` locally — all E2E tests pass (including cookbook modal search scenarios)
- [x] 6.3 Run `npx tsc --noEmit` — no TypeScript errors
- [x] 6.4 Manual smoke test: open Add Recipe modal with >20 recipes, scroll to bottom, verify more load; search for ingredient term, verify ingredient-match results appear

## 7. Self-Review

- [x] 7.1 Re-read `openspec/changes/cookbook-recipe-search-infinite-scroll/design.md` and verify implementation matches all decisions (D1–D4)
- [x] 7.2 Re-read `openspec/changes/cookbook-recipe-search-infinite-scroll/specs/recipe-infinite-search/spec.md` and verify every scenario has a corresponding test
- [x] 7.3 Check that `useRecipeSearch` contains no filtering/dedup logic (caller owns it)
- [x] 7.4 Check that `nextCursor` is `undefined` (not `null`) when no more pages exist
- [x] 7.5 Check that the 300 ms debounce constant matches `src/routes/recipes/index.tsx` exactly

## 8. PR and Merge

- [x] 8.1 Commit all changes to the feature branch with a descriptive commit message referencing GH issue #240
- [x] 8.2 Push the branch to remote
- [x] 8.3 Open a PR from `feat/cookbook-recipe-search-infinite-scroll` to `main` — enable auto-merge
- [x] 8.4 Monitor CI: if any check fails, diagnose, fix, commit, push, and repeat until all checks pass
- [x] 8.5 Address any review comments: fix, commit, push, repeat until no unresolved comments remain
- [x] 8.6 Enable auto-merge once all CI checks are green and no blocking review comments remain

## 9. Post-Merge

- [x] 9.1 Checkout `main` and pull (`git checkout main && git pull --ff-only`)
- [x] 9.2 Verify merged changes appear on `main`
- [x] 9.3 Sync approved spec delta to `openspec/specs/`: copy `openspec/changes/cookbook-recipe-search-infinite-scroll/specs/recipe-infinite-search/spec.md` → `openspec/specs/recipe-infinite-search/spec.md`
- [ ] 9.4 Archive the change (single atomic commit: copy change dir to `openspec/archive/` and delete original) — run `openspec archive cookbook-recipe-search-infinite-scroll`
- [ ] 9.5 Push the archive commit to `main`
- [ ] 9.6 Delete the local and remote feature branch

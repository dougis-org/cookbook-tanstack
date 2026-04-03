## Why

When adding a recipe to a cookbook, the search modal fetches only the first 20 recipes (the server default) and filters client-side — so any user with more than 20 recipes will never see recipes beyond that first page. This silently truncates the visible set and makes the search feel broken (GH issue #240). The fix also closes a secondary bug: the client-side filter only matched recipe names, while the server already supports searching ingredients too.

## What Changes

- `recipes.list` tRPC procedure gains a `cursor` field for infinite-query pagination and returns `nextCursor` in its response
- New reusable hook `useRecipeSearch` encapsulates debounced search + `useInfiniteQuery` against `recipes.list`
- New reusable hook `useScrollSentinel` wraps `IntersectionObserver` for infinite-scroll trigger
- `AddRecipeModal` in `cookbooks.$cookbookId.tsx` replaces its single-page `useQuery` call with `useRecipeSearch` and adds a scroll sentinel for load-more behaviour
- Search now delegates to the server (name + ingredients regex), matching the main recipes page behaviour
- Deduplication / exclusion of already-added recipes remains at the call site (not in the hook), so the hook stays generic and future duplicate-recipe-per-chapter support is not blocked

## Capabilities

### New Capabilities

- `recipe-infinite-search`: Reusable infinite-scroll recipe search — debounced server-side query, `useInfiniteQuery`-backed, scroll-sentinel triggered

### Modified Capabilities

- `cookbook-detail-owner-gating`: The Add Recipe modal within the cookbook detail page changes its data-fetching and UX behaviour (infinite scroll replaces single paginated fetch)

## Impact

- **`src/server/trpc/routers/recipes.ts`** — input schema and return shape of `recipes.list`
- **`src/hooks/useRecipeSearch.ts`** — new file
- **`src/hooks/useScrollSentinel.ts`** — new file
- **`src/routes/cookbooks.$cookbookId.tsx`** — `AddRecipeModal` component
- **Tests** — `recipes.test.ts`, new hook unit tests, `CookbookDetail.test.tsx`, E2E modal search spec
- No breaking changes to existing `recipes.list` callers; `page` param continues to work

## Scope

**In scope:**
- Fix the truncated recipe list in `AddRecipeModal`
- Server-side search (name + ingredients) with 300 ms debounce
- Infinite scroll with `IntersectionObserver` sentinel
- Reusable `useRecipeSearch` and `useScrollSentinel` hooks
- Test coverage for all new/changed code

**Out of scope:**
- Replacing pagination on the main `/recipes` page with infinite scroll
- Server-side exclusion of already-added recipe IDs
- Allowing duplicate recipes in cookbooks (future work, but design must not block it)
- Any other cookbook or recipe feature changes

## Risks

- `useInfiniteQuery` key includes `search` term — on each debounced keystroke the query resets to page 1, which is correct but means previously loaded pages are discarded. This is expected behaviour.
- If many recipes are already in the cookbook, early pages may render few or no available items, causing the sentinel to fire multiple times in quick succession. The `enabled` gate on `useScrollSentinel` (disabled while fetching) prevents duplicate requests but the list may feel slow to populate. Accepted as a known limitation; server-side exclusion can be added later if it becomes a problem.
- The `pageSize` max of 100 on `recipes.list` is not raised; modal uses `pageSize: 20`, so this is not a constraint here.

## Open Questions

No unresolved ambiguity remains. Key decisions confirmed during exploration:
- Filtering existing recipe IDs stays at the call site, not in the hook
- No deduplication logic added globally (future chapters feature may allow duplicates)
- Debounce delay: 300 ms, matching main recipes page
- Page size: 20, matching main recipes page default

## Non-Goals

- This change does not introduce infinite scroll anywhere other than `AddRecipeModal`
- This change does not alter the main recipe list page's pagination behaviour
- This change does not add server-side filtering by `excludeIds`

---

> **Change control:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before implementation proceeds.
>
> **Approval required:** This proposal must be reviewed and explicitly approved before design, specs, tasks, or apply proceed.

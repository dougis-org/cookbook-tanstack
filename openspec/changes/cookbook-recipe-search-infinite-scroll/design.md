## Context

The `AddRecipeModal` in `src/routes/cookbooks.$cookbookId.tsx` calls `trpc.recipes.list.queryOptions({})` with no pagination params. The server defaults to `pageSize: 20`, so only the first 20 recipes are ever returned. Client-side text filtering then operates on that truncated set — both hiding recipes beyond page 1 and limiting search to recipe names only (the server already supports name + ingredients regex search).

Current state:
- `recipes.list` accepts `page` + `pageSize` for offset pagination, max 100
- Main recipes page uses URL-based pagination with manual 300 ms debounce
- No `useInfiniteQuery` usage exists anywhere in the codebase
- `AddRecipeModal` is defined inline in the cookbook route file (~970 lines total)

## Goals / Non-Goals

**Goals:**
- Fix the truncated recipe list by replacing single-page fetch with server-driven infinite scroll
- Delegate search to the server (name + ingredients) with 300 ms debounce matching the main page
- Introduce a reusable `useRecipeSearch` hook and `useScrollSentinel` hook for future use
- Keep the hook generic — no exclusion/dedup logic, caller owns filtering
- Full test coverage: unit (hooks + router), component, E2E

**Non-Goals:**
- Replacing pagination on the main `/recipes` page
- Server-side `excludeIds` filtering
- Allowing duplicate recipes in cookbooks (unblocked but not implemented here)
- Extracting `AddRecipeModal` to its own file (acceptable future refactor)

## Decisions

### D1: Add `cursor` to `recipes.list` rather than a new procedure

**Decision:** Extend the existing `recipes.list` input schema with an optional `cursor: z.number().int().positive().optional()` field and return `nextCursor` alongside existing fields.

**Rationale:** tRPC v11's `infiniteQueryOptions` requires a `cursor` field in the procedure input. Adding it alongside the existing `page` field keeps backward compatibility — all current callers continue to pass `page` and are unaffected. A new procedure would duplicate the entire filter/sort/pagination logic for no benefit.

**Alternative considered:** A separate `recipes.listInfinite` procedure. Rejected — duplicates ~100 lines of query logic and creates two sources of truth.

**Procedure change:**
- Input: add `cursor: z.number().int().positive().optional()`
- Logic: `const page = input?.cursor ?? input?.page ?? 1`
- Response: add `nextCursor: currentPage * pageSize < total ? currentPage + 1 : undefined`

### D2: `useRecipeSearch` — debounced state + `useInfiniteQuery`

**Decision:** Create `src/hooks/useRecipeSearch.ts` that owns debounced search state and the `useInfiniteQuery` call.

**API:**
```ts
function useRecipeSearch(params?: {
  pageSize?: number
  sort?: RecipeSort
}): {
  inputValue: string
  onSearchChange: (value: string) => void
  recipes: RecipeListItem[]
  total: number
  hasNextPage: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
  isLoading: boolean
}
```

**Debounce:** Manual `useRef` + `setTimeout` at 300 ms — identical pattern to `src/routes/recipes/index.tsx`. When `inputValue` changes, a 300 ms timer fires and updates `searchTerm` (the value passed to the query). When `searchTerm` changes, `useInfiniteQuery`'s key changes and TanStack Query automatically resets to page 1 — no manual reset needed.

**Infinite query config:**
```ts
trpc.recipes.list.infiniteQueryOptions(
  { pageSize, sort, search: searchTerm || undefined },
  {
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
)
```

Flattened result: `data?.pages.flatMap(p => p.items) ?? []`

**Alternative considered:** Lifting debounce to the component. Rejected — keeps the hook self-contained and the component clean.

### D3: `useScrollSentinel` — generic IntersectionObserver hook

**Decision:** Create `src/hooks/useScrollSentinel.ts` as a thin wrapper around `IntersectionObserver`.

**API:**
```ts
function useScrollSentinel(
  onIntersect: () => void,
  enabled: boolean
): React.RefObject<HTMLDivElement>
```

When the returned ref's element enters the viewport and `enabled` is true, `onIntersect` is called. The `enabled` flag is set to `!isFetchingNextPage && hasNextPage` by the caller, preventing duplicate fetches while a page is in-flight.

**Why IntersectionObserver over scroll event:** No scroll math, fires reliably regardless of container size, built-in browser support, minimal setup.

### D4: `AddRecipeModal` wires both hooks

**Decision:** Update `AddRecipeModal` in-place (no file extraction). Wire `useRecipeSearch` for data + `useScrollSentinel` for load-more trigger. The existing `existingRecipeIds` client-side filter remains at the component level.

**List container:** The existing `<ul className="flex-1 overflow-y-auto ...">` is the scroll parent. A `<div ref={sentinelRef}>` is appended after the `<li>` items, inside the `<ul>` (or just after), to act as the intersection target. A subtle loading indicator (`isFetchingNextPage`) appears above the sentinel.

**Search input:** `value={inputValue}`, `onChange={(e) => onSearchChange(e.target.value)}` — identical shape to the main recipes page.

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| Fix truncated recipe list | D1: cursor-based infinite query on `recipes.list` |
| Server-side search (name + ingredients) | D1: `search` param passed to existing server regex logic |
| 300 ms debounce matching main page | D2: `useRecipeSearch` debounce implementation |
| Reusable hook, no dedup | D2: generic hook API, caller owns filtering |
| Infinite scroll trigger | D3: `useScrollSentinel` with IntersectionObserver |
| Modal wiring | D4: in-place update of `AddRecipeModal` |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Sentinel fires repeatedly if early pages yield few visible items (many already-added recipes) | `enabled` gate prevents duplicate in-flight requests; acceptable UX tradeoff, server-side exclusion can be added later |
| Search reset on debounce clears loaded pages | Expected behaviour — user started a new search |
| `recipes.list` input schema change could confuse future readers (two page fields) | `cursor` takes precedence, `page` is legacy; comment in code explains |
| `AddRecipeModal` file grows further | Acceptable; extraction to its own file is a future refactor |

## Rollback / Mitigation

All changes are additive or isolated:
- `recipes.list` `cursor` field is optional — removing it reverts to prior behaviour with no consumer impact
- `useRecipeSearch` and `useScrollSentinel` are new files — deletion has no side-effects
- `AddRecipeModal` change is self-contained within one function in one file — reverting the component is a clean git operation

If CI is blocked: fix the blocking check before merging. Do not bypass lint, type-check, or test gates.

## Open Questions

None. All decisions resolved during exploration and brainstorming.

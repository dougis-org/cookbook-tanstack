## ADDED Requirements

### Requirement: `recipes.list` supports cursor-based infinite pagination

The `recipes.list` tRPC procedure SHALL accept an optional `cursor` integer input field and SHALL include a `nextCursor` field in its response. When `cursor` is provided it SHALL take precedence over `page` as the effective page number.

#### Scenario: First page with no cursor

- **WHEN** `recipes.list` is called with no `cursor` and no `page`
- **THEN** it returns the first page of results
- **AND** `nextCursor` is set to `2` if more results exist
- **AND** `nextCursor` is `undefined` if all results fit on one page

#### Scenario: Subsequent page via cursor

- **WHEN** `recipes.list` is called with `cursor: 2`
- **THEN** it returns the second page of results
- **AND** `nextCursor` is `3` if more results exist beyond page 2
- **AND** `nextCursor` is `undefined` if page 2 is the last page

#### Scenario: Backward compatibility — `page` still works

- **WHEN** `recipes.list` is called with `page: 3` and no `cursor`
- **THEN** it returns page 3 as before
- **AND** existing callers are unaffected by the addition of `cursor`

---

### Requirement: `useRecipeSearch` hook — debounced server-side recipe search with infinite pagination

The `useRecipeSearch` hook SHALL encapsulate debounced search input state and `useInfiniteQuery` against `recipes.list`. It SHALL expose a flat array of all loaded recipe items, pagination state, and the ability to fetch the next page. It SHALL NOT perform any filtering, deduplication, or exclusion of recipes — callers own that logic.

#### Scenario: Initial load with no search term

- **WHEN** the hook mounts with no search term
- **THEN** `isLoading` is `true` until the first page resolves
- **AND** `recipes` contains the items from page 1 once loaded
- **AND** `total` reflects the server-reported total count

#### Scenario: Search term debounce

- **WHEN** `onSearchChange` is called with a new value
- **THEN** `inputValue` updates immediately (controlled input stays responsive)
- **AND** the server query is NOT re-issued until 300 ms after the last change
- **AND** once fired, the query resets to page 1 with the new `search` term

#### Scenario: Search includes ingredients

- **WHEN** a search term matches a recipe's ingredient list but not its name
- **THEN** that recipe appears in `recipes` after the debounce fires

#### Scenario: Load next page

- **WHEN** `fetchNextPage` is called and `hasNextPage` is `true`
- **THEN** the next page is fetched and its items are appended to `recipes`
- **AND** `isFetchingNextPage` is `true` during the fetch and `false` after

#### Scenario: No more pages

- **WHEN** all pages have been loaded
- **THEN** `hasNextPage` is `false`
- **AND** calling `fetchNextPage` has no effect

#### Scenario: Search term change resets pages

- **WHEN** a new debounced search term fires after prior pages were loaded
- **THEN** `recipes` resets to only the first page results for the new term
- **AND** previously loaded pages for the old term are discarded

---

### Requirement: `useScrollSentinel` hook — IntersectionObserver-based scroll trigger

The `useScrollSentinel` hook SHALL observe a sentinel DOM element and invoke a callback when that element enters the viewport. It SHALL accept an `enabled` flag to suppress firing when disabled (e.g., while a fetch is in-flight or no more pages exist).

#### Scenario: Sentinel enters viewport while enabled

- **WHEN** the sentinel element scrolls into the viewport
- **AND** `enabled` is `true`
- **THEN** the callback is invoked once

#### Scenario: Sentinel enters viewport while disabled

- **WHEN** the sentinel element enters the viewport
- **AND** `enabled` is `false`
- **THEN** the callback is NOT invoked

#### Scenario: Observer is cleaned up on unmount

- **WHEN** the component using `useScrollSentinel` unmounts
- **THEN** the `IntersectionObserver` is disconnected and no callbacks fire after unmount

---

### Requirement: `AddRecipeModal` uses infinite scroll with server-side search

The Add Recipe modal in the cookbook detail page SHALL use `useRecipeSearch` for data fetching and `useScrollSentinel` for load-more triggering. It SHALL delegate search to the server (name + ingredients). The existing filter excluding already-added recipe IDs SHALL remain at the component level.

#### Scenario: Modal opens and shows first page of recipes

- **WHEN** the owner opens the Add Recipe modal
- **THEN** the first page of their accessible recipes is displayed
- **AND** recipes already in the cookbook are excluded from the displayed list

#### Scenario: User types in the search box

- **WHEN** the user types in the search input
- **THEN** the input responds immediately (no lag)
- **AND** after 300 ms of inactivity, the server is queried with the typed term
- **AND** the list updates to show only matching recipes

#### Scenario: Ingredient search works in modal

- **WHEN** the user searches for a term that matches an ingredient but not a recipe name
- **THEN** the matching recipe appears in the modal's recipe list

#### Scenario: Scrolling to bottom loads more recipes

- **WHEN** the user scrolls to the bottom of the recipe list in the modal
- **AND** more recipes are available (`hasNextPage` is `true`)
- **THEN** the next page is fetched and appended to the list

#### Scenario: Loading indicator during next-page fetch

- **WHEN** the next page is being fetched (`isFetchingNextPage` is `true`)
- **THEN** a loading indicator is visible at the bottom of the list

#### Scenario: No loading indicator when all pages loaded

- **WHEN** `hasNextPage` is `false`
- **THEN** no loading indicator is shown at the bottom of the list

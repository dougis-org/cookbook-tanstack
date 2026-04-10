## GitHub Issues

- dougis-org/cookbook-tanstack#291

## Why

- Problem statement: The header search box requires pressing Enter to trigger filtering, while the recipe page's inline search auto-filters as you type. Users expect consistent, immediate feedback when searching.
- Why now: Issue #291 was filed requesting the header search match the recipe page search UX. The opportunity to consolidate to a single search input eliminates redundancy and simplifies the codebase.
- Business/user impact: Faster, more discoverable search experience across all pages. Mobile users currently have no search access from the header at all.

## Problem Space

- Current behavior: Header has a form with `onSubmit` — requires Enter key press to navigate to `/recipes?search=...`. On mobile (`< md`), the header search is hidden entirely. The recipe page has its own independent search input with debouncing and URL sync.
- Desired behavior: A single global search input in the header that auto-filters on keypress (300ms debounce). On desktop: always visible. On mobile: magnifying glass icon that expands to a full-width overlay bar. Active search shows a cyan dot on the search icon (mobile) or the search string in the input (desktop).
- Constraints: TanStack Router's `useSearch` is route-scoped and cannot be called from `Header.tsx` (a shared component). URL sync requires reading from `useRouterState`.
- Assumptions: All recipe search flows navigate to or update `/recipes?search=...`. No other page uses the `search` URL param in a conflicting way.
- Edge cases considered:
  - User navigates to `/recipes?search=foo` via external link — header input should populate with "foo"
  - User clears the search input — URL search param is removed, not set to empty string
  - User presses Escape while overlay is open — overlay closes, search is cleared
  - User is not on `/recipes` when searching — navigation to `/recipes` occurs with the search param

## Scope

### In Scope

- Refactor `Header.tsx` to own all recipe search UI and logic
- Mobile: search icon with cyan dot indicator → full-width overlay on tap
- Desktop: always-visible input (remove `hidden md:flex`), cyan dot on search icon when active
- Debounced (300ms) `onChange` navigation to `/recipes?search=...`
- Sync header input from current URL `?search=` param via `useRouterState`
- Remove the search input block from `src/routes/recipes/index.tsx`
- Remove related dead code from the recipe page: `searchInputRef`, `searchValue` state, sync `useEffect`, `debouncedSearch`, `debounceRef`, the `/` keyboard shortcut
- Update E2E tests in `src/e2e/recipes-list.spec.ts` to target the header search input

### Out of Scope

- Search on any page other than `/recipes`
- Persistent search history or autocomplete/suggestions
- Mobile sidebar search field (the overlay approach replaces this need)
- Any backend changes

## What Changes

- `src/components/Header.tsx` — complete rework of search UI and logic
- `src/routes/recipes/index.tsx` — remove search input and all associated state/logic
- `src/e2e/recipes-list.spec.ts` — update test selectors from `data-testid="recipe-search-input"` to target header input

## Risks

- Risk: `useRouterState` reads raw location search string; parsing `?search=` incorrectly could cause header input to show wrong value or fail silently.
  - Impact: Medium — header appears out of sync with active filter
  - Mitigation: Use a shared Zod schema or simple URLSearchParams parse; covered by E2E test asserting header value matches URL

- Risk: Removing the recipe page search input breaks the `/` keyboard shortcut (currently focuses page input).
  - Impact: Low — power-user feature, not prominent
  - Mitigation: Move the shortcut to focus the header input, or remove it (decided: remove, can be re-added later)

- Risk: Mobile overlay animation may conflict with other header z-index or scroll behaviors.
  - Impact: Low — cosmetic
  - Mitigation: Use `z-50` (already used by the sidebar) and test on small viewport

## Open Questions

No unresolved ambiguity remains. All design decisions were confirmed during explore session:
- Style B overlay confirmed for mobile
- Cyan dot active indicator confirmed
- Desktop always-visible confirmed (no breakpoint hiding)
- Recipe page search removal confirmed

## Non-Goals

- Autocomplete or search suggestions
- Searching content other than recipes
- Persisting search history across sessions

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

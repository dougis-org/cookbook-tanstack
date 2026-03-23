## Why

The `/cookbooks/:cookbookId` and `/cookbooks/:cookbookId/toc` views are not rendering as distinct pages in the current implementation, because the parent route `/cookbooks` does not contain an outlet for nested route children. The same anti-pattern is present in `/categories` → `/categories/:categoryId`.

This causes navigation to cookbooks and categories subpages to update the URL without reliably switching the visible view, which breaks expected routing behavior.

## What Changes

- Update `src/routes/cookbooks.tsx` to include `<Outlet />` (or equivalent) so nested cookbook routes can render in context.
- Update `src/routes/categories.tsx` similarly to support `/categories/:categoryId` as a child route.
- Add route audit logic (or quick docs/comments) to catch any future parent route lacking an outlet for nested child routes.
- Add end-to-end tests to cover:
  - `/cookbooks` list → click cookbook card → `/cookbooks/:cookbookId` detail page
  - `/cookbooks/:cookbookId` → click Table of Contents → `/cookbooks/:cookbookId/toc`
  - `/categories` list → click category card → `/categories/:categoryId` detail page

## Capabilities

### New Capabilities

- `ui-route-nested-outlet`: Nested route layout components can render child routes.
- `cookbooks-route-hydration`: `/cookbooks` becomes a layout route for its children.

### Modified Capabilities

- `src/routes/cookbooks.tsx`
- `src/routes/categories.tsx`
- `src/routes/cookbooks.$cookbookId.tsx`
- `src/routes/cookbooks.$cookbookId.toc.tsx`
- `src/routes/categories.$categoryId.tsx`

## Impact

- **User-visible:** Cookbooks and categories route links now navigate to the expected, distinct detail and toc pages.
- **Developer-visible:** Route tree behavior becomes aligned with TanStack Router nesting expectations.
- **Tests:** new E2E coverage for cookbook/category route transitions.

## Scope

**In scope:**
- Routing bug fix for cookbook/category nested routes in the frontend UI.
- Tests for navigation and view update behavior.

**Out of scope:**
- Backend API changes.
- Recipe single-page sibling routes (`/recipes` and `/recipes/:recipeId`) since they are sibling-root routes.

## Risks

- Adding `<Outlet />` changes layout semantics and may require prop/function harmonization in the existing `CookbooksPage`/`CategoriesPage` components if the current page is expected to be full-screen only.
- Existing styling may cause list UI and child UI to combine unexpectedly if not scoped properly.

## Non-Goals

- Refactoring to non-file routes or restructuring route namespaces.
- Adding global routing framework changes beyond this nested outlet pattern.

## Decisions

- Refactor `/cookbooks` into a parent layout route + child index route (list view) with child routes (`/$cookbookId`, `/$cookbookId/toc`).
- Apply the same parent-layout-route refactor to `/categories` (e.g., `/categories` parent + `/$categoryId` child).
- Add a dedicated lint rule to catch any `createFileRoute` parent route that has child routes but does not render `<Outlet />`.

## Open Questions

- We should validate both sibling and parent/child routes in the lint rule to catch regressions in deeply nested or peer route layouts. Should sibling-only route nodes also require layout/outlet enforcement as a stricter guard?

## Goal

Fix route nesting in the CookBook UI so that child routes render correctly under parent routes for cookbooks and categories.

## Acceptance Criteria

1. Given `/cookbooks`, the cookbooks list is displayed.
2. Given the user clicks a cookbook card, the URL changes to `/cookbooks/:cookbookId` and cookbook detail content appears.
3. Given the user clicks "Table of Contents" in cookbook detail, the URL changes to `/cookbooks/:cookbookId/toc` and TOC content appears.
4. Given `/categories`, the categories list is displayed.
5. Given the user clicks a category card, the URL changes to `/categories/:categoryId` and category detail content appears.
6. Browser back/forward navigation properly switches between route views when moving between list/detail/TOC.
7. E2E tests cover both cookbooks and categories parent/child route transitions.

## Non-Functional Requirements

- Route components should follow TanStack Router nesting semantics by using outlet-capable parent layout routes.
- The linter rule must prevent parent routes with children from missing an outlet (covers parent/child and sibling route setups).
## GitHub Issues

- #505

## Why

- **Problem statement**: Personal source attributions (like `personalSourceName: "Mom's Cookbook"`) are private to the recipe's owner, but currently the server returns the field to other users and anonymous guests as `null` or raw strings instead of omitting the field entirely.
- **Why now**: Client-side filtering is insufficient as the field is visible via network inspections. Server-side stripping is the only acceptable privacy boundary.
- **Business/user impact**: Fixes a potential data privacy leak for recipe owners who wish to keep their custom personal sources private from other viewers when the recipe itself is public.

## Problem Space

- **Current behavior**: The endpoints in `recipesRouter` (`list`, `byId`, etc.) and `cookbooksRouter` return `personalSourceName` as `null` or the string name to all users.
- **Desired behavior**: The `personalSourceName` field is completely stripped/deleted from the response objects for any user who is not the owner (and always for unauthenticated guests).
- **Constraints**: Must be enforced server-side. Must work correctly for paginated arrays, single objects, and nested arrays (e.g. recipes inside cookbooks).
- **Assumptions**: 
  - Frontend components degrade gracefully (e.g., using `recipe.personalSourceName ?? null` or checking for undefined) so that removing the key entirely does not cause JavaScript errors.
  - The recipe creator/owner is always the user whose `userId` matches the recipe's `userId`.
- **Edge cases considered**:
  - Anonymous users (unauthenticated `ctx.user === null`).
  - Owner viewing their own public/private recipes (should still see `personalSourceName`).
  - Mixed lists (e.g. a public feed containing recipes owned by the viewer and recipes owned by others — each row must be evaluated individually).

## Scope

### In Scope

- Creation of a centralized recursive helper function (`stripPersonalSourceName`) to omit `personalSourceName` from objects, arrays, and paginated lists.
- A tRPC middleware applied to `recipesRouter` endpoints that automatically strips the field for non-owners.
- Type definitions update (`Recipe` interface in `src/types/recipe.ts`) making `personalSourceName` optional.
- Unit and integration tests verifying that `personalSourceName` is absent (i.e. `toBeUndefined()`) for non-owners.

### Out of Scope

- Removing or altering the db storage of `personalSourceName`.
- Modifying recipes creation or updates logic (the field is still saved/updated correctly).
- Modifying UI components for displaying personal sources (this is blocked/handled by other issues like Issue H).

## What Changes

- [src/server/trpc/routers/_helpers.ts](file:///home/doug/dev/cookbook-tanstack/src/server/trpc/routers/_helpers.ts): Add recursive helper `stripPersonalSourceName`.
- [src/server/trpc/routers/recipes.ts](file:///home/doug/dev/cookbook-tanstack/src/server/trpc/routers/recipes.ts): Add output middleware and wrap recipe procedures.
- [src/types/recipe.ts](file:///home/doug/dev/cookbook-tanstack/src/types/recipe.ts): Make `personalSourceName` optional in TypeScript interfaces.
- [src/server/trpc/routers/__tests__/recipes.test.ts](file:///home/doug/dev/cookbook-tanstack/src/server/trpc/routers/__tests__/recipes.test.ts): Add integration tests validating the field is absent for non-owners.

## Risks

- **Risk**: Frontend code crashes when the `personalSourceName` field is absent in JSON responses.
  - **Impact**: Broken pages or index views.
  - **Mitigation**: We audited the client codebase and verified that the only location using `personalSourceName` is [cookbooks.$cookbookId_.print.tsx](file:///home/doug/dev/cookbook-tanstack/src/routes/cookbooks.$cookbookId_.print.tsx), which uses `recipe.personalSourceName ?? null` and handles `undefined` safely. We will also update the TypeScript interface to enforce type checking.

## Open Questions

- No unresolved ambiguity exists.

## Non-Goals

- Hiding or filtering other recipe fields (like names, ingredients, classification).
- Modifying the frontend design.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

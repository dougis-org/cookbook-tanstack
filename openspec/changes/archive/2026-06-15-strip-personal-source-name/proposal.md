## GitHub Issues

- #505

## Why

- Problem statement: `personalSourceName` contains private attribution info that should only be visible to the recipe's owner. Currently, the tRPC routers leak the property as `null` or a value to non-owners, which is a privacy boundary issue.
- Why now: Part of the Personal source initiative. Server-side stripping is the only acceptable privacy boundary to prevent network leaks prior to UI wiring.
- Business/user impact: Guarantees user privacy for recipe sources.

## Problem Space

- Current behavior: `recipes.list` and `recipes.byId` return `personalSourceName` as `string | null` for all viewers (set to `null` if not the owner), leaking the key's presence. Nested recipes in `cookbooks` list and detail endpoints also expose the key.
- Desired behavior: `personalSourceName` is completely deleted/absent (not just `null` or empty) from the serialized JSON response for any endpoint returning recipes if the viewer is not the owner. Unauthenticated viewers are treated as non-owners.
- Constraints: Must centralize in one helper so future endpoints cannot accidentally leak it. Must strip per-row in list responses.
- Assumptions: Viewer ID is safely obtained via `ctx.user?.id`.
- Edge cases considered:
  - Mixed owner and non-owner rows in listing endpoints.
  - Anonymous (unauthenticated) users viewing public personal recipes.
  - Owners must still see their own `personalSourceName` (falling back to `null` if not set).

## Scope

### In Scope

- Creating a centralized `sanitizeRecipePersonalSource` helper in `src/server/trpc/routers/_helpers.ts`.
- Applying the helper in `recipesRouter` (`list`, `byId`, `create`, `update`).
- Applying the helper in `cookbooksRouter` for embedded recipe listings.
- Updating `src/types/recipe.ts` to mark `personalSourceName` as optional.
- Adding comprehensive unit tests covering owner, different authed user, and anonymous user views.

### Out of Scope

- Frontend UI changes displaying `personalSourceName`.
- Modifying how `personalSourceName` is validated or saved.

## What Changes

- `src/server/trpc/routers/_helpers.ts` (centralized sanitization helper)
- `src/server/trpc/routers/recipes.ts` (resolving queries/mutations to run sanitization)
- `src/server/trpc/routers/cookbooks.ts` (resolving recipes inside cookbooks)
- `src/types/recipe.ts` (optional type signature)
- `src/server/trpc/routers/__tests__/recipes.test.ts` (unit tests)

## Risks

- Risk: Mutation of shared references if returned objects are not fresh.
  - Impact: Side effects in server caches or queries.
  - Mitigation: All routers return mapped plain objects from `.lean()` or `.toObject()`, so they are safe to modify.

## Open Questions

- None - The required behavior has been confirmed during the exploration phase.

## Non-Goals

- Refactoring general recipe query structures or Mongoose population logic.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

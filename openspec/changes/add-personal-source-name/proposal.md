## GitHub Issues

- #503

## Why

- Problem statement: We need a way to store per-recipe private attribution (e.g., "Aunt Mary") that pairs with the seeded Personal source.
- Why now: This is foundational database work that unblocks downstream tRPC read stripping (Issue E) and write normalization (Issue D).
- Business/user impact: Allows users to add private attribution to recipes, enhancing the experience without compromising privacy.

## Problem Space

- Current behavior: No dedicated field exists for personal, private attribution on recipes.
- Desired behavior: Recipes can optionally save a `personalSourceName` string (max 80 chars).
- Constraints: The field is optional, requires no new database index, and empty strings should be treated as undefined/"no name".
- Assumptions: The UI will later pass this field when the selected source is "Personal". Only the recipe owner will be permitted to read it (enforced in a later issue).
- Edge cases considered: Strings > 80 characters (rejected by validation), empty strings (normalized to undefined).

## Scope

### In Scope

- Adding `personalSourceName?: string` to `IRecipe` and `recipeSchema` in Mongoose.
- Enforcing `maxlength: 80` in the database schema.
- Updating shared types (e.g., `src/types/recipe.ts`).
- Updating Zod validation schemas (`src/server/trpc/routers/recipes.ts`, `src/lib/validation.ts`).
- Adding unit tests for the schema validation in `src/db/models/__tests__/recipe.test.ts`.

### Out of Scope

- Enforcing read-stripping for non-owners (this is Issue E).
- Enforcing write normalization for this field (this is Issue D).
- Updating the frontend UI to display or edit this field.

## What Changes

- Mongoose `Recipe` schema gains `personalSourceName`.
- TypeScript definitions for `Recipe` and Zod validation schemas are updated to accept the new optional field.
- Model tests added to verify validation rules.

## Risks

- Risk: Accidental exposure of the private field to non-owners before Issue E is implemented.
  - Impact: Low/Medium (since UI doesn't expose it yet, but API might return it).
  - Mitigation: The current scope is purely foundational, but we should prioritize Issue E immediately after to fully enforce privacy.

## Open Questions

- Question: Does the `personalSourceName` need to be explicitly stripped in this step from public API responses, or is it strictly left for Issue E?
  - Needed from: Requester
  - Blocker for apply: no

## Non-Goals

- Creating new API endpoints.
- Building the UI components for the new field.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

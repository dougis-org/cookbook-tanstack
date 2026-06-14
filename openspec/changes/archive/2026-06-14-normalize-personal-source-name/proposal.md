## GitHub Issues

- #504

## Why

- Problem statement: When a user switches a recipe's source away from "Personal", the `personalSourceName` field can be left as a stale value in the database if the UI does not clear it. We need a backend enforcement point to automatically normalize this field.
- Why now: This enforces data integrity for the "Personal source initiative" before the UI is fully wired up.
- Business/user impact: Prevents dirty data where non-personal recipes hold a personal source name, reducing bugs and data migration needs later.

## Problem Space

- Current behavior: The `create` and `update` endpoints accept `personalSourceName` blindly without validating it against the `sourceId`.
- Desired behavior: If the `sourceId` doesn't match the Personal Source ID, the `personalSourceName` is scrubbed.
- Constraints: The Personal source ID must be retrieved dynamically via `Source.findOne({ slug: "personal" })`.
- Assumptions: The client sends `sourceId` in both create and update operations when `personalSourceName` is provided (currently true since the frontend rebuilds the entire payload for updates).
- Edge cases considered: If `sourceId` is explicitly changed away from Personal in an update, we must clear `personalSourceName` by explicitly setting it to `null` in the database.

## Scope

### In Scope

- Updating `recipeFields` schema to `trim()` the `personalSourceName`.
- Normalizing `personalSourceName` to `undefined`/`null` in `create` tRPC endpoint if `sourceId` != Personal Source ID.
- Normalizing `personalSourceName` in `update` tRPC endpoint.
- Adding resolver unit tests.

### Out of Scope

- UI changes to `RecipeForm` (handled in a separate issue).
- Creating the "Personal" source (handled in #502).

## What Changes

- `recipeFields` schema gets `.trim()`.
- `recipes.create` mutation logic adds a normalization rule.
- `recipes.update` mutation logic adds a normalization rule to clear the field if needed.
- `recipes.test.ts` gets tests for these scenarios.

## Risks

- Risk: The Personal source is missing from the database.
  - Impact: Normalization might clear `personalSourceName` unexpectedly if the lookup fails.
  - Mitigation: Safely handle `null` if the Personal source isn't found. Since #502 handles seeding, we can assume it will normally exist.

## Open Questions

- None - The required behavior has been confirmed during the exploration phase.

## Non-Goals

- Refactoring the entire `recipes.ts` update logic.
- Implementing memoization/caching for `Source.findOne` (we confirmed we will fetch per request to avoid test flakes and complexity).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

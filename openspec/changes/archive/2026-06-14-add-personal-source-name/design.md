## Context

- Relevant architecture: Mongoose Database Model (`Recipe`), Shared TypeScript interfaces (`src/types/recipe.ts`), tRPC backend validation logic (`src/server/trpc/routers/recipes.ts`), and import validation logic (`src/lib/validation.ts`).
- Dependencies: Mongoose, Zod.
- Interfaces/contracts touched: `IRecipe`, `Recipe` (frontend type), `recipeFields` (Zod), `importedRecipeSchema` (Zod).

## Goals / Non-Goals

### Goals

- Add the `personalSourceName` field to the recipe model up and down the stack to allow saving and retrieving this field.
- Ensure strict database and runtime validation (max length 80).

### Non-Goals

- Implementation of the frontend UI to capture or display this field.
- Stripping of this field from public API requests (handled in Issue E).
- Strict write normalization (handled in Issue D).

## Decisions

### Decision 1: Field schema type and validation

- Chosen: `personalSourceName: { type: String, maxlength: 80 }` in Mongoose, and `z.string().max(80).optional()` in Zod.
- Alternatives considered: Using a subdocument or making it an ObjectId referencing another collection.
- Rationale: The attribution is a simple text string attached to the user's specific recipe, not a global taxonomy.
- Trade-offs: Increases the size of the recipe document slightly, but avoids join complexity.

### Decision 2: Handling empty states

- Chosen: Omit empty string checks beyond `maxlength: 80` in the database, allowing empty strings or undefined to represent "no name" per acceptance criteria.
- Alternatives considered: Normalizing empty strings to `null` or `undefined` via Mongoose middleware.
- Rationale: The acceptance criteria states "Empty string and undefined both treated as 'no name'". Mongoose handles absent fields as undefined naturally.
- Trade-offs: Minor inconsistency if both empty string and undefined exist in the database, but it satisfies the requirement without complex middleware.

## Proposal to Design Mapping

- Proposal element: Add `personalSourceName` (max 80 chars) to Mongoose model.
  - Design decision: Decision 1: Field schema type and validation.
  - Validation approach: Add unit test in `src/db/models/__tests__/recipe.test.ts` to assert a string with 81 characters fails validation.

- Proposal element: Empty string and undefined treated as "no name".
  - Design decision: Decision 2: Handling empty states.
  - Validation approach: Add unit test in `src/db/models/__tests__/recipe.test.ts` to assert that creating a recipe without the field or with an empty string saves without error and round-trips correctly.

## Functional Requirements Mapping

- Requirement: The recipe model must support an optional `personalSourceName` string.
  - Design element: `IRecipe` and Mongoose schema updates.
  - Acceptance criteria reference: "Field saves and round-trips."
  - Testability notes: Can be verified using standard Vitest tests for the Recipe model.

- Requirement: The personal source name must not exceed 80 characters.
  - Design element: Mongoose `maxlength: 80` and Zod `.max(80)`.
  - Acceptance criteria reference: "Length validation rejects strings > 80 chars."
  - Testability notes: Verify that saving an 81-character string throws a `ValidationError`.

## Non-Functional Requirements Mapping

- Requirement category: Security/Privacy
  - Requirement: The personal source name should only be visible to the recipe owner (deferred to Issue E).
  - Design element: N/A for this specific issue, as it is foundational.
  - Acceptance criteria reference: N/A (deferred).
  - Testability notes: N/A.

- Requirement category: Performance
  - Requirement: Adding the field should not slow down queries.
  - Design element: No new database index is added.
  - Acceptance criteria reference: "Optional. No index needed."
  - Testability notes: Ensure no `index: true` is added to the Mongoose field definition.

## Risks / Trade-offs

- Risk/trade-off: Allowing empty strings vs strict `undefined` normalization.
  - Impact: Low impact on query performance or frontend rendering, but could cause minor inconsistencies if the UI expects strict `null` vs `undefined` vs `""`.
  - Mitigation: Ensure the frontend safely handles falsy values when it is implemented.

## Rollback / Mitigation

- Rollback trigger: Production errors when saving or retrieving recipes due to schema validation failures.
- Rollback steps: Revert the PR that introduces the schema changes.
- Data migration considerations: Because the field is optional, reverting the schema simply means Mongoose will ignore the field if it exists in the database. No downward migration script is strictly necessary.
- Verification after rollback: Run standard E2E test suite to ensure recipe creation and retrieval works without the field.

## Operational Blocking Policy

- If CI checks fail: Fix type errors or test failures directly; do not merge.
- If security checks fail: Unlikely for this change, but block merge and resolve.
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: Raise to engineering lead if blocked for >2 days.

## Open Questions

- None.

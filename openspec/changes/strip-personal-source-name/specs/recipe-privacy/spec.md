## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Recipe Personal Source Name Privacy Boundaries

The system SHALL strip the `personalSourceName` field from all recipe-returning API response objects for any user who is not the authenticated owner of the recipe, and always for unauthenticated/anonymous guests.

#### Scenario: Owner views own recipe
- **Given** an authenticated user "Alice" who owns a recipe with `personalSourceName` set to "Mom's Recipes"
- **When** Alice requests the recipe details via `recipes.byId`
- **Then** the response includes `personalSourceName` matching "Mom's Recipes"

#### Scenario: Non-owner authenticated user views public recipe
- **Given** an authenticated user "Bob" and a public recipe owned by "Alice" with `personalSourceName` set to "Mom's Recipes"
- **When** Bob requests the recipe details via `recipes.byId` or lists recipes via `recipes.list`
- **Then** the `personalSourceName` key is completely absent from the response object(s)

#### Scenario: Unauthenticated guest views public recipe
- **Given** an unauthenticated guest user and a public recipe owned by "Alice" with `personalSourceName` set to "Mom's Recipes"
- **When** the guest requests the recipe details via `recipes.byId` or lists recipes via `recipes.list`
- **Then** the `personalSourceName` key is completely absent from the response object(s)

## MODIFIED Requirements

### Requirement: MODIFIED Recipe TypeScript Return Type

The `Recipe` TypeScript return interface SHALL be modified to reflect that the `personalSourceName` key is optional (may be absent).

#### Scenario: TypeScript type safety check
- **Given** the `Recipe` interface in `src/types/recipe.ts`
- **When** the field `personalSourceName` is accessed or compiled
- **Then** TypeScript compiler allows it to be `undefined` (absent) or `string | null`

## REMOVED Requirements

### Requirement: REMOVED None

No requirements are removed.

## Traceability

- **Proposal element**: Server-side stripping of `personalSourceName` -> **Requirement**: ADDED Recipe Personal Source Name Privacy Boundaries.
- **Design decision**: Decision 1 (Recursive Helper) -> **Requirement**: ADDED Recipe Personal Source Name Privacy Boundaries.
- **Design decision**: Decision 2 (Procedural Middleware) -> **Requirement**: ADDED Recipe Personal Source Name Privacy Boundaries.
- **Design decision**: Decision 3 (Optional Interface) -> **Requirement**: MODIFIED Recipe TypeScript Return Type.
- **Requirement**: ADDED Recipe Personal Source Name Privacy Boundaries -> **Task(s)**: Implement recursive helper, implement output middleware, integrate into router.
- **Requirement**: MODIFIED Recipe TypeScript Return Type -> **Task(s)**: Update `Recipe` interface in `src/types/recipe.ts`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget
- **Given** a response payload containing 100 recipe rows
- **When** the recursive stripping helper processes the payload
- **Then** the execution time overhead is less than 1 millisecond

### Requirement: Security

See functional scenarios:
- *Non-owner authenticated user views public recipe*
- *Unauthenticated guest views public recipe*

### Requirement: Reliability

#### Scenario: Graceful omission handling
- **Given** an absent `personalSourceName` field in a recipe object
- **When** the print view (`cookbooks.$cookbookId_.print.tsx`) renders the recipe
- **Then** it coalesces the value to `null` and renders without any JavaScript errors or crash

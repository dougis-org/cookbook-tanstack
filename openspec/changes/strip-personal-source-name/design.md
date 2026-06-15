## Context

- **Relevant architecture**: 
  - tRPC API layer located in `src/server/trpc/`.
  - Mongoose models in `src/db/models/`.
  - Shared router helper functions in `src/server/trpc/routers/_helpers.ts`.
  - TypeScript types in `src/types/recipe.ts`.
- **Dependencies**: 
  - Personal source initiative (#503) defining recipe schema and field.
- **Interfaces/contracts touched**:
  - `Recipe` type interface in `src/types/recipe.ts`.
  - tRPC endpoints in `recipesRouter` returning recipe objects.

## Goals / Non-Goals

### Goals

- Strip/delete the `personalSourceName` field from recipe responses returned by tRPC endpoints when accessed by non-owners or unauthenticated users.
- Keep the `personalSourceName` field intact when the recipe owner queries their own recipes.
- Centrally secure the endpoints to prevent accidental field leaks on future endpoints.

### Non-Goals

- Restricting database access or removing `personalSourceName` from database schemas.
- Restricting UI display code beyond what is dictated by the API responses.

## Decisions

### Decision 1: Shared Recursive Stripping Helper

- **Chosen**: Implement `stripPersonalSourceName` in `src/server/trpc/routers/_helpers.ts` which recursively traverses any object or array, checks for recipe-like objects (having `userId` and `personalSourceName` keys), and deletes `personalSourceName` if `recipe.userId !== viewerUserId`.
- **Alternatives considered**: Ad-hoc helper calls in each individual resolver.
- **Rationale**: A recursive helper is highly reusable and handles single objects, plain arrays, paginated envelopes (e.g. `{ items: [...] }`), and nested relations (e.g. recipes nested inside a cookbook).
- **Trade-offs**: Marginally higher CPU usage due to recursive traversal compared to static manual mapping, but negligible for typical page sizes (<100 items).

### Decision 2: Local Procedural Middleware for recipesRouter

- **Chosen**: Define localized custom procedure builders (`recipePublicProcedure`, `recipeProtectedProcedure`, `recipeVerifiedProcedure`) in `src/server/trpc/routers/recipes.ts` that apply an output interceptor middleware.
- **Alternatives considered**: Appending `.use()` middleware individually to every resolver definition.
- **Rationale**: Creating procedure wrappers ensures that any endpoint registered under `recipesRouter` utilizing these procedures is automatically and transparently protected, reducing developer oversight risk.
- **Trade-offs**: Requires changing the procedure builder references at the top of the endpoints, but is highly standard tRPC pattern.

### Decision 3: Update TypeScript Interface to Make Field Optional

- **Chosen**: Update `personalSourceName` in `Recipe` interface to `personalSourceName?: string | null` (optional).
- **Alternatives considered**: Keeping it required (`personalSourceName: string | null`) and expecting the field to always be present as `null`.
- **Rationale**: Since we are using `delete recipe.personalSourceName` to make the key completely absent (as required by acceptance criteria), TypeScript must represent this key as optional so that compilers/consumers do not assume it is always present.
- **Trade-offs**: Frontend code must handle the key being absent, which it already does using standard nullish coalescing (`recipe.personalSourceName ?? null`).

## Proposal to Design Mapping

- **Proposal element**: Server-side stripping of `personalSourceName` for non-owners.
  - **Design decision**: Decision 1 (Recursive Helper) and Decision 2 (Procedural Middleware).
  - **Validation approach**: Integration tests using `makeAuthCaller` and `makeAnonCaller` asserting field is `undefined` on the response.
- **Proposal element**: Ensure unauthenticated users do not get the field.
  - **Design decision**: Decision 1 (Recursive Helper) using `viewerUserId === undefined`.
  - **Validation approach**: Integration tests using `makeAnonCaller`.
- **Proposal element**: List endpoints strip per-row.
  - **Design decision**: Decision 1 (Recursive Helper) checks `recipe.userId` for each individual item in the array.
  - **Validation approach**: Integration test seeding a list with mixed ownership recipes and asserting the field presence per row.

## Functional Requirements Mapping

- **Requirement**: Owner GET returns `personalSourceName`.
  - **Design element**: `stripPersonalSourceName` logic returns field if `viewerUserId === recipe.userId`.
  - **Acceptance criteria reference**: `Owner GET returns personalSourceName`.
  - **Testability notes**: Query `recipes.byId` as owner and verify field matches seed.
- **Requirement**: Non-owner GET does not include `personalSourceName`.
  - **Design element**: `stripPersonalSourceName` deletes field if `viewerUserId !== recipe.userId`.
  - **Acceptance criteria reference**: `Different authenticated user GET does not include the field`.
  - **Testability notes**: Query `recipes.byId` as non-owner and verify key is absent via `toBeUndefined()`.
- **Requirement**: Unauthenticated GET does not include `personalSourceName`.
  - **Design element**: `stripPersonalSourceName` deletes field if `viewerUserId` is undefined.
  - **Acceptance criteria reference**: `Unauthenticated GET does not include the field`.
  - **Testability notes**: Query `recipes.byId` as anonymous user and verify key is absent.

## Non-Functional Requirements Mapping

- **Requirement category**: Security
  - **Requirement**: Zero chance of data leak on new recipe endpoints.
  - **Design element**: Router-level middleware wrapped in local procedures.
  - **Acceptance criteria reference**: `Centralize in one helper so future endpoints can't accidentally leak`.
  - **Testability notes**: Any endpoint using `recipePublicProcedure` will automatically be formatted.

## Risks / Trade-offs

- **Risk/trade-off**: Performance overhead of recursive traversal on large payloads.
  - **Impact**: Increased server response latency.
  - **Mitigation**: Traversal checks for standard object/array types and returns early if not object. Page sizes are limited to 100 max, which takes <0.1ms to traverse in JS.

## Rollback / Mitigation

- **Rollback trigger**: Frontend compilation errors or unexpected runtime crashes due to absent fields.
- **Rollback steps**:
  1. Revert `Recipe` interface to required.
  2. Modify output middleware to set `personalSourceName: null` instead of deleting the key.
- **Data migration considerations**: None.
- **Verification after rollback**: Run `npm run test` and check that all endpoints return the field as `null` or string.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge. Run `npm run test` locally to diagnose.
- **If security checks fail**: Address vulnerabilities prior to merge.
- **If required reviews are blocked/stale**: Propose alignment or request follow-up from code owners.
- **Escalation path and timeout**: Auto-merge is standard. If blocked, contact Doug Hubbard.

## Open Questions

- None.

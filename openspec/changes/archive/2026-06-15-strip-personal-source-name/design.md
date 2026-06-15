## Context

- Relevant architecture: tRPC Router Layer, Mongoose query mapping layer, client-side typescript interfaces.
- Dependencies: `@trpc/server`, Mongoose Models (`Recipe`, `Cookbook`).
- Interfaces/contracts touched: `recipesRouter` (`list`, `byId`, `create`, `update` schemas and return types), `cookbooksRouter` (`byId` return types), and the client-side `Recipe` interface.

## Goals / Non-Goals

### Goals

- Completely omit/strip `personalSourceName` from recipe data returned via tRPC to anyone other than the recipe's owner.
- Centralize this logic into a single, reusable helper in `src/server/trpc/routers/_helpers.ts` to ensure consistency and prevent accidental leak points.
- Make `personalSourceName` optional in TypeScript interfaces to align client-side type-safety with backend omitting behavior.

### Non-Goals

- Altering the database schema or the way recipes are written.
- Rewriting other unrelated fields' visibility filters.

## Decisions

### Decision 1: Shared Helper location & implementation

- Chosen: Implement `sanitizeRecipePersonalSource` in `src/server/trpc/routers/_helpers.ts` and mutate in place or delete properties dynamically.
- Alternatives considered: Implementing a tRPC output validator using Zod.
- Rationale: A Zod output validator would have to parse and transform the whole output, which can be computationally expensive and harder to configure for nested outputs (like recipes in cookbooks). A plain JS helper allows targeted, lightweight sanitization on already mapped results without schema overhead.
- Trade-offs: Requires manually calling the helper in each relevant resolver, but it is extremely simple and fast.

### Decision 2: Stripping Mechanism

- Chosen: Use the `delete` operator on plain mapped Javascript objects (e.g. `delete recipe.personalSourceName`).
- Alternatives considered: Copying the object without the property, or returning `undefined`.
- Rationale: Modifying the object directly avoids extra memory allocations. JSON serialization natively omits keys that are deleted or set to `undefined`, achieving the desired network-level omission.
- Trade-offs: Mutating in-place can be risky if reference transparency is required, but since the resolvers already construct fresh plain objects from DB lean results/mappings, mutation is safe.

### Decision 3: Client Type changes

- Chosen: Update `personalSourceName` in `src/types/recipe.ts` to `personalSourceName?: string | null` (optional).
- Alternatives considered: Keeping it required and forcing client-side selectors to expect it.
- Rationale: Since the server physically deletes the key, any strict client-side JSON deserializer or validator might complain if the key is missing. Making it optional resolves type checks gracefully.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Shared output transformer to delete personalSourceName for non-owners.
  - Design decision: Decision 1 & Decision 2.
  - Validation approach: Unit tests on endpoint callers asserting the key is absent.
- Proposal element: Update types to prevent compilation issues.
  - Design decision: Decision 3.
  - Validation approach: Type checks (`npx tsc --noEmit`).

## Functional Requirements Mapping

- Requirement: Owner viewing their recipe receives `personalSourceName` (retaining its value or null).
  - Design element: `sanitizeRecipePersonalSource` preserves it for matching viewer ID.
  - Acceptance criteria reference: AC 1 in issue 505.
  - Testability notes: Mock user as owner, call `recipes.byId` and check field presence.
- Requirement: Non-owner viewing the recipe has `personalSourceName` stripped completely from JSON output.
  - Design element: `sanitizeRecipePersonalSource` deletes the key for non-matching viewer ID.
  - Acceptance criteria reference: AC 2 & 3 in issue 505.
  - Testability notes: Mock user as different user or anonymous, call `recipes.byId` and assert `"personalSourceName" in result` is false.
- Requirement: Mixed row query results (like list or search) are sanitized per-row.
  - Design element: Loop/map through items and run `sanitizeRecipePersonalSource` per row.
  - Acceptance criteria reference: AC 4 in issue 505.
  - Testability notes: Call `recipes.list` with a mix of owned and public non-owned recipes, check each row.

## Non-Functional Requirements Mapping

- Requirement category: security (privacy)
  - Requirement: Zero leakage of personal attributions to non-owners over API boundaries.
  - Design element: Server-side deletion of key before sending response.
  - Acceptance criteria reference: AC 5 in issue 505.
  - Testability notes: Unit tests verifying `undefined` rather than `null`.

## Risks / Trade-offs

- Risk/trade-off: Modifying in-place.
  - Impact: Possible bugs if helper is called on shared/cached objects.
  - Mitigation: Ensure helper is called on new/lean objects at the boundary.

## Rollback / Mitigation

- Rollback trigger: Code fails compilation or regressions are detected in unit tests.
- Rollback steps: Revert the PR using Git.
- Data migration considerations: None (read-only change).
- Verification after rollback: Run `npm run test`.

## Operational Blocking Policy

- If CI checks fail: Block PR merge, fix issues, and push again.
- If security checks fail: Remediate before PR merge.
- If required reviews are blocked/stale: Escalation to project admin.
- Escalation path and timeout: N/A.

## Open Questions

- None.

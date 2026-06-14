## Context

- Relevant architecture: Mongoose ODM on MongoDB 7 (Docker or Atlas). All models live in `src/db/models/`, barrel-exported from `src/db/models/index.ts`. Existing typed pattern: `notification.ts` (`INotification extends Document`, `mongoose.models.X || mongoose.model<T>(...)` guard for hot-reload safety).
- Dependencies: `mongoose` (already installed), `@/types/user` for `hasAtLeastTier` reference (consumed by API layer, not this model). Better-Auth user record holds `user.tier`.
- Interfaces/contracts touched: `src/db/models/index.ts` barrel (one new export).

## Goals / Non-Goals

### Goals

- Define a minimal, well-indexed `RecipeNote` Mongoose model
- Enforce one note per (userId, recipeId) at the database layer
- Keep visibility logic out of the model entirely

### Non-Goals

- Tier enforcement (belongs in tRPC route handlers in #492)
- Reconciliation on tier change (notes are a binary feature gate, not quantity-limited)
- API routes, UI, or any runtime behaviour beyond the model definition

## Decisions

### Decision 1: Typed document interface (`IRecipeNote extends Document`)

- Chosen: Follow `notification.ts` pattern — define `IRecipeNote extends Document`, use `Model<IRecipeNote>` generic.
- Alternatives considered: Bare schema with no interface (the `recipe-like.ts` pattern).
- Rationale: `RecipeNote` has meaningful field types (`body: string`, ObjectId refs) that benefit from TypeScript inference in route handlers. The notification pattern is the more recent convention in this codebase.
- Trade-offs: Slightly more boilerplate, but consistent with the direction the project is moving.

### Decision 2: No `hiddenByTier` field

- Chosen: Omit `hiddenByTier` entirely. Tier visibility is a read-time check at the API layer (`hasAtLeastTier(user, 'sous-chef')`).
- Alternatives considered: Persisting `hiddenByTier: boolean` on the note (original issue spec).
- Rationale: Persisted visibility creates upgrade amnesia — a downgraded user who re-upgrades would not see their notes without a reconciliation sweep. Notes are a binary feature gate, not a quantity-limited resource, so the `hiddenByTier` / `reconcile-user-content.ts` pattern does not apply.
- Trade-offs: API routes must always check tier before returning notes (slightly more work in #492), but model complexity is reduced and correctness is improved.

### Decision 3: `timestamps: true` (Mongoose option) not manual fields

- Chosen: Pass `{ timestamps: true }` to the schema constructor.
- Alternatives considered: Manual `createdAt`/`updatedAt` fields (as in `columns.ts` helpers or `recipe-like.ts`).
- Rationale: `timestamps: true` is the pattern used in `notification.ts` and is idiomatic Mongoose. Avoids needing to import or repeat the `columns.ts` timestamp definition.
- Trade-offs: None significant.

### Decision 4: Compound unique index declared via `schema.index()`

- Chosen: `recipeNoteSchema.index({ userId: 1, recipeId: 1 }, { unique: true })` after schema construction — same pattern as `recipe-like.ts`.
- Alternatives considered: Inline `unique: true` on the field definition.
- Rationale: Compound uniqueness cannot be expressed inline on a single field; post-schema `index()` call is the correct Mongoose API and matches existing conventions.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Typed Mongoose pattern from `notification.ts`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; model type inference checked in tests

- Proposal element: No `hiddenByTier` field
  - Design decision: Decision 2
  - Validation approach: Model schema inspection in unit tests; field must be absent

- Proposal element: `timestamps: true`
  - Design decision: Decision 3
  - Validation approach: Unit test asserts `createdAt`/`updatedAt` are present after save

- Proposal element: Compound unique index `(userId, recipeId)`
  - Design decision: Decision 4
  - Validation approach: Unit test inserts duplicate pair and asserts MongoError code 11000

## Functional Requirements Mapping

- Requirement: Store `userId`, `recipeId`, `body` with required validation
  - Design element: Schema field definitions with `required: true`
  - Acceptance criteria reference: spec — required fields
  - Testability notes: Vitest unit test attempts save with each required field missing; asserts `ValidationError`

- Requirement: `body` maxlength 10000, trim
  - Design element: `{ type: String, maxlength: 10000, trim: true }`
  - Acceptance criteria reference: spec — body validation
  - Testability notes: Test saves body of length 10001; asserts `ValidationError`

- Requirement: One note per (userId, recipeId)
  - Design element: Compound unique index, Decision 4
  - Acceptance criteria reference: spec — uniqueness
  - Testability notes: Insert same (userId, recipeId) twice; assert second insert throws with code 11000

- Requirement: Auto timestamps
  - Design element: Decision 3
  - Acceptance criteria reference: spec — timestamps present
  - Testability notes: After save, assert `doc.createdAt` and `doc.updatedAt` are Date instances

- Requirement: Barrel export
  - Design element: Add `export { RecipeNote } from "./recipe-note"` to `src/db/models/index.ts`
  - Acceptance criteria reference: spec — export
  - Testability notes: Import `{ RecipeNote }` from `@/db/models` in test; assert not undefined

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Model safe for hot-reload (dev server re-imports)
  - Design element: `(mongoose.models.RecipeNote as Model<IRecipeNote>) || mongoose.model<IRecipeNote>(...)` guard
  - Acceptance criteria reference: implicit — follows notification.ts convention
  - Testability notes: Not directly unit-testable; verified by code review

- Requirement category: performance
  - Requirement: Efficient lookup by userId for future API queries
  - Design element: Compound unique index serves as a covering index for `{ userId, recipeId }` lookups
  - Acceptance criteria reference: N/A (no query-performance test at model layer)
  - Testability notes: Index presence verified via `recipeNoteSchema.indexes()` in unit test if desired

## Risks / Trade-offs

- Risk/trade-off: Unique index violation surfaces as a raw MongoError (code 11000) not a Mongoose ValidationError
  - Impact: Route handlers in #492 must catch and handle this specifically (not just `err instanceof mongoose.Error.ValidationError`)
  - Mitigation: Document in the spec; #492 tasks must include error handling for duplicate note saves

## Rollback / Mitigation

- Rollback trigger: Critical bug in model discovered after merge; or downstream issues in #492/#493 reveal a schema change is needed.
- Rollback steps: Revert `src/db/models/RecipeNote.ts` and the barrel export line. The `recipe-notes` collection in MongoDB can remain (no data loss concern — no UI or API routes exist yet at this stage).
- Data migration considerations: None — this change only adds a new collection; no existing data is touched.
- Verification after rollback: `npm run build` passes; `npm run test` passes; `src/db/models/index.ts` no longer exports `RecipeNote`.

## Operational Blocking Policy

- If CI checks fail: Fix the failing check before merging. Do not bypass with `--no-verify` or skip-CI flags.
- If security checks fail: Treat as a blocker. Investigate Codacy/Snyk findings; resolve or explicitly document as accepted risk with owner sign-off.
- If required reviews are blocked/stale: Re-request review after 24 hours. Auto-merge is enabled — once checks pass and reviews are satisfied, the PR merges automatically.
- Escalation path and timeout: If blocked > 48 hours, flag in PR comments and notify the repo owner.

## Open Questions

No open questions. All design decisions were resolved during explore-mode discussion.

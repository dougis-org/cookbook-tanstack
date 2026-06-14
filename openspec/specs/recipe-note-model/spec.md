## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-recipe-note-model/design.md) document, not a replacement.

### Requirement: ADDED RecipeNote Mongoose model

The system SHALL persist one private markdown note per (userId, recipeId) pair in a `recipe-notes` MongoDB collection, with required field validation, body length enforcement, and a compound unique database constraint.

#### Scenario: Save valid note

- **Given** a valid `userId` (ObjectId), `recipeId` (ObjectId), and `body` string of 1–10000 characters
- **When** a `RecipeNote` document is saved
- **Then** the document is persisted with `userId`, `recipeId`, `body`, `createdAt`, and `updatedAt` fields present and correctly typed

#### Scenario: Required field missing — userId

- **Given** a `RecipeNote` with no `userId`
- **When** `.save()` is called
- **Then** a Mongoose `ValidationError` is thrown referencing the `userId` path

#### Scenario: Required field missing — recipeId

- **Given** a `RecipeNote` with no `recipeId`
- **When** `.save()` is called
- **Then** a Mongoose `ValidationError` is thrown referencing the `recipeId` path

#### Scenario: Required field missing — body

- **Given** a `RecipeNote` with no `body`
- **When** `.save()` is called
- **Then** a Mongoose `ValidationError` is thrown referencing the `body` path

#### Scenario: Body exceeds maxlength

- **Given** a `RecipeNote` with a `body` string of 10001 characters
- **When** `.save()` is called
- **Then** a Mongoose `ValidationError` is thrown referencing the `body` path with a maxlength message

#### Scenario: Body is trimmed on save

- **Given** a `RecipeNote` with `body` set to `"  hello  "`
- **When** the document is saved and retrieved
- **Then** `doc.body` equals `"hello"` (leading and trailing whitespace stripped)

#### Scenario: Timestamps are auto-populated

- **Given** a valid `RecipeNote` document
- **When** the document is saved
- **Then** `doc.createdAt` and `doc.updatedAt` are both `Date` instances

### Requirement: ADDED Compound unique index on (userId, recipeId)

The system SHALL enforce that no two `RecipeNote` documents share the same `(userId, recipeId)` pair at the database layer.

#### Scenario: Duplicate (userId, recipeId) rejected

- **Given** a `RecipeNote` with a given `userId` and `recipeId` already exists in the database
- **When** a second `RecipeNote` with the same `userId` and `recipeId` is inserted
- **Then** MongoDB throws an error with code `11000` (duplicate key)

#### Scenario: Same userId, different recipeId allowed

- **Given** a `RecipeNote` for `(userId: A, recipeId: X)` exists
- **When** a `RecipeNote` for `(userId: A, recipeId: Y)` is saved
- **Then** the second document is persisted successfully

### Requirement: ADDED Barrel export

The system SHALL export `RecipeNote` from `src/db/models/index.ts` so consumers can import it as `import { RecipeNote } from '@/db/models'`.

#### Scenario: Named export resolves correctly

- **Given** the barrel export `export { RecipeNote } from "./recipe-note"` is present in `src/db/models/index.ts`
- **When** a module imports `{ RecipeNote }` from `@/db/models`
- **Then** `RecipeNote` is a Mongoose `Model` (not `undefined`)

### Requirement: ADDED recipe-notes collection documented

The system SHALL document the `recipe-notes` collection in `docs/database.md` with its fields, indexes, and tier-gate note.

#### Scenario: docs/database.md lists recipe-notes

- **Given** `docs/database.md` is read
- **When** searching for `recipe-notes`
- **Then** the collection is listed with `userId`, `recipeId`, `body`, `createdAt`, `updatedAt`, and notes on the compound unique index and tier gate

## MODIFIED Requirements

None. This change adds a new model; no existing models or collections are modified.

## REMOVED Requirements

### Requirement: REMOVED hiddenByTier field

Reason for removal: The original issue spec included `hiddenByTier: boolean (default false)` and a secondary index `(userId, hiddenByTier)`. This was removed during design exploration. Notes are a binary tier feature gate, not a quantity-limited resource. Storing visibility state on the note creates upgrade amnesia (re-upgrading users cannot see their notes without a reconciliation sweep). Visibility is determined at query time from `user.tier` on the Better-Auth user record. No `hiddenByTier` field, no secondary index, and no entry in `reconcile-user-content.ts` are needed.

## Traceability

- Proposal: "No `hiddenByTier`" → Requirement: REMOVED hiddenByTier field → Design Decision 2
- Proposal: "Typed Mongoose pattern" → Requirement: ADDED RecipeNote model → Design Decision 1
- Proposal: "Compound unique index" → Requirement: ADDED Compound unique index → Design Decision 4
- Proposal: "`timestamps: true`" → Requirement: ADDED RecipeNote model (timestamps scenario) → Design Decision 3
- Design Decision 1 → Tasks: create `RecipeNote.ts`, write interface, write model export guard
- Design Decision 4 → Tasks: add `schema.index()` call
- Requirements → Tasks: unit test file covering all scenarios above

## Non-Functional Acceptance Criteria

### Requirement: Performance

No latency budget applies at the model layer. Index efficiency for future API queries is covered by the compound unique index serving as a covering index for `(userId, recipeId)` lookups. No standalone scenario needed.

### Requirement: Security

Access-control enforcement (Sous Chef+ gate) is out of scope for this model-layer change and will be specified in the #492 API routes change. No NFAC security scenario applies here — no access path exists yet.

### Requirement: Reliability

#### Scenario: Hot-reload safety

- **Given** the development server reloads and re-executes the model file
- **When** `mongoose.model('RecipeNote', ...)` would be called a second time
- **Then** the existing compiled model is returned (via `mongoose.models.RecipeNote` guard) without throwing `OverwriteModelError`

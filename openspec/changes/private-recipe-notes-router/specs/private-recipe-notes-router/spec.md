## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `privateRecipeNotes.get` procedure

The system SHALL expose a `privateRecipeNotes.get({ recipeId })` tRPC procedure that returns `{ hasNote: boolean, note: { body: string, updatedAt: Date } | null }`, where `note` is populated only for Sous Chef+ callers.

#### Scenario: Anonymous caller is rejected

- **Given** no authenticated session
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** a `TRPCClientError` with code `UNAUTHORIZED` is thrown

#### Scenario: Authenticated lower-tier caller, no note exists

- **Given** an authenticated home-cook or prep-cook user
- **And** no `RecipeNote` document exists for `(userId, recipeId)`
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** the response is `{ hasNote: false, note: null }`

#### Scenario: Authenticated lower-tier caller, note exists

- **Given** an authenticated home-cook or prep-cook user
- **And** a `RecipeNote` document exists for `(userId, recipeId)` with a non-empty body
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** the response is `{ hasNote: true, note: null }` (existence signalled, content withheld)

#### Scenario: Sous Chef caller, no note exists

- **Given** an authenticated sous-chef user
- **And** no `RecipeNote` document exists for `(userId, recipeId)`
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** the response is `{ hasNote: false, note: null }`

#### Scenario: Sous Chef caller, note exists

- **Given** an authenticated sous-chef user
- **And** a `RecipeNote` document exists for `(userId, recipeId)` with body `"My note"` and a known `updatedAt`
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** the response is `{ hasNote: true, note: { body: "My note", updatedAt: <date> } }`

#### Scenario: Executive Chef caller, note exists

- **Given** an authenticated executive-chef user
- **And** a `RecipeNote` document exists for `(userId, recipeId)`
- **When** `privateRecipeNotes.get({ recipeId })` is called
- **Then** the response includes `note: { body, updatedAt }` (same as sous-chef)

---

### Requirement: ADDED `privateRecipeNotes.upsert` procedure

The system SHALL expose a `privateRecipeNotes.upsert({ recipeId, body })` tRPC mutation that creates or replaces the caller's note on a recipe, restricted to Sous Chef+ users, with `body` validated to at most 10,000 characters, and requiring the recipe to be visible to the caller.

#### Scenario: Lower-tier caller is rejected

- **Given** an authenticated home-cook or prep-cook user
- **When** `privateRecipeNotes.upsert({ recipeId, body: "..." })` is called
- **Then** a `TRPCClientError` with code `FORBIDDEN` is thrown

#### Scenario: Body exceeds 10,000 characters

- **Given** an authenticated sous-chef user
- **When** `privateRecipeNotes.upsert({ recipeId, body: <10001-char string> })` is called
- **Then** a `TRPCClientError` with code `BAD_REQUEST` is thrown

#### Scenario: Recipe not found or not visible

- **Given** an authenticated sous-chef user
- **When** `privateRecipeNotes.upsert({ recipeId: <unknown or private-other-user's id>, body: "..." })` is called
- **Then** a `TRPCClientError` with code `NOT_FOUND` is thrown

#### Scenario: Create note on a public recipe

- **Given** an authenticated sous-chef user
- **And** a public recipe exists with a known `recipeId`
- **And** no note exists for `(userId, recipeId)`
- **When** `privateRecipeNotes.upsert({ recipeId, body: "Hello" })` is called
- **Then** the note is created and `get({ recipeId })` subsequently returns `{ hasNote: true, note: { body: "Hello", ... } }`

#### Scenario: Create note on caller's own private recipe

- **Given** an authenticated sous-chef user
- **And** the user owns a non-public recipe with a known `recipeId`
- **When** `privateRecipeNotes.upsert({ recipeId, body: "Private" })` is called
- **Then** the note is created successfully

#### Scenario: Update existing note (upsert semantics)

- **Given** an authenticated sous-chef user with an existing note `"Old text"` on a recipe
- **When** `privateRecipeNotes.upsert({ recipeId, body: "New text" })` is called
- **Then** `get({ recipeId })` returns `{ hasNote: true, note: { body: "New text", ... } }` (no duplicate documents created)

#### Scenario: Body at exactly 10,000 characters is accepted

- **Given** an authenticated sous-chef user
- **And** a visible recipe
- **When** `privateRecipeNotes.upsert({ recipeId, body: <10000-char string> })` is called
- **Then** the note is created or updated successfully

---

### Requirement: ADDED `privateRecipeNotes.delete` procedure

The system SHALL expose a `privateRecipeNotes.delete({ recipeId })` tRPC mutation that removes the caller's note on a recipe, restricted to Sous Chef+ users.

#### Scenario: Lower-tier caller is rejected

- **Given** an authenticated home-cook or prep-cook user
- **When** `privateRecipeNotes.delete({ recipeId })` is called
- **Then** a `TRPCClientError` with code `FORBIDDEN` is thrown

#### Scenario: Delete existing note

- **Given** an authenticated sous-chef user with an existing note on a recipe
- **When** `privateRecipeNotes.delete({ recipeId })` is called
- **Then** the note is removed and `get({ recipeId })` subsequently returns `{ hasNote: false, note: null }`

#### Scenario: Delete non-existent note

- **Given** an authenticated sous-chef user
- **And** no note exists for `(userId, recipeId)`
- **When** `privateRecipeNotes.delete({ recipeId })` is called
- **Then** a `TRPCClientError` with code `NOT_FOUND` is thrown

---

### Requirement: ADDED `privateRecipeNotes` registered on `appRouter`

The system SHALL include `privateRecipeNotes: privateRecipeNotesRouter` in the `appRouter` export from `src/server/trpc/router.ts`, making all three procedures available to tRPC clients via the `trpc.privateRecipeNotes.*` namespace.

#### Scenario: Router is accessible on the app router

- **Given** the app is built and running
- **When** a tRPC client calls `trpc.privateRecipeNotes.get({ recipeId })`
- **Then** the procedure resolves (or rejects with a structured error), confirming the router is wired up

## MODIFIED Requirements

None. No existing capabilities are modified.

## REMOVED Requirements

None.

## Traceability

- Proposal: "get returns `{ hasNote, note }` with tier-conditional content" → Requirement: `privateRecipeNotes.get`
- Proposal: "upsert/delete require Sous Chef+" → Requirement: `privateRecipeNotes.upsert` + `delete`
- Proposal: "Recipe visibility = public OR owned by caller" → Scenario: Recipe not found or not visible; Scenario: Create note on caller's own private recipe
- Design Decision 1 (protectedProcedure for get) → Scenario: Anonymous caller is rejected; Scenario: Lower-tier get returns hasNote
- Design Decision 2 (tierProcedure for upsert/delete) → Scenario: Lower-tier caller is rejected (upsert/delete)
- Design Decision 3 (recipe visibility query) → Scenario: Recipe not found or not visible
- Design Decision 4 (NOT_FOUND on delete of non-existent) → Scenario: Delete non-existent note
- Requirements → Tasks: All scenarios map to integration tests in `tasks.md` Task 3

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios:
- "Anonymous caller is rejected" (UNAUTHORIZED via `protectedProcedure`)
- "Lower-tier caller is rejected" × 2 (FORBIDDEN via `tierProcedure`)
- "Recipe not found or not visible" (NOT_FOUND prevents note on invisible recipe)
- "Sous Chef caller, note exists" (note body not returned to lower-tier callers)

No additional security scenarios: all access-control properties are fully expressed by the functional scenarios above.

### Requirement: Reliability

#### Scenario: Upsert is idempotent — no duplicate documents

- **Given** a sous-chef user calls `upsert` twice with different bodies on the same `(userId, recipeId)` pair
- **When** both calls complete successfully
- **Then** exactly one `RecipeNote` document exists for that pair (the compound unique index is not violated)
- **And** the final `body` matches the second call's value

## Context

- **Relevant architecture:** tRPC routers in `src/server/trpc/routers/`. Procedures are built on `publicProcedure`, `protectedProcedure`, and `tierProcedure(tier)` from `src/server/trpc/init.ts`. The `appRouter` in `src/server/trpc/router.ts` is the single registration point.
- **Dependencies:**
  - `RecipeNote` Mongoose model — `src/db/models/recipe-note.ts` (done, #490)
  - `canUsePrivateRecipeNotes(tier)` — `src/lib/tier-entitlements.ts` (PR #539 / #491)
  - `hasAtLeastTier` — `src/types/user.ts` (existing)
  - `Recipe` model — `src/db/models/recipe.ts` (existing, used for recipe visibility)
  - `objectId` Zod validator — `src/server/trpc/routers/_helpers.ts` (existing)
- **Interfaces/contracts touched:**
  - `AppRouter` type — gains `privateRecipeNotes` namespace
  - tRPC client inference — downstream UI (#495, #497, #499) uses generated types

## Goals / Non-Goals

### Goals

- Expose `privateRecipeNotes.get`, `.upsert`, and `.delete` as typed tRPC procedures.
- Enforce authentication for `get` and Sous Chef+ tier for `upsert`/`delete`.
- Return `{ hasNote: boolean, note: { body, updatedAt } | null }` from `get`, with `note` populated only for Sous Chef+ callers.
- Enforce recipe visibility before writing a note (upsert only).
- Pass all acceptance-criteria integration tests from #492.

### Non-Goals

- UI components or client hooks.
- Tier-change reconciliation for notes.
- Pagination or listing of notes across multiple recipes.

## Decisions

### Decision 1: Procedure base for `get` — `protectedProcedure`, not `tierProcedure`

- **Chosen:** `protectedProcedure` (any authenticated user may call `get`), with an in-handler `canUsePrivateRecipeNotes(ctx.user.tier)` check to conditionally include note content.
- **Alternatives considered:** `tierProcedure('sous-chef')` — would block lower-tier callers entirely, losing the ability to signal `hasNote: true` for downgraded users.
- **Rationale:** The issue spec explicitly requires that home-cook/prep-cook `get` returns `{ note: null, hasNote: true }` when a note exists. That signal enables a tier-upgrade prompt in the UI without exposing note body.
- **Trade-offs:** Slightly more complex handler logic; mitigated by a single boolean branch.

### Decision 2: Procedure base for `upsert` and `delete` — `tierProcedure('sous-chef')`

- **Chosen:** `tierProcedure('sous-chef')` from `src/server/trpc/init.ts`.
- **Alternatives considered:** Manual `hasAtLeastTier` check inside `protectedProcedure`.
- **Rationale:** `tierProcedure` is the canonical pattern in this codebase for tier-gated mutations. Admins are automatically exempt (handled inside `tierProcedure`). No bespoke logic needed.
- **Trade-offs:** None; this is the established pattern.

### Decision 3: Recipe visibility check in `upsert`

- **Chosen:** Before writing, query `Recipe.findOne` with a filter that matches: `_id === recipeId AND (isPublic: true OR ownerId === ctx.user.id AND [within tier recipe limit])`. If no document matches, throw `NOT_FOUND`. The "within tier limit" part is derived from the existing `TIER_LIMITS` map in `src/lib/tier-entitlements.ts` (recipe count is not checked per-write; the visibility check here guards against orphan notes on hidden recipes, not against the count limit).
- **Revised:** On reflection, the tier recipe-count limit applies to *creation of recipes*, not to *reading* recipes the user already owns. A user who has hit their recipe limit can still read their own recipes. Therefore the simpler correct rule is: **recipe must be public OR owned by the caller**. The "within tier limit" phrasing in the issue meant access-visibility, not count-checking.
- **Chosen (revised):** `Recipe.findOne({ _id: recipeId, $or: [{ isPublic: true }, { ownerId: userId }] })`.
- **Alternatives considered:** Separate public-only check (too restrictive — owners should note their own private recipes).
- **Rationale:** A caller should not be able to attach notes to recipes they cannot see. This matches the spirit of `isPublic || owned`.
- **Trade-offs:** Does not prevent notes on `hiddenByTier` recipes owned by the caller; those are still accessible to the owner and the note attachment is harmless (the UI will handle display).

### Decision 4: `delete` when no note exists — `NOT_FOUND`

- **Chosen:** Throw `TRPCError({ code: 'NOT_FOUND' })` when deleting a non-existent note.
- **Alternatives considered:** Silent no-op (idempotent delete).
- **Rationale:** Explicit error helps clients detect stale state. The issue spec doesn't mandate idempotent delete, and a `NOT_FOUND` on delete is the established pattern in this codebase (see `cookbooks.delete`).
- **Trade-offs:** Client must handle `NOT_FOUND` on delete; acceptable since it only happens on stale UI state.

### Decision 5: `canUsePrivateRecipeNotes` dependency strategy

- **Chosen:** Import `canUsePrivateRecipeNotes` from `src/lib/tier-entitlements.ts`. This function is provided by PR #539 (#491). Do not apply this change until #539 is merged.
- **Alternatives considered:** Inline `hasAtLeastTier({ tier }, 'sous-chef')` to remove the dependency.
- **Rationale:** Single source of truth for the tier gate. The proposal risk note covers the timing; the apply step should be gated on #539 landing.
- **Trade-offs:** Hard dependency on #539. The inline fallback is a one-line change if scheduling demands parallel application.

## Proposal to Design Mapping

- Proposal element: `get` returns `{ hasNote, note }` with tier-conditional content
  - Design decision: Decision 1 — `protectedProcedure` + in-handler tier branch
  - Validation approach: Integration tests per tier (home-cook with/without note, sous-chef, exec-chef)

- Proposal element: `upsert`/`delete` require Sous Chef+
  - Design decision: Decision 2 — `tierProcedure('sous-chef')`
  - Validation approach: Integration tests asserting `FORBIDDEN` for home-cook/prep-cook callers

- Proposal element: Recipe visibility before upsert
  - Design decision: Decision 3 — `Recipe.findOne({ _id, $or: [isPublic, owned] })`
  - Validation approach: Test upsert against unknown recipeId → `NOT_FOUND`; test against public recipe → success; test against own private recipe → success

- Proposal element: `canUsePrivateRecipeNotes` as single tier-gate source of truth
  - Design decision: Decision 5 — import from `tier-entitlements.ts`
  - Validation approach: Unit tests for the helper are in #491's scope; integration tests here exercise the router behaviour

## Functional Requirements Mapping

- **Requirement:** Anonymous callers get `UNAUTHORIZED` on `get`
  - Design element: `protectedProcedure` middleware throws automatically
  - Acceptance criteria: Issue #492, `get` bullet 1
  - Testability notes: `makeAnonCaller()` from test-helpers, assert `TRPCClientError` with code `UNAUTHORIZED`

- **Requirement:** `get` returns `{ note: null, hasNote: false }` when no note exists (any auth tier)
  - Design element: `RecipeNote.findOne({ userId, recipeId })` returns null → return `{ hasNote: false, note: null }`
  - Acceptance criteria: Issue #492, `get` bullet 2
  - Testability notes: Seed user, call `get` on recipe with no note

- **Requirement:** `get` returns `{ note: null, hasNote: true }` for lower-tier user when note exists
  - Design element: In-handler `canUsePrivateRecipeNotes` branch
  - Acceptance criteria: Issue #492, `get` bullet 2 (hasNote variant)
  - Testability notes: Seed note via direct DB insert, call `get` as home-cook/prep-cook

- **Requirement:** `get` returns full `{ note: { body, updatedAt }, hasNote: true }` for sous-chef+
  - Design element: `canUsePrivateRecipeNotes` true branch returns full note
  - Acceptance criteria: Issue #492, `get` bullet 2
  - Testability notes: Seed note, call as sous-chef; assert body and updatedAt match

- **Requirement:** `upsert` rejected for home-cook/prep-cook with `FORBIDDEN`
  - Design element: `tierProcedure('sous-chef')` middleware
  - Acceptance criteria: Issue #492, `upsert` bullet 1
  - Testability notes: `makeTieredCaller('home-cook')` and `makeTieredCaller('prep-cook')`, assert `FORBIDDEN`

- **Requirement:** `upsert` validates body ≤ 10,000 chars
  - Design element: `z.string().max(10000)` in input schema
  - Acceptance criteria: Issue #492, `upsert` bullet 2
  - Testability notes: Call upsert with 10,001 char body; assert `BAD_REQUEST`

- **Requirement:** `upsert` creates or updates the `(userId, recipeId)` row
  - Design element: `RecipeNote.findOneAndUpdate({ userId, recipeId }, { body }, { upsert: true, new: true })`
  - Acceptance criteria: Issue #492, `upsert` bullet 3
  - Testability notes: Call twice with different body, assert second overwrites first

- **Requirement:** `upsert` verifies recipe visibility
  - Design element: Decision 3 — `Recipe.findOne` with visibility filter
  - Acceptance criteria: Issue #492, `upsert` bullet 4
  - Testability notes: Call upsert with unknown recipeId → `NOT_FOUND`

- **Requirement:** `delete` requires Sous Chef+ and removes the note
  - Design element: `tierProcedure('sous-chef')` + `RecipeNote.deleteOne`
  - Acceptance criteria: Issue #492, `delete` bullet
  - Testability notes: Upsert then delete as sous-chef; verify `get` returns `hasNote: false`

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: No note body exposed to lower-tier callers
  - Design element: In-handler `canUsePrivateRecipeNotes` branch in `get`; `tierProcedure` for mutations
  - Acceptance criteria reference: Issue #492 `get` tier bullets
  - Testability notes: Negative tests asserting `note: null` for home-cook/prep-cook when note exists

- **Requirement category:** Security
  - Requirement: Cannot write a note on an invisible recipe
  - Design element: Decision 3 recipe visibility query
  - Acceptance criteria reference: Issue #492 `upsert` bullet 4
  - Testability notes: Test with random ObjectId recipeId

- **Requirement category:** Reliability
  - Requirement: Compound unique index ensures one note per `(userId, recipeId)` pair
  - Design element: Mongoose `findOneAndUpdate` with `upsert: true` respects the unique index cleanly
  - Acceptance criteria reference: Implicit in upsert semantics
  - Testability notes: Two sequential upserts should overwrite, not create two documents

## Risks / Trade-offs

- **Risk/trade-off:** `canUsePrivateRecipeNotes` not yet merged when apply runs
  - Impact: Build failure
  - Mitigation: Gate apply on #539 merge; or temporarily inline `hasAtLeastTier({ tier }, 'sous-chef')`

- **Risk/trade-off:** Recipe visibility query uses `ownerId` field — need to confirm field name on `Recipe` schema
  - Impact: If the field is named differently (e.g., `userId`), the query silently fails to match owned private recipes
  - Mitigation: Check `src/db/models/recipe.ts` before writing the query; confirmed in tasks step

## Rollback / Mitigation

- **Rollback trigger:** `privateRecipeNotes` router causes a build failure or breaks existing router tests.
- **Rollback steps:** Remove `privateRecipeNotes` from `appRouter` in `src/server/trpc/router.ts` and delete `src/server/trpc/routers/privateRecipeNotes.ts`. The `RecipeNote` model and `canUsePrivateRecipeNotes` helper are independent and do not need rollback.
- **Data migration considerations:** None. No schema changes; the `recipe-notes` collection may contain data from prior testing but the collection is unchanged.
- **Verification after rollback:** Run `npm run test` and confirm existing router tests pass.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check before reopening for review.
- **If security checks fail:** Treat as a blocker. Resolve Codacy/Snyk findings before merging.
- **If required reviews are blocked/stale:** Re-request review after 24 hours. Escalate to repo owner after 48 hours.
- **Escalation path and timeout:** If blocked for more than 3 business days, discuss scope reduction or deferral with the team.

## Open Questions

No open questions. All design decisions are resolved.

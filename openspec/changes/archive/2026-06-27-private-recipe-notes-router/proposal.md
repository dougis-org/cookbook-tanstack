## GitHub Issues

- #492 — Private Recipe Notes: add privateRecipeNotes tRPC router (get/upsert/delete)
- Blocked by: #490 (closed), #491 (PR #539 in flight)
- Blocks: #495, #497, #499

## Why

- **Problem statement:** Users at the Sous Chef+ tier can store a private note per recipe, but no API exists to read or write those notes. The `RecipeNote` Mongoose model (#490) and tier-entitlement helper `canUsePrivateRecipeNotes` (#491) are in place (or in flight); this change wires them into the tRPC layer.
- **Why now:** #491 (PR #539) is landing and #495/#497/#499 (UI and downstream consumers) are blocked on this router.
- **Business/user impact:** Unlocks the private notes feature for Sous Chef and Executive Chef subscribers. Lower-tier users get a clean signal (`hasNote: true, note: null`) that promotes upgrade without exposing note content.

## Problem Space

- **Current behavior:** No tRPC procedures exist for private recipe notes. Clients have no way to read or write the `recipe-notes` collection.
- **Desired behavior:** Three procedures under `privateRecipeNotes`:
  - `get({ recipeId })` — any authenticated user can call; content returned only if caller is Sous Chef+.
  - `upsert({ recipeId, body })` — Sous Chef+ only; creates or replaces the `(userId, recipeId)` note.
  - `delete({ recipeId })` — Sous Chef+ only; removes the note document.
- **Constraints:**
  - Server is the sole source of tier truth; no tier state is persisted on the note document.
  - Recipe visibility check in `upsert`: recipe must be public **or** (owned by caller **and** within caller's current tier recipe limit). This mirrors the existing recipe access model.
  - `body` max length 10,000 characters (enforced by Zod and Mongoose).
- **Assumptions:**
  - `canUsePrivateRecipeNotes` from `src/lib/tier-entitlements.ts` (PR #539) will be merged before this change is applied.
  - `RecipeNote` model is already exported from `src/db/models/index.ts` (done in #490).
  - Recipe visibility/ownership lookup uses the `Recipe` model already in use by the recipes router.
- **Edge cases considered:**
  - Lower-tier user with an existing note (stored before downgrade): `get` returns `{ hasNote: true, note: null }` — content withheld, existence signalled. No DB reconciliation needed.
  - Upsert on a recipe the caller doesn't own and isn't public → `NOT_FOUND` (same as if the recipe didn't exist; avoids leaking existence of private recipes).
  - Delete when no note exists → `NOT_FOUND`.
  - Body at exactly 10,000 characters → accepted. Body at 10,001 → `BAD_REQUEST`.

## Scope

### In Scope

- New file `src/server/trpc/routers/privateRecipeNotes.ts` with the `privateRecipeNotesRouter`.
- Registration of `privateRecipeNotes: privateRecipeNotesRouter` in `src/server/trpc/router.ts`.
- Integration tests in `src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts` covering all acceptance-criteria scenarios from #492.

### Out of Scope

- UI components for displaying or editing notes (tracked in #495, #497, #499).
- Tier-change integration tests (tracked in #493).
- `canUsePrivateRecipeNotes` helper itself (tracked in #491 / PR #539).
- `RecipeNote` model (done in #490).

## What Changes

- **New file:** `src/server/trpc/routers/privateRecipeNotes.ts`
- **Modified file:** `src/server/trpc/router.ts` — adds `privateRecipeNotes` to `appRouter`
- **New test file:** `src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`

## Risks

- **Risk:** #491 (PR #539) not yet merged when this change is applied.
  - **Impact:** `canUsePrivateRecipeNotes` import fails; build breaks.
  - **Mitigation:** This change depends on #491. Do not apply until #539 is merged, or inline `hasAtLeastTier({ tier }, 'sous-chef')` and migrate to `canUsePrivateRecipeNotes` in a follow-up once #539 lands.

- **Risk:** Recipe visibility logic diverges from the recipes router over time.
  - **Impact:** Notes could be attached to recipes the caller can no longer see.
  - **Mitigation:** Extract shared `isRecipeVisibleToUser` logic into a helper if duplication grows beyond this router.

- **Risk:** Compound unique index not yet present if `RecipeNote` collection was created before #490 applied the index.
  - **Impact:** Duplicate notes could exist; upsert semantics break.
  - **Mitigation:** #490 is closed/merged. Index is part of the schema definition and applied on first model load.

## Open Questions

No unresolved ambiguity remains. All questions from explore mode have been answered:
- `get` visibility: `protectedProcedure` (auth required, any tier) ✓
- `upsert`/`delete` tier gate: `tierProcedure('sous-chef')` ✓
- Recipe visibility for `upsert`: public OR (caller owns AND within tier limit) ✓
- Anonymous `get`: plain `UNAUTHORIZED` via `protectedProcedure` ✓

## Non-Goals

- Sharing notes between users.
- Note history / versioning.
- Rich-text or structured format (body is plaintext/markdown, opaque to the server).
- Rate limiting or per-user note count limits (notes are one-per-recipe, binary gate).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## GitHub Issues

- #490

## Why

- Problem statement: Sous Chef+ users have no way to attach personal notes to recipes. Notes are a planned Sous Chef-tier feature that underpins the broader recipe-notes capability (blocked issues #492, #493).
- Why now: Issue #490 is a foundation dependency; #492 (API routes) and #493 (UI) are blocked until the model exists.
- Business/user impact: Without the model, the entire recipe-notes feature cannot be built. Sous Chef and Executive Chef subscribers have no personal annotation capability.

## Problem Space

- Current behavior: No `recipe-notes` collection exists. Users cannot store per-recipe notes.
- Desired behavior: A `RecipeNote` document persists one private markdown note per (userId, recipeId) pair. Access control is enforced at the API layer by checking `user.tier >= 'sous-chef'` — no visibility state is stored on the note itself.
- Constraints:
  - Follows the typed Mongoose pattern (`IRecipeNote extends Document`, `Model<IRecipeNote>`) established by `notification.ts`.
  - `hiddenByTier` must NOT be added. Notes are a binary feature gate, not a quantity-limited resource. The existing `hiddenByTier` / `reconcile-user-content.ts` pattern applies only to quantity-limit reconciliation on recipes and cookbooks.
  - Tier is read from `user.tier` on the Better-Auth user record at query time — no denormalized copy on the note.
- Assumptions: One note per user per recipe is the intended design (enforced by compound unique index).
- Edge cases considered:
  - User downgrades below Sous Chef: existing notes are preserved in the database; the API simply returns 403. If the user re-upgrades, notes are immediately accessible again — no reconciliation sweep needed.
  - Empty body: allowed (user may want a placeholder note); `trim: true` prevents whitespace-only saves from consuming the maxlength.

## Scope

### In Scope

- `src/db/models/RecipeNote.ts` — Mongoose model with `userId`, `recipeId`, `body`, timestamps
- Compound unique index `(userId, recipeId)`
- Export from `src/db/models/index.ts` barrel
- Unit tests for required fields, maxlength validation, uniqueness constraint, default values
- `docs/database.md` updated to document the `recipe-notes` collection

### Out of Scope

- tRPC API routes for reading/writing notes (#492)
- UI components (#493)
- Tier gate enforcement code (belongs in the tRPC route handlers, not the model)
- Any entry in `reconcile-user-content.ts`

## What Changes

- New file: `src/db/models/RecipeNote.ts`
- Modified: `src/db/models/index.ts` (one export line)
- New file: `src/__tests__/db/models/RecipeNote.test.ts` (or equivalent test path)
- Modified: `docs/database.md` (new collection entry)

## Risks

- Risk: Compound unique index not enforced at the application layer, only at the DB layer.
  - Impact: Low — Mongoose will throw on duplicate insert, which the tRPC route can handle cleanly.
  - Mitigation: Document the constraint in the model and in the spec; route handlers in #492 must use upsert semantics.

## Open Questions

No unresolved ambiguity. The design discussion in explore mode resolved the key question (hiddenByTier omitted; tier checked at API layer). Confirmed before proposal was written.

## Non-Goals

- Shared or public notes
- Note versioning or history
- Rich-text beyond markdown
- Quantity limits on notes (one per recipe per user is the ceiling by design)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

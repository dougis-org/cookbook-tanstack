## Context

- Relevant architecture: TanStack Start app, tRPC routers backed by Mongoose. Recipe create/update flows through `src/server/trpc/routers/recipes.ts` (`recipeFields` zod schema + `create`/`update` procedures), the `Recipe` Mongoose model (`src/db/models/recipe.ts`), the edit form (`src/components/recipes/RecipeForm.tsx`, react-hook-form + zod resolver), and four display surfaces: `RecipeDetail.tsx`, `RecipeCard.tsx`, `CookbookRecipeCard.tsx`, `CookbookStandaloneLayout.tsx`.
- Dependencies: `src/lib/validation.ts` (`importedRecipeSchema`) already models `prepTime`/`cookTime` as `.nullable().optional()` for the import path — this is the reference contract the primary `recipeFields` schema should converge on. `ImageUploadField`'s `onRemove` (`RecipeForm.tsx`) already demonstrates the "clear by sending explicit `null`" client pattern for `imageUrl`, which is nullable in `recipeFields` today.
- Interfaces/contracts touched: `recipesRouter.create`/`recipesRouter.update` tRPC procedure input (`recipeFields`), the `Recipe` document shape (no schema-level Mongoose change expected — `{ type: Number }` already accepts `null`), `RecipeFormValues` (react-hook-form state), and the props/render logic of the four display components.

## Goals / Non-Goals

### Goals

- Allow `prepTime` and `cookTime` to be independently set to an explicit N/A (`null`) via the edit form, and have that persist correctly through create/update/autosave.
- Treat `0` identically to N/A everywhere: validation, storage-read normalization for display, and toggle initial state.
- Render "N/A" consistently on every surface that shows prep/cook time, replacing today's silent omission on three of the four surfaces.
- Keep the fix minimal: reuse the existing nullable-field pattern already proven by `imageUrl` rather than introducing new update-handler branching.

### Non-Goals

- No new "no-cook" concept distinct from N/A.
- No change to `servings`, `difficulty`, nutrition fields, or the general shape of the `update` mutation's field-spreading logic beyond what `prepTime`/`cookTime` need.
- No migration of existing data — a stored `cookTime: 0` is left as-is in the database; only display/validation treatment changes to read it as N/A.

## Decisions

### Decision 1: Represent N/A as `null` at the API and DB layer, not a sentinel or boolean flag

- Chosen: `prepTime`/`cookTime` remain `Number | null` throughout the stack. N/A = `null`. No new "isPrepTimeNA" boolean field on the Recipe model.
- Alternatives considered: (a) a sentinel numeric value (e.g. `-1`) — rejected, error-prone and requires filtering everywhere numeric comparisons/sorts happen; (b) a separate boolean flag per field — rejected, adds schema surface and two sources of truth (flag + stale number) that can disagree.
- Rationale: `null` is the idiomatic "no value" representation already used by `imageUrl`, `classificationId` reads, and the import schema (`importedRecipeSchema`) for these exact two fields. Reusing it keeps one code path for "nullable optional number" instead of inventing a second convention.
- Trade-offs: Existing legacy `0` values must be normalized to N/A at the display/consumption layer (see Decision 3) since the DB itself won't retroactively rewrite `0` to `null`.

### Decision 2: Server schema change is the only backend change needed — no update-handler branching

- Chosen: Change `recipeFields` in `src/server/trpc/routers/recipes.ts` for `prepTime`/`cookTime` from `z.number().int().positive().optional()` to `z.number().int().nonnegative().nullable().optional()`. Leave the `update` mutation's `{ ...data }` → `$set` spread untouched.
- Alternatives considered: Special-casing `prepTime`/`cookTime` in the `update` mutation to explicitly forward `null` into `$set` (as originally flagged as a risk in the proposal) — investigated and rejected once confirmed unnecessary: `undefined` values are what silently vanish in JSON/superjson transport and via `{ ...data }` object spread; an explicit `null` value survives serialization and spreading intact and reaches `$set` correctly. This is already proven by the existing `imageUrl` nullable field, which supports "clear image" via `setValue("imageUrl", null, ...)` today with no special server-side handling.
- Rationale: Minimal, consistent change. The real defect was never in the update handler — it's that (a) the schema rejected `null` outright, and (b) the client-side `toNum()` helper produced `undefined` instead of `null` for a cleared value, so there was never an explicit `null` for the transport layer to carry.
- Trade-offs: None significant. `.nonnegative()` (accepting `0`) instead of `.positive()` slightly widens what the server accepts numerically, but `0` is immediately normalized to N/A everywhere it's read (Decision 3), so no behavioral ambiguity results.

### Decision 3: Client sends explicit `null` via a per-field N/A toggle, and a shared display helper normalizes `0`/`null`/`undefined` to "N/A"

- Chosen:
  - `RecipeForm.tsx` gains two toggle controls (checkbox or switch), one each for Prep Time and Cook Time, alongside the existing number inputs. When a toggle is ON: the corresponding number input is disabled/cleared, and `toPayload` sends `prepTime: null` (or `cookTime: null`) instead of running it through `toNum`. When OFF: behavior is unchanged from today (empty string → `undefined`, meaning "no change" on update, or "no value" on create).
  - Toggle initial state on load: ON if `initialData.prepTime` is `null`, `undefined`, or `0`; OFF otherwise.
  - Toggling N/A off clears back to an empty, editable input (does not attempt to restore a previously-entered value in the same session) — resolves the proposal's open question with the simplest behavior.
  - A new shared utility, `formatMinutesOrNA(value: number | null | undefined): string` (location: `src/lib/recipeDisplay.ts` or colocated in an existing shared UI lib — final path decided at implementation time), returns `"N/A"` for `null`, `undefined`, or `0`, and `` `${value} min` `` otherwise. All four display sites (`RecipeDetail.tsx`, `RecipeCard.tsx`, `CookbookRecipeCard.tsx`, `CookbookStandaloneLayout.tsx`) call this helper instead of their own ad hoc ternary/`&&` logic.
- Alternatives considered: Leaving each display component with its own inline ternary (status quo for `RecipeDetail.tsx`) — rejected because it already caused three of four surfaces to diverge; a shared helper is the smallest change that guarantees consistency and is trivially unit-testable in isolation.
- Rationale: Directly implements the requester's confirmed decisions: (1) 0 == N/A, (2) explicit N/A toggle that disables the input, (3) N/A shown consistently on every display surface.
- Trade-offs: `RecipeCard.tsx` and `CookbookRecipeCard.tsx`/`CookbookStandaloneLayout.tsx` currently omit the whole labeled segment when there's no value (compact card layout); switching to always-show-with-"N/A" makes those cards slightly busier/longer. Accepted per requester's explicit answer to question 3 in exploration ("the NA should show there also").

## Proposal to Design Mapping

- Proposal element: 0 minutes treated identically to N/A (requester decision 1)
  - Design decision: Decision 3 (`formatMinutesOrNA` treats `0` as N/A) + Decision 2 (`.nonnegative()` no longer rejects `0` at the schema level, since it's a valid-but-normalized input)
  - Validation approach: Unit test asserting `formatMinutesOrNA(0) === "N/A"`; unit test asserting the server schema accepts `0` without error.
- Proposal element: Explicit N/A toggle that disables the input (requester decision 2)
  - Design decision: Decision 3 (per-field toggle in `RecipeForm.tsx`)
  - Validation approach: Component test toggling N/A on/off, asserting input `disabled` state and that `toPayload()`'s resulting object has `prepTime: null` / `cookTime: null` when toggled on.
- Proposal element: N/A shown consistently in display and printout (requester decision 3)
  - Design decision: Decision 3 (`formatMinutesOrNA` used by all four display components)
  - Validation approach: Snapshot/unit tests per component asserting "N/A" text renders for `null`, `undefined`, and `0` inputs, and the numeric label renders for positive values.
- Proposal element: Server currently rejects `null` outright (`.positive()`, no `.nullable()`)
  - Design decision: Decision 2 (schema change to `.nonnegative().nullable().optional()`)
  - Validation approach: tRPC router unit/integration test asserting `update` with `prepTime: null` persists `null` to the document, and that negative values are still rejected.
- Proposal element: Cleared input never reaches the server as a change (transport drops `undefined`)
  - Design decision: Decision 2 + Decision 3 together — schema now accepts `null`, and the client now produces `null` (via the toggle) instead of `undefined` for an intentional clear.
  - Validation approach: Integration test: create a recipe with `prepTime: 30`, submit an update with the N/A toggle on, assert the persisted document has `prepTime: null`.

## Functional Requirements Mapping

- Requirement: A user can toggle Prep Time (and independently Cook Time) to N/A while editing a recipe, and the input is disabled while N/A is active.
  - Design element: Decision 3, `RecipeForm.tsx` toggle controls.
  - Acceptance criteria reference: specs delta for `recipe-editing` capability (N/A toggle behavior).
  - Testability notes: Component-level test with react-hook-form; assert disabled attribute and payload shape.
- Requirement: Saving a recipe with N/A toggled on persists `null` for that field.
  - Design element: Decision 2 (schema) + Decision 3 (client payload).
  - Acceptance criteria reference: specs delta for `recipe-editing` capability.
  - Testability notes: tRPC router test hitting `update` with `prepTime: null`; assert Mongo document reflects `null`.
- Requirement: Every prep/cook time display surface shows "N/A" for `null`, `undefined`, or `0`, and the numeric value otherwise.
  - Design element: Decision 3, `formatMinutesOrNA` shared helper.
  - Acceptance criteria reference: specs delta for `recipe-display` capability.
  - Testability notes: Unit test the helper directly (4 input cases: null, undefined, 0, positive number); component tests for each of the four consuming components confirming they call/render via the helper.
- Requirement: A recipe with a legacy `cookTime: 0` (or `prepTime: 0`) value displays as N/A without requiring a data migration.
  - Design element: Decision 3 (helper normalizes at read time, not at rest).
  - Acceptance criteria reference: specs delta for `recipe-display` capability.
  - Testability notes: Unit test the helper with `0` input directly; no DB fixture migration needed.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The autosave path (`autoSaveOnSave`/`useAutoSave` in `RecipeForm.tsx`) must persist an N/A toggle the same way manual submit does, since both share `toPayload`.
  - Design element: Decision 3 — the N/A toggle changes what `toPayload` returns, and both `onSubmit` and `autoSaveOnSave` already call `toPayload`, so no separate autosave-specific logic is needed.
  - Testability notes: Test that autosave's mutation payload (via `autoSaveMutation`) includes `prepTime: null` when the toggle is on, mirroring the manual-submit test.
- Requirement category: security
  - Requirement: No new validation is weakened beyond `prepTime`/`cookTime` accepting `0`/`null`; negative values must still be rejected; ownership/tier checks in `update` remain untouched.
  - Design element: Decision 2 explicitly scopes the schema change to `.nonnegative().nullable().optional()` (not `.optional()` alone, not removing integer constraint).
  - Testability notes: Router test asserting `update`/`create` with `prepTime: -1` still throws a validation error.

## Risks / Trade-offs

- Risk/trade-off: Card-style display surfaces (`RecipeCard.tsx`, `CookbookRecipeCard.tsx`, `CookbookStandaloneLayout.tsx`) become visually busier by always showing "N/A" instead of omitting the segment.
  - Impact: Low — minor layout/copy change, explicitly requested by the user (exploration answer to question 3).
  - Mitigation: None needed; this is the desired behavior. Flag in PR description for visual review against the four-theme design system checklist (design-system/CLAUDE.md "What done looks like").
- Risk/trade-off: Widening `.positive()` to `.nonnegative()` could be misread later as a general validation loosening if someone greps only the diff without context.
  - Impact: Low.
  - Mitigation: Comment or commit message ties the change explicitly to the N/A/0 normalization decision; covered by an explicit negative-number-rejected test so intent is enforced by tests, not just prose.

## Rollback / Mitigation

- Rollback trigger: If the N/A toggle causes unexpected data loss (e.g., toggling N/A accidentally clears a value on unrelated save paths) discovered post-merge.
- Rollback steps: Revert the `RecipeForm.tsx` and `recipeFields` schema commits; no data migration is required to roll back since no existing data is rewritten by this change (only new saves after deployment would have written `null` where a value was previously required).
- Data migration considerations: None. This change never rewrites existing `0`/positive values in the database; it only changes what new writes can contain and how existing values are displayed.
- Verification after rollback: Confirm `prepTime`/`cookTime` inputs in `RecipeForm.tsx` again reject empty submission the same way as before this change (manual smoke test + existing `recipes-crud.spec.ts` e2e coverage).

## Operational Blocking Policy

- If CI checks fail: Fix the failing unit/e2e/lint checks before merge; do not bypass with `--no-verify` or skip flags. This is a small, well-isolated change — failures should be resolved directly rather than deferred.
- If security checks fail (Codacy/Snyk): Review findings against the schema/validation change specifically (`.nonnegative()` widening); if a finding is a false positive tied to accepting `0`/`null` as intended, document the rationale in the PR rather than suppressing the rule repo-wide.
- If required reviews are blocked/stale: Follow standard project policy — resolve reviewer/AI-reviewer threads (see project memory: PRs require thread resolution before auto-merge) before requesting re-review.
- Escalation path and timeout: If blocked >1 business day on an external check (e.g. stalled bot review), ping the requester (repo owner) directly; this is a small, self-contained bugfix change with no cross-team dependency.

## Open Questions

- None blocking. The proposal's two open questions were resolved by the requester during exploration: (1) N/A toggle returns to an empty input on re-disable rather than restoring a prior value — confirmed as acceptable default; (2) "the printout" scope is confirmed to mean the four identified display components (`RecipeDetail`, `RecipeCard`, `CookbookRecipeCard`, `CookbookStandaloneLayout`) — implementation should still grep for any other `prepTime`/`cookTime` render site before closing out tasks, in case a print-specific component was missed during exploration.

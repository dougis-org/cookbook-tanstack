## GitHub Issues

- dougis-org/cookbook-tanstack#558

## Why

- Problem statement: Users cannot set a recipe's prep time or cook time to "N/A" (not applicable). Clearing the field in the edit form silently fails to persist, and existing display surfaces (recipe cards, cookbook card summaries) simply omit the field instead of showing an explicit "N/A" state.
- Why now: Filed as a user-reported bug (#558) — recipes without a meaningful prep/cook time (e.g., no-bake desserts, beverages, pantry items) have no correct way to represent that in the data or the UI.
- Business/user impact: Users editing recipes get silently-ignored edits (data loss of intent) and inconsistent display — some surfaces show "N/A", others show nothing, which reads as a bug/incompleteness rather than an intentional state.

## Problem Space

- Current behavior:
  - `recipeFields` in `src/server/trpc/routers/recipes.ts` defines `prepTime`/`cookTime` as `z.number().int().positive().optional()` — not `.nullable()`, and `.positive()` rejects `0`. The server has no way to accept an explicit "clear this value" signal.
  - `RecipeForm.tsx`'s `toNum()` converts an emptied number input to `undefined`. In the `update` mutation, `updateData = { ...data }` is passed to `$set`; a key with value `undefined` is dropped in transport/serialization, so `$set` never touches the existing DB value — clearing the input in the UI has no effect on the saved recipe.
  - Display components disagree on how to render a missing value:
    - `RecipeDetail.tsx` already renders `"N/A"` via a ternary (`recipe.prepTime ? ... : "N/A"`) — this is the correct/reference behavior.
    - `RecipeCard.tsx`, `CookbookRecipeCard.tsx`, and `CookbookStandaloneLayout.tsx` use `recipe.prepTime && (...)` — a falsy value (including `0`, `null`, `undefined`) causes the entire label/segment to be omitted rather than showing "N/A".
  - `src/lib/validation.ts`'s `importedRecipeSchema` already models `prepTime`/`cookTime` as `.nullable().optional()` for recipe import — proving the nullable pattern already exists elsewhere in this codebase and should be mirrored in the primary create/update path.
- Desired behavior:
  - A recipe's prep time and cook time can each independently be set to an explicit "N/A" (represented as `null` in the database and API).
  - The edit form exposes a per-field "N/A" toggle. Toggling N/A on disables/clears that field's number input and sends `null` on save. Toggling N/A off re-enables numeric entry.
  - `0` minutes is treated identically to N/A — there is no distinct "instant/no-cook" numeric state separate from N/A. A stored `0` (e.g. from legacy data or import) displays and behaves as N/A.
  - Every surface that displays prep/cook time (recipe detail, recipe card, cookbook recipe card, cookbook standalone/print layout) shows the literal text "N/A" when the value is null, undefined, or 0 — never silently omitting the label.
- Constraints:
  - Must not break existing recipes that have legitimate positive prep/cook time values — those continue to display and edit normally.
  - Must not weaken tier/ownership checks or other validation already present in the `update`/`create` mutations.
  - Import path (`src/lib/validation.ts`, `importedRecipeSchema`) already supports `null` — new behavior must stay consistent with it rather than introducing a second convention.
- Assumptions:
  - "N/A" is represented as `null` at the database/API layer (not a sentinel number, not a separate boolean flag column).
  - The reporter's mention of "the printout" refers to the cookbook print/standalone layout and recipe print view, which reuse the same card/detail components already in scope.
- Edge cases considered:
  - A recipe created via import or directly in Mongo with `cookTime: 0` (a pre-existing pattern seen in fixture/mock data) must display and behave as N/A, not as a literal "0 minutes".
  - Toggling N/A on, then off again without re-entering a number — the field should return to an empty, editable input rather than restoring a stale prior value silently.
  - Autosave (`useAutoSave` / `autoSaveOnSave` in `RecipeForm.tsx`) must correctly propagate a `null` value the same way the manual submit path does, since it shares `toPayload`.

## Scope

### In Scope

- `src/server/trpc/routers/recipes.ts`: make `prepTime`/`cookTime` nullable in `recipeFields`, drop `.positive()` in favor of `.nonnegative()` (or equivalent) so `0` is not rejected outright (it is normalized to N/A elsewhere), and ensure the `update` mutation's `$set` payload includes explicit `null` when the client requests it.
- `src/components/recipes/RecipeForm.tsx`: add a per-field N/A toggle (prep time, cook time) that disables the corresponding number input and sends `null`; fix the value pipeline (`toNum`/`toPayload`) so a cleared/N/A field reaches the server as `null`, not `undefined`.
- `src/components/recipes/RecipeCard.tsx`, `src/components/cookbooks/CookbookRecipeCard.tsx`, `src/components/cookbooks/CookbookStandaloneLayout.tsx`: change falsy-omission rendering to explicit "N/A" text, treating `0` the same as `null`/`undefined`.
- `src/components/recipes/RecipeDetail.tsx`: normalize its existing ternary so `0` also maps to "N/A" (currently only `null`/`undefined`/falsy already works by virtue of `0` being falsy — confirm and keep consistent with the shared helper introduced for this change).
- A small shared helper/utility for "format prep/cook time as N/A or `${n} min`" to keep the four display sites consistent (avoid re-deriving the same ternary four times).
- Test coverage: unit tests for the nullable schema/update path, RecipeForm N/A toggle behavior, and each display component's N/A rendering; e2e coverage for the edit-and-persist-N/A flow if the existing `recipes-crud.spec.ts` pattern supports it.

### Out of Scope

- Any change to `servings`, `difficulty`, nutrition fields, or other numeric recipe fields — this change is scoped strictly to `prepTime` and `cookTime`.
- Introducing a distinct "no-cook" concept separate from N/A (explicitly rejected by the requester: 0 == N/A).
- Changing the recipe import/URL-import pipelines beyond confirming they remain compatible with the nullable schema (they already use `.nullable().optional()` and should need no changes).
- Redesigning the recipe form's overall layout beyond adding the N/A toggle controls.

## What Changes

- `recipeFields` schema (`src/server/trpc/routers/recipes.ts`) becomes `prepTime`/`cookTime`: `z.number().int().nonnegative().nullable().optional()`.
- `update` mutation explicitly forwards `null` values for `prepTime`/`cookTime` into `$set` instead of relying on `{ ...data }` spreading, which currently drops `undefined` and has no path for `null` today.
- `RecipeForm.tsx` gains two new toggle controls ("N/A" checkbox/switch next to Prep Time and Cook Time inputs) wired into `react-hook-form` state; `toPayload`/`toNum` updated so N/A-toggled fields serialize to `null`.
- A shared `formatMinutesOrNA(value: number | null | undefined): string` (or similarly named) utility is introduced and used by `RecipeDetail.tsx`, `RecipeCard.tsx`, `CookbookRecipeCard.tsx`, and `CookbookStandaloneLayout.tsx` so `0`, `null`, and `undefined` all render "N/A" consistently.

## Risks

- Risk: Existing recipes with a genuine `cookTime: 0` (e.g., the "Lemony White Bean Salad" no-cook fixture) will now display "N/A" instead of "0 min" everywhere.
  - Impact: Low — this is the explicit, requested semantics (0 == N/A per requester decision); no data is lost, only display/validation treatment changes.
  - Mitigation: Call out in release notes / PR description that 0 now reads as N/A; no migration needed since underlying stored value is unchanged.
- Risk: Changing `.positive()` to `.nonnegative()` on the server schema could be interpreted as loosening validation more broadly than intended.
  - Impact: Low — scoped only to `prepTime`/`cookTime`, and `0`/`null` are the only newly-accepted values; negative numbers remain rejected.
  - Mitigation: Cover with an explicit unit test asserting negative values are still rejected.
- Risk: The `update` mutation's generic `{ ...data }` → `$set` spread pattern is shared with other optional fields; special-casing `prepTime`/`cookTime` null-forwarding could introduce inconsistency with how other nullable fields (e.g., `personalSourceName`, `imageUrl`) are handled.
  - Impact: Medium — need to check `imageUrl`'s existing nullable handling (`imageUrl: z.string().url().nullable().optional()` already exists) as precedent to follow rather than inventing a new pattern.
  - Mitigation: Design phase will confirm whether a general fix (e.g., always forwarding `null` values explicitly for all nullable fields) is warranted vs. a field-specific fix, and pick the smaller, more consistent change.

## Open Questions

- Question: Should the N/A toggle, once enabled, preserve the previously-entered number in local component state (so re-disabling N/A restores it in the same editing session) even though the proposal above says it should return to empty?
  - Needed from: Product/requester confirmation.
  - Blocker for apply: no — default to "returns to empty" (simplest, matches requester's stated toggle behavior) unless corrected.
- Question: Does "the printout" in the original issue refer only to the cookbook print/standalone layout, or also to an individual recipe print view (if one exists) that may render prep/cook time via a different code path not yet located?
  - Needed from: Confirm no additional print-specific component renders prepTime/cookTime outside the four identified in Scope.
  - Blocker for apply: no — design/implementation will grep for any additional render sites before considering the change complete.

## Non-Goals

- Not adding a distinct "quick/no-cook" badge or separate data field.
- Not changing units (minutes) or introducing hours/duration formatting.
- Not altering tier entitlements, ownership checks, or other unrelated validation in the `create`/`update` recipe mutations.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

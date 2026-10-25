## GitHub Issues

- #701

## Why

- Problem statement: Private notes can only be viewed/edited on the recipe detail page. A recipe author editing a recipe cannot add or edit their private note there, and cannot relocate content from the public `notes` field into their private note.
- Why now: Authors are putting personal commentary in public notes because the edit screen offers no private alternative (issue #701).
- Business/user impact: Completes the Sous Chef private-notes feature on the surface where authors curate recipe content; reinforces the tier upgrade path via the existing nudge.

## Problem Space

- Current behavior: `PrivateRecipeNotes` is mounted only in `src/routes/recipes/$recipeId.tsx`. `src/components/recipes/RecipeForm.tsx` (used by `/recipes/new` and `/recipes/$recipeId/edit`) has only the public "Notes" textarea.
- Desired behavior: In edit mode, `RecipeForm` shows the same private-notes display/edit experience (including tier nudges) as the detail page, plus a "Move to private notes" action on the public Notes field. In create mode, a hint tells the user to save the recipe first.
- Constraints:
  - Private notes are keyed by `(userId, recipeId)`; no note can exist before the recipe has an ID.
  - `privateRecipeNotes.upsert` requires `sous-chef`; `get` returns existence only below tier (no body leak).
  - Buttons rendered inside `RecipeForm`'s `<form>` must not submit the recipe form.
  - Design-system rules: `--theme-*` tokens, no emoji, Lucide icons, Title Case CTAs, `up-*` classnames for upsell surfaces (already used by the nudge).
- Assumptions:
  - Only the recipe owner reaches the edit route (guarded by `requireVerifiedAuth` plus server ownership checks on update).
  - The private note saves independently of the recipe save (own Save/Cancel), mirroring the detail page.
- Edge cases considered:
  - Create mode (no recipe ID) shows a hint, not the panel.
  - Below-tier and downgraded users see the existing nudges; the Move action is hidden for them.
  - Move must never lose content: private note is written first, public field cleared only on success; existing private note content is appended to, never overwritten.
  - Appended result exceeding 10000 chars is rejected with an error; public notes stay intact.
  - Move while the private note panel is mid-edit (unsaved textarea) — Move is disabled during panel edit mode to avoid clobbering unsaved text.
  - Empty/whitespace-only public notes: Move action hidden/disabled.
  - Unsaved private-note text is lost on navigation (same as detail page; accepted).

## Scope

### In Scope

- Embed `PrivateRecipeNotes` in `RecipeForm` for edit mode, with an `embedded` visual variant (no detail-page `rounded-b-lg`/`max-w-4xl` card chrome).
- Add `type="button"` to all buttons in `PrivateRecipeNotes` / `NoteBody` / `EditButton`.
- Create-mode hint: "Save this recipe first to add private notes."
- Tier nudges (anonymous / below-tier / hidden-by-downgrade) carried over via the existing component.
- "Move to Private Notes" action beneath the public Notes textarea (edit mode, entitled users, non-empty public notes): appends public notes to the private note, then clears the public field so the normal form save/autosave persists the clear.
- Unit/integration tests and an E2E test for the edit-screen flow.
- File a follow-up issue for real-time (autosave) private notes.

### Out of Scope

- Real-time/autosave of the private note (follow-up issue).
- Warning on navigating away with unsaved private-note edits.
- Server/router/model changes (existing `get`/`upsert` are sufficient).
- Moving private → public, or bulk moves.
- Changing public-notes behavior, print behavior, or tier rules.

## What Changes

- `src/components/recipes/PrivateRecipeNotes.tsx`: add `variant?: 'detail' | 'embedded'` prop (default `detail`), `type="button"` on all buttons, and expose the saved body / editing state needed by the Move action.
- `src/components/recipes/RecipeForm.tsx`: render the panel (edit mode) or hint (create mode) below the public Notes field; add "Move to Private Notes" button wired to `privateRecipeNotes.upsert` then `setValue('notes', '', { shouldDirty: true })`.
- New tests alongside existing `PrivateRecipeNotes.test.tsx` and `__tests__/RecipeForm.test.tsx`; E2E in `src/e2e/recipes-crud.spec.ts` (or sibling spec).
- Follow-up GitHub issue for autosave of private notes.

## Risks

- Risk: Nested interactive buttons submit the recipe form.
  - Impact: Accidental recipe save/navigation when saving a note.
  - Mitigation: `type="button"` everywhere + regression test asserting no recipe update call.
- Risk: Two sources of truth (recipe form draft/autosave vs. private-note query) diverge during Move.
  - Impact: Content lost or duplicated.
  - Mitigation: Write private first, clear public second; append-only; tests for failure path.
- Risk: Autosave persists cleared public notes while private upsert is retried/failed.
  - Impact: None (clear only occurs after upsert success).
  - Mitigation: Ordering enforced in handler; covered by test.
- Risk: Visual regression on the detail page from the variant prop.
  - Impact: Layout/theme differences.
  - Mitigation: Default variant unchanged; existing detail tests must pass untouched.

## Open Questions

- Question: None unresolved. Decisions confirmed by requester: embed existing panel (option A); `type="button"`; create-mode hint; include nudges; include "move to private" in this change; unsaved-edit loss is acceptable; real-time save is a separate follow-up.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Redesigning the private notes data model or tier rules.
- Making the edit screen a single atomic save across recipe + private note.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

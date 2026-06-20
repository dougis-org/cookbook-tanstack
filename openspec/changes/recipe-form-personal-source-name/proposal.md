## GitHub Issues

- #507

## Why

- Problem statement: The client-side `RecipeForm` does not wire the `personalSourceName` field through create/edit flows. This means users cannot specify a personal name (e.g. "Aunt Mary") when associating a recipe with the "Personal" source.
- Why now: Part of the Personal source initiative, completing the front-end support for this feature now that backend normalization (#504) and source selector input UI (#506) are completed.
- Business/user impact: Enables users to organize personal/family recipes with custom source attributions, while keeping the data private and secure.

## Problem Space

- Current behavior: `RecipeForm` uses a generic `SourcePickerDropdown` that does not expose the `personalSourceName` field. Users cannot set this attribute, and when editing existing personal recipes, any pre-saved personal source names are not displayed or editable.
- Desired behavior: `RecipeForm` integrates `SourceSelector` autocomplete component, manages `personalSourceName` state, and submits it in create and edit mutation payloads. The value is preserved on source transitions to prevent data loss.
- Constraints: Client-side must not clear the value on source change (letting server handle normalization); input is capped at 80 characters.
- Assumptions: The server correctly normalizes (deletes/nullifies) the `personalSourceName` if the selected source is not personal.
- Edge cases considered: Flipped source states (Personal -> other -> Personal) must preserve the typed name client-side.

## Scope

### In Scope

- Replace `SourcePickerDropdown` with `SourceSelector` in `RecipeForm.tsx`.
- Support `personalSourceName` state in `RecipeForm`.
- Map `personalSourceName` into `create` and `update` mutation payloads in `RecipeForm`.
- Support draft persistence (autosave) and revert behavior for `personalSourceName`.
- Adjust `SourceSelector` client-side behavior to NOT clear the personal source name when selected source is changed/cleared.
- Write unit/integration tests for both components covering creation, editing, and client-side persistence.

### Out of Scope

- Displaying `personalSourceName` in recipe details views.
- Modifying server-side normalizers or validators.

## What Changes

- `src/components/recipes/RecipeForm.tsx` (state, markup, submit handler, auto-save mappings)
- `src/components/ui/SourceSelector.tsx` (disable clearing of `personalSourceName`)
- Tests for both files.

## Risks

- Risk: Accidental submit of personal name payload on non-personal sources.
  - Impact: Minimal, as server-side normalization discards the value.
  - Mitigation: Rely on existing backend validators; tests verify both front-end submission and backend normalization.

## Open Questions

- There are no unresolved ambiguities for this feature.

## Non-Goals

- Modifying other dropdown selectors or forms.
- Doing a bulk backfill or migration.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

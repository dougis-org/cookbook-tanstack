## GitHub Issues

- #514

## Why

- Problem statement: The category dropdown on the recipe entry and edit screens is a native `<select>` element. It lacks search functionality and specific sorting, making it hard to locate a specific category as the list grows. Its UX also doesn't match the existing custom source dropdown.
- Why now: Users are finding it increasingly difficult to find categories, causing friction during recipe entry/edit.
- Business/user impact: Improves user experience by speeding up recipe creation and ensuring visual consistency across forms.

## Problem Space

- Current behavior: Categories are displayed in an unordered list within a native `<select>` element with no search capability.
- Desired behavior:
  - Alphabetical order A-Z
  - Selected items pinned to the top of the list
  - Remaining items in alphabetical order below
  - Search/filter input within the dropdown
  - Layout and UX match the existing source dropdown
- Constraints: The new dropdown needs to seamlessly integrate with `react-hook-form` in `RecipeForm.tsx`.
- Assumptions: The lists of categories and sources are small enough to be loaded entirely into memory for local filtering.
- Edge cases considered:
  - No matching search results.
  - No item initially selected.
  - Navigating dropdown with keyboard (must retain existing accessible behaviors).

## Scope

### In Scope

- Creating a new generic `SingleSelectDropdown.tsx` component.
- Implementing local search, filtering, and sorting (with the selected item pinned) within the new component.
- Refactoring `SourcePickerDropdown.tsx` to use the new generic component.
- Updating `RecipeForm.tsx` to replace the native Category `<select>` with the new generic component.

### Out of Scope

- Modifying the existing `MultiSelectDropdown.tsx`.
- Adding backend pagination or search endpoints for categories (local filtering only).
- Allowing users to create new categories inline from the dropdown.

## What Changes

- `src/components/ui/SingleSelectDropdown.tsx` (new file)
- `src/components/ui/SourcePickerDropdown.tsx` (refactored)
- `src/components/recipes/RecipeForm.tsx` (updated category input)

## Risks

- Risk: Refactoring `SourcePickerDropdown` might introduce regressions in the source selection behavior.
  - Impact: Users cannot select sources for recipes.
  - Mitigation: Ensure existing functionality (like fetching sources remotely on open) is preserved by passing data directly or maintaining the wrapper behavior. Add/update tests to verify behavior.

## Open Questions

- None at this time. (Ambiguities resolved during exploration phase).

## Non-Goals

- Refactoring all `<select>` elements across the entire app.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

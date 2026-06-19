## GitHub Issues

- #514

## Why

- **Problem statement:** In production, the Category dropdown shows a placeholder/empty state while classifications are being fetched on page mount. In contrast, the Source dropdown immediately displays the current source name because it initializes from preloaded data and lazy-fetches options only when opened. We need to align the Category dropdown to use this same zero-latency, lazy-fetching approach.
- **Why now:** This discrepancy creates visual latency and inconsistent form behavior in production during recipe creation and editing.
- **Business/user impact:** Users will see selected categories immediately upon edit page load with zero latency, and network queries will be deferred until the dropdown is opened.

## Problem Space

- **Current behavior:** `RecipeForm.tsx` fetches the full classifications list unconditionally on mount, leading to empty/placeholder text on initial render while the query runs, and executing unnecessary network requests.
- **Desired behavior:** 
  - Render Category using a dedicated `CategoryPickerDropdown` component.
  - Category name is displayed immediately on mount without waiting for query completion.
  - Classifications query is deferred and executed only when the dropdown is opened (lazy fetching).
  - Draft restoration is fully preserved.
- **Constraints:** Keep category selection fully integrated with `react-hook-form` to preserve validations, dirtiness checks, and autosave.

## Scope

### In Scope

- Creating a new `CategoryPickerDropdown.tsx` component in `src/components/ui/` that wraps `SingleSelectDropdown` and handles lazy-fetching on open.
- Registering both `classificationId` and `classificationName` in the `RecipeForm` schema to support zero-latency rendering and full draft restoration.
- Refactoring `RecipeForm.tsx` to remove the mount-time classifications query and leverage `CategoryPickerDropdown`.
- Adding unit/component tests for `CategoryPickerDropdown`.

### Out of Scope

- Modifying how the recipe list filters categories.
- Changing backend classification router logic.

## What Changes

- `src/components/ui/CategoryPickerDropdown.tsx` (new file)
- `src/components/ui/__tests__/CategoryPickerDropdown.test.tsx` (new test file)
- `src/components/recipes/RecipeForm.tsx` (updated)

## Risks

- **Risk:** Storing `classificationName` in Hook Form might cause mismatch if Category is updated outside Hook Form.
  - **Mitigation:** Since `RecipeForm` is the single source of truth for editing the recipe, any updates will go through `setValue` and update both fields in sync.

## Open Questions

- None.

## Non-Goals

- Refactoring other dropdowns in the app.

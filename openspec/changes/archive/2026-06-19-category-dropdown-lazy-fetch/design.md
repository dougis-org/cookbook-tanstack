## Context

- **Relevant architecture:** React frontend with `@tanstack/react-query` and `react-hook-form` in `RecipeForm.tsx`.
- **Dependencies:** `@tanstack/react-query` for query fetching and states.
- **Interfaces/contracts touched:** `RecipeForm` internal fields and schema, taxonomy fields in `Recipe`.

## Goals / Non-Goals

### Goals

- Implement `CategoryPickerDropdown` component matching the lazy-fetching behavior of `SourcePickerDropdown`.
- Eliminate category dropdown mount latency on the New/Edit recipe screens.
- Keep Hook Form integration for validation, dirty checking, and draft autosaving/restoration.

### Non-Goals

- Refactoring non-form dropdowns (like filter panel dropdowns).

## Decisions

### Decision 1: Create a dedicated CategoryPickerDropdown

- **Chosen:** Create `src/components/ui/CategoryPickerDropdown.tsx` that wraps `SingleSelectDropdown`.
- **Rationale:** Aligns with the wrapper pattern used by `SourcePickerDropdown`. It encapsulates query logic and open state tracking, keeping `RecipeForm` uncoupled from query mechanics.

### Decision 2: Store classificationName in react-hook-form state

- **Chosen:** Register `classificationName` in the react-hook-form schema and form defaults.
- **Rationale:** Ensures that the selected category's name is available immediately on mount (from preloaded recipe data) and behaves correctly during draft restoration (which is stored in localStorage by `useAutoSave`). When a user selects a category, both `classificationId` and `classificationName` will be set using `setValue`.

## Proposal to Design Mapping

- **Proposal element:** Dedicated component & lazy fetching.
  - **Design decision:** Decision 1.
  - **Validation approach:** Component tests for `CategoryPickerDropdown`.
- **Proposal element:** Zero-latency mount and draft restoration.
  - **Design decision:** Decision 2.
  - **Validation approach:** Unit tests in `RecipeForm.test.tsx` verifying it correctly initialises with and restores values.

## Risks / Trade-offs

- **Risk/trade-off:** Increased form state overhead by storing `classificationName` in hook form.
  - **Impact:** Very minimal; it is a single additional string property.
  - **Mitigation:** Safe, as the value is synced in the `onChange` callback of `CategoryPickerDropdown`.

## Rollback / Mitigation

- **Rollback trigger:** Failure in form validation/saving or draft restoration in production.
- **Rollback steps:** Revert the commits.

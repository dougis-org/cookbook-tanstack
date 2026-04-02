## Context

The `RecipeForm.tsx` is a central component for creating and editing recipes. It currently lacks background persistence, making it vulnerable to data loss. The current implementation uses `react-hook-form` and `@tanstack/react-router`'s `useBlocker`.

## Goals / Non-Goals

**Goals:**
- Implement a `useAutoSave` hook for debounced persistence.
- Sync form state to `localStorage` for all recipes (new and edit).
- Sync form state to the server via TRPC for existing recipes (`isEdit`).
- Provide non-intrusive UI feedback on save status.
- Implement a "Revert" flow for existing recipes.

**Non-Goals:**
- Server-side drafts for new recipes.
- Conflict resolution (e.g., Last-Write-Wins is acceptable).

## Decisions

### 1. Unified `useAutoSave` Hook
- **Decision**: Create a custom hook that accepts form values, an optional mutation, and a `localStorage` key.
- **Rationale**: Keeps the `RecipeForm` component clean and allows for reuse in future forms.
- **Implementation**:
  - Uses `useEffect` to watch the form's `watch()` output.
  - Implements a 1-2s debounce using `setTimeout` or a utility like `useDebounce`.
  - On debounce:
    1. Writes current state to `localStorage`.
    2. If `isEdit` and form is valid, triggers the server mutation.

### 2. LocalStorage Keying
- **Decision**: Use `recipe-draft-new` for new recipes and `recipe-draft-{recipeId}` for existing ones.
- **Rationale**: Prevents different recipes from overwriting each other's drafts.

### 3. Status Indicator Component
- **Decision**: A small component within the `RecipeForm` that renders the current state from the `useAutoSave` hook.
- **Rationale**: Minimalist feedback ensures the user knows their work is safe without being distracting.

### 4. Modified `useBlocker` Logic
- **Decision**: Update `shouldBlockFn` to consider the autosave status.
- **Rationale**: In `isEdit` mode, if the last change is successfully saved to the server, there is no need to block navigation.

### 5. "Revert" instead of "Cancel" in Edit Mode
- **Decision**: Change the button label and action when `isEdit` is true.
- **Rationale**: Explicitly allows users to discard all current (including autosaved) changes and return to the initial state.

## Risks / Trade-offs

- **[Risk]** Excessive server requests. → **[Mitigation]** Use a 2-second debounce and only save when the form is valid.
- **[Risk]** Validation UI noise. → **[Mitigation]** Autosave will check validity silently without triggering the visual error states of the inputs (using `form.getValues()` vs `handleSubmit`).
- **[Risk]** LocalStorage bloat. → **[Mitigation]** Clear the specific key upon successful manual save or explicit revert.

## Rollback / Mitigation

- **Rollback**: Since this is a pure UI/UX enhancement on top of existing mutations, rolling back simply involves reverting the `RecipeForm.tsx` and deleting the new hook/component.
- **Failure Mitigation**: If autosave fails, the "Saved" indicator will show "Failed to save". The manual "Save" button remains as a fully functional fallback.

## Open Questions

None. The strategy is fully aligned with the requirements.

## Mapping (Proposal → Design)

- **LocalStorage Autosave** → Decision #2 (Keying Strategy)
- **Server-side Autosave** → Decision #1 (useAutoSave logic)
- **Status Indicator** → Decision #3 (UI Component)
- **Draft Restoration** → Decision #1 (Hydration logic in the hook)
- **Revert Action** → Decision #5 (Button swap and state reset)
- **Guard Suppression** → Decision #4 (useBlocker update)

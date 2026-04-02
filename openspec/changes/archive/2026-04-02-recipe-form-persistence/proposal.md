## Why

The recipe form currently lacks an autosave mechanism, leading to potential data loss if the user accidentally navigates away, closes the tab, or experiences a crash. This change introduces a robust, multi-layered persistence strategy to ensure that user work is continuously saved, whether through local browser storage or direct server-side updates.

## What Changes

- **LocalStorage Autosave**: Form state is automatically saved to `localStorage` for both new and existing recipes.
- **Server-side Autosave (Edit Mode)**: For existing recipes, changes are debounced and automatically committed to the database.
- **Status Indicator**: A non-blocking UI element shows the current save state ("Saving...", "Saved", "Failed to save").
- **Draft Restoration**: On form load, the system checks for a newer `localStorage` draft and prompts the user to restore it if found.
- **Revert Action**: In Edit mode, the "Cancel" button is replaced with "Revert," allowing the user to return to the last known server state and clearing the local draft.
- **Guard Suppression**: The unsaved-changes guard is suppressed when the form is in Edit mode and the latest changes have been successfully autosaved to the server.

## Problem Space

### In-Scope
- `localStorage` persistence with a keyed slot (`recipe-draft` or `recipe-draft-{id}`).
- Debounced (1-2s) server-side autosave for `isEdit` mode.
- Prompt for draft restoration on form entry.
- Visual status feedback for all persistence actions.
- Clearing drafts on successful manual submission or explicit reversion.

### Out-of-Scope
- Implementing a server-side "Draft" state for new recipes.
- Conflict resolution for multiple users/tabs editing the same recipe.
- Full undo/redo transaction history.

## Capabilities

### New Capabilities
- `recipe-form-persistence`: Handles the logic for local/server autosave, UI feedback, and draft restoration workflows.

### Modified Capabilities
- `unsaved-changes-guard`: The requirement for the guard is modified to be suppressed when server-side autosave has successfully committed the latest edits.

## Impact

- **Affected Code**: `src/components/recipes/RecipeForm.tsx`.
- **New Hooks/Components**: `src/hooks/useAutoSave.ts`, `StatusIndicator` component.
- **User Experience**: Smoother, "always-saved" editing experience for existing recipes; safety net for new recipes.

## Risks

- **Server Load**: Increased number of update requests due to debounced autosave.
- **Validation Noise**: Autosave must not trigger disruptive validation error UI while the user is typing.
- **Synchronization**: `localStorage` data could conflict with server data if not managed carefully.

## Open Questions

There is currently no unresolved ambiguity. The alignment on the strategy (1-2s debounce, unified indicator, revert logic) has been confirmed with the requester.

## Non-Goals

- Replacing the manual "Save" button (it remains for explicit, intentional commits).
- Creating a separate "Drafts" page in the application.

## Change-Control Note

If the scope of this work changes after approval, the proposal, design, specs, and tasks must be updated before implementation proceeds.

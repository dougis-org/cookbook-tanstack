## Why

The recipe form (`RecipeForm`) has no guard against accidental data loss. If a user has been filling in a new recipe or editing an existing one and then clicks Cancel, presses the browser Back button, or closes the tab, all form work is silently discarded with no warning. This is a Milestone 02 requirement (issue #183).

## What Changes

- **Unsaved-changes guard in `RecipeForm`**: When the form is dirty (any field or taxonomy selection has changed from its initial state), navigating away — via Cancel, in-app link/back button, or tab close/refresh — triggers a confirmation modal asking the user to confirm discarding their changes.
- **New shared `ConfirmDialog` component**: A reusable styled confirmation modal in `src/components/ui/ConfirmDialog.tsx` that accepts a configurable message and confirm/cancel callbacks. Reusable for future blockers (e.g. cookbook editing).
- **Cancel uses history navigation**: The Cancel button calls `router.history.back()` (with a `/recipes` fallback when no prior history exists) instead of hardcoding a destination. This fixes the existing bug where Cancel on the edit form goes to `/recipes` instead of back to the recipe detail page, and ensures any future entry point (e.g. editing from a cookbook) also gets correct Cancel behaviour without requiring a prop.

## Capabilities

### New Capabilities

- `confirm-dialog`: Shared UI component for confirmation modals — accepts `message`, `onConfirm`, and `onCancel` props. Styled with the app's dark/cyan theme.
- `unsaved-changes-guard`: `RecipeForm` detects dirty state (RHF fields + external taxonomy/source state) and blocks in-app navigation, browser back, and tab close when dirty. A confirmation modal is shown via `ConfirmDialog` before navigation proceeds.

### Modified Capabilities

- `recipe-form-cancel`: Cancel button navigates via `router.history.back()` with `/recipes` fallback, replacing the hardcoded `navigate({ to: "/recipes" })`.

## Impact

**Files modified:**
- `src/components/recipes/RecipeForm.tsx` — dirty detection, `useBlocker`, `useRouter`, Cancel handler

**Files created:**
- `src/components/ui/ConfirmDialog.tsx` — new shared confirmation modal

**Tests created/updated:**
- `src/components/ui/__tests__/ConfirmDialog.test.tsx` — new component tests
- `src/components/recipes/__tests__/RecipeForm.test.tsx` — unsaved-changes guard scenarios

**No API, schema, or database changes required.** All changes are UI-layer only.

## Non-Goals

- Auto-save for edit mode (tracked in issue #217)
- Draft infrastructure for new recipe auto-save
- Changes to any route files (no `cancelTo` prop threading required)
- Undo/redo history

## Risks

- **`useBlocker` and `enableBeforeUnload`**: The native `beforeunload` dialog is browser-controlled and cannot be styled. This is expected and acceptable behaviour.
- **Dirty detection false positives**: If `MultiSelectDropdown` changes the order of selected IDs (e.g. on render), comparison must be order-insensitive. Sorted comparison mitigates this.
- **`router.history.back()` on direct URL access**: If a user opens the form via a bookmarked URL (no prior history), `history.back()` could navigate outside the app. The `window.history.length <= 1` fallback to `/recipes` handles this.

## Open Questions

None — all scope decisions resolved in discovery.

---

*Scope change note: If scope changes after approval, proposal.md, design.md, specs, and tasks.md must be updated before implementation proceeds.*

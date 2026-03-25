# Spec: Recipe Delete Cascade

## Capability
When a recipe is deleted, all dependent database documents are cleaned up atomically and the user is informed if the operation fails.

## Requirements

### R1 — Cascade on Delete
When `recipes.delete` succeeds, the following must be true:
- The Recipe document exists in the `recipes` collection with `deleted: true` (it is NOT removed)
- The Recipe document is NOT visible via any application query (list, getById, cookbook lookup)
- No cookbook's `recipes` array contains an entry with `recipeId` equal to the deleted recipe's ID
- No `RecipeLike` document exists with `recipeId` equal to the deleted recipe's ID

### R2 — Atomic Transaction
The three delete operations (Recipe, Cookbook entries, RecipeLikes) must execute inside a single MongoDB session transaction. If any operation fails, all three are rolled back.

### R3 — Error Surfaced in Modal
If the transaction fails, the delete confirmation modal must remain open and display a human-readable error message via `FormError` above the action buttons. The error must have `role="alert"`.

### R4 — No Error on Clean Delete
When the recipe has no associated cookbook entries or likes, the delete must still succeed without error.

### R5 — Error Cleared on Cancel
When the user cancels the modal after an error, the error state is reset so it does not persist if they re-open the modal.

## Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A recipe exists in one or more cookbooks | Owner deletes the recipe | Recipe document is soft-deleted (`deleted: true`) and all cookbook entries for that recipe are removed |
| AC2 | A recipe has one or more likes | Owner deletes the recipe | All `RecipeLike` docs for that recipe are removed |
| AC3 | A recipe exists with no cookbook or like references | Owner deletes the recipe | Delete succeeds with `{ success: true }`; document remains with `deleted: true` |
| AC4 | A DB error occurs mid-transaction | Owner confirms delete | Modal stays open; error message appears inside modal with `role="alert"` |
| AC5 | Error is showing in modal | User clicks Cancel | Modal closes; error is cleared |

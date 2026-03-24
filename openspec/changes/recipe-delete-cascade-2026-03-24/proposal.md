# Recipe Delete Cascade — Proposal

**GitHub Issue:** [#179](https://github.com/dougis/cookbook-tanstack/issues/179)
**Labels:** bug, api, database

## Problem

`recipes.delete` in `src/server/trpc/routers/recipes.ts` only deletes the Recipe document. It does not:

1. Remove the deleted recipe from any cookbook's embedded `recipes` array — deleted recipes remain as stale entries in cookbooks.
2. Delete orphaned `RecipeLike` documents for the deleted recipe — these accumulate indefinitely.

This was a Milestone 02 requirement (tasks 47–51) that was never implemented.

## Solution

Wrap the three required delete operations in a single **MongoDB multi-document transaction** to guarantee all-or-nothing atomicity:

1. `Recipe.findByIdAndDelete(id)` — delete the recipe
2. `Cookbook.updateMany({ 'recipes.recipeId': id }, { $pull: { recipes: { recipeId: id } } })` — remove stale cookbook entries
3. `RecipeLike.deleteMany({ recipeId: id })` — purge orphaned likes

If the transaction fails, a user-visible error is shown **inside the delete confirmation modal** rather than silently swallowing the failure.

## Scope

### Infrastructure (prerequisite for transactions)
- `docker-compose.yml` — run MongoDB as a single-node replica set (`--replSet rs0`) with a `mongo-init` dependent service that runs `rs.initiate()`
- `src/test-helpers/db-global-setup.ts` — switch from `MongoMemoryServer` to `MongoMemoryReplSet` so integration tests can use transactions

### Backend
- `src/server/trpc/routers/recipes.ts` — rewrite `delete` mutation with `mongoose.startSession()` + `session.withTransaction()`, importing `Cookbook` and `mongoose`

### Frontend
- `src/components/recipes/DeleteConfirmModal.tsx` — add optional `error` prop, render `FormError` inside the modal when set
- `src/routes/recipes/$recipeId.tsx` — add `deleteError` state, wire `onError` on `deleteMutation`

### Tests (TDD — tests written before implementation)
- New integration tests in `src/server/trpc/routers/__tests__/recipes.test.ts` covering cascading cleanup

## Out of Scope
- Cookbook router — no changes needed; the cascade is handled server-side on recipe delete
- Transaction rollback simulation tests — injecting mid-transaction failures requires mocking internals; coverage is provided by the happy-path cascade tests and MongoDB's own transaction guarantees

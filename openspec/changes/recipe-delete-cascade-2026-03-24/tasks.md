# Recipe Delete Cascade — Tasks

## 1. Branch Setup

- [x] 1.1 Checkout `main`, pull latest remote changes
- [x] 1.2 Create feature branch `feat/recipe-delete-cascade-2026-03-24`

## 2. Infrastructure — Replica Set Support

- [x] 2.1 Update `docker-compose.yml` to run MongoDB as a single-node replica set: add `command: ["--replSet", "rs0", "--bind_ip_all"]` and a `healthcheck` to the `mongodb` service; add a `mongo-init` one-shot service that `depends_on` the healthy `mongodb` and runs `rs.initiate()`
- [x] 2.2 Update `src/test-helpers/db-global-setup.ts` to use `MongoMemoryReplSet` instead of `MongoMemoryServer` (`replSet: { count: 1 }`) so integration tests support transactions
- [x] 2.3 Run `npm run test` to confirm all existing tests still pass with the replica-set memory server

## 3. Tests — Write Failing Tests First (TDD)

- [x] 3.1 In `src/server/trpc/routers/__tests__/recipes.test.ts`, add four new tests under `describe("recipes.delete")`:
  - `"removes the recipe from any cookbook's recipes array"` — seed a cookbook with the recipe in its `recipes` array, delete the recipe, assert the cookbook's `recipes` array no longer contains the entry
  - `"removes all RecipeLike documents for the recipe"` — seed a `RecipeLike`, delete the recipe, assert no `RecipeLike` exists with that `recipeId`
  - `"cleans up both cookbook entries and likes in a single delete"` — seed both, delete, assert both are gone
  - `"succeeds when the recipe has no cookbook or like references"` — delete a recipe with no associations, assert `{ success: true }` and no errors
- [x] 3.2 Run `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts` — confirm the four new tests **fail** (expected, implementation not yet written)

## 4. Backend — Transaction Implementation

- [x] 4.1 In `src/server/trpc/routers/recipes.ts`, add `Cookbook` to the `@/db/models` import and add `import mongoose from 'mongoose'`
- [x] 4.2 Rewrite the `delete` mutation body:
  - Call `verifyOwnership()` before starting the session (fail-fast guard, no session overhead on auth failure)
  - Open a session with `mongoose.startSession()`
  - Wrap the three operations in `session.withTransaction()`: `Recipe.findByIdAndDelete(id, { session })`, `Cookbook.updateMany(... $pull ..., { session })`, `RecipeLike.deleteMany({ recipeId: id }, { session })`
  - Use a `try/finally` to ensure `session.endSession()` always runs
  - On catch, throw `new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete recipe. Please try again.' })`
- [x] 4.3 Run `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts` — all five delete tests (including existing two) must pass

## 5. Frontend — Error in Modal

- [x] 5.1 In `src/components/recipes/DeleteConfirmModal.tsx`, add an optional `error?: string` prop to the interface; import `FormError`; render `<FormError message={error} />` above the action buttons row
- [x] 5.2 In `src/routes/recipes/$recipeId.tsx`:
  - Add `const [deleteError, setDeleteError] = useState<string | undefined>()`
  - Add `onError: (err) => setDeleteError(err.message)` to `deleteMutation`
  - Clear `deleteError` in the `onSuccess` handler and in the modal's `onCancel` handler
  - Pass `error={deleteError}` to `<DeleteConfirmModal>`

## 6. Validation

- [x] 6.1 Run `npm run test` — all tests pass
- [x] 6.2 Run `npm run test:e2e` — all E2E tests pass
- [x] 6.3 Start the app (`docker compose up -d && npm run dev`), add a recipe to a cookbook, add a like, delete the recipe — confirm the cookbook entry is gone and the like is removed

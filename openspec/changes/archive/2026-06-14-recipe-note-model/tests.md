---
name: tests
description: Tests for the recipe-note-model change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, implement the minimum code to pass it, then refactor. Tests live in `src/db/models/__tests__/RecipeNote.test.ts`, following the pattern established in `src/db/models/__tests__/notification.test.ts`.

Test runner: `npx vitest run src/db/models/__tests__/RecipeNote.test.ts`
Full suite: `npm run test`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — capture the requirement before writing implementation code; run and confirm it fails.
2. **Write code to pass** — implement the minimum in `src/db/models/RecipeNote.ts` to make the test pass.
3. **Refactor** — improve clarity/structure while keeping tests green.

---

## Test Cases

### Task 1 — Unit tests (written before model exists)

All cases use `withCleanDb` and `// @vitest-environment node` (same as `notification.test.ts`). Import `RecipeNote` from `@/db/models` once the barrel export is in place; until then import directly from `@/db/models/RecipeNote`.

#### Required fields

- [ ] **Missing `userId`** — construct `RecipeNote` with no `userId`, call `.save()`, assert it rejects (Mongoose `ValidationError`)
  - Spec: "Required field missing — userId"
  - Task: Task 1

- [ ] **Missing `recipeId`** — construct `RecipeNote` with no `recipeId`, call `.save()`, assert it rejects
  - Spec: "Required field missing — recipeId"
  - Task: Task 1

- [ ] **Missing `body`** — construct `RecipeNote` with no `body`, call `.save()`, assert it rejects
  - Spec: "Required field missing — body"
  - Task: Task 1

#### Body validation

- [ ] **Body maxlength** — construct `RecipeNote` with `body` of 10001 characters, call `.save()`, assert it rejects with a message matching `maxlength` or `body`
  - Spec: "Body exceeds maxlength"
  - Task: Task 1

- [ ] **Body at maxlength** — construct `RecipeNote` with `body` of exactly 10000 characters, call `.save()`, assert it resolves successfully
  - Spec: inverse of "Body exceeds maxlength"
  - Task: Task 1

- [ ] **Body trim** — construct `RecipeNote` with `body: "  hello  "`, save and read back, assert `doc.body === "hello"`
  - Spec: "Body is trimmed on save"
  - Task: Task 1

#### Timestamps

- [ ] **Auto timestamps** — save a valid `RecipeNote`, assert `doc.createdAt` is a `Date` instance and `doc.updatedAt` is a `Date` instance
  - Spec: "Timestamps are auto-populated"
  - Task: Task 1

#### Happy path

- [ ] **Valid note saves** — save a `RecipeNote` with valid `userId`, `recipeId`, and `body`; assert all three fields are present on the returned document
  - Spec: "Save valid note"
  - Task: Task 1

#### Compound unique index

- [ ] **Duplicate (userId, recipeId) rejected** — save two `RecipeNote` documents with identical `userId` and `recipeId`; assert the second `.save()` rejects with an error whose `code` is `11000`
  - Spec: "Duplicate (userId, recipeId) rejected"
  - Task: Task 1

- [ ] **Same userId, different recipeId allowed** — save `RecipeNote(userId: A, recipeId: X)` then `RecipeNote(userId: A, recipeId: Y)`; assert both resolve successfully
  - Spec: "Same userId, different recipeId allowed"
  - Task: Task 1

---

### Task 2 — Model implementation

No additional test cases — Task 1 tests drive the implementation. After writing `src/db/models/RecipeNote.ts`, all Task 1 tests must pass.

Verification command: `npx vitest run src/db/models/__tests__/RecipeNote.test.ts`

---

### Task 3 — Barrel export

- [ ] **Named export resolves** — in the test file, replace the direct model import with `import { RecipeNote } from '@/db/models'`; re-run all tests; assert they all still pass (confirms the barrel export is correct)
  - Spec: "Named export resolves correctly"
  - Task: Task 3

---

### Task 4 — docs/database.md update

No automated test. Manual verification: open `docs/database.md` and confirm:
- `recipe-notes` collection is listed
- Fields `userId`, `recipeId`, `body`, `createdAt`, `updatedAt` are documented
- Compound unique index `(userId, recipeId)` is noted
- Tier gate note is present (`hasAtLeastTier(user, 'sous-chef')` enforced at API layer)

---

## No `hiddenByTier` test

There is intentionally no test for a `hiddenByTier` field. Its absence is the design. If a future contributor inadvertently adds the field, the model review and spec traceability will catch it.

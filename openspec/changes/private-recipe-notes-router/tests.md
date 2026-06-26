---
name: tests
description: Tests for the private-recipe-notes-router change
---

# Tests

## Overview

This document outlines the tests for the `private-recipe-notes-router` change. All work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor.

**Test file:** `src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`
**Test runner:** `npx vitest run src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`

## Testing Steps

1. **Write a failing test:** Write the test before any implementation. Run it — it must fail.
2. **Write code to pass the test:** Write the minimum code in `src/server/trpc/routers/privateRecipeNotes.ts` to make the test pass.
3. **Refactor:** Improve code quality and structure while keeping the test green.

## Test Cases

### `get` procedure

#### Task 2 — `get` tests (maps to specs scenario: Anonymous caller is rejected)
- [ ] `get` called without session → throws `UNAUTHORIZED`

#### Task 2 — `get` tests (maps to spec: Authenticated lower-tier caller, no note exists)
- [ ] `get` called as `home-cook`, no note in DB → returns `{ hasNote: false, note: null }`
- [ ] `get` called as `prep-cook`, no note in DB → returns `{ hasNote: false, note: null }`

#### Task 2 — `get` tests (maps to spec: Authenticated lower-tier caller, note exists)
- [ ] `get` called as `home-cook`, note exists in DB → returns `{ hasNote: true, note: null }`
- [ ] `get` called as `prep-cook`, note exists in DB → returns `{ hasNote: true, note: null }`

#### Task 2 — `get` tests (maps to spec: Sous Chef caller, no note exists)
- [ ] `get` called as `sous-chef`, no note in DB → returns `{ hasNote: false, note: null }`

#### Task 2 — `get` tests (maps to spec: Sous Chef caller, note exists)
- [ ] `get` called as `sous-chef`, note exists → returns `{ hasNote: true, note: { body: <expected>, updatedAt: <date> } }`
- [ ] `note.body` matches the seeded note body exactly
- [ ] `note.updatedAt` is a `Date` instance

#### Task 2 — `get` tests (maps to spec: Executive Chef caller, note exists)
- [ ] `get` called as `executive-chef`, note exists → returns `{ hasNote: true, note: { body, updatedAt } }`

---

### `upsert` procedure

#### Task 2 — `upsert` tests (maps to spec: Lower-tier caller is rejected)
- [ ] `upsert` called as `home-cook` → throws `FORBIDDEN`
- [ ] `upsert` called as `prep-cook` → throws `FORBIDDEN`

#### Task 2 — `upsert` tests (maps to spec: Body exceeds 10,000 characters)
- [ ] `upsert` with body of 10,001 characters → throws `BAD_REQUEST`
- [ ] `upsert` with body of exactly 10,000 characters → succeeds (maps to spec: Body at exactly 10,000 characters is accepted)

#### Task 2 — `upsert` tests (maps to spec: Recipe not found or not visible)
- [ ] `upsert` with a random `recipeId` that doesn't exist in DB → throws `NOT_FOUND`
- [ ] `upsert` with a `recipeId` belonging to a private recipe owned by a different user → throws `NOT_FOUND`

#### Task 2 — `upsert` tests (maps to spec: Create note on a public recipe)
- [ ] `upsert` as `sous-chef` on a public recipe → note created; subsequent `get` as `sous-chef` returns `{ hasNote: true, note: { body: <expected> } }`

#### Task 2 — `upsert` tests (maps to spec: Create note on caller's own private recipe)
- [ ] `upsert` as `sous-chef` on caller's own non-public recipe → note created successfully

#### Task 2 — `upsert` tests (maps to spec: Update existing note — upsert semantics)
- [ ] `upsert` twice with different bodies on same `(userId, recipeId)` → only one document exists in `RecipeNote` collection; body matches second call's value

---

### `delete` procedure

#### Task 2 — `delete` tests (maps to spec: Lower-tier caller is rejected)
- [ ] `delete` called as `home-cook` → throws `FORBIDDEN`
- [ ] `delete` called as `prep-cook` → throws `FORBIDDEN`

#### Task 2 — `delete` tests (maps to spec: Delete existing note)
- [ ] `delete` as `sous-chef`, note exists → succeeds; subsequent `get` returns `{ hasNote: false, note: null }`

#### Task 2 — `delete` tests (maps to spec: Delete non-existent note)
- [ ] `delete` as `sous-chef`, no note exists → throws `NOT_FOUND`

---

### Router registration (Task 4)

- [ ] `appRouter` includes `privateRecipeNotes` namespace — verified by TypeScript compilation (`npx tsc --noEmit`) and by the integration tests being callable via `appRouter.createCaller(...).privateRecipeNotes.get(...)`

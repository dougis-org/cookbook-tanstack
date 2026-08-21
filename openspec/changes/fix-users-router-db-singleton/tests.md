---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-users-router-db-singleton` change. All work should follow a strict TDD (Test-Driven Development) process. All test cases live in `src/server/trpc/routers/__tests__/users.test.ts` (new/modified) and are exercised via `npm run test:unit` / `npx vitest run src/server/trpc/routers/__tests__/users.test.ts`.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task: Inspect current test mocking

- [ ] **Confirm baseline** — run `npx vitest run src/server/trpc/routers/__tests__/users.test.ts` against the unmodified codebase and confirm all existing tests pass. This establishes the pre-change baseline before any source edit.
- [ ] **Confirm test isolation strategy** — read `src/server/trpc/routers/__tests__/test-helpers.ts` (or equivalent) to confirm `withCleanDb`/`withSeededUser` operate against a real/test MongoDB instance rather than mocking `@/db`. (No `vi.mock('@/db', ...)` was found in `users.test.ts` at proposal time — confirm this is still true before proceeding, since a mock would need updating to avoid masking the collection-accessor swap.)

### Task: Update `users.ts` import, `search` collection access, `updateProfile` collection access

Maps to spec scenario: "`search` returns matching users using the shared collection accessor" and "`updateProfile` persists changes using the shared collection accessor" (`specs/users-router-data-access/spec.md`).

- [ ] **Test case 1 (existing, must still pass unmodified):** `users.search` — "returns matching users and excludes the caller" — verifies `search` still queries and returns correct results after the `getBetterAuthCollection("user")` swap.
- [ ] **Test case 2 (existing, must still pass unmodified):** `users.search` — "limits results to 10" — verifies `.limit(10)` behavior is unaffected by the collection-accessor swap.
- [ ] **Test case 3 (existing, must still pass unmodified):** `users.updateProfile` — "updates user name and returns updated user data" — verifies `updateProfile`'s write path is unaffected by the collection-accessor swap.
- [ ] **Test case 4 (existing, must still pass unmodified):** `users.updateProfile` — "returns null when user is not found after update" — verifies the not-found path still resolves correctly via `getBetterAuthCollection("user")`.
- [ ] **Test case 5 (existing, must still pass unmodified):** `users.updateProfile` — "updates successfully even if findOneAndUpdate has driver quirks" — verifies the fallback `updateOne`/`findOne` path (untouched by this change) still functions against the new accessor.
- [ ] **Verification (source-level, not a runtime test):** `grep -n "getMongoClient().db().collection(\"user\")" src/server/trpc/routers/users.ts` returns zero matches after the change.

### Task: Update `search` input schema (`.trim().min(2).max(254)`)

Maps to spec scenario: "Query at the minimum boundary is accepted", "Query at the maximum boundary is accepted", "Query exceeding the maximum boundary is rejected", "Whitespace-padded query is trimmed before length validation", "Query that is too short after trimming is rejected" (`specs/users-router-data-access/spec.md`).

- [ ] **Test case 6 (existing, must still pass unmodified):** `users.search` — "rejects queries shorter than 2 characters" (`query: "x"`, 1 char) — still rejected after the schema change.
- [ ] **Test case 7 (new — write failing first):** `users.search` — accepts a query of exactly 2 characters with no whitespace (e.g. `"ab"`) and does not throw a validation error. Fails before the change only if the current `.min(2)`-only schema behaves differently at this exact boundary (it should already pass; this test locks in the boundary post-change).
- [ ] **Test case 8 (new — write failing first):** `users.search` — accepts a query of exactly 254 characters (e.g. `"a".repeat(254)`) and does not throw. Fails before the change because no `.max()` exists yet to define this boundary as intentional (test still technically passes pre-change since there's no upper bound at all — the point of this test is to lock in 254 as the sanctioned boundary going forward, so write it referencing the new schema before implementing).
- [ ] **Test case 9 (new — write failing first):** `users.search` — rejects a query of 255 characters (e.g. `"a".repeat(255)`) with a thrown validation error. **Must fail before the change** (no `.max()` exists yet, so a 255-char query currently succeeds), and **must pass after** adding `.max(254)`.
- [ ] **Test case 10 (new — write failing first):** `users.search` — a whitespace-padded query `"  ab  "` (6 chars raw, 2 significant) behaves identically to `"ab"` — i.e. succeeds and is not treated as an 6-character query for bounding purposes. **Must fail before the change** (no `.trim()` exists yet, so length checks run against the raw 6-char string — though 6 is still within the old unbounded range, so use a version of this test that also exercises the trim-then-max interaction, e.g. a query that is 253 significant chars padded to 260 raw chars, which would incorrectly reject pre-`.trim()` but correctly accept post-`.trim()`), and **must pass after** adding `.trim()`.
- [ ] **Test case 11 (new — write failing first):** `users.search` — a query of `" a"` (2 chars raw, whitespace + 1 significant char) is rejected with a validation error, because trimming reduces it below the 2-character minimum. **Must fail before the change** (currently passes `min(2)` since trimming doesn't happen), and **must pass after** adding `.trim()`.

### Task: Confirm acceptance criteria are covered

- [ ] Cross-check: every scenario in `openspec/changes/fix-users-router-db-singleton/specs/users-router-data-access/spec.md` has at least one corresponding test case above (functional + NFAC). Functional scenario "Over-length query never reaches the database" (NFAC Security) is satisfied by test case 9 combined with an assertion (or code-review confirmation) that Zod validation errors are thrown by the tRPC input pipeline before the procedure handler body executes — no additional runtime test needed beyond test case 9, per the spec's explicit cross-reference instruction.

## Regression Guard

- [ ] Run the full `users.test.ts` file (not just new cases) after implementation: `npx vitest run src/server/trpc/routers/__tests__/users.test.ts` — all tests (existing + new) must pass.
- [ ] Run the full project unit suite: `npm run test:unit` — confirm no other test file's mocks or fixtures assumed `getMongoClient` was called directly from `users.ts` (e.g. a shared test helper spying on `getMongoClient` call counts).

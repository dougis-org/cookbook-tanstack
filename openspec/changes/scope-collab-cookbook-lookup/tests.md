---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `scope-collab-cookbook-lookup` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `getCollabCookbookIds` on `Context` (`src/server/trpc/context.ts`)

- [ ] **Test 1.1 — Success resolves to expected IDs** (maps to spec: "Successful resolution is unaffected and memoized across multiple reads in one request"): mock `Collaborator.find` to resolve with fixture docs; call `getCollabCookbookIds()`; assert the resolved array equals the fixture cookbook IDs as strings.
- [ ] **Test 1.2 — Repeated calls within one context memoize to a single query** (maps to spec: "Successful resolution is unaffected and memoized across multiple reads in one request"; NFAC "At most one underlying query per request regardless of read count"): mock/spy `Collaborator.find`; call `getCollabCookbookIds()` twice (including via `Promise.all` to cover concurrent calls before the first resolves); assert `Collaborator.find` was called exactly once and both calls resolve to the same value.
- [ ] **Test 1.3 — Failure rejects with `TRPCError`, not the raw exception** (maps to spec: "Lookup failure inside a cookbooks procedure surfaces as a retryable error"): mock `Collaborator.find` to reject with a generic `Error`; call `getCollabCookbookIds()`; assert the returned promise rejects with a `TRPCError` where `code === "INTERNAL_SERVER_ERROR"` and `message` matches the retry-friendly copy specified in design.md Decision 2.
- [ ] **Test 1.4 — Failure is logged** (maps to design.md Decision 2 operability requirement): spy on `console.error`; trigger the failure path from Test 1.3; assert `console.error` was called with a recognizable `[context.collabCookbookIds]`-style prefix and the original error.
- [ ] **Test 1.5 — A new context after a prior failure resolves independently** (maps to NFAC "A transient lookup failure does not poison subsequent, unrelated requests"): create context A, mock `Collaborator.find` to reject, call `getCollabCookbookIds()` on A and confirm it rejects; create a fresh context B with `Collaborator.find` mocked to resolve normally, call `getCollabCookbookIds()` on B, and confirm it resolves successfully with no residual error/caching from A.

### Task 2 — Updated `context.ts` comment block

- [ ] **Test 2.1 — Documentation review only** (no automated test per design.md Decision 4's validation approach): manual PR-review checklist item confirming the comment above the `collabCookbookIds` block states the finished rationale (lazy/scoped, fails loud, links `design.md`) and no longer frames the asymmetry as an open question referencing "#677" as unresolved.

### Task 3 — `cookbooks.ts` call sites (`list`, `byId`, `printById`)

- [ ] **Test 3.1 — `list` success path unchanged** (maps to spec: "Successful resolution is unaffected..."): existing `list` fixture test continues to pass after switching to `await ctx.getCollabCookbookIds()`; assert returned cookbooks include collaborative cookbooks for a collaborator, as today.
- [ ] **Test 3.2 — `list` failure surfaces as `TRPCError`** (maps to spec: "Lookup failure inside a cookbooks procedure surfaces as a retryable error"): mock `Collaborator.find` to reject; call `list` via a test caller; assert the call rejects with the expected `TRPCError` and that no cookbook data is returned as a fallback.
- [ ] **Test 3.3 — `byId` success path unchanged**: existing `byId` fixture test continues to pass for a collaborator viewing a collaborative cookbook.
- [ ] **Test 3.4 — `byId` failure surfaces as `TRPCError`**: mock `Collaborator.find` to reject; call `byId` for a cookbook a user would only see via collaboration; assert `TRPCError` rejection.
- [ ] **Test 3.5 — `printById` resolves the value once and reuses it across all three read sites** (maps to spec NFAC "At most one underlying query per request regardless of read count"): spy on `Collaborator.find`; call `printById` for a collaborator (exercising both `visibilityFilter` calls and the `isAuthorized`/`includes` check); assert exactly one `Collaborator.find` invocation and that all three consumers see consistent IDs.
- [ ] **Test 3.6 — `printById` failure surfaces as `TRPCError`**: mock `Collaborator.find` to reject; call `printById`; assert `TRPCError` rejection and that the procedure does not fall through to treating the caller as a non-collaborator.

### Task 4 — `alexa.ts` context construction and isolation

- [ ] **Test 4.1 — Alexa context type-compiles and resolves an empty list**: construct the Alexa router's context object; call `getCollabCookbookIds()` on it; assert it resolves to `[]` without touching `Collaborator`.
- [ ] **Test 4.2 — Alexa procedures are unaffected by a `Collaborator` failure** (maps to spec: "Non-cookbooks procedures are unaffected by lookup failure and never trigger the lookup"): mock `Collaborator.find` to reject/throw if called; invoke an `alexa.ts` procedure; assert it succeeds normally and `Collaborator.find` is never called.

### Task 5 — Shared test fixtures (`test-helpers.ts`)

- [ ] **Test 5.1 — `makeAuthCaller`'s public `collabCookbookIds` option still works**: call `makeAuthCaller(userId, { collabCookbookIds: [id] })` and confirm a `cookbooks.ts` procedure invoked through the returned caller sees that ID via `getCollabCookbookIds()` — this is a regression check that the fixture's internal refactor (option name unchanged, internal construction changed to an accessor) is transparent to the 12 existing `cookbooks.test.ts` call sites.
- [ ] **Test 5.2 — Unauthenticated caller fixture (`test-helpers.ts` line ~94) compiles and resolves an empty list**: confirm the unauthenticated caller's context exposes a `getCollabCookbookIds` that resolves to `[]`.

### Task 6 — `context.test.ts` / `context.integration.test.ts` updates

- [ ] **Test 6.1 — Existing direct-field assertions updated**: any pre-existing test asserting `ctx.collabCookbookIds === [...]` is updated to `await ctx.getCollabCookbookIds()` and continues to pass with equivalent coverage.
- [ ] **Test 6.2 — Integration-level success path**: `context.integration.test.ts` exercises a real (test-DB) `Collaborator` lookup through `getCollabCookbookIds()` and confirms it returns the expected IDs for a seeded collaborator relationship, matching pre-change integration coverage.

### Task 7 — Isolation verification (non-code-change task, validation-only)

- [ ] **Test 7.1 — Isolation scenario for `recipes.ts`** (maps to spec: "Non-cookbooks procedures are unaffected by lookup failure and never trigger the lookup"): mock `Collaborator.find` to reject/throw if called; invoke a `recipes.ts` procedure (e.g. `list`); assert it succeeds normally and `Collaborator.find` is never invoked.
- [ ] **Test 7.2 — Isolation scenario for `privateRecipeNotes.ts`**: same pattern as 7.1, invoking a `privateRecipeNotes.ts` procedure.
- [ ] **Test 7.3 — Static verification**: `grep -rn "collabCookbookIds\|getCollabCookbookIds" src/server --include="*.ts"` reviewed manually to confirm no consumer exists outside `context.ts`, `cookbooks.ts`, `alexa.ts`, and test files — a structural backstop for Tests 7.1/7.2.

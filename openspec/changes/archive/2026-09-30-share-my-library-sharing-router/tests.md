---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `share-my-library-sharing-router` change.
All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test
    that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the
    test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test
    still passes.

## Test Cases

### Task A.1 — Promote `execChefProcedure`

- [ ] Existing `cookbooks.ts` collaboration integration tests pass unchanged after
      the move (regression, not a new test) — maps to design.md Decision 9

### Task A.2 — Extract the owner-tier-eligibility pipeline helper

- [ ] New unit test: helper includes an owner whose tier is `executive-chef` — maps
      to design.md Decision 8
- [ ] New unit test: helper excludes an owner whose tier is below `executive-chef`
      — maps to design.md Decision 8
- [ ] Existing `context.ts` `sharedOwnerIds` tests pass unchanged after the
      refactor: grant → visible; owner downgrade → invisible; owner re-upgrade →
      visible again; zero grant rows → `[]` with no owner-tier lookup executed;
      failed lookup → `[]` (fail closed) — regression, not new tests

### Task B — `shareLibrary` grant procedure

- [ ] Test: Executive Chef owner creates a grant; row has correct `ownerId`,
      `recipientId`, `addedBy`, and populated `addedAt` — maps to spec Scenario
      "Executive Chef grants access to another user"
- [ ] Test (table-driven): caller at `home-cook` receives `FORBIDDEN`; no row
      created — maps to spec Scenario "Non-Executive-Chef caller is rejected"
- [ ] Test (table-driven): caller at `prep-cook` receives `FORBIDDEN`; no row
      created — maps to spec Scenario "Non-Executive-Chef caller is rejected"
- [ ] Test (table-driven): caller at `sous-chef` receives `FORBIDDEN`; no row
      created — maps to spec Scenario "Non-Executive-Chef caller is rejected"
- [ ] Test: unauthenticated caller receives `UNAUTHORIZED` — maps to spec Scenario
      "Unauthenticated caller is rejected"
- [ ] Test: self-share (`recipientId === ctx.user.id`) receives `BAD_REQUEST`; no
      row created — maps to spec Scenario "Self-share is rejected before any
      recipient lookup"
- [ ] Test: non-existent recipient id receives `NOT_FOUND`; no row created — maps
      to spec Scenario "Unknown recipient is rejected"
- [ ] Test: duplicate pair receives `CONFLICT`; exactly one row remains — maps to
      spec Scenario "Duplicate grant is rejected"

### Task C — `revokeLibraryShare` and listing procedures

- [ ] Test: owner revokes their own grant; row is deleted — maps to spec Scenario
      "Owner revokes a grant"
- [ ] Test: a user who is neither owner nor recipient attempts revoke; receives
      `FORBIDDEN`; grant survives — maps to spec Scenario "Non-owner cannot revoke a
      grant"
- [ ] Test: the recipient attempts to revoke their own received grant; receives
      `FORBIDDEN`; grant survives — maps to spec Scenario "The recipient cannot
      revoke their own received grant"
- [ ] Test: revoking a non-existent grant id receives `NOT_FOUND` — maps to spec
      Scenario "Revoking a non-existent grant is distinguished from a forbidden one"
- [ ] Test: `myLibraryShares` returns grants given, each with the recipient's
      display name — maps to spec Scenario "Owner lists grants they have given"
- [ ] Test: `mySharedLibraries` returns grants received, each with the owner's
      display name — maps to spec Scenario "Recipient lists libraries shared with
      them"
- [ ] Test: a grant from an owner currently below `executive-chef` is absent from
      both `myLibraryShares` (called by that owner) and `mySharedLibraries` (called
      by the recipient); the `LibraryShare` document still exists in both cases —
      maps to spec Scenario "A downgraded owner's grant is excluded from both
      listings"
- [ ] Test: after the owner's tier is restored to `executive-chef`, the grant
      reappears in both listings with no new `LibraryShare` document created —
      maps to spec Scenario "A re-upgraded owner's grant reappears with no
      re-grant"
- [ ] Test: every entry returned by `myLibraryShares` and `mySharedLibraries` has no
      `email` key and no `tier` key — maps to spec Non-Functional Acceptance
      Criteria Scenario "Listings never include email or tier"

### Task D — Wire up the router

- [ ] Test: `trpc.sharing.shareLibrary` is callable end-to-end through the composed
      `appRouter` (not just the isolated procedure) — maps to design.md Decision 13
      validation approach
- [ ] Verification (not a test): `npx tsc --noEmit && npm run build` succeeds with
      the new router registered in `src/server/trpc/router.ts`

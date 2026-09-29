---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `share-my-library-read-path-integration`
change. All work follows a strict TDD process.

Each case below maps to a task in `tasks.md` and to an acceptance scenario in
`specs/library-sharing-read-path/spec.md`. Notation: **[T n.n]** = task, **[S: name]**
= spec requirement.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that
   captures the requirements of the task. Run it and confirm it fails *for the expected
   reason* — a test that fails because of a typo or missing import proves nothing.
2. **Write code to pass the test:** Write the simplest code that makes the test pass.
3. **Refactor:** Improve structure while keeping the test green.

## Test Fixtures

Reuses the fixture cast established by the parent plan
(`openspec/changes/share-my-library/tests.md`), since this change's tests exercise the
same actors at the read-path layer:

- `owner` — verified user, tier `executive-chef`, with private and public recipes and a
  private cookbook
- `recipient` — verified user, tier `home-cook` (deliberately the lowest tier, to prove
  no recipient tier floor exists)
- `stranger` — verified user with no relationship to `owner`
- `grant(owner, recipient)` — helper creating a `LibraryShare`
- `setTier(user, tier)` — helper mutating tier directly in the DB, to simulate
  downgrade without going through billing
- `collaborator(user, cookbook)` — existing helper adding `user` as a `Collaborator` on
  `cookbook`, used only in the 3.4.4 overlap case

## Test Cases

### Task 3.1 — Call-site threading _(integration)_

- [ ] Recipient's `recipes.list` includes the owner's private recipe **[T 3.1]**
      **[S: ADDED Recipient visibility / "Recipient sees the owner's private recipes"]**
- [ ] Recipient's `recipes.byId` succeeds for the owner's private recipe **[T 3.1]**
      **[S: ADDED Recipient visibility / "Recipient sees an individual shared recipe by id"]**
- [ ] Recipient's `cookbooks.list` includes the owner's private cookbook **[T 3.1]**
      **[S: ADDED Recipient visibility / "Recipient sees the owner's cookbooks"]**
- [ ] Recipient's `cookbooks.byId` succeeds for the owner's private cookbook **[T 3.1]**
      **[S: ADDED Recipient visibility / "Recipient sees an individual shared cookbook by id"]**
- [ ] Recipe created by the owner *after* the grant is visible to the recipient
      **[T 3.1]** **[S: ADDED Recipient visibility / "Content created after the grant is included"]**
- [ ] `stranger` sees none of the owner's private content in `recipes.list` or
      `cookbooks.list` **[T 3.1]** **[S: ADDED Recipient visibility / "Non-grantee sees nothing"]**
- [ ] Recipient's own recipe and a public recipe both carry `sharedBy: null` **[T 3.1]**
      **[S: ADDED Recipient visibility / "Owned and public content is not annotated"]**
- [ ] One case per remaining `visibilityFilter` call site found by the 3.1.1 audit,
      asserting shared content surfaces there too **[T 3.1]**
- [ ] Owner's `hiddenByTier: true` recipe is absent for the recipient **[T 3.1]**
      **[S: ADDED Hidden content stays hidden in shared reads / "Tier-hidden content is not shared"]**
- [ ] Owner's soft-deleted recipe is absent for the recipient **[T 3.1]**
      **[S: ADDED Hidden content stays hidden in shared reads / "Soft-deleted content is not shared"]**
- [ ] Regression: a caller with `sharedOwnerIds: []` produces byte-identical filter
      output to pre-change `visibilityFilter` behavior **[T 3.1]**

### Task 3.2 — `sharedBy` payload _(integration)_

- [ ] Shared recipe carries `sharedBy: { id, name }` matching the owner **[T 3.2]**
      **[S: ADDED Recipient visibility / "Recipient sees the owner's private recipes"]**
- [ ] Shared cookbook carries `sharedBy` **[T 3.2]**
      **[S: ADDED Recipient visibility / "Recipient sees the owner's cookbooks"]**
- [ ] Payload contains no owner `email` and no owner `tier`, checked across the full
      response shape, not only inside `sharedBy` **[T 3.2]**
      **[S: ADDED Recipient visibility / "Owner attribution exposes no other owner data"]**
- [ ] Owner names resolve in a single batched query for a list of N shared items — not N
      queries (query-count assertion using the existing query-counting harness pattern
      from `context.integration.test.ts`) **[T 3.2]** **[S: NFAC Performance / "`sharedBy`
      resolution is batched, not per-row"]**
- [ ] The added `$lookup` stage is ordered after existing filter/sort/pagination stages
      — regression test confirming pagination and sort order are unaffected by the new
      stage **[T 3.2]**

### Task 3.3 — Cross-owner cookbook entries _(integration)_

- [ ] Recipient adds the owner's shared recipe to their own cookbook: entry persists and
      **no new `Recipe` document is created** **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks / "Recipient adds a shared recipe to their own cookbook"]**
- [ ] Recipient's recipe quota usage is unchanged after adding **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks / "Recipient adds a shared recipe to their own cookbook"]**
- [ ] Entry resolves through `cookbooks.byId` with `sharedBy` populated **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks / "Shared entry resolves with attribution"]**
- [ ] Owner edits the recipe; recipient sees the updated content (live reference, not a
      copy) **[T 3.3]** **[S: ADDED Adding shared recipes to own cookbooks / "Owner's later edits are reflected"]**
- [ ] After revocation: entry present, `unavailable: true`, `orderIndex` and `chapterId`
      preserved, and **no name / ingredients / instructions leaked** **[T 3.3]**
      **[S: ADDED Unavailable shared entries / "Entry becomes unavailable after revocation"]**
- [ ] After owner downgrade: entry `unavailable: true` **[T 3.3]**
      **[S: ADDED Unavailable shared entries / "Entry becomes unavailable after owner downgrade"]**
- [ ] After owner soft-deletes the recipe (grant still active): entry `unavailable: true`
      **[T 3.3]** **[S: ADDED Unavailable shared entries / "Entry becomes unavailable after the owner deletes the recipe"]**
- [ ] Recipient cannot add a recipe they cannot see (unrelated private recipe) to their
      cookbook — `FORBIDDEN`/`NOT_FOUND`, `recipes[]` unchanged **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks / "Recipient cannot add a recipe they cannot see"]**
- [ ] Print route does not render cross-owner entries at all (not `unavailable`, not
      rendered) — guard until #669 **[T 3.3]**
      **[S: ADDED Unavailable shared entries / "The print route excludes cross-owner entries"]**
- [ ] Every other consumer of `Cookbook.recipes[]` found in the 3.3.4 audit resolves
      through visibility — one case per consumer **[T 3.3]**
      **[S: ADDED Unavailable shared entries / "Every other consumer of `Cookbook.recipes[]` resolves through visibility"]**

### Task 3.4 — Read-only enforcement _(integration)_

- [ ] Table-driven: **every** recipe mutation, enumerated from the `recipes` router
      definition, invoked by the recipient against the owner's recipe, returns
      `FORBIDDEN`/`NOT_FOUND` and leaves the document unchanged **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Every enumerated recipe mutation is rejected"]**
- [ ] Table-driven: **every** cookbook mutation, enumerated from the `cookbooks` router
      definition, invoked by the recipient against the owner's cookbook, returns
      `FORBIDDEN`/`NOT_FOUND` and leaves the document unchanged **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Every enumerated cookbook mutation is rejected"]**
- [ ] Recipient cannot add or remove recipe entries in the owner's cookbook **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Recipient cannot modify a shared cookbook's recipe entries"]**
- [ ] Recipient cannot add or remove collaborators on the owner's cookbook **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Recipient cannot manage a shared cookbook's collaborators"]**
- [ ] Recipient whose own tier is `executive-chef` shares their library with a third
      user; that user gains no visibility of the original owner's content **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Recipient cannot re-share the owner's library"]**
- [ ] A user who is both grantee and cookbook collaborator keeps edit rights on the
      collaborated cookbook while the rest stays read-only **[T 3.4]**
      **[S: ADDED Read-only enforcement / "Collaborator write access on one cookbook survives alongside read-only sharing"]**
- [ ] After revocation, re-requesting a previously visible shared document by id returns
      `NOT_FOUND` **[T 3.4]** **[S: NFAC Security / "Revoked access is not recoverable
      from client state"]**
- [ ] A `LibraryShare` whose `recipientId` points at a deleted user grants access to
      nobody and raises no error at any of the four touched endpoints **[T 3.4]**
      **[S: NFAC Reliability / "Orphaned grants are inert"]**
- [ ] The mutation-table introspection itself is verified non-vacuous: temporarily
      comment out one mutation's ownership check during development, confirm 3.4.2
      fails, then revert — this check is a development-time verification step, not a
      committed test, and must be performed before Task 3.4 is considered complete
      **[T 3.4]**

## Coverage Summary

| Task | Test count | Spec requirement(s) covered |
| ---- | ---------- | ---------------------------- |
| 3.1  | 11         | ADDED Recipient visibility; ADDED Hidden content stays hidden in shared reads |
| 3.2  | 5          | ADDED Recipient visibility (attribution); NFAC Performance |
| 3.3  | 10         | ADDED Adding shared recipes to own cookbooks; ADDED Unavailable shared entries |
| 3.4  | 9          | ADDED Read-only enforcement; NFAC Security; NFAC Reliability |

Every scenario in `specs/library-sharing-read-path/spec.md` has at least one
corresponding case above; no NFAC scenario duplicates a functional one — where a
functional scenario already proves an access-control or error-handling case, the NFAC
row cross-references it by name rather than repeating it, matching the parent spec's
established convention.

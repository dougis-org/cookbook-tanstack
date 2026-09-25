---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `share-my-library-foundation` change (Share My
Library epic PR 1 / #671). All work follows strict TDD: red, then green, then refactor.

Each case maps to a task in `tasks.md` and a scenario in
`specs/library-sharing-foundation/spec.md`. Notation: **[T n.n]** = task, **[S: name]**
= spec requirement.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** capture the requirement before writing implementation
   code. Run it and confirm it fails *for the expected reason* — a test failing on a
   typo or missing import proves nothing.
2. **Write code to pass the test:** the simplest change that makes it pass.
3. **Refactor:** improve structure while the test stays green.

## Test Fixtures

- `owner` — verified user, tier mutable in-test (start `executive-chef`)
- `recipient` — verified user, any tier (this PR does not gate recipients)
- `grant(owner, recipient)` — helper creating a `LibraryShare` row directly
- `setTier(user, tier)` — helper mutating tier directly in the DB, simulating a
  downgrade/upgrade without going through billing
- A query-count fixture or spy capable of asserting how many queries/aggregations run
  against `LibraryShare` and the `user` collection during a single context-creation call

## Test Cases

### Task 1.1 — `visibilityFilter` shared-owner clause _(unit)_

- [ ] Anonymous caller: filter is restricted to `isPublic: true`,
      `hiddenByTier: { $ne: true }`, `pendingVerification: { $ne: true }` regardless of
      what is passed for `sharedOwnerIds` **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause — "Anonymous callers are unaffected"]**
- [ ] Authenticated caller, `sharedOwnerIds` omitted: filter is structurally identical
      to the two-parameter output (regression guard) **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause — "Omitting the new parameter preserves prior behavior exactly"]**
- [ ] Authenticated caller, non-empty `sharedOwnerIds`: filter gains an `$or` clause on
      `userId: { $in: [...] }` **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause — "Shared-owner clause is added when ids are supplied"]**
- [ ] That clause also requires `hiddenByTier: { $ne: true }` **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause]**
- [ ] Invalid ObjectId strings in `sharedOwnerIds` are discarded, not passed to the
      query **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause — "Invalid ids are discarded before reaching the query"]**
- [ ] Existing collaborator clause is unchanged in shape when both parameters are
      non-empty **[T 1.1]**
      **[S: ADDED Visibility filter shared-owner clause — "Collaborator clause is unaffected when both parameters are supplied"]**
- [ ] No existing call site's query count changes when the new parameter is omitted
      **[T 1.1]** **[S: NFAC Performance — "No query-count regression for existing call sites"]**

### Task 1.2 — Relocate `userLookupStages` _(unit)_

- [ ] `userLookupStages(localField, alias)`, imported from `_helpers.ts`, returns the
      same two-stage `$lookup` + `$unwind` (`preserveNullAndEmptyArrays: true`) pipeline
      shape as the pre-move implementation **[T 1.2]**
- [ ] `cookbooks.ts`'s pre-existing `fetchCollaboratorsWithUsers` test suite passes
      **unchanged** — same assertions, same expected output — after the relocation
      **[T 1.2]** **[S: NFAC Operability — "Relocating a shared helper does not regress its existing caller"]**
- [ ] `cookbooks.ts` no longer defines `userLookupStages` locally; it imports the
      export from `_helpers.ts` **[T 1.2]**

### Task 1.3 — `LibraryShare` model _(unit)_

- [ ] Creating two documents with the same `(ownerId, recipientId)` throws a
      duplicate-key error; exactly one document exists afterward **[T 1.3]**
      **[S: ADDED LibraryShare grant storage — "Duplicate pair is rejected at the storage layer"]**
- [ ] Indexes exist on `ownerId`, on `recipientId`, and uniquely on the pair **[T 1.3]**
      **[S: ADDED LibraryShare grant storage]**
- [ ] Omitting `ownerId`, `recipientId`, or `addedBy` fails validation **[T 1.3]**
      **[S: ADDED LibraryShare grant storage — "Required fields are enforced"]**
- [ ] `addedAt` defaults to the creation time when not supplied **[T 1.3]**
      **[S: ADDED LibraryShare grant storage — "addedAt defaults without being supplied"]**
- [ ] The model file contains a comment explaining why grants are not deleted on
      downgrade, referencing this change's design doc **[T 1.3]**

### Task 1.4 — `ctx.sharedOwnerIds` resolution _(integration)_

- [ ] Grant from an `executive-chef` owner appears in `ctx.sharedOwnerIds` **[T 1.4]**
      **[S: ADDED Live owner-eligibility resolution in one query — "Eligible owner appears in the resolved set"]**
- [ ] Grant from an owner currently at `sous-chef` is excluded, and the grant row still
      exists afterward **[T 1.4]**
      **[S: ADDED Live owner-eligibility resolution in one query — "Downgraded owner is excluded without deleting the grant"]**
- [ ] Owner downgraded then re-upgraded to `executive-chef`: the same grant becomes
      effective again with no new row created **[T 1.4]**
      **[S: ADDED Live owner-eligibility resolution in one query — "Re-upgraded owner is included again with no new grant"]**
- [ ] Caller with zero `LibraryShare` rows as recipient: `ctx.sharedOwnerIds` is `[]`
      **and** exactly one aggregation runs against `LibraryShare`, matching nothing
      (assert via the query-count fixture) **[T 1.4]**
      **[S: ADDED Live owner-eligibility resolution in one query — "Recipient with no grants incurs no owner-tier lookup"]**
- [ ] Caller with one or more grants: exactly one additional round trip is issued,
      projecting only the owner id field **[T 1.4]**
      **[S: ADDED Live owner-eligibility resolution in one query — "Owner-tier resolution is a single round trip"]**
- [ ] Forcing the aggregation to throw: context creation still completes, and
      `ctx.sharedOwnerIds` is `[]` **[T 1.4]**
      **[S: ADDED Owner-eligibility lookup fails closed — "A failed eligibility lookup does not fail the request"]**
- [ ] Same forced-failure condition: the resulting context produces a visibility filter
      with no shared-owner clause **[T 1.4]**
      **[S: ADDED Owner-eligibility lookup fails closed — "A failed eligibility lookup does not expose shared content"]**
- [ ] A code comment is present on the `sharedOwnerIds` block explaining the fail-closed
      asymmetry with `collabCookbookIds` and referencing #677 **[T 1.4]**
- [ ] `collabCookbookIds`'s existing behavior (still throws on failure) is unchanged by
      this task — regression check, not new coverage **[T 1.4]**

## Coverage Check

Before opening the PR, verify every requirement in
`specs/library-sharing-foundation/spec.md` has at least one case above, and that every
case ran red before it ran green.

| Spec requirement | Covered by |
| ---------------- | ---------- |
| ADDED LibraryShare grant storage | T 1.3 |
| ADDED Live owner-eligibility resolution in one query | T 1.4 |
| ADDED Visibility filter shared-owner clause | T 1.1 |
| ADDED Owner-eligibility lookup fails closed | T 1.4 |
| NFAC Performance | T 1.1, T 1.4 |
| NFAC Security | T 1.1, T 1.4 (cross-referenced to functional scenarios) |
| NFAC Reliability | T 1.4 (cross-referenced to functional scenarios) |
| NFAC Operability | T 1.2 |

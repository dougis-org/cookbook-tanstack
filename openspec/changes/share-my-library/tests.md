---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `share-my-library` change. All work follows a
strict TDD process.

Each case below maps to a task in `tasks.md` and to an acceptance scenario in
`specs/library-sharing/spec.md`. Notation: **[T n.n]** = task, **[S: name]** = spec
requirement.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that
   captures the requirements of the task. Run it and confirm it fails *for the expected
   reason* — a test that fails because of a typo or missing import proves nothing.
2. **Write code to pass the test:** Write the simplest code that makes the test pass.
3. **Refactor:** Improve structure while keeping the test green.

## Test Fixtures

A shared fixture builds the recurring cast, since nearly every case needs it:

- `owner` — verified user, tier `executive-chef`, with private and public recipes and a
  private cookbook
- `recipient` — verified user, tier `home-cook` (deliberately the lowest tier, to prove
  no recipient tier floor exists)
- `stranger` — verified user with no relationship to `owner`
- `grant(owner, recipient)` — helper creating a `LibraryShare`
- `setTier(user, tier)` — helper mutating tier directly in the DB, to simulate
  downgrade without going through billing

## Test Cases

### Phase 1 — Foundation

**Task 1.1 — `visibilityFilter` shared-owner clause** _(unit)_

- [ ] Anonymous caller: filter restricts to `isPublic: true`, `hiddenByTier: { $ne: true }`,
      `pendingVerification: { $ne: true }` — unchanged from before **[T 1.1]**
      **[S: MODIFIED Content visibility filtering]**
- [ ] Authenticated caller, `sharedOwnerIds` omitted: filter is byte-equivalent to the
      pre-change output (regression guard) **[T 1.1]**
      **[S: MODIFIED Content visibility filtering]**
- [ ] Authenticated caller, non-empty `sharedOwnerIds`: filter gains an `$or` clause
      matching `userId: { $in: [...] }` **[T 1.1]** **[S: MODIFIED Content visibility filtering]**
- [ ] The shared clause also requires `hiddenByTier: { $ne: true }` **[T 1.1]**
      **[S: ADDED Hidden content stays hidden]**
- [ ] Invalid ObjectId strings in `sharedOwnerIds` are discarded, not passed to Mongo
      **[T 1.1]** **[S: MODIFIED Content visibility filtering]**
- [ ] Collaborator clause still present and unchanged when both are supplied **[T 1.1]**

**Task 1.2 — `LibraryShare` model** _(unit)_

- [ ] Creating two grants with the same `(ownerId, recipientId)` throws a duplicate-key
      error **[T 1.2]** **[S: ADDED Granting library access]**
- [ ] Indexes exist on `ownerId`, on `recipientId`, and uniquely on the pair **[T 1.2]**
- [ ] `addedAt` defaults to now; `addedBy` is required **[T 1.2]**

**Task 1.2 — `ctx.sharedOwnerIds`** _(integration)_

- [ ] Grant from an `executive-chef` owner appears in `ctx.sharedOwnerIds` **[T 1.2]**
      **[S: MODIFIED Request context composition]**
- [ ] Grant from an owner downgraded to `sous-chef` is excluded, and the grant row still
      exists afterwards **[T 1.2]** **[S: ADDED Tier downgrade suspends shares]**
- [ ] Owner re-upgraded to `executive-chef`: the same grant becomes effective again with
      no new row created **[T 1.2]** **[S: ADDED Tier downgrade suspends shares]**
- [ ] Caller with zero grant rows yields `[]` **and** performs no owner-tier lookup
      (assert query count) **[T 1.2]** **[S: MODIFIED Request context composition, NFAC Performance]**
- [ ] Caller with grants incurs exactly one additional indexed query beyond the
      pre-change baseline **[T 1.2]** **[S: NFAC Performance]**
- [ ] A thrown/timed-out tier lookup degrades to `[]` rather than propagating an error,
      and exposes no shared content **[T 1.2]** **[S: NFAC Reliability "Recovery behavior"]**

### Phase 2 — Sharing router

**Task 2.1 — `shareLibrary`** _(integration)_

- [ ] `executive-chef` owner creates a grant; row has correct `ownerId`, `recipientId`,
      `addedBy`, and a populated `addedAt` **[T 2.1]** **[S: ADDED Granting library access]**
- [ ] Each of `home-cook`, `prep-cook`, `sous-chef` receives `FORBIDDEN`; no row created
      (table-driven) **[T 2.1]** **[S: ADDED Granting library access]**
- [ ] Unauthenticated caller receives `UNAUTHORIZED` **[T 2.1]**
- [ ] Duplicate pair receives `CONFLICT`; exactly one row remains **[T 2.1]**
      **[S: ADDED Granting library access]**
- [ ] Self-share receives `BAD_REQUEST`; no row created **[T 2.1]**
      **[S: ADDED Granting library access]**
- [ ] Non-existent recipient id receives `NOT_FOUND` **[T 2.1]**

**Task 2.2 — `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`** _(integration)_

- [ ] Owner revokes; row deleted **[T 2.2]** **[S: ADDED Revoking a share]**
- [ ] Non-owner (including the recipient) receives `FORBIDDEN`; grant survives **[T 2.2]**
      **[S: ADDED Revoking a share]**
- [ ] `myLibraryShares` returns grants given, with recipient display name **[T 2.2]**
      **[S: ADDED Managing shares]**
- [ ] `mySharedLibraries` returns grants received, with owner display name **[T 2.2]**
      **[S: ADDED Managing shares]**
- [ ] Neither listing includes grants whose owner is currently below `executive-chef`
      **[T 2.2]** **[S: ADDED Tier downgrade suspends shares]**
- [ ] Neither listing exposes owner or recipient email or tier **[T 2.2]**
      **[S: NFAC Security "Owner identity is the only owner data exposed"]**

### Phase 3 — Read-path integration

**Task 3.1 — Call-site threading** _(integration)_

- [ ] Recipient's `recipes.list` includes the owner's private recipe **[T 3.1]**
      **[S: ADDED Recipient visibility]**
- [ ] Recipient's `cookbooks.list` includes the owner's private cookbook **[T 3.1]**
      **[S: ADDED Recipient visibility]**
- [ ] Recipe created by the owner *after* the grant is visible to the recipient
      **[T 3.1]** **[S: ADDED Recipient visibility]**
- [ ] `stranger` sees none of the owner's private content in either listing **[T 3.1]**
      **[S: ADDED Recipient visibility]**
- [ ] One case per remaining `visibilityFilter` call site found by the Task 3.1 audit,
      asserting shared content surfaces there too **[T 3.1]**
- [ ] Owner's `hiddenByTier: true` recipe is absent for the recipient **[T 3.1]**
      **[S: ADDED Hidden content stays hidden]**
- [ ] Owner's soft-deleted recipe is absent for the recipient **[T 3.1]**
      **[S: ADDED Hidden content stays hidden]**

**Task 3.2 — `sharedBy` payload** _(integration)_

- [ ] Shared recipe carries `sharedBy: { id, name }` matching the owner **[T 3.2]**
      **[S: ADDED Recipient visibility]**
- [ ] Shared cookbook carries `sharedBy` **[T 3.2]** **[S: ADDED Recipient visibility]**
- [ ] Recipient's own recipe and a public recipe both carry `sharedBy: null` **[T 3.2]**
      **[S: ADDED Recipient visibility]**
- [ ] Payload contains no owner `email` and no owner `tier` **[T 3.2]**
      **[S: NFAC Security "Owner identity is the only owner data exposed"]**
- [ ] Owner names resolve in a single batched query for a list of N shared items — not N
      queries **[T 3.2]** **[S: NFAC Performance]**

**Task 3.3 — Cross-owner cookbook entries** _(integration)_

- [ ] Recipient adds the owner's shared recipe to their own cookbook: entry persists and
      **no new `Recipe` document is created** **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks]**
- [ ] Recipient's recipe quota usage is unchanged after adding **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks; ADDED Quota displays exclude shared content]**
- [ ] Entry resolves through `cookbooks.byId` with `sharedBy` populated **[T 3.3]**
      **[S: ADDED Adding shared recipes to own cookbooks]**
- [ ] Owner edits the recipe; recipient sees the updated content (live reference, not a
      copy) **[T 3.3]** **[S: ADDED Adding shared recipes to own cookbooks]**
- [ ] After revocation: entry present, `unavailable: true`, `orderIndex` and `chapterId`
      preserved, and **no name / ingredients / instructions leaked** **[T 3.3]**
      **[S: ADDED Unavailable shared entries]**
- [ ] After owner downgrade: entry `unavailable: true` **[T 3.3]**
      **[S: ADDED Unavailable shared entries]**
- [ ] After owner soft-deletes the recipe (grant still active): entry `unavailable: true`
      **[T 3.3]** **[S: ADDED Unavailable shared entries]**
- [ ] Recipient cannot add a recipe they cannot see (unrelated private recipe) to their
      cookbook — `FORBIDDEN`/`NOT_FOUND` **[T 3.3]**
- [ ] Print route does not render cross-owner entries (guard until #669) **[T 3.3]**
- [ ] Every other consumer of `Cookbook.recipes[]` found in the audit resolves through
      visibility — one case per consumer **[T 3.3]**

**Task 3.4 — Read-only enforcement** _(integration)_

- [ ] Table-driven: **every** recipe mutation invoked by the recipient against the
      owner's recipe returns `FORBIDDEN`/`NOT_FOUND` and leaves the document unchanged.
      The table is derived from the router definition so future mutations are covered by
      construction **[T 3.4]** **[S: ADDED Read-only enforcement]**
- [ ] Table-driven: **every** cookbook mutation invoked by the recipient against the
      owner's cookbook returns `FORBIDDEN`/`NOT_FOUND` **[T 3.4]**
      **[S: ADDED Read-only enforcement]**
- [ ] Recipient cannot add or remove recipe entries in the owner's cookbook **[T 3.4]**
      **[S: ADDED Read-only enforcement]**
- [ ] Recipient whose own tier is `executive-chef` shares their library with a third
      user; that user gains no visibility of the original owner's content **[T 3.4]**
      **[S: ADDED Read-only enforcement]**
- [ ] Recipient cannot add or remove collaborators on the owner's cookbook **[T 3.4]**
      **[S: ADDED Read-only enforcement]**
- [ ] After revocation, re-requesting a previously visible shared document by id returns
      `NOT_FOUND` **[T 3.4]**
      **[S: NFAC Security "Revoked access is not recoverable from client state"]**
- [ ] A `LibraryShare` whose `recipientId` points at a deleted user grants access to
      nobody and raises no error **[T 3.4]**
      **[S: NFAC Reliability "Orphaned grants are inert"]**
- [ ] A user who is both a grantee and a cookbook collaborator retains edit rights on the
      collaborated cookbook while the rest of the library stays read-only **[T 3.4]**

### Phase 4 — Content UI

**Task 4.1 — Badges** _(component)_

- [ ] `RecipeCard` renders the "Shared with me" badge when `sharedBy` is set **[T 4.1]**
      **[S: ADDED Recipient visibility]**
- [ ] `RecipeCard` omits the badge when `sharedBy` is `null` **[T 4.1]**
- [ ] `CookbookCard` renders and omits the badge under the same conditions **[T 4.1]**
- [ ] Badge uses a Lucide icon and `--theme-*` tokens — assert no hard-coded hex value
      and no emoji in the rendered output **[T 4.1]**

**Task 4.2 — Gated affordances** _(component)_

- [ ] Recipe detail hides edit and delete controls when `sharedBy` is set **[T 4.2]**
      **[S: ADDED Read-only enforcement]**
- [ ] Cookbook detail hides edit, delete, and collaborator controls when `sharedBy` is
      set **[T 4.2]** **[S: ADDED Read-only enforcement]**
- [ ] Owner attribution is displayed on shared detail views **[T 4.2]**
- [ ] Controls remain present on the user's own content (regression guard) **[T 4.2]**

**Task 4.3 — Unavailable placeholder** _(component)_

- [ ] An entry with `unavailable: true` renders a placeholder in its original position
      **[T 4.3]** **[S: ADDED Unavailable shared entries]**
- [ ] The placeholder reveals no recipe name or content **[T 4.3]**
      **[S: ADDED Unavailable shared entries]**
- [ ] Copy uses the `N/A` empty convention and sentence case; no emoji **[T 4.3]**

**Task 4.4 — Quota display** _(integration + component)_

- [ ] `home-cook` recipient owning 3 recipes with 50 shared recipes visible reports usage
      of 3 of 10 **[T 4.4]** **[S: ADDED Quota displays exclude shared content]**
- [ ] That recipient can still create a recipe (limit not falsely tripped) **[T 4.4]**
      **[S: ADDED Quota displays exclude shared content]**
- [ ] Cookbook quota likewise excludes shared cookbooks **[T 4.4]**
      **[S: ADDED Quota displays exclude shared content]**

### Phase 5 — Account section

**Task 5.1 — `SharingSection`** _(component)_

- [ ] Grants given are listed with recipient name and grant date **[T 5.1]**
      **[S: ADDED Managing shares]**
- [ ] Libraries shared with the user are listed by owner name **[T 5.1]**
      **[S: ADDED Managing shares]**
- [ ] Existing cookbook collaborations are listed and link to the cookbook **[T 5.1]**
      **[S: ADDED Managing shares]**
- [ ] Empty states render for each of the three lists **[T 5.1]**
- [ ] Section is hidden or shows an upgrade affordance for non-`executive-chef` users who
      have no received shares **[T 5.1]**

**Task 5.2 — Invite and revoke** _(component)_

- [ ] Typing in the invite field invokes `users.search` **[T 5.2]**
      **[S: ADDED Managing shares]**
- [ ] Selecting a result creates a grant and the list updates **[T 5.2]**
      **[S: ADDED Granting library access; ADDED Managing shares]**
- [ ] Revoke removes the grant and updates the list **[T 5.2]**
      **[S: ADDED Revoking a share; ADDED Managing shares]**
- [ ] A failed mutation reverts optimistic UI and surfaces an error **[T 5.2]**
- [ ] Scope-warning copy is present, stating the grant covers the entire library
      including future private content **[T 5.2]** **[S: ADDED Managing shares]**

**Task 5.3 — Design system** _(component / visual)_

- [ ] Section renders legibly in `dark`, `dark-greens`, `light-cool`, and `light-warm`
      **[T 5.3]**
- [ ] No hard-coded theme-able hex values in the new components **[T 5.3]**
- [ ] No emoji in any new user-facing string **[T 5.3]**
- [ ] Any tier-upsell surface uses adblock-safe classnames (`.up-*`), never `.promo-*`,
      `.ad-*`, or `.sponsor-*` **[T 5.3]**

**Task 5.4 — End to end** _(Playwright)_

- [ ] Full round trip across two browser contexts: owner grants → recipient sees shared
      content badged → recipient adds a shared recipe to their own cookbook → owner
      revokes → recipient sees the entry as unavailable **[T 5.4]**
      **[S: ADDED Recipient visibility; ADDED Adding shared recipes to own cookbooks; ADDED Revoking a share; ADDED Unavailable shared entries]**
- [ ] Owner downgrade path: grant active → owner tier lowered → recipient's next page
      load shows no shared content **[T 5.4]** **[S: ADDED Tier downgrade suspends shares]**
- [ ] E2E waits use the project's explicit hydration readiness marker — never
      `networkidle` or fixed sleeps **[T 5.4]**

## Coverage Check

Before opening the final PR, verify every requirement in
`specs/library-sharing/spec.md` has at least one case above, and that every case has run
red before it ran green.

| Spec requirement | Covered by |
| ---------------- | ---------- |
| ADDED Granting library access | T 2.1, T 5.2 |
| ADDED Recipient visibility | T 3.1, T 3.2, T 4.1, T 5.4 |
| ADDED Read-only enforcement | T 3.4, T 4.2 |
| ADDED Adding shared recipes to own cookbooks | T 3.3, T 5.4 |
| ADDED Revoking a share | T 2.2, T 5.2, T 5.4 |
| ADDED Tier downgrade suspends shares | T 1.2, T 2.2, T 5.4 |
| ADDED Unavailable shared entries | T 3.3, T 4.3, T 5.4 |
| ADDED Hidden content stays hidden | T 1.1, T 3.1 |
| ADDED Managing shares | T 2.2, T 5.1, T 5.2 |
| ADDED Quota displays exclude shared content | T 3.3, T 4.4 |
| MODIFIED Content visibility filtering | T 1.1 |
| MODIFIED Request context composition | T 1.2 |
| NFAC Performance | T 1.2, T 3.2 |
| NFAC Security | T 2.2, T 3.2, T 3.4 |
| NFAC Reliability | T 1.2, T 3.4 |

## Context

- **Relevant architecture:** `privateRecipeNotes.get` reads `ctx.user.tier` at request time and gates note-body visibility via `canUsePrivateRecipeNotes`. No tier state is persisted on `RecipeNote` documents. `admin.users.setTier` updates `user.tier` in MongoDB and calls `reconcileUserContent`, which operates only on Recipes and Cookbooks — not on `RecipeNote`.
- **Dependencies:** `private-recipe-notes-router` change (router + per-tier tests) must be merged first. `admin-tier-integration.test.ts` provides the reference pattern for setTier-driven integration tests.
- **Interfaces/contracts touched:** `admin.users.setTier` (mutation), `privateRecipeNotes.get` (query), `RecipeNote` Mongoose model (read-only in these tests).

## Goals / Non-Goals

### Goals

- Prove that note-body visibility changes immediately on the next request after a tier change, with no DB mutation to the `RecipeNote` document.
- Prove that `reconcileUserContent` running during `setTier` does not touch `RecipeNote` documents.
- Cover all four tier-transition scenarios from #493's acceptance criteria.

### Non-Goals

- Testing session-refresh mechanics (E2E concern).
- Testing `setTier` side effects unrelated to notes (audit log, email notification, recipe/cookbook reconciliation — covered elsewhere).
- Spy-based assertion on `reconcileUserContent` internals.

## Decisions

### Decision 1: New file, not extending `privateRecipeNotes.test.ts`

- **Chosen:** `src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`
- **Alternatives considered:** Adding a `describe('tier-change integration')` block inside `privateRecipeNotes.test.ts`
- **Rationale:** `admin-tier-integration.test.ts` already establishes the pattern of "setTier-driven" tests in a dedicated file. Keeping tier-transition concerns separate from per-tier access tests mirrors that structure and avoids conflating two different test axes.
- **Trade-offs:** One more file to navigate; offset by clean separation of concerns.

### Decision 2: New caller per tier state (no caller mutation)

- **Chosen:** After each `setTier` call, create a new caller via `makeAuthCaller(userId, { tier: newTier })` to simulate a fresh request with the updated session tier.
- **Alternatives considered:** Mutating the existing caller's context; using a real session lookup.
- **Rationale:** `makeAuthCaller` bakes tier into context. Creating a new caller is the idiomatic pattern in this test suite and correctly simulates what happens when the next real HTTP request arrives with a refreshed session.
- **Trade-offs:** Does not exercise the session-refresh path itself, but that is an E2E boundary, not an integration-test boundary.

### Decision 3: Doc-snapshot comparison for "reconcile doesn't touch notes"

- **Chosen:** Capture the `RecipeNote` document (all fields) before calling `setTier`, then re-fetch and deep-equal compare after.
- **Alternatives considered:** `vi.spyOn(reconcileUserContent)` to assert it returns no note-related results.
- **Rationale:** The snapshot approach is implementation-agnostic. A spy would couple the test to `reconcileUserContent`'s return shape; the snapshot proves the invariant directly regardless of how reconcile is structured internally.
- **Trade-offs:** Doesn't explicitly prove `reconcileUserContent` wasn't called — only that it didn't write to the note. Accepted: the outcome is what matters.

### Decision 4: Idempotent-downgrade via two `setTier` calls to same target

- **Chosen:** First call downgrades from `sous-chef` → `home-cook` (reconcile fires). Second call targets `home-cook` again (hits `noOp` branch — reconcile not called). Assert doc snapshot unchanged after both.
- **Rationale:** This is the only realistic way to exercise "downgrade twice" given `setTier`'s no-op guard. It also confirms the no-op path doesn't accidentally mutate the note.
- **Trade-offs:** The second `setTier` is a no-op by design, so this test is mostly proving the first call's snapshot holds. Acceptable: that's the invariant being claimed.

## Proposal to Design Mapping

- **Proposal element:** New test file only, no implementation code
  - **Design decision:** Decision 1 (dedicated file)
  - **Validation approach:** File exists, all four test cases pass, no router/model code changed

- **Proposal element:** Tier-baked caller context requires new caller after tier change
  - **Design decision:** Decision 2 (new caller per tier state)
  - **Validation approach:** Each test constructs a fresh caller after `setTier`; `get` is called on the new caller

- **Proposal element:** RecipeNote doc unchanged after reconcile
  - **Design decision:** Decision 3 (doc-snapshot comparison)
  - **Validation approach:** `toEqual` on the full lean document before vs. after `setTier`

- **Proposal element:** Idempotent downgrade
  - **Design decision:** Decision 4 (two `setTier` calls)
  - **Validation approach:** Snapshot unchanged after both calls; `get` returns `{ hasNote: true, note: null }` on both

## Functional Requirements Mapping

- **Requirement:** Downgrade immediately withholds note body on next request
  - **Design element:** New caller with `tier: 'home-cook'`; `get` asserts `{ hasNote: true, note: null }`
  - **Acceptance criteria reference:** Issue #493 — "Downgrade path"
  - **Testability notes:** Synchronous test; no async polling needed since enforcement is at request time

- **Requirement:** Re-upgrade restores original note body intact
  - **Design element:** Two `setTier` calls (down then up); new caller with restored tier; `get` asserts original body
  - **Acceptance criteria reference:** Issue #493 — "Re-upgrade path"
  - **Testability notes:** Body string stored before downgrade, compared after upgrade

- **Requirement:** Upgrade from zero grants access but returns `{ hasNote: false, note: null }`
  - **Design element:** User seeded with no notes; `setTier` upgrade; new caller; `get` asserted
  - **Acceptance criteria reference:** Issue #493 — "Upgrade from zero"
  - **Testability notes:** Straightforward; no note seeding step needed

- **Requirement:** `RecipeNote` documents are never mutated during tier change
  - **Design element:** Lean doc snapshot before/after `setTier`; `toEqual` comparison
  - **Acceptance criteria reference:** Issue #493 — "Confirmed by test: RecipeNote unchanged"
  - **Testability notes:** `toEqual` on a `lean()` document compares all fields including `updatedAt`

## Non-Functional Requirements Mapping

- **Requirement category:** Test isolation / reliability
  - **Requirement:** Each test cleans up its DB state
  - **Design element:** `withCleanDb` wraps every test
  - **Testability notes:** Same pattern as all other router integration tests in this suite

## Risks / Trade-offs

- **Risk/trade-off:** Test file depends on router implementation not yet merged
  - **Impact:** Build fails if `private-recipe-notes-router` change isn't merged first
  - **Mitigation:** Sequencing — apply this change only after the router lands

- **Risk/trade-off:** Snapshot comparison includes `updatedAt` field
  - **Impact:** If Mongoose auto-updates `updatedAt` on a read (it shouldn't), the comparison could produce a false negative
  - **Mitigation:** `lean()` returns a plain JS object; Mongoose does not touch `updatedAt` on reads. No mitigation needed beyond awareness.

## Rollback / Mitigation

- **Rollback trigger:** Tests consistently fail in CI due to dependency on unmerged router
- **Rollback steps:** Revert the test file; router change must land first
- **Data migration considerations:** None — test-only change
- **Verification after rollback:** CI green; `admin-notes-tier-change-integration.test.ts` absent from the tree

## Operational Blocking Policy

- **If CI checks fail:** Investigate test failure; most likely cause is missing router dependency. Sequence the router change first.
- **If security checks fail:** Not applicable — no application code changed, no new dependencies.
- **If required reviews are blocked/stale:** Wait up to 48 hours; if still stale, re-request review or escalate to maintainer.
- **Escalation path and timeout:** After 48 hours of stale review, ping in PR thread; after 72 hours, escalate to project owner.

## Open Questions

No unresolved questions remain. All design decisions have been made and confirmed during explore mode.

## GitHub Issues

- #493

## Why

- **Problem statement:** The `privateRecipeNotes.get` router enforces tier gating at request time — no `hiddenByTier` field, no reconciliation step. The tests in `privateRecipeNotes.test.ts` cover per-tier access in isolation, but no test exercises a *tier transition*: create a note as Sous Chef, downgrade to Home Cook, then verify the next `get` withholds content without touching the note document. Without these tests, the "real-time, no-mutation" guarantee is documented but unproven.
- **Why now:** The router implementation (#492) and its per-tier unit tests are in place (or landing via the `private-recipe-notes-router` change). Issue #493 is the explicit acceptance criterion that closes that loop.
- **Business/user impact:** Confirms that a tier downgrade never silently destroys note content, and that a re-upgrade restores the original body. Prevents regressions if the `get` handler is ever refactored.

## Problem Space

- **Current behavior:** `privateRecipeNotes.test.ts` tests static-tier scenarios (e.g. a home-cook caller with a pre-existing note). No test calls `admin.users.setTier` and then re-queries the note.
- **Desired behavior:** A dedicated integration test file proves that tier changes produce the correct `get` response in real time and leave the `RecipeNote` document untouched.
- **Constraints:**
  - `makeAuthCaller` bakes `tier` into context at creation time; a new caller must be created after each tier change to simulate the next request.
  - `reconcile-user-content.ts` has no reference to `RecipeNote` — the "not called for notes" assertion is made indirectly by asserting the doc is field-identical before and after reconciliation runs.
  - Tests must run in the `node` Vitest environment with `withCleanDb` isolation.
- **Assumptions:**
  - `admin.users.setTier` is already implemented and tested for recipe/cookbook reconciliation.
  - `privateRecipeNotes.get` is implemented (the `private-recipe-notes-router` change lands first).
  - Test helpers `seedUserWithBetterAuth`, `makeAuthCaller` are available and sufficient.
- **Edge cases considered:**
  - "Idempotent downgrade": second `setTier` to the same tier hits the `noOp` branch and does not call reconcile; note doc is still untouched.
  - "Upgrade from zero": user with no notes is upgraded; `get` correctly returns `{ hasNote: false, note: null }` — access granted, but no note to surface.

## Scope

### In Scope

- New test file `src/server/trpc/routers/__tests__/admin-notes-tier-integration.test.ts`
- Four test cases (downgrade, re-upgrade, upgrade-from-zero, idempotent-downgrade)
- Assertion that `RecipeNote` document fields are unchanged after `setTier`

### Out of Scope

- The `privateRecipeNotes` router implementation itself (tracked in #492 / `private-recipe-notes-router` change)
- Nudge UI for `hasNote: true` below-tier users (tracked in #496, #497)
- Tier-change reconciliation for recipes and cookbooks (covered in `admin-tier-integration.test.ts`)
- Any new test helpers or changes to `test-helpers.ts`

## What Changes

- **New file:** `src/server/trpc/routers/__tests__/admin-notes-tier-integration.test.ts`

## Risks

- **Risk:** `private-recipe-notes-router` change (the router implementation) is not yet merged when this change is applied.
  - **Impact:** Tests import the `privateRecipeNotes` router which doesn't exist; build fails.
  - **Mitigation:** This change depends on the router being in place. Do not apply until `private-recipe-notes-router` is merged.
- **Risk:** Tier-baked caller context means tests don't truly exercise the session-refresh path.
  - **Impact:** A bug where the session doesn't refresh the tier from the DB would be missed.
  - **Mitigation:** Accepted: the router reads `ctx.user.tier` which is session-derived; the test simulates a fresh request by constructing a new caller. Full session-refresh coverage is an E2E concern, not an integration-test concern.

## Open Questions

No unresolved ambiguity remains:
- File placement: new file `admin-notes-tier-integration.test.ts` (not extending `privateRecipeNotes.test.ts`) — confirmed.
- "Reconcile not called" assertion: indirect (doc snapshot comparison) rather than spy — confirmed.
- "Idempotent downgrade" mechanics: two `setTier` calls to the same target tier; second hits the `noOp` branch — confirmed.

## Non-Goals

- Testing the email notification sent by `setTier`.
- Testing the `AdminAuditLog` entry created by `setTier`.
- Spy-based verification that `reconcileUserContent` is not called (doc assertion is sufficient).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

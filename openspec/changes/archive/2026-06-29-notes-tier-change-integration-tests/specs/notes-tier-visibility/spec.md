## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Tier-change integration tests for `privateRecipeNotes.get`

The test suite SHALL prove that note-body visibility on `privateRecipeNotes.get` reflects the caller's current tier immediately after an `admin.users.setTier` call, without any mutation to the underlying `RecipeNote` document.

---

#### Scenario: Downgrade withholds note body on next request

- **Given** a Sous Chef user has created a private note via `privateRecipeNotes.upsert`
- **When** an admin calls `admin.users.setTier` to downgrade that user to `home-cook`, and the user's next request is modelled as `makeAuthCaller(userId, { tier: 'home-cook' }).privateRecipeNotes.get({ recipeId })`
- **Then** the response is `{ hasNote: true, note: null }` — note existence is signalled but body is withheld

---

#### Scenario: Re-upgrade restores original note body intact

- **Given** a Sous Chef user has been downgraded to `home-cook` (note body withheld per above scenario)
- **When** an admin calls `admin.users.setTier` to upgrade the user back to `sous-chef`, and the user's next request is modelled as `makeAuthCaller(userId, { tier: 'sous-chef' }).privateRecipeNotes.get({ recipeId })`
- **Then** the response is `{ hasNote: true, note: { body: <original body>, updatedAt: <Date> } }` — the body is the exact string stored before the downgrade

---

#### Scenario: Upgrade from zero grants access with no note surfaced

- **Given** a `prep-cook` user who has never created a private note
- **When** an admin calls `admin.users.setTier` to upgrade the user to `executive-chef`, and the user's next request is modelled as `makeAuthCaller(userId, { tier: 'executive-chef' }).privateRecipeNotes.get({ recipeId })`
- **Then** the response is `{ hasNote: false, note: null }` — access is granted but there is no note to return

---

#### Scenario: RecipeNote document is unchanged after downgrade and idempotent second downgrade

- **Given** a Sous Chef user has an existing `RecipeNote` document (body, `createdAt`, `updatedAt` captured as a snapshot)
- **When** an admin calls `admin.users.setTier` to downgrade to `home-cook` (reconcile fires), then calls `admin.users.setTier` to `home-cook` again (no-op branch, reconcile not called)
- **Then** `RecipeNote.findOne({ userId, recipeId }).lean()` returns a document that deep-equals the pre-change snapshot — no fields were added, removed, or mutated

## MODIFIED Requirements

None. No existing requirements are changed by this work.

## REMOVED Requirements

None.

## Traceability

- Proposal element "new test file only" → Requirement: ADDED Tier-change integration tests
- Proposal element "RecipeNote doc unchanged" → Scenario: RecipeNote document is unchanged after downgrade
- Design decision 1 (dedicated file) → Task: Create `admin-notes-tier-change-integration.test.ts`
- Design decision 2 (new caller per tier) → Scenarios: Downgrade, Re-upgrade, Upgrade from zero
- Design decision 3 (doc-snapshot comparison) → Scenario: RecipeNote document unchanged
- Design decision 4 (two setTier calls for idempotent downgrade) → Scenario: idempotent second downgrade
- Requirement: ADDED Tier-change integration tests → Task: Write four test cases

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Test isolation — each test cleans up its DB state

- **Given** any of the four tier-change scenarios runs
- **When** the test completes (pass or fail)
- **Then** `withCleanDb` ensures no documents from that test persist into subsequent tests

### Requirement: Security

See functional scenarios above: the downgrade and re-upgrade scenarios directly verify that note content is not leaked to below-tier callers. No additional security scenario is required.

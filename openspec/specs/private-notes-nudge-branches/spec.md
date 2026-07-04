## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-04-wire-private-notes-nudges/design.md) document, not a replacement.

### Requirement: ADDED Branch — Anonymous visitor sees upgrade nudge

The system SHALL render `RecipeNotesUpgradeNudge` with `state="anonymous"` and make no tRPC API call when the viewer is not authenticated.

#### Scenario: Anonymous visitor views recipe detail page

- **Given** a user who is not logged in views any recipe detail page
- **When** the `PrivateRecipeNotes` component mounts
- **Then** `RecipeNotesUpgradeNudge` renders with `state="anonymous"` and the `privateRecipeNotes.get` query is not called

#### Scenario: Anonymous nudge contains login CTA

- **Given** `RecipeNotesUpgradeNudge` renders with `state="anonymous"`
- **When** the component is visible
- **Then** a link with label "Login" pointing to `/auth/login` is present in the DOM

---

### Requirement: ADDED Branch — Below-tier authenticated user with no existing note sees below-tier nudge

The system SHALL render `RecipeNotesUpgradeNudge` with `state="below-tier"` when the caller is authenticated, below Sous Chef tier, and has no existing note for the recipe.

#### Scenario: Below-tier user with no note views recipe detail page

- **Given** an authenticated user whose tier does not include `privateRecipeNotes`
- **And** the `privateRecipeNotes.get` endpoint returns `{ hasNote: false, note: null }`
- **When** the `PrivateRecipeNotes` component finishes loading
- **Then** `RecipeNotesUpgradeNudge` renders with `state="below-tier"` and no editor (no `<textarea>`) is present

---

### Requirement: ADDED Branch — Below-tier authenticated user with an existing note (downgrade path) sees hidden-by-downgrade nudge

The system SHALL render `RecipeNotesUpgradeNudge` with `state="hidden-by-downgrade"` when the caller is authenticated, below Sous Chef tier, and a note exists for the recipe (note body is withheld by server).

#### Scenario: Downgraded user with a saved note views recipe detail page

- **Given** an authenticated user who previously had Sous Chef tier, has a saved note, and has since downgraded
- **And** the `privateRecipeNotes.get` endpoint returns `{ hasNote: true, note: null }`
- **When** the `PrivateRecipeNotes` component finishes loading
- **Then** `RecipeNotesUpgradeNudge` renders with `state="hidden-by-downgrade"` and no note body text is visible in the DOM

#### Scenario: Note body is not displayed for below-tier caller with hasNote: true

- **Given** the above downgraded user scenario
- **When** the component renders
- **Then** no `<textarea>` is present and no note body content is rendered (only the nudge copy and upgrade CTA)

---

### Requirement: ADDED Branch — Entitled user sees inline editor

The system SHALL render the full `PrivateRecipeNotes` inline editor (with textarea) when the caller is authenticated and entitled to `privateRecipeNotes`.

#### Scenario: Entitled user with no existing note sees empty editor prompt

- **Given** an authenticated Sous Chef (or higher) user
- **And** `privateRecipeNotes.get` returns `{ hasNote: false, note: null }`
- **When** the component finishes loading
- **Then** an "Add a note" button is visible and no `RecipeNotesUpgradeNudge` is rendered

#### Scenario: Entitled user with an existing note sees note body

- **Given** an authenticated Sous Chef (or higher) user
- **And** `privateRecipeNotes.get` returns `{ hasNote: true, note: { body: "My note", updatedAt: <date> } }`
- **When** the component finishes loading
- **Then** the note body text "My note" is visible in the DOM and no `RecipeNotesUpgradeNudge` is rendered

---

## MODIFIED Requirements

### Requirement: MODIFIED Query enabled guard

The system SHALL enable the `privateRecipeNotes.get` query for all authenticated users (not only entitled users) so that below-tier callers can determine whether a note exists.

#### Scenario: Query fires for authenticated below-tier user

- **Given** an authenticated below-tier user
- **When** `PrivateRecipeNotes` mounts
- **Then** the `privateRecipeNotes.get` query is called with the correct `recipeId`

#### Scenario: Query does not fire for anonymous user

- **Given** a user who is not logged in
- **When** `PrivateRecipeNotes` mounts
- **Then** the `privateRecipeNotes.get` query is not called

---

### Requirement: MODIFIED Loading state for below-tier users

The system SHALL render nothing (not the skeleton) while the `hasNote` check is in flight for below-tier authenticated users.

#### Scenario: Below-tier user experiences blank space during hasNote fetch

- **Given** an authenticated below-tier user
- **And** the `privateRecipeNotes.get` query is still loading
- **When** `PrivateRecipeNotes` renders
- **Then** no skeleton element (`data-testid="private-notes-skeleton"`) is present and no nudge is rendered yet

---

## REMOVED Requirements

No requirements are removed by this change.

---

## Traceability

- Proposal element "Four render branches" → Requirements: Anonymous branch, Below-tier-no-note branch, Below-tier-has-note branch, Entitled branch
- Proposal element "Widen query enabled guard" → Requirement: MODIFIED Query enabled guard
- Proposal element "Skip skeleton for below-tier" → Requirement: MODIFIED Loading state for below-tier users
- Design Decision 1 (branching inside component) → All four branch requirements
- Design Decision 2 (widen query guard) → MODIFIED Query enabled guard requirement
- Design Decision 3 (render null while loading) → MODIFIED Loading state requirement
- Design Decision 4 (isError returns null) → Reliability NFAC
- Requirements → Tasks: All requirements implemented in `src/components/recipes/PrivateRecipeNotes.tsx`; all branch scenarios covered by tests in `src/components/recipes/PrivateRecipeNotes.test.tsx`

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Below-tier path adds at most one network call per recipe view

- **Given** an authenticated below-tier user views a recipe detail page
- **When** `PrivateRecipeNotes` mounts
- **Then** exactly one call to `privateRecipeNotes.get` is made (no polling, no duplicate calls)

### Requirement: Security

See functional scenarios: "Note body is not displayed for below-tier caller with hasNote: true" and "Downgraded user with a saved note views recipe detail page". Those scenarios fully cover the access-control requirement (server withholds body; client renders nudge only).

### Requirement: Reliability

#### Scenario: Network error on hasNote check does not break the page

- **Given** any authenticated user (entitled or below-tier)
- **When** the `privateRecipeNotes.get` query returns an error
- **Then** the `PrivateRecipeNotes` component renders nothing (`null`) and no error UI is shown in the notes section

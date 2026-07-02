## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED PrivateRecipeNotes component — empty state

The system SHALL render a "Private Notes" card with an "Add a note" affordance when a Sous Chef+ user views a recipe that has no saved note.

#### Scenario: Empty state for entitled user with no note

- **Given** the user is authenticated as Sous Chef or above
- **When** the recipe detail page loads and `privateRecipeNotes.get` returns `{ hasNote: false, note: null }`
- **Then** the "Private Notes" card is visible, read mode is shown, and an "Add a note" button (or equivalent affordance) is rendered; no note body text is present

#### Scenario: Loading state shown while query is in flight

- **Given** the user is authenticated as Sous Chef or above
- **When** `privateRecipeNotes.get` is pending
- **Then** a loading skeleton is rendered in place of the card content

---

### Requirement: ADDED PrivateRecipeNotes component — read mode with note

The system SHALL display the saved note body as plain pre-wrapped text in read mode.

#### Scenario: Read mode renders note body

- **Given** the user is authenticated as Sous Chef or above
- **When** `privateRecipeNotes.get` returns `{ hasNote: true, note: { body: "My note text", updatedAt: ... } }`
- **Then** the note body "My note text" is visible in the card with `whitespace-pre-wrap` formatting; an edit button (Pencil icon) is visible

---

### Requirement: ADDED PrivateRecipeNotes component — edit mode

The system SHALL allow the user to click-to-edit, displaying a textarea with a character counter and Save / Cancel controls.

#### Scenario: Entering edit mode from read mode

- **Given** the note card is in read mode (with or without a note body)
- **When** the user clicks the edit/add-note button
- **Then** a textarea is shown containing the current note body (empty if no note), a character counter showing `{n} / 10000` is visible, and Save and Cancel buttons are present

#### Scenario: Character counter updates as user types

- **Given** the edit mode textarea is visible
- **When** the user types additional characters
- **Then** the counter updates to reflect the current character count in real time

#### Scenario: Save button disabled when body is unchanged

- **Given** the edit mode textarea is visible and the body matches the saved note (or both are empty)
- **When** the user has not changed the textarea value
- **Then** the Save button is disabled

#### Scenario: Save button enabled after change

- **Given** the edit mode textarea is visible
- **When** the user modifies the textarea value to differ from the saved body
- **Then** the Save button becomes enabled

---

### Requirement: ADDED PrivateRecipeNotes component — save success

The system SHALL call `privateRecipeNotes.upsert` on Save, apply an optimistic update, and return to read mode on success.

#### Scenario: Save succeeds with optimistic update

- **Given** the edit mode textarea is visible with a changed body value
- **When** the user clicks Save
- **Then** the query cache is optimistically updated with the new body, the component transitions to read mode showing the new text, and the `upsert` mutation is called with `{ recipeId, body }`

#### Scenario: Save button disabled while mutation is pending

- **Given** the user has clicked Save and the mutation is in flight
- **When** the mutation has not yet resolved
- **Then** the Save button is disabled

---

### Requirement: ADDED PrivateRecipeNotes component — save failure

The system SHALL display an inline error message and roll back the optimistic update when `upsert` fails.

#### Scenario: Save fails — error shown, optimistic update rolled back

- **Given** the edit mode textarea is visible with a changed body value
- **When** the user clicks Save and the `upsert` mutation rejects
- **Then** the optimistic cache update is rolled back, an inline error message is visible near the Save/Cancel controls, and the user remains in edit mode

---

### Requirement: ADDED PrivateRecipeNotes component — cancel

The system SHALL revert the textarea to the original body and exit edit mode when the user clicks Cancel.

#### Scenario: Cancel reverts changes

- **Given** the edit mode textarea is visible and the user has modified the body
- **When** the user clicks Cancel
- **Then** the textarea is hidden, the component returns to read mode, and the original note body (or empty state) is shown unchanged

---

### Requirement: ADDED PrivateRecipeNotes component — tier gating

The system SHALL render nothing for users below Sous Chef tier or unauthenticated users.

#### Scenario: Non-entitled user sees no component

- **Given** the user is authenticated below Sous Chef tier (home-cook or prep-cook) or is not logged in
- **When** the recipe detail page renders
- **Then** the Private Notes card is not present in the DOM and no `privateRecipeNotes.get` network request is made

---

## MODIFIED Requirements

### Requirement: MODIFIED Recipe detail page layout

The recipe detail page (`src/routes/recipes/$recipeId.tsx`) SHALL render the `PrivateRecipeNotes` component between `RecipeDetail` and the action buttons section.

#### Scenario: Notes panel appears in correct position

- **Given** the user is Sous Chef+
- **When** the recipe detail page renders
- **Then** the Private Notes card appears below the `RecipeDetail` component and above the export/delete action buttons

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal: "No new npm dependencies" → Design Decision 1 (whitespace-pre-wrap), Decision 2 (inline error) → Requirement: save failure
- Proposal: "Optimistic update with rollback" → Design Decision 4 → Requirement: save success, save failure
- Proposal: "Tier gating via useTierEntitlements()" → Design Decision 3 → Requirement: tier gating
- Design Decision 5 (placement) → Requirement: MODIFIED recipe detail page layout
- All requirements → tasks.md (implementation tasks)

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

See functional scenario: "Non-entitled user sees no component" — the `enabled: false` query option ensures no network request is made for ineligible users. No additional latency scenario required.

### Requirement: Security

See functional scenario: "Non-entitled user sees no component" for client-side gating. Server-side enforcement is covered by existing `tierProcedure("sous-chef")` integration tests from #492.

**Distinct NFAC — no tier data leaked in component output:**

#### Scenario: Lower-tier user gets no note content in DOM

- **Given** the component is rendered for a user below Sous Chef (hypothetically)
- **When** the page renders
- **Then** no note body text appears anywhere in the DOM (the component returns null before any data is fetched or rendered)

### Requirement: Reliability

#### Scenario: Recovery after save failure

- **Given** a save failure has been shown and the inline error is visible
- **When** the user corrects their input and clicks Save again
- **Then** the previous error message is cleared, a new mutation fires, and on success the component transitions to read mode with the updated body

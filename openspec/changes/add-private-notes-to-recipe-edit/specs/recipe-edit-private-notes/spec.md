## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Edit screen private notes panel

The system SHALL render the private notes panel (same display/edit behavior as the recipe detail page) inside `RecipeForm` when editing an existing recipe.

#### Scenario: Entitled owner sees panel on edit screen

- **Given** a Sous Chef or above user editing their recipe at `/recipes/:recipeId/edit`
- **When** the edit screen loads
- **Then** a "Private Notes" panel is rendered below the public Notes field, showing the saved note or an "Add a note" affordance

#### Scenario: Saving a private note does not save the recipe

- **Given** the panel is in edit mode inside the recipe form
- **When** the user clicks the panel's Save button
- **Then** `privateRecipeNotes.upsert` is called with the recipe ID and body, and `recipes.update` is NOT called and the form is not submitted

#### Scenario: Cancel does not submit the recipe

- **Given** the panel is in edit mode inside the recipe form
- **When** the user clicks the panel's Cancel button
- **Then** edit mode closes and the recipe form is not submitted

---

### Requirement: ADDED Create-mode hint

The system SHALL show a hint instead of the panel when creating a new recipe.

#### Scenario: Hint on create screen

- **Given** a logged-in user on `/recipes/new`
- **When** the form renders
- **Then** the text "Save this recipe first to add private notes." is shown in the private-notes slot and no `privateRecipeNotes` query is issued

---

### Requirement: ADDED Tier nudges on edit screen

The system SHALL show the existing `RecipeNotesUpgradeNudge` states in the edit-screen private-notes slot.

#### Scenario: Below-tier user

- **Given** a user below Sous Chef editing a recipe with no saved note
- **When** the edit screen loads
- **Then** the "below-tier" nudge is shown, no textarea is available, and no Move action is shown

#### Scenario: Downgraded user with existing note

- **Given** a user below Sous Chef whose `privateRecipeNotes.get` returns `hasNote: true`
- **When** the edit screen loads
- **Then** the "hidden-by-downgrade" nudge is shown and no note body is rendered

---

### Requirement: ADDED Move to Private Notes

The system SHALL provide a "Move to Private Notes" action beneath the public Notes field that appends the public notes to the user's private note and then clears the public field.

#### Scenario: Move with no existing private note

- **Given** an entitled owner on the edit screen, public notes "Use less salt", and no private note
- **When** the user clicks "Move to Private Notes"
- **Then** `privateRecipeNotes.upsert` is called with body "Use less salt", and after success the public Notes field is empty and the form is dirty

#### Scenario: Move appends to existing private note

- **Given** an existing private note "Grandma's tip" and public notes "Use less salt"
- **When** the user clicks "Move to Private Notes"
- **Then** the upserted body is "Grandma's tip\n\nUse less salt" and the public field is cleared

#### Scenario: Move failure preserves public notes

- **Given** public notes "Use less salt"
- **When** the user clicks "Move to Private Notes" and `upsert` fails
- **Then** the public Notes field still contains "Use less salt" and an inline error is shown

#### Scenario: Combined length exceeds limit

- **Given** the combined body would exceed 10000 characters
- **When** the user clicks "Move to Private Notes"
- **Then** `upsert` is not called, an error explains the limit, and the public field is unchanged

#### Scenario: Action hidden or disabled when not applicable

- **Given** any of: public notes empty/whitespace, user below Sous Chef, create mode, or the private-notes panel in edit mode
- **When** the form renders
- **Then** the Move action is not shown (or is disabled when the panel is editing)

#### Scenario: Cleared public notes persist via normal form save

- **Given** a successful Move
- **When** the autosave fires or the user saves the recipe
- **Then** the recipe is updated with empty `notes`

## Traceability

- Proposal element (Embed panel) -> Requirements: Edit screen private notes panel, Tier nudges on edit screen
- Proposal element (Create-mode hint) -> Requirement: Create-mode hint
- Proposal element (Move) -> Requirement: Move to Private Notes
- Design Decisions 1, 3 -> Edit screen panel; Decision 4 -> hint; Decision 5 -> Move
- Requirements -> Tasks: Tasks 1-5 in tasks.md (Execution section)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No extra requests in create mode

- **Given** `/recipes/new`
- **When** the form renders
- **Then** no `privateRecipeNotes.get` request is made (covered by "Hint on create screen")

### Requirement: Security

See functional scenarios: "Below-tier user", "Downgraded user with existing note". Move is not offered to below-tier users.

### Requirement: Reliability

See functional scenarios: "Move failure preserves public notes", "Combined length exceeds limit".

### Requirement: Usability / Theming

#### Scenario: Theme-safe styling

- **Given** any of the four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`)
- **When** the edit screen renders the panel, hint, and Move action
- **Then** only `--theme-*` tokens are used (no hard-coded theme-able colors, no emoji) and text is legible

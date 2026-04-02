## ADDED Requirements

### Requirement: LocalStorage Autosave
The system SHALL automatically persist the current recipe form state to `localStorage` whenever a change is detected, using a 1-2 second debounce.

#### Scenario: Form state saved to localStorage
- **WHEN** the user modifies any field in the recipe form
- **THEN** after 2 seconds of inactivity, the current form state is written to `localStorage` under a key specific to the recipe (e.g., `recipe-draft-new` or `recipe-draft-{id}`)

### Requirement: Server-side Autosave (Edit Mode)
For existing recipes (`isEdit` is true), the system SHALL automatically commit valid form changes to the database using a debounced server mutation.

#### Scenario: Valid edit is autosaved to server
- **GIVEN** the form is in Edit mode and all current fields are valid
- **WHEN** a change is detected and the debounce timer expires
- **THEN** the system triggers a TRPC update mutation to persist the changes to the server

#### Scenario: Invalid edit is not autosaved to server
- **GIVEN** the form is in Edit mode and contains validation errors (e.g., empty name)
- **WHEN** the debounce timer expires
- **THEN** the system SHALL NOT trigger a server mutation, but SHALL still update `localStorage`

### Requirement: Save Status Feedback
The system SHALL provide a non-blocking visual indicator of the current persistence status.

#### Scenario: Status shows "Saving..." during active persistence
- **WHEN** a `localStorage` or server-side save operation is in progress
- **THEN** the status indicator shows "Saving..."

#### Scenario: Status shows "Saved" after successful persistence
- **WHEN** the latest changes have been successfully saved to both `localStorage` and the server (if applicable)
- **THEN** the status indicator shows "Saved"

#### Scenario: Status shows "Failed to save" on error
- **WHEN** a server-side autosave operation fails
- **THEN** the status indicator shows "Failed to save" and provides a "Retry" action

### Requirement: Draft Restoration Prompt
On initialization of the recipe form, the system SHALL check for a corresponding `localStorage` draft and prompt the user to restore it if it is newer than the initial state.

#### Scenario: User prompted to restore draft
- **GIVEN** a `localStorage` draft exists for the current recipe
- **WHEN** the form is loaded
- **THEN** the system shows a non-blocking prompt: "An unsaved draft was found. Would you like to restore it?"

#### Scenario: User restores draft
- **GIVEN** the restoration prompt is visible
- **WHEN** the user clicks "Restore"
- **THEN** the form fields are populated with the draft data

### Requirement: Revert to Server State
In Edit mode, the system SHALL provide an action to discard all current changes (including autosaved ones) and return to the state when the page was first loaded.

#### Scenario: User reverts changes
- **GIVEN** the form is in Edit mode and has been modified
- **WHEN** the user clicks the "Revert" button
- **THEN** the form state is reset to the initial server values and the corresponding `localStorage` draft is cleared

### Requirement: Clear Draft on Success
The system SHALL clear the corresponding `localStorage` draft upon a successful manual form submission.

#### Scenario: Draft cleared after manual save
- **WHEN** the user clicks the primary "Save" or "Update" button and the submission succeeds
- **THEN** the system removes the associated `localStorage` key

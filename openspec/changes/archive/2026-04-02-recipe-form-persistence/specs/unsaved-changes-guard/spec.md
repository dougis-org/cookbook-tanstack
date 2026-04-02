## MODIFIED Requirements

### Requirement: Block in-app navigation when form is dirty
The system SHALL prevent in-app navigation away from the recipe form and show a confirmation modal when the form has unsaved changes. In Edit mode, this SHALL only apply if changes have not yet been successfully persisted to the server.

#### Scenario: Clean form — no block on navigation
- **GIVEN** the recipe form has not been modified
- **WHEN** the user navigates away (Cancel, back button, or link)
- **THEN** navigation proceeds immediately with no modal shown

#### Scenario: Dirty form — Cancel triggers confirmation modal
- **GIVEN** the user has modified at least one form field
- **WHEN** the user clicks Cancel
- **THEN** a confirmation modal is shown asking whether to discard changes

#### Scenario: User confirms discard — navigation proceeds
- **GIVEN** the confirmation modal is shown
- **WHEN** the user clicks the confirm ("Discard Changes") button
- **THEN** the modal closes and navigation proceeds

#### Scenario: User cancels discard — stays on form
- **GIVEN** the confirmation modal is shown
- **WHEN** the user clicks the cancel ("Keep Editing") button
- **THEN** the modal closes and the user remains on the form with changes intact

#### Scenario: Dirty form — in-app link triggers confirmation modal
- **GIVEN** the user has modified at least one form field
- **WHEN** a TanStack Router navigation event fires (e.g. clicking a nav link)
- **THEN** the navigation is blocked and the confirmation modal is shown

#### Scenario: Edit mode — autosaved changes do not block navigation
- **GIVEN** the form is in Edit mode and changes have been made
- **WHEN** the autosave status is "Saved" (to server) and the user navigates away
- **THEN** navigation proceeds immediately without showing the confirmation modal

### Requirement: Block tab close / refresh when form is dirty
The system SHALL trigger the browser's native `beforeunload` dialog when the form is dirty and the user attempts to close or refresh the tab. In Edit mode, this SHALL only apply if changes have not yet been successfully persisted to the server.

#### Scenario: Dirty form — tab close triggers native dialog
- **GIVEN** the user has modified at least one form field
- **WHEN** the user attempts to close the tab or refresh the page
- **THEN** the browser's native unsaved-changes dialog fires

#### Scenario: Clean form — no dialog on tab close
- **GIVEN** the form has not been modified
- **WHEN** the user closes the tab or refreshes the page
- **THEN** no native dialog fires

#### Scenario: Edit mode — autosaved changes do not trigger native dialog
- **GIVEN** the form is in Edit mode and changes have been made
- **WHEN** the autosave status is "Saved" (to server) and the user closes the tab
- **THEN** no native unsaved-changes dialog fires

## Purpose

Per-user preferences controlling which recipe sections print and where meta elements (Category, Difficulty, Servings, Prep, Cook) are placed in the print header or footer.

## Requirements

### Requirement: Per-user print section preferences storage

The system SHALL persist four independent boolean preferences per user — `printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes` — each defaulting to `true`, using the existing Better-Auth `additionalFields` mechanism. The former `printShowMeta` boolean is retained only as a legacy input to placement resolution (see "Legacy print meta preference migration"); the meta line is governed by the per-element placement preferences, not by `printShowMeta`.

#### Scenario: New user has section preferences default to shown and placements to their defaults

- **Given** a user account that has never modified print preferences
- **When** the user's session/preferences are read
- **Then** the four boolean section preferences (`printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes`) resolve to `true`
- **And** the five placement preferences resolve to their defaults: Category `footer`; Difficulty, Servings, Prep time and Cook time `none`

#### Scenario: User updates a single preference without affecting others

- **Given** a logged-in user whose preferences are all at their default value
- **When** the user sets `printShowIngredients` to `false` and saves
- **Then** `printShowIngredients` persists as `false` and the other three preferences remain `true`

### Requirement: Print Preferences settings UI

The system SHALL provide a "Print Preferences" section on the settings page (`/account/settings`) with an independently toggleable control for each of the four section preferences, saved via the existing user-update save path.

#### Scenario: User toggles a preference off and saves

- **Given** a logged-in user viewing `/account/settings`
- **When** the user toggles "Personal Notes" off and clicks Save
- **Then** the save succeeds, a success indicator is shown, and `printShowPersonalNotes` is `false` on the user's session going forward

#### Scenario: Save failure surfaces an error without silently discarding the change

- **Given** a logged-in user on `/account/settings` who has toggled a preference
- **When** the save request fails
- **Then** an error message is shown and the toggle's on-screen state remains as the user left it (not silently reverted)

### Requirement: Print section suppression driven by user preferences

The system SHALL suppress each of the four printable recipe sections (ingredients, instructions, notes, personal notes) from print output when the corresponding preference is `false`, in addition to each section's existing content-presence check, and SHALL apply this uniformly to both the single-recipe print view and the cookbook print view.

#### Scenario: Preference off suppresses the section in single-recipe print

- **Given** a logged-in user with `printShowInstructions` set to `false`, viewing a recipe with a non-empty `instructions` field
- **When** the recipe page is rendered for print (print media)
- **Then** the Instructions section is absent from the print DOM

#### Scenario: Preference off suppresses the section in cookbook print

- **Given** a logged-in user with `printShowIngredients` set to `false`, viewing a cookbook print page containing a recipe with a non-empty `ingredients` field
- **When** the cookbook print page is rendered for print (print media)
- **Then** the Ingredients section for that recipe is absent from the print DOM

#### Scenario: Preference off does not suppress content that is already absent

- **Given** a logged-in user with `printShowNotes` set to `true`, viewing a recipe whose `notes` field is empty
- **When** the recipe page is rendered for print
- **Then** the Notes section is absent (unchanged — governed by the existing content-presence check, not the preference)

#### Scenario: Preference on-off state does not change on-screen (non-print) rendering

- **Given** a logged-in user with `printShowIngredients`, `printShowInstructions`, and `printShowNotes` all set to `false`, viewing a recipe with content in all three sections
- **When** the recipe page is rendered for screen (non-print) media
- **Then** the Ingredients, Instructions, and Notes sections are all visible on screen exactly as if the preferences were `true`

#### Scenario: Personal notes preference only affects display of an already-authorized note

- **Given** a logged-in user who owns a recipe's personal note, is tier-eligible per `canUsePrivateRecipeNotes`, and has `printShowPersonalNotes` set to `false`
- **When** the recipe page is rendered for print
- **Then** the Personal Notes section is absent from the print DOM, and no additional note data is fetched or exposed as a result of the preference being `false`

### Requirement: Default-safe preference resolution for missing or anonymous sessions

The system SHALL resolve any missing, undefined, or non-boolean preference value as `true` (shown), and SHALL resolve all section preferences as `true` for an anonymous (logged-out) viewer.

#### Scenario: Anonymous viewer prints a recipe

- **Given** no active session (logged-out viewer)
- **When** a recipe page is rendered for print
- **Then** all four sections render in print exactly as they did before this change (subject only to their existing content-presence checks)

#### Scenario: Existing user session predates the new fields

- **Given** a logged-in user's session object that does not contain any `printShow*` field (pre-migration state)
- **When** print preferences are resolved for that session
- **Then** all four preferences resolve to `true`

### Requirement: Per-element print placement preferences

The system SHALL store, per user, a placement of `"header"`, `"footer"` or `"none"` for each of Category, Difficulty, Servings, Prep time and Cook time, in the fields `printCategory`, `printDifficulty`, `printServings`, `printPrepTime` and `printCookTime`.

#### Scenario: New account defaults

- **Given** a newly created user
- **When** their print preferences are resolved
- **Then** Category resolves to `footer`
- **And** Difficulty, Servings, Prep time and Cook time resolve to `none`

#### Scenario: Stored placements are honored

- **Given** a session whose user has `printCategory: "header"` and `printPrepTime: "footer"`
- **When** `resolvePrintPreferences` runs
- **Then** Category resolves to `header` and Prep time resolves to `footer`

### Requirement: Server-side placement validation

The system SHALL reject, before persistence, any update that sets a placement field to a value other than `"header"`, `"footer"` or `"none"`, and SHALL leave stored data unchanged when it rejects.

#### Scenario: Server rejects invalid placement values

- **Given** an authenticated user with `printCategory: "footer"`
- **When** an update sets `printCategory` to `"sideways"` (or a non-string value)
- **Then** the update is rejected with an error
- **And** the stored `printCategory` is still `"footer"`

#### Scenario: Valid values are accepted

- **Given** an authenticated user
- **When** an update sets each placement field to one of the three allowed values
- **Then** the update succeeds and the values are stored

### Requirement: Legacy print meta preference migration

The system SHALL resolve Prep time, Cook time, Servings and Difficulty from the legacy `printShowMeta` field when the corresponding new field is absent, without modifying stored data.

#### Scenario: Legacy user with meta shown

- **Given** a user with no new placement fields and `printShowMeta` true or absent
- **When** preferences are resolved
- **Then** Prep time, Cook time, Servings and Difficulty resolve to `header`
- **And** Category resolves to `footer`

#### Scenario: Legacy user with meta hidden

- **Given** a user with no new placement fields and `printShowMeta: false`
- **When** preferences are resolved
- **Then** Prep time, Cook time, Servings and Difficulty resolve to `none`

#### Scenario: New field wins over legacy flag

- **Given** a user with `printShowMeta: false` and `printServings: "footer"`
- **When** preferences are resolved
- **Then** Servings resolves to `footer`
- **And** the other three meta elements resolve to `none`

### Requirement: Print placement settings UI

The system SHALL present, in the Print Preferences block of the account settings screen, a Header / Footer / None choice for each of the five elements, a static layout sketch showing the header, body and footer zones, and SHALL save the choices with the existing Save action.

#### Scenario: Controls reflect current preferences

- **Given** a logged-in user with `printCategory: "footer"` and `printServings: "header"`
- **When** they open `/account`
- **Then** Category shows Footer selected and Servings shows Header selected
- **And** each of the five elements shows exactly one selected option

#### Scenario: Saving persists the placements

- **Given** a user who changes Difficulty to Footer
- **When** they click Save Changes
- **Then** `authClient.updateUser` is called with `printDifficulty: "footer"` and the other four placement values
- **And** the success message is shown

#### Scenario: Controls are keyboard operable

- **Given** focus on a placement control
- **When** the user presses an arrow key
- **Then** selection moves to the adjacent option and focus follows

### Requirement: Default-safe resolution of placement preferences

The system SHALL resolve every placement preference to its default when the session is missing, anonymous, or the value is invalid. A placement value that is not exactly `"header"`, `"footer"` or `"none"` SHALL be treated as absent.

#### Scenario: Anonymous session

- **Given** no session
- **When** preferences are resolved
- **Then** Category resolves to `footer`
- **And** Difficulty, Servings, Prep time and Cook time resolve to `none`

#### Scenario: Invalid placement value

- **Given** a user with `printCategory: "sideways"` and `printDifficulty: 7`
- **When** preferences are resolved
- **Then** each invalid value resolves as if absent (Category `footer`; Difficulty per the legacy rule)

### Requirement: Section visibility reliability

The system SHALL tolerate malformed preference data without breaking rendering.

#### Scenario: Malformed preference value does not break rendering

- **Given** a session where a `printShow*` field holds a non-boolean value (e.g. a stale/corrupted string)
- **When** print preferences are resolved
- **Then** the value resolves to `true` and rendering proceeds without error

### Requirement: Section visibility operability

The system SHALL require no data migration to introduce these preferences.

#### Scenario: No migration required to add the feature

- **Given** the deployed change adds five new `additionalFields`
- **When** an existing user document (created before this change) is read
- **Then** the missing fields resolve via `defaultValue: true` with no database migration or backfill step required

### Requirement: Placement performance

The system SHALL resolve preferences from the existing session without extra requests.

#### Scenario: No added requests

- **Given** the session already carries user fields
- **When** preferences are resolved for a print view
- **Then** no additional network request is made

### Requirement: Placement reliability

The system SHALL tolerate malformed preference data without breaking rendering.

#### Scenario: Malformed session data

- **Given** `session.user` is null, a non-object, or has non-string placement fields
- **When** preferences are resolved
- **Then** resolution does not throw and returns a complete preferences object

### Requirement: Placement operability

The system SHALL require no data migration to introduce these preferences.

#### Scenario: No data migration needed

- **Given** a production user document with none of the new fields
- **When** the new code is deployed
- **Then** that user's Prep, Cook, Servings and Difficulty print exactly as before, with no script run
- **And** Category prints in the footer (the Category default), which is the only difference from prior output

## Traceability

- Proposal element: "Five new Better-Auth `additionalFields`" -> Requirement: Per-user print section preferences storage
- Proposal element: "New 'Print Preferences' section on `account_.settings.tsx`" -> Requirement: Print Preferences settings UI
- Proposal element: "`RecipeDetail.tsx`: gate the five existing print sections" + "cookbook print honors the same toggles" -> Requirement: Print section suppression driven by user preferences
- Proposal element: "Anonymous/logged-out viewers ... default to showing everything" -> Requirement: Default-safe preference resolution for missing or anonymous sessions
- Design decision: Decision 1 (flat `additionalFields`) -> Requirement: Per-user print section preferences storage
- Design decision: Decision 2 (`authClient.updateUser` save path) -> Requirement: Print Preferences settings UI
- Design decision: Decision 3 (route-resolved, presentational `RecipeDetail`) + Decision 4 (print-only gating) -> Requirement: Print section suppression driven by user preferences
- Requirement: Per-user print section preferences storage -> Task(s): auth.ts additionalFields, resolution helper unit tests
- Requirement: Print Preferences settings UI -> Task(s): account_.settings.tsx section, settings component tests
- Requirement: Print section suppression driven by user preferences -> Task(s): RecipeDetail prop + gating, both route wirings, RecipeDetail component tests, e2e print specs
- Requirement: Default-safe preference resolution for missing or anonymous sessions -> Task(s): resolution helper + its unit tests
- Extended by: customize-recipe-print-header-footer (per-element placement) — [`design.md`](../../changes/archive/2026-10-24-customize-recipe-print-header-footer/design.md), [`tasks.md`](../../changes/archive/2026-10-24-customize-recipe-print-header-footer/tasks.md)

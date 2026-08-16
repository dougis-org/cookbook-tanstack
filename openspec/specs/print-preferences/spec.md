## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-15-print-preferences/design.md) document, not a replacement.

### Requirement: ADDED Per-user print section preferences storage

The system SHALL persist five independent boolean preferences per user — `printShowMeta`, `printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes` — each defaulting to `true`, using the existing Better-Auth `additionalFields` mechanism.

#### Scenario: New user has all preferences default to shown

- **Given** a user account that has never modified print preferences
- **When** the user's session/preferences are read
- **Then** all five `printShow*` fields resolve to `true`

#### Scenario: User updates a single preference without affecting others

- **Given** a logged-in user whose preferences are all at their default value
- **When** the user sets `printShowIngredients` to `false` and saves
- **Then** `printShowIngredients` persists as `false` and the other four preferences remain `true`

### Requirement: ADDED Print Preferences settings UI

The system SHALL provide a "Print Preferences" section on the settings page (`/account/settings`) with an independently toggleable control for each of the five preferences, saved via the existing user-update save path.

#### Scenario: User toggles a preference off and saves

- **Given** a logged-in user viewing `/account/settings`
- **When** the user toggles "Personal Notes" off and clicks Save
- **Then** the save succeeds, a success indicator is shown, and `printShowPersonalNotes` is `false` on the user's session going forward

#### Scenario: Save failure surfaces an error without silently discarding the change

- **Given** a logged-in user on `/account/settings` who has toggled a preference
- **When** the save request fails
- **Then** an error message is shown and the toggle's on-screen state remains as the user left it (not silently reverted)

### Requirement: ADDED Print section suppression driven by user preferences

The system SHALL suppress each of the five printable recipe sections (meta line, ingredients, instructions, notes, personal notes) from print output when the corresponding preference is `false`, in addition to each section's existing content-presence check, and SHALL apply this uniformly to both the single-recipe print view and the cookbook print view.

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

### Requirement: ADDED Default-safe preference resolution for missing or anonymous sessions

The system SHALL resolve any missing, undefined, or non-boolean preference value as `true` (shown), and SHALL resolve all preferences as `true` for an anonymous (logged-out) viewer.

#### Scenario: Anonymous viewer prints a recipe

- **Given** no active session (logged-out viewer)
- **When** a recipe page is rendered for print
- **Then** all five sections render in print exactly as they did before this change (subject only to their existing content-presence checks)

#### Scenario: Existing user session predates the new fields

- **Given** a logged-in user's session object that does not contain any `printShow*` field (pre-migration state)
- **When** print preferences are resolved for that session
- **Then** all five preferences resolve to `true`

## Traceability

- Proposal element: "Five new Better-Auth `additionalFields`" -> Requirement: ADDED Per-user print section preferences storage
- Proposal element: "New 'Print Preferences' section on `account_.settings.tsx`" -> Requirement: ADDED Print Preferences settings UI
- Proposal element: "`RecipeDetail.tsx`: gate the five existing print sections" + "cookbook print honors the same toggles" -> Requirement: ADDED Print section suppression driven by user preferences
- Proposal element: "Anonymous/logged-out viewers ... default to showing everything" -> Requirement: ADDED Default-safe preference resolution for missing or anonymous sessions
- Design decision: Decision 1 (flat `additionalFields`) -> Requirement: ADDED Per-user print section preferences storage
- Design decision: Decision 2 (`authClient.updateUser` save path) -> Requirement: ADDED Print Preferences settings UI
- Design decision: Decision 3 (route-resolved, presentational `RecipeDetail`) + Decision 4 (print-only gating) -> Requirement: ADDED Print section suppression driven by user preferences
- Requirement: ADDED Per-user print section preferences storage -> Task(s): auth.ts additionalFields, resolution helper unit tests
- Requirement: ADDED Print Preferences settings UI -> Task(s): account_.settings.tsx section, settings component tests
- Requirement: ADDED Print section suppression driven by user preferences -> Task(s): RecipeDetail prop + gating, both route wirings, RecipeDetail component tests, e2e print specs
- Requirement: ADDED Default-safe preference resolution for missing or anonymous sessions -> Task(s): resolution helper + its unit tests

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "Personal notes preference only affects display of an already-authorized note" — the preference is a display-only gate on data already authorized upstream by ownership and tier checks; no new authorization surface is introduced.

### Requirement: Reliability

#### Scenario: Malformed preference value does not break rendering

- **Given** a session where a `printShow*` field holds a non-boolean value (e.g. a stale/corrupted string)
- **When** print preferences are resolved
- **Then** the value resolves to `true` and rendering proceeds without error

### Requirement: Operability

#### Scenario: No migration required to add the feature

- **Given** the deployed change adds five new `additionalFields`
- **When** an existing user document (created before this change) is read
- **Then** the missing fields resolve via `defaultValue: true` with no database migration or backfill step required

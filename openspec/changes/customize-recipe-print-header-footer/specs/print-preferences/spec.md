## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Per-element print placement preferences

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

### Requirement: ADDED Server-side placement validation

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

### Requirement: ADDED Legacy print meta preference migration

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

### Requirement: ADDED Print placement settings UI

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

### Requirement: ADDED Default-safe resolution of placement preferences

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

## Notes

- The promoted `openspec/specs/print-preferences/spec.md` is structurally invalid today (delta headers in a main spec). Its storage and suppression requirements still describe `printShowMeta`; the meta-line suppression is superseded by this change. Repair the main spec when syncing at Post-Merge instead of modifying it by header.

## Traceability

- Proposal element -> Requirement: Placement fields -> Per-element print placement preferences, Server-side placement validation; Replace `printShowMeta` -> Legacy migration; Settings screen -> Print placement settings UI; Safe defaults -> Default-safe resolution of placement preferences
- Design decision -> Requirement: Decisions 1, 3 -> Per-element placement; Decision 2 -> Legacy migration, default-safe resolution; Decision 6 -> Settings UI
- Requirement -> Task(s): see `tasks.md` Execution, PR 1 (tasks 1.x)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No added requests

- **Given** the session already carries user fields
- **When** preferences are resolved for a print view
- **Then** no additional network request is made

### Requirement: Security

See functional scenarios: Server rejects invalid placement values (write path) and Invalid placement value (read-path backstop for legacy or corrupted records).

### Requirement: Reliability

#### Scenario: Malformed session data

- **Given** `session.user` is null, a non-object, or has non-string placement fields
- **When** preferences are resolved
- **Then** resolution does not throw and returns a complete preferences object

### Requirement: Operability

#### Scenario: No data migration needed

- **Given** a production user document with none of the new fields
- **When** the new code is deployed
- **Then** that user's Prep, Cook, Servings and Difficulty print exactly as before, with no script run
- **And** Category prints in the footer (the Category default), which is the only difference from prior output

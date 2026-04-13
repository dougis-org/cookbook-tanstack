## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Live theme preview on option select

The system SHALL apply the selected theme class to `document.documentElement` immediately when the user selects a dropdown option, without saving to localStorage.

#### Scenario: Selecting a theme option previews it live

- **Given** the sidebar is open and the committed theme is `dark`
- **When** the user selects `light-warm` from the dropdown
- **Then** `document.documentElement.className` equals `light-warm` and localStorage still contains `dark`

#### Scenario: Selecting the already-committed theme produces no pending change

- **Given** the sidebar is open and the committed theme is `dark`
- **When** the user selects `dark` from the dropdown
- **Then** `previewId` remains `null` and OK/Cancel buttons are not rendered

---

### Requirement: ADDED OK commits and closes sidebar

The system SHALL save the previewed theme and close the sidebar when the user presses OK.

#### Scenario: OK commits the previewed theme

- **Given** the user has previewed `light-cool` (committed is `dark`)
- **When** the user presses OK
- **Then** `setTheme('light-cool')` is called, localStorage is updated to `light-cool`, and the sidebar closes

#### Scenario: OK is not rendered when no preview is pending

- **Given** the sidebar is open and no option has been selected (committed = current)
- **When** the dropdown renders
- **Then** neither OK nor Cancel buttons are in the DOM

---

### Requirement: ADDED Cancel reverts and closes sidebar

The system SHALL revert `document.documentElement.className` to the committed theme and close the sidebar when the user presses Cancel.

#### Scenario: Cancel reverts to committed theme

- **Given** the user has previewed `light-warm` (committed is `dark`)
- **When** the user presses Cancel
- **Then** `document.documentElement.className` equals `dark`, localStorage is unchanged, and the sidebar closes

---

### Requirement: ADDED Unmount cleanup reverts preview

The system SHALL revert `document.documentElement.className` to the committed theme if the Header component unmounts while a preview is active.

#### Scenario: Navigation while preview is active

- **Given** the user has previewed `light-cool` without pressing OK
- **When** the Header component unmounts (e.g. route navigation)
- **Then** `document.documentElement.className` equals the committed theme

---

## MODIFIED Requirements

### Requirement: MODIFIED Theme selector in sidebar footer

The system SHALL render a custom dropdown in the sidebar footer instead of a flex row of buttons.

#### Scenario: All registered themes are accessible

- **Given** `THEMES` contains `dark`, `light-cool`, and `light-warm`
- **When** the user opens the dropdown
- **Then** three options are visible, each showing the theme label and a color swatch

#### Scenario: Selected theme is visually indicated

- **Given** the committed theme is `light-cool`
- **When** the dropdown renders
- **Then** the `light-cool` option is marked as selected (e.g. checkmark or `aria-selected="true"`)

---

## REMOVED Requirements

### Requirement: REMOVED Button-group theme selector

The flex row of `<button>` elements (one per THEMES entry) in the sidebar footer is removed.

**Reason for removal:** Replaced by the custom dropdown. Does not scale to 4+ themes.

---

## Traceability

- Proposal: live preview → Requirement: ADDED Live theme preview on option select
- Proposal: OK commits + closes → Requirement: ADDED OK commits and closes sidebar
- Proposal: Cancel reverts + closes → Requirement: ADDED Cancel reverts and closes sidebar
- Proposal: cleanup on unmount → Requirement: ADDED Unmount cleanup reverts preview
- Design Decision 1 (local previewId state) → ADDED Live preview, OK, Cancel, Unmount cleanup
- Design Decision 5 (conditional OK/Cancel) → OK/Cancel visibility scenarios
- Requirement: ADDED Live preview → Task: implement dropdown preview state in Header
- Requirement: ADDED OK/Cancel → Task: implement OK and Cancel handlers
- Requirement: ADDED Unmount cleanup → Task: add useEffect cleanup

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Theme class swap has no perceptible delay

- **Given** the user selects a dropdown option
- **When** the option's `onSelect` handler fires
- **Then** `document.documentElement.className` is updated synchronously within the same event handler tick (no async, no debounce)

### Requirement: Reliability

#### Scenario: localStorage unavailable does not prevent preview or revert

- **Given** localStorage throws on access (e.g. private browsing restriction)
- **When** the user previews and then cancels a theme
- **Then** the DOM class is still correctly reverted; no unhandled exception is thrown

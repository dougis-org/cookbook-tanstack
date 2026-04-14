## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED ARIA roles and attributes on dropdown

The system SHALL apply `role="listbox"` to the dropdown options container and `role="option"` with `aria-selected` to each option, and `aria-expanded` on the trigger button.

#### Scenario: Trigger reflects expanded state

- **Given** the dropdown is closed
- **When** the trigger button is rendered
- **Then** `aria-expanded="false"` is present on the trigger

- **Given** the dropdown is open
- **When** the trigger button is rendered
- **Then** `aria-expanded="true"` is present on the trigger

#### Scenario: Options container has correct role

- **Given** the dropdown is open
- **When** the options list is rendered
- **Then** the container element has `role="listbox"`

#### Scenario: Each option has correct role and selection state

- **Given** the dropdown is open and the committed theme is `dark`
- **When** options are rendered
- **Then** the `dark` option has `role="option"` and `aria-selected="true"`; all others have `aria-selected="false"`

---

### Requirement: ADDED Keyboard navigation within dropdown

The system SHALL support ArrowDown, ArrowUp, Enter, and Escape keyboard interactions on the open dropdown.

#### Scenario: ArrowDown moves focus to next option

- **Given** the dropdown is open and focus is on the first option
- **When** the user presses ArrowDown
- **Then** focus moves to the second option

#### Scenario: ArrowUp moves focus to previous option

- **Given** the dropdown is open and focus is on the second option
- **When** the user presses ArrowUp
- **Then** focus moves to the first option

#### Scenario: Enter selects the focused option

- **Given** the dropdown is open and focus is on `light-warm`
- **When** the user presses Enter
- **Then** `light-warm` is set as `previewId` and `document.documentElement.className` becomes `light-warm`

#### Scenario: Escape closes dropdown and reverts preview

- **Given** the dropdown is open and `light-cool` is being previewed (committed is `dark`)
- **When** the user presses Escape
- **Then** the dropdown closes, `document.documentElement.className` reverts to `dark`, and `previewId` becomes `null`

---

### Requirement: ADDED Outside-click closes dropdown and reverts preview

The system SHALL close the dropdown and revert any pending preview when the user clicks outside the dropdown container.

#### Scenario: Click outside with pending preview reverts

- **Given** the dropdown is open and `light-warm` is being previewed (committed is `dark`)
- **When** the user clicks outside the dropdown container
- **Then** the dropdown closes, `document.documentElement.className` reverts to `dark`

---

## MODIFIED Requirements

_(None — accessibility is entirely new capability for this component.)_

## REMOVED Requirements

### Requirement: REMOVED `aria-pressed` on theme buttons

The `aria-pressed` attribute on the old button-group buttons is no longer applicable.

**Reason for removal:** Replaced by `aria-selected` on `role="option"` elements within the new `role="listbox"` dropdown.

---

## Traceability

- Design Decision 3 (custom `role="listbox"`) → Requirement: ADDED ARIA roles and attributes
- Design Decision 6 (Escape / outside-click = Cancel) → Requirement: ADDED Keyboard navigation, ADDED Outside-click
- Requirement: ADDED ARIA roles → Task: implement ARIA attributes in dropdown render
- Requirement: ADDED Keyboard navigation → Task: implement onKeyDown handler in dropdown
- Requirement: ADDED Outside-click → Task: implement click-outside listener (useRef + useEffect)

---

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Dropdown is operable by keyboard without a mouse

- **Given** the user has navigated to the sidebar footer using Tab
- **When** the user opens the dropdown with Enter/Space and navigates with Arrow keys
- **Then** they can select a theme, confirm with OK, and close the sidebar without using a mouse

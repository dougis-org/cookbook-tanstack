## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED — Close sidebar on outside click (AC1)

The system SHALL close the mobile sidebar when the user clicks or taps anywhere outside the sidebar while it is open.

#### Scenario: Click outside closes the sidebar

- **Given** the mobile sidebar is open
- **When** the user clicks anywhere on the backdrop overlay (outside the `<aside>`)
- **Then** the sidebar slides out of view (`translate-x-full`) and the backdrop is removed from the DOM

#### Scenario: Click inside the sidebar does not close it

- **Given** the mobile sidebar is open
- **When** the user clicks on an area inside the `<aside>` that has no explicit close handler (e.g., the sidebar title area)
- **Then** the sidebar remains open

---

### Requirement: ADDED — Close sidebar on theme selection (AC2)

The system SHALL close the mobile sidebar when the user selects a theme from the sidebar theme picker.

#### Scenario: Theme selection closes the sidebar and applies the theme

- **Given** the mobile sidebar is open
- **When** the user clicks a theme button (e.g., "Light", "Dark", "Cool")
- **Then** the sidebar closes AND the selected theme is applied (the `data-theme` attribute on `<html>` updates to the chosen theme)

#### Scenario: Theme selection on already-active theme still closes the sidebar

- **Given** the mobile sidebar is open and the "Dark" theme is already active
- **When** the user clicks the "Dark" theme button again
- **Then** the sidebar closes (theme remains "Dark" — no change, no error)

---

## MODIFIED Requirements

### Requirement: MODIFIED — Sidebar close behaviors remain intact (AC3)

The system SHALL continue to close the sidebar via the X button, any nav link click, and the sign-out button — these existing behaviors must not regress.

#### Scenario: X button still closes the sidebar

- **Given** the mobile sidebar is open
- **When** the user clicks the X (close) button
- **Then** the sidebar slides closed

#### Scenario: Nav link click still closes the sidebar

- **Given** the mobile sidebar is open
- **When** the user clicks any nav link (Home, Recipes, Categories, Cookbooks, etc.)
- **Then** the sidebar closes and navigation occurs

---

## REMOVED Requirements

No requirements were removed by this change.

---

## Traceability

- Proposal element "backdrop overlay" → Requirement AC1 (close on outside click)
- Proposal element "setIsOpen(false) on theme buttons" → Requirement AC2 (close on theme selection)
- Design Decision 1 (backdrop overlay div) → AC1
- Design Decision 2 (updated theme button onClick) → AC2
- AC1 → Task: Add backdrop overlay div to Header.tsx
- AC2 → Task: Update theme button onClick handlers
- AC3 → Task: Regression test existing close behaviors

---

## Non-Functional Acceptance Criteria

### Requirement: Accessibility (AC4)

The backdrop overlay element SHALL be hidden from assistive technologies.

#### Scenario: Screen reader ignores backdrop

- **Given** the sidebar is open and the backdrop is rendered
- **When** an axe-core scan runs on the page
- **Then** no new accessibility violations are reported (backdrop has `aria-hidden="true"`)

### Requirement: Performance

The sidebar open/close transition SHALL not cause layout shift or extra repaints on pages where the sidebar is closed.

#### Scenario: Backdrop not in DOM when sidebar is closed

- **Given** the sidebar is closed
- **When** the page is rendered
- **Then** no backdrop div exists in the DOM (conditional render via `{isOpen && ...}`)

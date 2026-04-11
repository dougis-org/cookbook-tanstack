# Spec: Theme Extensibility

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Theme system is config-driven and requires no component changes to add a theme

The system SHALL allow a new theme to be added by: (1) defining `html.<theme-name> { --theme-*: ...; }` in `src/styles.css`, and (2) adding a `{ id, label }` entry to the `THEMES` config array in `src/contexts/ThemeContext.tsx`. No component changes are required.

#### Scenario: Adding a stub third theme

- **Given** only dark and light themes exist
- **When** a developer adds `html.solarized { --theme-bg: #002b36; ... }` to `styles.css` and `{ id: 'solarized', label: 'Solarized' }` to the `THEMES` array
- **Then** the theme selector shows three options, selecting "Solarized" applies the new CSS variables to all surfaces, and no component files are modified

#### Scenario: Theme selector renders all registered themes

- **Given** the `THEMES` array contains `[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]`
- **When** the hamburger menu is opened
- **Then** the theme selector shows exactly two options labelled "Dark" and "Light"

### Requirement: ADDED Active theme is visually indicated in the selector

The system SHALL highlight the currently active theme option in the selector with a distinct visual treatment (e.g., filled background, border, bold label).

#### Scenario: Active theme highlighted on open

- **Given** the dark theme is active
- **When** the user opens the hamburger menu
- **Then** the "Dark" option is visually distinguished from "Light" in the theme selector

#### Scenario: Active indicator updates on theme change

- **Given** the user selects "Light" from the theme selector
- **When** the selector re-renders
- **Then** the "Light" option is visually highlighted and "Dark" is not

## MODIFIED Requirements

None — this is entirely new capability.

## REMOVED Requirements

None.

## Traceability

- Proposal element "N-theme selector widget" → Requirements: Theme system is config-driven; Active theme is visually indicated
- Proposal element "Future themes added by defining html.themename { } CSS block and registering in selector" → Requirement: Theme system is config-driven
- Design Decision 6 (N-theme selector, config-driven) → All requirements in this spec
- Requirements → Tasks: Task 4 (ThemeContext + THEMES config), Task 9 (theme selector UI in Header)

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Theme addition requires changes to exactly two locations

- **Given** the theme system is implemented
- **When** a code reviewer audits a PR that adds a new theme
- **Then** changes exist in exactly: `src/styles.css` (new `html.<name>` block) and `src/contexts/ThemeContext.tsx` (new `THEMES` entry) — no other files require changes

### Requirement: Reliability

#### Scenario: Unknown theme name in localStorage is handled gracefully

- **Given** `localStorage['cookbook-theme']` contains a value not in the `THEMES` array (e.g., from a future theme that was later removed)
- **When** the inline script applies the class and React initialises
- **Then** the app does not crash; the unknown class has no defined CSS variables so the page may render unstyled, but `useTheme` detects the mismatch and falls back to `'dark'`

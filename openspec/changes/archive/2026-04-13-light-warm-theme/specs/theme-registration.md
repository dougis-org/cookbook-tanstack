## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Light (warm) theme is selectable from the theme menu

The system SHALL present a "Light (warm)" button in the theme selector and apply the `light-warm` class to `<html>` when selected.

#### Scenario: Light (warm) button appears in hamburger menu

- **Given** the user is on any page with the default or any stored theme
- **When** the user opens the hamburger menu
- **Then** a button labelled "Light (warm)" is visible in the theme selector alongside "Dark" and "Light (cool)"

#### Scenario: Selecting Light (warm) applies warm theme class

- **Given** the app is running in any theme
- **When** the user clicks the "Light (warm)" button in the theme selector
- **Then** `document.documentElement.className` is exactly `light-warm`
- **And** key surface background colors differ from both the dark and light-cool themes

#### Scenario: Light (warm) preference persists across page reload

- **Given** `localStorage` contains `cookbook-theme = light-warm`
- **When** the user navigates to any page (fresh load or reload)
- **Then** `document.documentElement.className` contains `light-warm` before and after hydration
- **And** the "Light (warm)" button in the theme selector has `aria-pressed="true"`

#### Scenario: No flash — html has light-warm class before hydration when light-warm stored

- **Given** `localStorage` contains `cookbook-theme = light-warm`
- **When** the page is loaded with `waitUntil: 'commit'` (before React hydration)
- **Then** `document.documentElement.className` already contains `light-warm`

## MODIFIED Requirements

### Requirement: MODIFIED Theme selector renders all registered themes

The system SHALL render buttons for every entry in `ThemeContext.THEMES`, which now includes `light-warm`.

#### Scenario: Theme selector lists three options

- **Given** the user opens the hamburger menu
- **When** the theme section is visible
- **Then** three theme buttons are present: "Dark", "Light (cool)", and "Light (warm)"

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal element (theme registration) → Requirement: Light (warm) theme is selectable
- Design decision 1–6 (palette) → Requirement: Selecting Light (warm) applies warm theme class
- Requirement: Light (warm) is selectable → Task: Register `light-warm` in `ThemeContext.THEMES`
- Requirement: Persists across reload → Task: (no implementation needed — existing ThemeContext handles it)
- Requirement: Theme selector lists three options → Task: Register `light-warm` in `ThemeContext.THEMES`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Theme switch latency

- **Given** the app is hydrated and running
- **When** the user clicks "Light (warm)"
- **Then** the CSS class change is synchronous (no async work); visible update occurs within the browser's next paint cycle (~16ms)

### Requirement: Reliability

#### Scenario: Unknown stored theme falls back to dark

- **Given** `localStorage` contains an unrecognised theme value (e.g. a future id not in THEMES)
- **When** the page loads
- **Then** the app falls back to the `dark` theme without error (existing `readStoredTheme` behavior, unchanged)

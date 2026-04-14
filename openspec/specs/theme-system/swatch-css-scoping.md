## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Color swatch per dropdown option

The system SHALL render a small colored circle alongside each theme label in the dropdown, using `var(--theme-bg)` scoped to that theme via a `data-theme` attribute.

#### Scenario: Swatch renders in the correct color for each theme

- **Given** the dropdown is open while the active theme is `dark`
- **When** the `light-warm` option is rendered
- **Then** its swatch `<span>` has `data-theme="light-warm"` and its background resolves to `light-warm`'s `--theme-bg` value (not `dark`'s)

#### Scenario: Swatch for active theme also renders correctly

- **Given** the active theme is `dark`
- **When** the `dark` option is rendered
- **Then** its swatch `<span>` has `data-theme="dark"` and its background resolves to `dark`'s `--theme-bg` value

---

### Requirement: ADDED `data-theme` selector in each theme CSS file

Each theme CSS file SHALL include a `[data-theme="<id>"]` attribute selector alongside the existing `html.<id>` selector, so that any element with `data-theme="<id>"` inherits that theme's custom properties.

#### Scenario: `dark.css` exposes tokens via `data-theme`

- **Given** `dark.css` contains `html.dark, [data-theme="dark"] { --theme-bg: ... }`
- **When** a `<span data-theme="dark">` exists inside a `html.light-warm` document
- **Then** `getComputedStyle(span).getPropertyValue('--theme-bg')` returns the `dark` theme value

#### Scenario: `light-cool.css` exposes tokens via `data-theme`

- **Given** `light-cool.css` contains `html.light-cool, [data-theme="light-cool"] { --theme-bg: ... }`
- **When** a `<span data-theme="light-cool">` exists inside a `html.dark` document
- **Then** `getComputedStyle(span).getPropertyValue('--theme-bg')` returns the `light-cool` theme value

#### Scenario: `light-warm.css` exposes tokens via `data-theme`

- **Given** `light-warm.css` contains `html.light-warm, [data-theme="light-warm"] { --theme-bg: ... }`
- **When** a `<span data-theme="light-warm">` exists inside a `html.dark` document
- **Then** `getComputedStyle(span).getPropertyValue('--theme-bg')` returns the `light-warm` theme value

---

### Requirement: ADDED Swatches are leaf elements

The system SHALL render swatch `<span>` elements with no children, to prevent unintended CSS custom property cascade into child elements.

#### Scenario: Swatch has no child nodes

- **Given** the dropdown is rendered
- **When** each option's swatch element is inspected
- **Then** `span[data-theme].childNodes.length === 0`

---

## MODIFIED Requirements

_(None — swatch rendering is entirely new capability.)_

## REMOVED Requirements

_(None.)_

---

## Traceability

- Proposal: `data-theme` swatches using `var(--theme-bg)` → Requirement: ADDED Color swatch per option
- Design Decision 2 (`data-theme` selector + `var(--theme-bg)`) → All requirements in this spec
- Requirement: ADDED `data-theme` selector → Task: update `dark.css`, `light-cool.css`, `light-warm.css`
- Requirement: ADDED Color swatch → Task: render swatch `<span>` in dropdown option

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Future themes automatically work with swatches

- **Given** a new theme file `src/styles/themes/dark-warm.css` adds `[data-theme="dark-warm"]` to its selector
- **When** `{ id: 'dark-warm', label: 'Dark (warm)' }` is added to `THEMES`
- **Then** the new option's swatch renders using `dark-warm`'s `--theme-bg` with no other code changes

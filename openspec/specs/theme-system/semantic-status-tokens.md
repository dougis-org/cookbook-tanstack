## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Semantic status tokens defined in base CSS

The system SHALL define `--theme-error-base`, `--theme-error`, `--theme-error-bg`, `--theme-error-border`, `--theme-success-base`, `--theme-success`, `--theme-success-bg`, `--theme-warning-base`, `--theme-warning`, `--theme-warning-bg`, and `--theme-warning-border` as CSS custom properties on `:root` in `src/styles/base.css`.

#### Scenario: Status tokens resolve in all themes

- **Given** any of the three themes (`dark`, `light-cool`, `light-warm`) is active on `<html>`
- **When** a component uses `text-[var(--theme-error)]` or `bg-[color:var(--theme-error-bg)]`
- **Then** the resolved color is non-empty, visible against the theme's surface color, and differs from `transparent`

#### Scenario: Dark theme overrides base status hues

- **Given** `html.dark` or `[data-theme="dark"]` is active
- **When** `--theme-error-base` is inspected via `getComputedStyle`
- **Then** it resolves to a brighter value than the `:root` default (e.g. `red-400` vs `red-600`) appropriate for dark surfaces

### Requirement: ADDED `color-mix()` derivation for status bg and border tokens

The system SHALL derive `--theme-error-bg`, `--theme-error-border`, `--theme-warning-bg`, `--theme-warning-border`, and `--theme-success-bg` using `color-mix(in srgb, var(--theme-X-base) N%, transparent)` so that overriding `-base` automatically updates all derived tokens.

#### Scenario: Derived tokens update when base is overridden

- **Given** the dark theme overrides `--theme-error-base` to `red-400`
- **When** `--theme-error-bg` is inspected in dark theme
- **Then** it reflects a tint of `red-400` at ~10% opacity, not the `:root` default tint of `red-600`

#### Scenario: Derived tokens are non-zero opacity on any background

- **Given** any active theme
- **When** `--theme-error-bg` is rendered as a background color
- **Then** the element is visually distinct from the page background (i.e. not fully transparent and not fully opaque)

## MODIFIED Requirements

### Requirement: MODIFIED Status colors respond to theme switching

Previously, status colors (error text, backgrounds, borders) were hardcoded Tailwind classes unaffected by theme changes. The system SHALL now update all status colors when the active theme class changes on `<html>`.

#### Scenario: Error color changes when switching from dark to light-cool

- **Given** a form validation error is displayed while `html.dark` is active
- **When** the theme is switched to `html.light-cool`
- **Then** the error text color and background visually update without page reload, and the error remains legible against the light surface

## REMOVED Requirements

### Requirement: REMOVED Hardcoded Tailwind color classes for status states

Reason for removal: Hardcoded classes (`text-red-400`, `bg-red-500/10`, `border-red-500`, `text-green-500`, `text-amber-200`, etc.) are replaced by CSS custom property tokens. Components must no longer reference raw color scales for status states.

## Traceability

- Proposal element "status tokens (error/success/warning)" → Requirement: ADDED Semantic status tokens defined in base CSS
- Design decision 2 (`color-mix()` derivation) → Requirement: ADDED `color-mix()` derivation for status bg and border tokens
- Requirement: ADDED Semantic status tokens → Tasks: "Create base.css with status tokens", "Override status bases in dark.css"
- Requirement: MODIFIED Status colors respond to theme switching → Tasks: "Replace hardcoded status classes in components"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No visual regression in dark theme

- **Given** the dark theme is active before and after this change
- **When** a Playwright screenshot is taken of a page showing error, success, and warning states
- **Then** the screenshot matches the pre-change baseline within an acceptable pixel diff threshold

### Requirement: Operability

#### Scenario: Future theme inherits status defaults

- **Given** a hypothetical new theme CSS file with no status token overrides
- **When** the theme class is applied to `<html>`
- **Then** status tokens resolve from `:root` defaults in `base.css` and render correctly without any component changes

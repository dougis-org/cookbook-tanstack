## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Per-category badge token sets defined in base CSS

The system SHALL define four independent badge token sets in `src/styles/base.css` `:root`:
- `--theme-badge-meal-{base,bg,text,border}`
- `--theme-badge-course-{base,bg,text,border}`
- `--theme-badge-prep-{base,bg,text,border}`
- `--theme-badge-classification-{base,bg,text,border}`

`-bg` and `-border` SHALL be derived via `color-mix()` from `-base`. `-text` SHALL be defined explicitly (not derived) because text requires an inverse lightness relationship to background.

#### Scenario: Badge tokens resolve per category in light theme

- **Given** `html.light-cool` is active (or no theme override, inheriting `:root`)
- **When** `TaxonomyBadge` renders with `type="meal"`
- **Then** the badge background is a pale amber tint and the text is dark amber — both resolved from `--theme-badge-meal-*` tokens, not hardcoded classes

#### Scenario: Badge tokens produce distinct colors per category

- **Given** any active theme
- **When** `TaxonomyBadge` renders badges for meal, course, and prep types side by side
- **Then** each badge has a visually distinct background and text color (amber vs violet vs emerald families)

### Requirement: ADDED Dark theme badge overrides for base and text

The system SHALL override `--theme-badge-*-base` and `--theme-badge-*-text` in `dark.css` for all four badge categories. `-bg` and `-border` SHALL NOT be overridden (they derive from `-base` automatically).

#### Scenario: Dark theme badge text is light

- **Given** `html.dark` is active
- **When** any badge renders
- **Then** the badge text resolves to a light shade appropriate for dark surfaces (e.g. `amber-300` for meal, `violet-300` for course)

#### Scenario: Dark theme badge background is muted tint

- **Given** `html.dark` is active and `--theme-badge-meal-base` is overridden to `amber-400`
- **When** `--theme-badge-meal-bg` is inspected
- **Then** it resolves to a ~15% tint of `amber-400` against transparent — a muted, darkened background appropriate for dark surfaces

## MODIFIED Requirements

### Requirement: MODIFIED Badge components use token-based classes

Previously, `TaxonomyBadge` and `ClassificationBadge` used hardcoded Tailwind classes with manual `dark:` variants. The system SHALL replace all hardcoded badge color classes with `var(--theme-badge-*)` token utilities.

#### Scenario: Badge renders correctly after removing dark: variants

- **Given** `TaxonomyBadge` no longer uses `dark:bg-amber-500/20 dark:text-amber-300`
- **When** dark theme is active
- **Then** the badge renders with the same visual appearance as before, driven by `--theme-badge-meal-*` token overrides in `dark.css`

## REMOVED Requirements

### Requirement: REMOVED Hardcoded badge color classes with manual dark: variants

Reason for removal: Classes such as `bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300` are replaced by CSS custom property tokens. The `dark:` variant logic moves entirely into `dark.css`.

## Traceability

- Proposal element "Categorical badges (TaxonomyBadge, ClassificationBadge)" → Requirement: ADDED Per-category badge token sets
- Design decision 3 (per-category token sets) → Requirement: ADDED Per-category badge token sets
- Design decision 2 (`color-mix()` derivation) → Requirement: ADDED Dark theme badge overrides for base and text
- Requirement: ADDED Per-category badge token sets → Tasks: "Add badge tokens to base.css", "Add dark badge overrides to dark.css"
- Requirement: MODIFIED Badge components use token-based classes → Tasks: "Migrate TaxonomyBadge", "Migrate ClassificationBadge"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No visual regression in badge rendering

- **Given** dark and light themes are compared before and after the change
- **When** a Playwright screenshot is taken showing all badge category types
- **Then** badge colors in dark theme are visually identical to pre-change; light-theme badges now correctly adapt to the light surface

### Requirement: Operability

#### Scenario: New badge category can be added via CSS only

- **Given** a future taxonomy type (e.g. `cuisine`) is added to the system
- **When** a new `--theme-badge-cuisine-*` token set is added to `base.css` and `dark.css`
- **Then** a new `TaxonomyBadge` type using those tokens renders correctly without modifying existing badge logic

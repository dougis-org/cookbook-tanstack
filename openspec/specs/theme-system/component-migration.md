# Spec: Component Migration

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED All themed surfaces use `--theme-*` CSS variables

The system SHALL express all surface, border, text, and accent colours on themed components via `var(--theme-*)` CSS custom properties rather than hardcoded Tailwind colour utilities or `dark:` variants.

#### Scenario: Theme switch changes all site surfaces

- **Given** the dark theme is active and all components are migrated
- **When** the user selects "Light" from the theme selector
- **Then** the header, navigation sidebar, recipe cards, recipe detail, form inputs, dropdowns, and category badges (non-classification) all visually update to reflect the light theme token values

#### Scenario: No unstyled surface on light theme

- **Given** the light theme is active
- **When** the user navigates through the home page, recipe list, recipe detail, cookbook list, cookbook detail, and auth pages
- **Then** no element shows an unintended default browser colour (e.g., white-on-white or black-on-black text)

### Requirement: ADDED Classification badge colours are exempt from token migration

The system SHALL retain hardcoded Tailwind colour values for classification badge components (`amber`, `emerald`, `violet`, etc.). These colours represent categorical meaning and must be consistent across all themes.

#### Scenario: Badge colours unchanged after theme switch

- **Given** the dark theme is active and recipe classification badges are visible
- **When** the user switches to light theme
- **Then** the badge background and text colours are identical to those shown in dark theme

## MODIFIED Requirements

### Requirement: MODIFIED `dark:` Tailwind variants are removed from themed components

The system SHALL have no `dark:` Tailwind variant classes on components that have been migrated to CSS variable tokens. The only remaining `dark:` variants after migration SHALL be on classification badge components.

#### Scenario: Post-migration grep finds no unexpected `dark:` variants

- **Given** the migration is complete
- **When** a grep for `dark:` is run across `src/components/` and `src/routes/`
- **Then** all matches are in classification badge files or intentionally exempt files (documented)

## REMOVED Requirements

### Requirement: REMOVED Hardcoded `bg-slate-900`, `bg-gray-800`, `text-white`, `dark:*` etc. on themed surfaces

Reason for removal: All theme-sensitive colour classes are replaced by `bg-[var(--theme-bg)]`, `bg-[var(--theme-surface)]`, `text-[var(--theme-fg)]` etc. The specific Tailwind colour utilities these replaced are still available in the codebase for non-themed (categorical, print, brand) contexts.

## Traceability

- Proposal element "Migration of all existing dark: Tailwind variants" → Requirements in this spec
- Proposal element "Classification badge colours exempt" → Requirement: Classification badge colours exempt from token migration
- Design Decision 1 (CSS custom properties) → Requirement: All themed surfaces use `--theme-*`
- Design Decision 2 (Tailwind arbitrary values) → Requirement: `dark:` variants removed from migrated components
- Design Decision 8 (badges exempt) → Requirement: Classification badge colours exempt
- Requirements → Tasks: Tasks 5–7 (component migration by domain)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: No user-controlled content injected into CSS variable values

- **Given** the theme selector only accepts values from the static `THEMES` config array
- **When** `setTheme(name)` is called
- **Then** only `name` values from the known `THEMES` array are applied to `document.documentElement.className`; arbitrary strings from outside the config are rejected

### Requirement: Operability

#### Scenario: Post-migration completeness verified by grep

- **Given** the full migration is complete
- **When** `grep -r "dark:" src/ --include="*.tsx"` is run (excluding badge files)
- **Then** zero results are found outside of known-exempt badge components

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED base.css imported before theme files

The system SHALL import `src/styles/base.css` in the main stylesheet entry point before any theme file imports, so that `:root` defaults are defined at lower specificity than theme overrides.

#### Scenario: base.css precedes theme imports

- **Given** `src/styles.css` (or equivalent entry point) is inspected
- **When** the import order is checked
- **Then** `base.css` appears before `themes/dark.css`, `themes/light-cool.css`, and `themes/light-warm.css`

#### Scenario: Theme override wins over base default

- **Given** `html.dark` is active and `dark.css` overrides `--theme-error-base`
- **When** `--theme-error-base` is resolved via `getComputedStyle`
- **Then** the dark theme's value takes precedence over the `:root` value from `base.css`

## MODIFIED Requirements

### Requirement: MODIFIED No hardcoded Tailwind color classes remain in migrated component files

The system SHALL have zero occurrences of raw Tailwind color scale classes matching the pattern `(text|bg|border)-(red|blue|cyan|amber|orange|green|gray|slate|zinc|neutral|stone|violet|emerald|indigo|purple|pink|rose)-[0-9]+` in the 26 affected files listed in issue #316, with the exception of `CookbookStandaloneLayout` which uses `--theme-print-*` tokens (addressed in print-tokens.md) and any files determined to have legitimately intentional hardcoded colors documented with an inline comment.

#### Scenario: grep finds no hardcoded classes in migrated files

- **Given** all 26 component/route files have been migrated
- **When** a CI grep runs the pattern from issue #316 against `src/`
- **Then** the exit code is non-zero (no matches) OR all remaining matches are annotated with `/* theme-intentional */` comments

#### Scenario: Gray/slate utility classes replaced by structural tokens

- **Given** a component previously used `text-gray-400` (15 occurrences project-wide)
- **When** the component is migrated
- **Then** `text-gray-400` is replaced with `text-[var(--theme-fg-subtle)]` or equivalent structural token; no manual `dark:` variant is needed

### Requirement: MODIFIED Components render correctly in all three themes after migration

The system SHALL produce no visual regressions across dark, light-cool, and light-warm themes for all migrated components.

#### Scenario: Dark theme renders identically before and after migration

- **Given** a Playwright screenshot baseline exists for dark theme
- **When** the migrated components are rendered in dark theme
- **Then** the screenshot matches the baseline within an acceptable pixel diff threshold

#### Scenario: Light-cool theme status colors are legible

- **Given** `html.light-cool` is active
- **When** a form renders with a validation error (using `--theme-error` and `--theme-error-bg`)
- **Then** the error text has a contrast ratio ≥ 4.5:1 against the surface background

## REMOVED Requirements

### Requirement: REMOVED Manual `dark:` variant classes on status and badge colors

Reason for removal: Theme-specific color values for status states and badges move entirely into `dark.css` token overrides. Components no longer need `dark:text-red-400`, `dark:bg-amber-500/20`, or similar — the token cascade handles theme differentiation.

## Traceability

- Proposal element "26 component files with hardcoded color classes" → Requirement: MODIFIED No hardcoded classes remain
- Design decision 5 (Tailwind arbitrary values) → Requirement: MODIFIED No hardcoded classes remain
- Design decision 1 (base.css `:root` cascade) → Requirement: ADDED base.css imported before theme files
- Requirement: ADDED base.css import order → Tasks: "Update src/styles.css import order"
- Requirement: MODIFIED No hardcoded classes → Tasks: per-file migration tasks in tasks.md
- Requirement: MODIFIED Components render correctly → Tasks: "Visual regression check", "E2E screenshot tests"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No JS bundle size increase

- **Given** the migration adds only CSS files and removes hardcoded Tailwind classes
- **When** the production build is analyzed
- **Then** the JS bundle size is unchanged (CSS changes only affect the CSS bundle, which may slightly decrease due to removed inline `dark:` variants)

### Requirement: Reliability

#### Scenario: Hardcoded color grep enforced in CI

- **Given** the CI pipeline runs after this change merges
- **When** a future PR introduces a hardcoded color class in a migrated file
- **Then** the grep check fails and blocks the PR from merging

### Requirement: Security

No security-relevant changes. This is a pure CSS token refactor with no authentication, authorization, or data handling impact.

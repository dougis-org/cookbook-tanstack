## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Light (warm) palette applies correct token values

The system SHALL resolve all 14 CSS custom properties to warm-toned values under `html.light-warm` as defined in `src/styles/themes/light-warm.css`.

#### Scenario: Background token resolves to amber.50

- **Given** the Light (warm) theme is active (`html.light-warm`)
- **When** `getComputedStyle(document.documentElement).getPropertyValue('--theme-bg')` is evaluated
- **Then** the resolved value equals the computed color for `amber.50` (`#fffbeb` / `rgb(255 251 235)`)

#### Scenario: Accent token resolves to amber.700

- **Given** the Light (warm) theme is active
- **When** an active filter chip is rendered (e.g. `?hasImage=true`)
- **Then** the chip's computed text color equals the resolved value of `--theme-accent`
- **And** `--theme-accent` resolves to amber.700 (`#b45309` / approximately `rgb(180 83 9)`)

#### Scenario: Header surface changes color on switch to Light (warm)

- **Given** the app is in Dark theme
- **When** the user switches to Light (warm)
- **Then** the `.site-header` background color is different from the dark theme value

### Requirement: ADDED Warm accent meets WCAG AA contrast on white surface

The system SHALL use an accent color that achieves ≥ 4.5:1 contrast ratio against white for the Light (warm) theme.

#### Scenario: amber.700 contrast on white is ≥ 4.5:1

- **Given** `--theme-accent` resolves to `amber.700` (#b45309)
- **When** rendered as foreground text on a white (`#ffffff`) surface
- **Then** the contrast ratio is approximately 4.7:1, meeting WCAG AA
- **Note**: Verified statically; not enforced by automated E2E contrast scanner

## MODIFIED Requirements

No existing palette requirements are modified (Light (warm) is additive; Dark and Light (cool) tokens are unchanged).

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal element (amber.50 bg) → Requirement: Background token resolves to amber.50 → Task: Implement `--theme-bg` in `light-warm.css`
- Proposal element (amber.700 accent) → Requirement: Accent token resolves to amber.700 → Task: Implement `--theme-accent` in `light-warm.css`
- Design Decision 4 (amber.700 for WCAG AA) → Requirement: Warm accent meets WCAG AA → Task: Implement `--theme-accent` in `light-warm.css`
- Design Decision 5 (warm shadows) → Requirement: Header surface changes → Task: Implement shadow tokens in `light-warm.css`

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Foreground/background contrast for primary text

- **Given** the Light (warm) theme is active
- **When** body text (`--theme-fg` = stone.900 on white surface) is rendered
- **Then** the contrast ratio is approximately 16:1, exceeding WCAG AAA
- **Note**: stone.600 on white ≈ 5.9:1 (AA); amber.700 on white ≈ 4.7:1 (AA). All pairs meet minimum.

### Requirement: Performance

#### Scenario: No additional runtime cost

- **Given** the Light (warm) CSS file is loaded
- **When** the theme is applied or switched
- **Then** no JavaScript executes for the token resolution — CSS custom properties resolve natively by the browser

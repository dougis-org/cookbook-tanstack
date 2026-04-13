## ADDED Requirements

### Requirement: ADDED Light (cool) full token set with shadow tokens

The system SHALL define the complete Light (cool) token set in `src/styles/themes/light-cool.css` per the color system documented in the proposal.

#### Scenario: Page background is slate-100 in light-cool

- **Given** `html.light-cool` is active
- **When** the computed value of `--theme-bg` is read from `document.documentElement`
- **Then** the value resolves to `rgb(241, 245, 249)` (Tailwind `slate-100`)

#### Scenario: Card surfaces are white and elevated above the page

- **Given** `html.light-cool` is active
- **When** a recipe card, feature card, or cookbook card is rendered
- **Then** the card background is `white` (`var(--theme-surface)`) and a visible shadow (`var(--theme-shadow-sm)`) distinguishes it from the `slate-100` page background

#### Scenario: Accent colour is blue-600 in light-cool

- **Given** `html.light-cool` is active
- **When** a CTA button, active link, or active filter chip is rendered
- **Then** the accent colour resolves to `rgb(37, 99, 235)` (Tailwind `blue-600`)

### Requirement: ADDED WCAG AA contrast compliance for all token-driven text in light-cool

The system SHALL ensure all non-exempt text rendered using `--theme-fg`, `--theme-fg-muted`, and `--theme-fg-subtle` tokens meets WCAG AA minimum contrast (4.5:1) against their respective background surfaces.

#### Scenario: Primary text (fg) meets contrast on white surface

- **Given** `html.light-cool` is active and a card uses `var(--theme-surface)` (white) background
- **When** primary text using `var(--theme-fg)` (`slate-900`, `#0f172a`) is rendered
- **Then** the contrast ratio against white is ≥ 4.5:1 (actual: ~17:1 ✓)

#### Scenario: Muted text (fg-muted) meets contrast on white surface

- **Given** `html.light-cool` is active
- **When** secondary text using `var(--theme-fg-muted)` (`slate-600`, `#475569`) is rendered on white
- **Then** the contrast ratio against white is ≥ 4.5:1 (actual: ~7:1 ✓)

#### Scenario: Subtle text (fg-subtle) meets contrast on white surface

- **Given** `html.light-cool` is active
- **When** placeholder or caption text using `var(--theme-fg-subtle)` (`slate-500`, `#64748b`) is rendered on white
- **Then** the contrast ratio against white is ≥ 4.5:1 (actual: ~5:1 ✓)

#### Scenario: Accent text meets contrast on white surface

- **Given** `html.light-cool` is active
- **When** a link or CTA using `var(--theme-accent)` (`blue-600`, `#2563eb`) is rendered on white
- **Then** the contrast ratio against white is ≥ 4.5:1 (actual: ~5.9:1 ✓)

#### Scenario: Subtle text fails contrast in current placeholder light theme (regression proof)

- **Given** the old placeholder `html.light` block used `gray-400` (`#9ca3af`) for `--theme-fg-subtle`
- **When** contrast is measured against white
- **Then** the ratio is ~3.5:1 — below WCAG AA; the new `slate-500` value corrects this

## MODIFIED Requirements

### Requirement: MODIFIED `--theme-fg-subtle` value in light theme corrected for WCAG compliance

The system SHALL use `slate-500` (`#64748b`) for `--theme-fg-subtle` in the light-cool theme, replacing the previous `gray-400` value which failed WCAG AA.

#### Scenario: Placeholder text is readable in light-cool

- **Given** `html.light-cool` is active
- **When** an input field's placeholder text is rendered using `var(--theme-fg-subtle)`
- **Then** the text is visibly readable and meets ≥ 4.5:1 contrast against the `var(--theme-surface-raised)` (`slate-50`) background

### Requirement: MODIFIED PageLayout gradient produces visual hierarchy in light-cool

The system SHALL render the page background as a flat `--theme-bg` colour so card shadows provide the elevation signal, rather than a gradient that creates an invisible mid-section.

#### Scenario: Home page features section cards are visually distinct from page background

- **Given** `html.light-cool` is active and the home page features section is visible
- **When** the computed background colour of a feature card is compared to the page background
- **Then** the card appears visually elevated (white on slate-100) and is clearly distinguishable without requiring border inspection

## REMOVED Requirements

### Requirement: REMOVED Cyan accent in placeholder light theme

Reason for removal: `cyan-600` was used as the accent in the placeholder `html.light` block for functional parity with dark. The light-cool theme uses theme-specific `blue-600` as the accent — a deliberate design choice for the cool blue-gray character of this theme.

## Traceability

- Proposal element (color system / 60-30-10) → Requirements: ADDED Light cool token set, ADDED WCAG AA compliance
- Design decision 5 (fg-subtle fix) → Requirement: MODIFIED fg-subtle
- Design decision 6 (theme-specific accent) → Requirement: REMOVED cyan accent; ADDED accent is blue-600
- Design decision 7 (PageLayout gradient) → Requirement: MODIFIED PageLayout gradient
- Requirements → Tasks: T3 (create light-cool.css), T9 (PageLayout fix), T10 (hero fix)

## Non-Functional Acceptance Criteria

### Requirement: Accessibility — WCAG AA contrast across all text roles

#### Scenario: Page subtitle (fg-subtle) in light-cool passes WCAG AA

- **Given** `html.light-cool` is active and the recipes page subtitle is visible
- **When** the computed text colour of the subtitle (`var(--theme-fg-subtle)`) is measured against `var(--theme-bg)` (`slate-100`)
- **Then** the contrast ratio is ≥ 4.5:1

### Requirement: Reliability — dark theme token values unchanged

#### Scenario: Dark theme shadow tokens are visually inert

- **Given** `html.dark` is active
- **When** `var(--theme-shadow-sm)` is applied to a card element
- **Then** no visible shadow appears (value is `0 0 0 0 transparent`)

#### Scenario: Dark theme colour tokens are unchanged from pre-migration values

- **Given** the dark theme tokens have been extracted from `styles.css` to `src/styles/themes/dark.css`
- **When** the dark theme E2E test suite runs
- **Then** all tests pass without modification — no colour values changed during extraction

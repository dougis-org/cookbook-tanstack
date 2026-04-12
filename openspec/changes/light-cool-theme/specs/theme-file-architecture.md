## ADDED Requirements

### Requirement: ADDED Per-file theme CSS architecture

The system SHALL store each theme's CSS custom property definitions in its own file under `src/styles/themes/`, imported from `src/styles.css`.

#### Scenario: Dark theme loads from its own file

- **Given** `src/styles/themes/dark.css` exists and defines `html.dark { --theme-* }` tokens
- **When** the application loads with `html.dark` active
- **Then** all `--theme-*` custom properties resolve to the dark theme values defined in `dark.css`

#### Scenario: Light-cool theme loads from its own file

- **Given** `src/styles/themes/light-cool.css` exists and defines `html.light-cool { --theme-* }` tokens
- **When** the application loads with `html.light-cool` active
- **Then** all `--theme-*` custom properties resolve to the light-cool theme values defined in `light-cool.css`

#### Scenario: Adding a future theme requires no existing file edits beyond styles.css import

- **Given** a developer creates `src/styles/themes/solarized.css` with `html.solarized { --theme-* }` tokens
- **When** they add `@import "./styles/themes/solarized.css"` to `src/styles.css` and add `{ id: 'solarized', label: 'Solarized' }` to `THEMES`
- **Then** the Solarized theme is selectable and applies correctly without any component file changes

### Requirement: ADDED Shadow tokens in the `--theme-*` contract

The system SHALL define `--theme-shadow-sm` and `--theme-shadow-md` in every theme file as part of the standard token contract.

#### Scenario: Shadow tokens resolve in light-cool theme

- **Given** the light-cool theme is active
- **When** a component references `var(--theme-shadow-sm)` or `var(--theme-shadow-md)`
- **Then** the resolved value is a `box-shadow` string with `slate-900` RGB tint at ~8% opacity

#### Scenario: Shadow tokens are visually inert in dark theme

- **Given** the dark theme is active
- **When** a component references `var(--theme-shadow-sm)` or `var(--theme-shadow-md)`
- **Then** the resolved value is `0 0 0 0 transparent` — no visible shadow effect

## MODIFIED Requirements

### Requirement: MODIFIED `src/styles.css` delegates theme tokens to imported files

The system SHALL import theme files rather than defining `html.dark` / `html.light` blocks inline in `src/styles.css`.

#### Scenario: styles.css contains only imports and base styles

- **Given** the updated `src/styles.css`
- **When** a developer reads the file
- **Then** it contains `@import` statements for each theme file and base body/code styles, but no `html.<theme-name>` blocks

## REMOVED Requirements

### Requirement: REMOVED Inline `html.light` block in `src/styles.css`

Reason for removal: Replaced by `src/styles/themes/light-cool.css` with the fully designed light-cool token set. The placeholder `html.light` block is deleted.

### Requirement: REMOVED Inline `html.dark` block in `src/styles.css`

Reason for removal: Extracted to `src/styles/themes/dark.css` for consistency with the per-file architecture.

## Traceability

- Proposal element (per-file architecture) → Requirement: ADDED Per-file theme CSS architecture
- Design decision 1 (per-file architecture) → Requirement: ADDED Per-file theme CSS architecture
- Design decision 4 (shadow tokens) → Requirement: ADDED Shadow tokens
- Proposal element (styles.css extraction) → Requirement: MODIFIED styles.css delegates
- Requirements → Tasks: T3 (create theme files), T4 (update styles.css import)

## Non-Functional Acceptance Criteria

### Requirement: Reliability — dark theme unaffected by architecture change

#### Scenario: Existing dark theme E2E tests pass without modification

- **Given** the dark theme CSS has been extracted to `src/styles/themes/dark.css`
- **When** the full E2E test suite runs with dark theme active
- **Then** all previously passing dark theme tests continue to pass

### Requirement: Reliability — print isolation unaffected

#### Scenario: PrintLayout override still works after architecture change

- **Given** `PrintLayout` overrides `--theme-bg` to `white` via inline style
- **When** a cookbook print route is visited with `light-cool` active
- **Then** the print wrapper background resolves to white (existing E2E print isolation test passes)

### Requirement: Performance — build succeeds with `@import` theme files

#### Scenario: Production build completes without Tailwind parsing errors

- **Given** `src/styles.css` uses `@import` to load theme files
- **When** `npm run build` is executed
- **Then** the build completes without CSS parsing errors and the bundled CSS contains the correct token definitions for both themes

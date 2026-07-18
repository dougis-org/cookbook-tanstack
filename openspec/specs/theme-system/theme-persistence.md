## MODIFIED Requirements

### Requirement: MODIFIED Theme id for light theme changed to `light-cool`

The system SHALL recognise `'light-cool'` as a valid theme id, apply `html.light-cool` class, and display the label `"Light (cool)"` in the theme selector. The old id `'light'` SHALL NOT be listed as a selectable theme.

#### Scenario: Theme selector shows "Light (cool)" option

- **Given** `html.light-cool` support is registered in `ThemeContext.THEMES`
- **When** a user opens the hamburger menu
- **Then** a button labelled "Light (cool)" is visible in the theme selector
- **And** no button labelled "Light" (without qualifier) appears

#### Scenario: Selecting Light (cool) applies the correct class

- **Given** the theme selector is open with Dark currently active
- **When** the user clicks "Light (cool)"
- **Then** `document.documentElement.className` becomes `'light-cool'`
- **And** `localStorage['cookbook-theme']` becomes `'light-cool'`

#### Scenario: Light (cool) theme persists across page reload

- **Given** `localStorage['cookbook-theme']` is `'light-cool'`
- **When** the page is reloaded
- **Then** `html.light-cool` is applied before hydration (no dark flash)
- **And** the theme selector shows "Light (cool)" as the active option (`aria-pressed="true"`)

### Requirement: MODIFIED Inline script allowlist updated to include `light-cool`

The system SHALL apply `'light-cool'` from localStorage before first paint. An unknown stored value SHALL still fall back to `'dark'`.

#### Scenario: `light-cool` stored in localStorage is applied before hydration

- **Given** `localStorage['cookbook-theme']` is `'light-cool'`
- **When** the page loads at `waitUntil: 'commit'` (before React hydration)
- **Then** `document.documentElement.className` is `'light-cool'`

#### Scenario: Unknown theme id falls back to dark

- **Given** `localStorage['cookbook-theme']` is `'solarized'` (not yet registered)
- **When** the page loads
- **Then** `document.documentElement.className` is `'dark'`

### Requirement: MODIFIED localStorage migration shim upgrades `'light'` to `'light-cool'`

The system SHALL transparently upgrade a stored `'light'` value to `'light-cool'` on next page load, so existing users are not downgraded to dark.

#### Scenario: Stored `'light'` is migrated to `'light-cool'` on load

- **Given** `localStorage['cookbook-theme']` is `'light'`
- **When** the inline script runs on page load
- **Then** `localStorage['cookbook-theme']` is rewritten to `'light-cool'`
- **And** `document.documentElement.className` is set to `'light-cool'`
- **And** no dark flash occurs

### Requirement: MODIFIED Logged-in users' theme is reconciled against a server-persisted value after hydration

The system SHALL, for a logged-in user whose session carries a `user.theme` value that differs from the `localStorage`-resolved theme, update the active theme (DOM class, React state, and `localStorage`) to match the session value after hydration completes. `localStorage` SHALL remain authoritative for the pre-hydration, flash-avoidance first paint — this reconciliation happens only after mount.

#### Scenario: Session theme differs from localStorage on a new device

- **Given** a logged-in user whose session has `user.theme` = `'dark-greens'`
- **And** this device's `localStorage['cookbook-theme']` is unset (defaults to `'dark'`)
- **When** the page loads and hydration completes
- **Then** the page first paints `'dark'` (no regression to today's flash-free single-device pre-hydration behavior)
- **And** shortly after hydration, `document.documentElement.className` updates to `'dark-greens'`
- **And** `localStorage['cookbook-theme']` is updated to `'dark-greens'`

#### Scenario: Session theme matches localStorage — no visible change

- **Given** a logged-in user whose session has `user.theme` = `'light-cool'`
- **And** this device's `localStorage['cookbook-theme']` is already `'light-cool'`
- **When** the page loads and hydration completes
- **Then** no theme change or flash occurs; the page remains on `'light-cool'` throughout

#### Scenario: Anonymous/logged-out users are unaffected

- **Given** no active session
- **When** the page loads
- **Then** theme resolution behaves exactly as it does today — `localStorage` only, no server reconciliation attempted

## REMOVED Requirements

### Requirement: REMOVED Theme id `'light'` and label `"Light"`

Reason for removal: Replaced by `'light-cool'` with label `"Light (cool)"`. The old id is handled only by the migration shim and is not registered as a selectable theme.

## Traceability

- Proposal element (theme id light-cool) → Requirements: MODIFIED theme id, MODIFIED inline script allowlist
- Design decision 2 (light-cool id) → Requirement: MODIFIED theme id
- Design decision 3 (migration shim) → Requirement: MODIFIED localStorage migration shim
- Requirements → Tasks: T5 (ThemeContext update), T6 (inline script update)
- Proposal element (post-hydration reconciliation, accepted flash on new devices) → Requirement: MODIFIED Logged-in users' theme is reconciled against a server-persisted value after hydration (see [`user-settings-preferences` design](../../changes/archive/2026-07-17-user-settings-preferences/design.md), decision 3)

## Non-Functional Acceptance Criteria

### Requirement: Performance — no flash of wrong theme with light-cool stored

#### Scenario: No dark flash when light-cool is the stored preference

- **Given** `localStorage['cookbook-theme']` is `'light-cool'`
- **When** the page is navigated to and captured at `waitUntil: 'commit'`
- **Then** `document.documentElement.className` is `'light-cool'` — the dark theme is never painted

### Requirement: Reliability — migration shim is idempotent

#### Scenario: Shim does not rewrite `light-cool` to itself repeatedly

- **Given** `localStorage['cookbook-theme']` is already `'light-cool'`
- **When** the inline script runs
- **Then** `localStorage['cookbook-theme']` remains `'light-cool'` and no unnecessary write occurs

### Requirement: Reliability — localStorage unavailable does not crash the shim

#### Scenario: Inline script handles localStorage access error gracefully

- **Given** localStorage throws on read (e.g., private browsing, sandboxed iframe)
- **When** the inline script runs
- **Then** the error is caught; `html` class remains `'dark'`; no JavaScript error propagates

### Requirement: Performance — reconciliation does not block first paint

#### Scenario: Reconciliation does not block first paint

- **Given** a logged-in user with a session-stored theme
- **When** the page loads
- **Then** first paint occurs using the pre-hydration inline-script/localStorage value, unblocked by any network or session-resolution wait

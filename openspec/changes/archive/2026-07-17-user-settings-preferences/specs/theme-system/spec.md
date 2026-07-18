## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## Traceability

- Proposal element (post-hydration reconciliation, accepted flash on new devices) → Requirement: MODIFIED Logged-in users' theme is reconciled against a server-persisted value after hydration
- Design decision 3 (post-hydration, not SSR-aware sync) → Requirement: MODIFIED Logged-in users' theme is reconciled against a server-persisted value after hydration
- Requirement → Tasks: `ThemeProvider` reconciliation effect update

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Reconciliation does not block first paint

- **Given** a logged-in user with a session-stored theme
- **When** the page loads
- **Then** first paint occurs using the pre-hydration inline-script/localStorage value, unblocked by any network or session-resolution wait

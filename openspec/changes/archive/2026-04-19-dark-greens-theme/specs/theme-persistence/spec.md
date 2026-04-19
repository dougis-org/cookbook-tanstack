## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED dark-greens theme persists across page reloads

The system SHALL restore `Dark (greens)` theme on reload when it was the last selected theme.

#### Scenario: dark-greens persists after reload

- **Given** the user has selected `Dark (greens)` and `localStorage` contains `'dark-greens'`
- **When** the user reloads the page
- **Then** `<html>` has class `dark-greens` before any React hydration completes
- **And** the theme picker shows `Dark (greens)` as the active selection after hydration

#### Scenario: dark-greens restored from localStorage on cold load

- **Given** `localStorage` contains `'dark-greens'` and no React state exists yet
- **When** the inline init script runs in `<head>`
- **Then** `document.documentElement.className` is set to `'dark-greens'`

## MODIFIED Requirements

### Requirement: MODIFIED Theme allowlist in init script includes dark-greens

The system SHALL recognise `dark-greens` as a valid theme ID in the FOUC-prevention init script.

#### Scenario: dark-greens ID passes allowlist check

- **Given** `localStorage` contains `'dark-greens'`
- **When** the inline `themeInitScript` in `__root.tsx` runs
- **Then** `document.documentElement.className` is set to `'dark-greens'` (not the fallback `'dark'`)

#### Scenario: Unknown ID still falls back to dark

- **Given** `localStorage` contains `'unknown-theme'`
- **When** the inline `themeInitScript` runs
- **Then** `document.documentElement.className` is set to `'dark'`

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal element "Zero FOUC on dark-greens load" → Requirement: MODIFIED Theme allowlist in init script
- Proposal element "dark-greens persists across reloads" → Requirement: ADDED dark-greens theme persists
- Design Decision 5 (criticalCss + init script) → Both requirements above
- Requirements → Tasks: update `__root.tsx` criticalCss and themeInitScript; E2E persistence test

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: localStorage unavailable — graceful fallback

- **Given** `localStorage` throws on access (e.g., private browsing quota exceeded)
- **When** the init script runs or `ThemeContext` reads stored theme
- **Then** no uncaught exception is thrown
- **And** the `dark` (blues) theme is applied as fallback

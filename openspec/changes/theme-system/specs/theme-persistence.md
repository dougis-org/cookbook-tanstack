# Spec: Theme Persistence

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Theme selection persists to localStorage

The system SHALL store the user's selected theme in `localStorage['cookbook-theme']` and restore it on every subsequent page load, defaulting to `dark` when no preference is stored.

#### Scenario: User selects a theme and reloads

- **Given** the user has the app open with the dark theme active
- **When** the user opens the hamburger menu, selects "Light" from the theme selector, and then reloads the page
- **Then** the page loads with the light theme active (`<html>` has class `light`) and the theme selector shows "Light" as the active option

#### Scenario: No stored preference — default to dark

- **Given** the user has no `cookbook-theme` key in localStorage (first visit or cleared storage)
- **When** the user loads the app
- **Then** `<html>` has class `dark` and the theme selector shows "Dark" as the active option

#### Scenario: localStorage is unavailable

- **Given** localStorage throws (e.g., private browsing restrictions, sandboxed iframe)
- **When** the page loads
- **Then** the app renders in dark theme without throwing a JavaScript error

### Requirement: ADDED No theme flash on SSR page load

The system SHALL apply the correct theme class to `<html>` before the browser first paints, regardless of the active theme stored in localStorage.

#### Scenario: Light theme stored, page loads

- **Given** `localStorage['cookbook-theme']` is `'light'`
- **When** the browser navigates to the app
- **Then** `<html class="light">` is set before any content is rendered (no visible dark frame)

#### Scenario: Theme script executes before React hydration

- **Given** the inline theme script is in `<head>` before `<HeadContent />`
- **When** the browser parses the HTML
- **Then** `document.documentElement.className` is set to the stored theme before any React component mounts

## MODIFIED Requirements

### Requirement: MODIFIED `<html>` class is no longer statically hardcoded

The system SHALL set `<html class="dark">` as the server-rendered default, which is immediately overridden by the inline head script on the client before paint.

#### Scenario: SSR renders dark, client corrects to stored preference

- **Given** the server renders `<html class="dark">`
- **When** the inline script runs on the client with `localStorage['cookbook-theme'] === 'light'`
- **Then** `<html class="light">` is in effect before React hydrates

## REMOVED Requirements

### Requirement: DEFERRED REMOVAL — `@custom-variant dark` Tailwind variant

Reason for deferral: This change does not remove the `@custom-variant dark (&:where(.dark, .dark *))` declaration from `src/styles.css`. It is intentionally retained to support remaining `dark:` classes that have not yet been migrated to `--theme-*` CSS variables, including badge tints (`MultiSelectDropdown`, `ClassificationBadge`) and the `RecipeForm` draft banner accent. The custom variant ensures those classes continue to respond to `<html class="dark">` rather than falling back to `prefers-color-scheme`. Full removal is deferred until all remaining `dark:` usages are migrated.

## Traceability

- Proposal element "localStorage persistence" → Requirement: Theme selection persists to localStorage
- Proposal element "SSR flash prevention via inline head script" → Requirement: No theme flash on SSR page load
- Design Decision 4 (inline script) → Requirement: No theme flash on SSR page load
- Design Decision 5 (ThemeContext / useTheme) → Requirement: Theme selection persists to localStorage
- Requirements → Tasks: Task 1 (branch), Task 3 (token definitions), Task 4 (inline script + ThemeContext), Task 9 (theme selector UI)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Theme applied before first paint

- **Given** any stored theme preference in localStorage
- **When** the browser loads the page
- **Then** the correct theme class is on `<html>` before any content is visible (inline script runs synchronously in `<head>`)

### Requirement: Reliability

#### Scenario: Recovery from localStorage failure

- **Given** `localStorage.getItem` throws an exception
- **When** the inline script executes
- **Then** the exception is silently caught, the app renders in `dark` theme, and no JavaScript error surfaces to the user

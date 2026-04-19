## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: FR-1 — Dark theme background visible on first paint

The system SHALL render `<html>` with a dark background (`#0f172a`) before the external stylesheet finishes loading when the active theme is `dark` (including the default/no-preference case).

#### Scenario: First load with dark theme

- **Given** a user has no `cookbook-theme` key in localStorage (or has `"dark"`)
- **When** the browser parses and renders the `<html>` document before the external CSS file has loaded
- **Then** the `<html>` element has `background-color: #0f172a` and `color: #fff` from the inline `<style>` block

#### Scenario: localStorage unavailable (private browsing)

- **Given** localStorage is blocked or throws
- **When** the page is loaded
- **Then** the existing `themeInitScript` catch block defaults to class `dark`, and the inline `<style>` base `html` rule applies `background-color: #0f172a`

---

### Requirement: FR-2 — Light-cool theme background visible on first paint

The system SHALL render `<html>` with a light-cool background (`#f1f5f9`) before the external stylesheet finishes loading when the active theme is `light-cool`.

#### Scenario: First load with light-cool theme

- **Given** a user has `localStorage["cookbook-theme"] = "light-cool"`
- **When** the browser renders the page before the external CSS file has loaded
- **Then** the `<html>` element has `background-color: #f1f5f9` and `color: #0f172a` from the inline `<style>` block

#### Scenario: Legacy "light" value migrated

- **Given** a user has `localStorage["cookbook-theme"] = "light"` (legacy value)
- **When** the page loads
- **Then** the existing `themeInitScript` migrates to `"light-cool"`, and the inline `<style>` `html.light-cool` rule applies the correct background

---

### Requirement: FR-3 — Light-warm theme background visible on first paint

The system SHALL render `<html>` with a light-warm background (`#fffbeb`) before the external stylesheet finishes loading when the active theme is `light-warm`.

#### Scenario: First load with light-warm theme

- **Given** a user has `localStorage["cookbook-theme"] = "light-warm"`
- **When** the browser renders the page before the external CSS file has loaded
- **Then** the `<html>` element has `background-color: #fffbeb` and `color: #1c1917` from the inline `<style>` block

#### Scenario: Unknown theme value falls back to dark

- **Given** a user has `localStorage["cookbook-theme"] = "some-unknown-value"`
- **When** the page loads
- **Then** the `themeInitScript` defaults to class `dark`, and the inline `<style>` base `html` rule applies dark background

---

### Requirement: FR-4 — CSS stylesheet preloaded

The system SHALL emit a `<link rel="preload" as="style">` hint for the main application stylesheet in the `<head>` of every server-rendered page.

#### Scenario: Preload link present in SSR output

- **Given** any page in the application
- **When** the server renders the HTML response
- **Then** the `<head>` contains `<link rel="preload" as="style" href="[appCss fingerprinted URL]">` before the matching `<link rel="stylesheet">`

#### Scenario: Preload does not duplicate stylesheet

- **Given** the preload link is present
- **When** the browser processes the `<head>`
- **Then** the CSS file is fetched only once (preload + stylesheet declarations share the same resource)

---

### Requirement: FR-5 — Theme maintenance checklist documented

The system SHALL have a documented checklist (in `src/routes/__root.tsx` and `docs/theming.md`) that specifies every file requiring update when a new theme is added or an existing theme's background color changes.

#### Scenario: Comment block present in __root.tsx

- **Given** a developer opens `src/routes/__root.tsx`
- **When** they view the `criticalCss` constant
- **Then** an immediately adjacent comment block lists: the inline `criticalCss` constant, `src/styles/themes/<theme>.css`, `src/contexts/ThemeContext.tsx` (THEMES array), and `docs/theming.md`

#### Scenario: docs/theming.md contains checklist section

- **Given** a developer opens `docs/theming.md`
- **When** they search for "Theme Maintenance Checklist"
- **Then** the section exists and lists the same files as the code comment, with step-by-step instructions for adding a new theme

## MODIFIED Requirements

### Requirement: MODIFIED — `<head>` structure in `__root.tsx`

The system SHALL include an inline critical `<style>` block and `rel="preload"` hints in addition to the existing `themeInitScript` and `<HeadContent />` output.

#### Scenario: Head element order

- **Given** any server-rendered page
- **When** the browser receives the HTML
- **Then** the `<head>` elements appear in this order: (1) inline `themeInitScript`, (2) inline critical `<style>` block, (3) React HMR preamble (dev only), (4) `<HeadContent />` output (which includes preload links then stylesheet links)

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal: "Inline critical CSS block in `__root.tsx`" → FR-1, FR-2, FR-3
- Proposal: "`rel=preload` hint for `appCss`" → FR-4
- Proposal: "Maintenance documentation" → FR-5
- Design Decision 1 → FR-1, FR-2, FR-3
- Design Decision 2 → FR-4
- Design Decision 3 → FR-5
- Design Decision 4 → FR-1, FR-2, FR-3 (html element targeting)
- FR-1 → Task: Add inline critical CSS block
- FR-2 → Task: Add inline critical CSS block
- FR-3 → Task: Add inline critical CSS block
- FR-4 → Task: Add preload links to head()
- FR-5 → Task: Add maintenance comment in __root.tsx; Task: Create/update docs/theming.md

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Inline CSS payload size

- **Given** a production build of the application
- **When** the HTML response is inspected
- **Then** the inline `<style>` block is minified (no unnecessary whitespace) and adds no more than 300 bytes to the HTML payload

### Requirement: Security

#### Scenario: No user data in inline style block

- **Given** the inline `<style>` block in `__root.tsx`
- **When** a security review inspects its contents
- **Then** the block contains only hardcoded hex color values — no user-supplied data, no interpolated variables from request context

### Requirement: Reliability

#### Scenario: CSS file cached on repeat visit

- **Given** a user has previously loaded the page (CSS is cached)
- **When** they navigate to the app again
- **Then** the inline critical CSS applies immediately (as on first load) and the cached CSS file loads instantly — no flash occurs and no regression from the preload hint

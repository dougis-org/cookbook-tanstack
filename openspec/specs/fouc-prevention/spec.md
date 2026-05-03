<!-- markdownlint-disable MD013 -->

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

### Requirement: FR-4 — CSS stylesheet preloaded (main app only)

The system SHALL emit a preload hint for the main application stylesheet only; non-critical print CSS SHALL NOT be preloaded during initial app navigation.

#### Scenario: App preload remains before stylesheet

- **Given** any app page in the application
- **When** the server renders the HTML response
- **Then** the `<head>` contains `<link rel="preload" as="style" href="[appCss fingerprinted URL]">` before the matching app CSS `<link rel="stylesheet">`

#### Scenario: Print preload no longer present

- **Given** any app page in the application
- **When** the server renders the HTML response
- **Then** there is no `<link rel="preload" as="style" href="[printCss fingerprinted URL]">`

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

---

### Requirement: FR-6 — Themed boot loader before app stylesheet readiness

The system SHALL show a minimal inline-styled boot loader before the main application stylesheet has loaded.

#### Scenario: Boot loader appears while app CSS is delayed

- **Given** a user navigates to any app page
- **And** the main application stylesheet request is delayed
- **When** the browser parses the initial HTML document
- **Then** the user sees a themed boot loader containing the text "Pre-heating"
- **And** the boot loader includes a visible CSS-only spinner
- **And** the boot loader styling does not depend on external CSS, Tailwind utility classes, React hydration, Lucide icons, or image assets

#### Scenario: Boot loader is hidden after app CSS loads

- **Given** the initial boot loader is visible
- **When** the main application stylesheet finishes loading and applies
- **Then** the boot loader is hidden by the application stylesheet
- **And** the application shell becomes visible

---

### Requirement: FR-7 — App shell cloaked until app stylesheet loads

The system SHALL keep real application content hidden until the main application stylesheet has loaded.

#### Scenario: App content hidden while app CSS is delayed

- **Given** the main application stylesheet request is delayed
- **When** the initial HTML document renders
- **Then** the root application shell is present in the DOM
- **But** visible app content such as the header, navigation links, and route body is not visible to the user

#### Scenario: App content revealed by app stylesheet

- **Given** the main application stylesheet request has completed
- **When** the stylesheet applies
- **Then** the root application shell is visible
- **And** normal app layout, spacing, and theme styles apply

---

### Requirement: FR-8 — Boot loader follows active theme resolution

The system SHALL style the boot loader using the same active theme selected by the root theme initialization script.

#### Scenario: Dark theme boot loader

- **Given** localStorage has no `cookbook-theme` value or has `cookbook-theme = "dark"`
- **When** the page renders before app CSS loads
- **Then** the boot loader uses the dark theme background `#0f172a`, foreground `#ffffff`, and dark accent styling

#### Scenario: Light-cool boot loader

- **Given** localStorage has `cookbook-theme = "light-cool"`
- **When** the page renders before app CSS loads
- **Then** the boot loader uses the light-cool theme background `#f1f5f9`, foreground `#0f172a`, and light-cool accent styling

#### Scenario: Light-warm boot loader

- **Given** localStorage has `cookbook-theme = "light-warm"`
- **When** the page renders before app CSS loads
- **Then** the boot loader uses the light-warm theme background `#fffbeb`, foreground `#1c1917`, and light-warm accent styling

#### Scenario: Legacy and invalid theme values

- **Given** localStorage has `cookbook-theme = "light"`
- **When** the page renders before app CSS loads
- **Then** the theme initialization script migrates the value to `light-cool`
- **And** the boot loader uses light-cool styling
- **Given** localStorage has an invalid value or localStorage throws
- **When** the page renders before app CSS loads
- **Then** the boot loader falls back to dark theme styling

---

### Requirement: FR-9 — Delayed stylesheet feedback and retry

The system SHALL keep the boot loader visible during stylesheet lag or failure and provide delayed feedback with a retry affordance.

#### Scenario: Slow app CSS load

- **Given** the main application stylesheet request takes longer than the normal fast-load path
- **When** the boot loader remains visible past the configured delay threshold
- **Then** the boot loader updates its inline-styled status text to communicate continued loading
- **And** the application shell remains hidden

#### Scenario: App CSS fails to load

- **Given** the main application stylesheet request fails or is aborted
- **When** the boot loader remains visible past the configured failure threshold
- **Then** the boot loader offers a retry affordance that works without React hydration or external CSS
- **And** activating retry reloads the page

---

### Requirement: FR-10 — Print stylesheet preload removed

The system SHALL NOT emit a `rel="preload"` link for the print stylesheet during normal root head rendering.

#### Scenario: Head contains app CSS preload only

- **Given** any server-rendered app page
- **When** the document head is inspected
- **Then** the head contains a `rel="preload" as="style"` link for the main application stylesheet
- **And** the head does not contain a `rel="preload"` link for the print stylesheet

#### Scenario: Print stylesheet remains available

- **Given** a user opens a printable cookbook route or browser print flow
- **When** print styles are needed
- **Then** the print stylesheet remains linked and available for print rendering

---

### Requirement: FR-11 — Theme and boot CSS maintenance documented

The system SHALL document every file that must be updated when boot loader theme values or app themes change.

#### Scenario: Theming documentation names boot loader sync points

- **Given** a developer opens `docs/theming.md`
- **When** they read the theme maintenance checklist
- **Then** it names `src/routes/__root.tsx`, `src/styles.css`, `src/styles/themes/*.css`, and `src/contexts/ThemeContext.tsx` as relevant sync points
- **And** it states that boot loader theme colors must match the active app theme

---

### Requirement: FR-LSHEET-1 — Boot-loader resolves via `l.sheet` fast-path on cached stylesheet load

The system SHALL call `markLoaded()` immediately (without attaching a `load` event listener to the stylesheet `<link>`) when `link.sheet` is already non-null at `init()` time, and the app shell SHALL become visible as a result.

#### Scenario: Second navigation — CSS served from browser HTTP cache

- **Given** a user has already visited the app (first navigation primed the browser context HTTP cache with the content-hashed CSS, served with `Cache-Control: public, max-age=31536000, immutable`)
- **When** the user navigates to `'/'` a second time in the same browser session
- **Then** `#app-shell` is visible after the page loads
- **And** `#boot-loader` is not visible
- **And** no `'load'` event listener was attached to the stylesheet `<link>` element (confirming the `l.sheet` branch fired, not the `addEventListener` branch)
- **And** `link.sheet` is non-null after the page loads (confirming cache priming worked)

#### Scenario: `l.sheet` guard removed — boot-loader spins on cached load

- **Given** the `if (l.sheet) { markLoaded() }` check has been removed from the boot-loader script
- **When** the user navigates to `'/'` a second time (CSS from cache, `link.sheet` non-null before `init()`)
- **Then** a `'load'` event listener IS attached to the stylesheet `<link>` (spy flag is `true`)
- **And** the `fastPathTaken` assertion (`!__cssLoadListenerAttached`) fails
- **And** the test does NOT pass

## MODIFIED Requirements

### Requirement: MODIFIED — `<head>` and body structure in `__root.tsx`

The system SHALL include an inline theme initialization script, inline boot loader critical CSS, a boot loader script, boot loader markup, an app shell wrapper, and root head output that prioritizes the main app stylesheet.

#### Scenario: Root document boot order

- **Given** any server-rendered page
- **When** the browser receives the HTML
- **Then** the theme initialization script appears before inline critical boot CSS
- **And** the inline critical boot CSS appears before body content can paint
- **And** the body contains the boot loader before the app shell wrapper
- **And** `<HeadContent />` output includes app CSS preload and stylesheet links

## REMOVED Requirements

### Requirement: REMOVED — Print stylesheet preload

Reason for removal: Print CSS does not improve first visible app paint and can compete with the main application stylesheet during initial navigation.

#### Scenario: Normal navigation does not preload print CSS

- **Given** a user opens any normal app route
- **When** the browser parses the document head
- **Then** no preload request is initiated for the print stylesheet
- **And** print styling remains available through the normal print stylesheet link

## Traceability

- Proposal: "Inline critical CSS block in `__root.tsx`" → FR-1, FR-2, FR-3
- Proposal: "`rel=preload` hint for `appCss`" → FR-4
- Proposal: "Maintenance documentation" → FR-5
- Proposal: "Themed boot loader" → FR-6, FR-8, FR-9
- Proposal: "Hide app until stylesheet loads" → FR-7
- Proposal: "Remove print preload" → FR-10, MODIFIED FR-4, REMOVED Print stylesheet preload
- Proposal: "Document theme continuity" → FR-11
- Design Decision 1 → FR-1, FR-2, FR-3
- Design Decision 2 → FR-4
- Design Decision 3 → FR-5
- Design Decision 4 → FR-1, FR-2, FR-3 (html element targeting)
- Boot Gate Decision 1 → FR-6, FR-7
- Boot Gate Decision 2 → FR-8, FR-11
- Boot Gate Decision 3 → FR-6, FR-9
- Boot Gate Decision 4 → FR-10, MODIFIED FR-4, REMOVED Print stylesheet preload
- Boot Gate Decision 5 → FR-10 print availability scenario
- FR-1 → Task: Add inline critical CSS block
- FR-2 → Task: Add inline critical CSS block
- FR-3 → Task: Add inline critical CSS block
- FR-4 → Task: Add preload links to head(); remove print preload
- FR-5 → Task: Add maintenance comment in __root.tsx; Task: Create/update docs/theming.md
- FR-6 → Boot gate tasks 1, 3, 4
- FR-7 → Boot gate tasks 1, 2, 3, 4
- FR-8 → Boot gate tasks 1, 3, 4
- FR-9 → Boot gate tasks 1, 3, 4
- FR-10 → Boot gate tasks 2, 4, 5
- FR-11 → Boot gate task 6

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Boot CSS payload remains constrained

- **Given** a production build of the application
- **When** the inline boot CSS and boot script are inspected
- **Then** they contain only the minimal rules and logic required for theme resolution, loader display, app cloaking, delayed feedback, and retry

#### Scenario: Print CSS does not compete for initial preload priority

- **Given** a cold first navigation to the app
- **When** browser network requests are captured
- **Then** the main app stylesheet may be preloaded
- **And** the print stylesheet is not preloaded

### Requirement: Security

#### Scenario: No request or user data in inline critical CSS

- **Given** the inline boot CSS in `src/routes/__root.tsx`
- **When** a security review inspects its contents
- **Then** it contains only hardcoded CSS, hardcoded theme colors, static loader text, and static selectors
- **And** it does not interpolate request-derived or user-supplied values

### Requirement: Reliability

#### Scenario: CSS failure keeps deliberate fallback visible

- **Given** the main application stylesheet fails to load
- **When** the page remains open
- **Then** the user continues to see the themed boot loader rather than unstructured app content
- **And** the retry affordance remains available

#### Scenario: CSS file cached on repeat visit

- **Given** a user has previously loaded the page (CSS is cached)
- **When** they navigate to the app again
- **Then** the inline critical CSS applies immediately (as on first load) and the cached CSS file loads instantly — no flash occurs and no regression from the preload hint

### Requirement: Operability

#### Scenario: Regression test catches unstyled content exposure

- **Given** a future change accidentally reveals app shell content before app CSS loads
- **When** the FOUC prevention E2E tests run with delayed app CSS
- **Then** the tests fail before merge

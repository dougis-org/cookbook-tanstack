<!-- markdownlint-disable MD013 -->

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED FR-6 — Themed boot loader before app stylesheet readiness

The system SHALL show a minimal inline-styled boot loader before the main application stylesheet has loaded.

#### Scenario: Boot loader appears while app CSS is delayed

- **Given** a user navigates to any app page
- **And** the main application stylesheet request is delayed
- **When** the browser parses the initial HTML document
- **Then** the user sees a themed boot loader containing the text "Pre Heating"
- **And** the boot loader includes a visible CSS-only spinner
- **And** the boot loader styling does not depend on external CSS, Tailwind utility classes, React hydration, Lucide icons, or image assets

#### Scenario: Boot loader is hidden after app CSS loads

- **Given** the initial boot loader is visible
- **When** the main application stylesheet finishes loading and applies
- **Then** the boot loader is hidden by the application stylesheet
- **And** the application shell becomes visible

### Requirement: ADDED FR-7 — App shell cloaked until app stylesheet loads

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

### Requirement: ADDED FR-8 — Boot loader follows active theme resolution

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

### Requirement: ADDED FR-9 — Delayed stylesheet feedback and retry

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

### Requirement: ADDED FR-10 — Print stylesheet preload removed

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

### Requirement: ADDED FR-11 — Theme and boot CSS maintenance documented

The system SHALL document every file that must be updated when boot loader theme values or app themes change.

#### Scenario: Theming documentation names boot loader sync points

- **Given** a developer opens `docs/theming.md`
- **When** they read the theme maintenance checklist
- **Then** it names `src/routes/__root.tsx`, `src/styles.css`, `src/styles/themes/*.css`, and `src/contexts/ThemeContext.tsx` as relevant sync points
- **And** it states that boot loader theme colors must match the active app theme

## MODIFIED Requirements

### Requirement: MODIFIED FR-4 — CSS stylesheet preloaded

The system SHALL emit a preload hint for the main application stylesheet only; non-critical print CSS SHALL NOT be preloaded during initial app navigation.

#### Scenario: App preload remains before stylesheet

- **Given** any app page in the application
- **When** the server renders the HTML response
- **Then** the `<head>` contains `<link rel="preload" as="style" href="[appCss fingerprinted URL]">` before the matching app CSS `<link rel="stylesheet">`

#### Scenario: Print preload no longer present

- **Given** any app page in the application
- **When** the server renders the HTML response
- **Then** there is no `<link rel="preload" as="style" href="[printCss fingerprinted URL]">`

### Requirement: MODIFIED Head structure in `__root.tsx`

The system SHALL include an inline theme initialization script, inline boot loader critical CSS, boot loader markup, an app shell wrapper, and root head output that prioritizes the main app stylesheet.

#### Scenario: Root document boot order

- **Given** any server-rendered page
- **When** the browser receives the HTML
- **Then** the theme initialization script appears before inline critical boot CSS
- **And** the inline critical boot CSS appears before body content can paint
- **And** the body contains the boot loader before the app shell wrapper
- **And** `<HeadContent />` output includes app CSS preload and stylesheet links

## REMOVED Requirements

### Requirement: REMOVED Print stylesheet preload

Reason for removal: Print CSS does not improve first visible app paint and can compete with the main application stylesheet during initial navigation.

#### Scenario: Normal navigation does not preload print CSS

- **Given** a user opens any normal app route
- **When** the browser parses the document head
- **Then** no preload request is initiated for the print stylesheet
- **And** print styling remains available through the normal print stylesheet link

## Traceability

- Proposal element "themed boot loader" -> FR-6, FR-8, FR-9
- Proposal element "hide app until stylesheet loads" -> FR-7
- Proposal element "remove print preload" -> FR-10, MODIFIED FR-4, REMOVED Print stylesheet preload
- Proposal element "document theme continuity" -> FR-11
- Design Decision 1 -> FR-6, FR-7
- Design Decision 2 -> FR-8, FR-11
- Design Decision 3 -> FR-6, FR-9
- Design Decision 4 -> FR-10, MODIFIED FR-4, REMOVED Print stylesheet preload
- Design Decision 5 -> FR-10 print availability scenario
- FR-6 -> Tasks 1, 3, 4
- FR-7 -> Tasks 1, 2, 3, 4
- FR-8 -> Tasks 1, 3, 4
- FR-9 -> Tasks 1, 3, 4
- FR-10 -> Tasks 2, 4, 5
- FR-11 -> Task 6

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Print CSS does not compete for initial preload priority

- **Given** a cold first navigation to the app
- **When** browser network requests are captured
- **Then** the main app stylesheet may be preloaded
- **And** the print stylesheet is not preloaded

#### Scenario: Boot CSS payload remains constrained

- **Given** a production build of the application
- **When** the inline boot CSS and boot script are inspected
- **Then** they contain only the minimal rules and logic required for theme resolution, loader display, app cloaking, delayed feedback, and retry

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

### Requirement: Operability

#### Scenario: Regression test catches unstyled content exposure

- **Given** a future change accidentally reveals app shell content before app CSS loads
- **When** the FOUC prevention E2E tests run with delayed app CSS
- **Then** the tests fail before merge

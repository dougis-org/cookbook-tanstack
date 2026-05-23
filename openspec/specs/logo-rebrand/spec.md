## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Brand Mark Component (LogoMark)

The system SHALL render the custom SVG logo mark component in frontend views.

#### Scenario: Renders with custom size and class

- **Given** the `LogoMark` component is rendered with `size={48}` and `className="text-cyan-400"`
- **When** the page mounts
- **Then** the rendered SVG element has a width of `48px`, a height of `48px`, and the CSS class `text-cyan-400`.

## MODIFIED Requirements

### Requirement: MODIFIED Landing Page Hero Branding

The system SHALL render the custom brand mark instead of the Lucide ChefHat icon in the marketing hero.

#### Scenario: Hero brand mark visible

- **Given** an anonymous visitor lands on the landing page `/`
- **When** the hero section renders
- **Then** they see the custom Open Book + Steam brand mark rendered in the hero section, and they do not see the generic ChefHat icon.

### Requirement: MODIFIED Chrome Header Branding

The system SHALL render the custom brand mark instead of the Lucide ChefHat icon in the app chrome.

#### Scenario: Header brand marks visible

- **Given** a user is on any page with the header chrome
- **When** the header navigation mounts
- **Then** both the desktop branding link and the mobile drawer sidebar render the custom Open Book + Steam brand mark.

## REMOVED Requirements

### Requirement: REMOVED ChefHat Brand Identity

Reason for removal:
ChefHat is no longer the brand mark of the application. It is being replaced by the custom brand mark SVG to drive brand alignment.

## Traceability

- Proposal element -> Requirement:
  - Reusable `<LogoMark>` React component -> ADDED Brand Mark Component (LogoMark)
  - Landing Hero Rebrand -> MODIFIED Landing Page Hero Branding
  - Header Brand Icon Swap -> MODIFIED Chrome Header Branding
- Design decision -> Requirement:
  - Decision 1 (Create component) -> ADDED Brand Mark Component (LogoMark)
  - Decision 2 (Hero swap) -> MODIFIED Landing Page Hero Branding
  - Decision 3 (Header swap) -> MODIFIED Chrome Header Branding
- Requirement -> Task(s):
  - ADDED Brand Mark Component (LogoMark) -> Task 1 (Implement `LogoMark.tsx` component and unit tests)
  - MODIFIED Landing Page Hero Branding -> Task 2 (Update `src/routes/index.tsx` hero and verify E2E tests)
  - MODIFIED Chrome Header Branding -> Task 3 (Update `src/components/Header.tsx` brand links and verify unit/E2E tests)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency and bundle impact

- **Given** a standard mobile device loading the landing page `/`
- **When** the page is requested
- **Then** the brand mark SVG is rendered statically in the initial HTML paint without any async JS network fetch.

### Requirement: Operability (Theming)

#### Scenario: Theme responsiveness

- **Given** the application theme changes between light and dark modes
- **When** a user clicks the theme selector button
- **Then** the brand mark color automatically transitions to the correct theme color using `stroke="currentColor"`.

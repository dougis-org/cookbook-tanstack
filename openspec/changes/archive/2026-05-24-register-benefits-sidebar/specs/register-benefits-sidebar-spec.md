## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Register Benefits Sidebar

The system SHALL render a conversion-optimized registration sidebar showing the 5 key benefits of "My CookBooks" in a responsive multi-column layout, ensuring user reassurance on visitor onboarding.

#### Scenario: Rendering benefits sidebar on desktop (≥ 768px / md breakpoint)

- **Given** a guest user navigating to `/auth/register` on a viewport of width 1024px
- **When** the registration page renders
- **Then** the auth card expands up to `max-w-3xl` and displays a two-column grid showing the registration fields on the left column, and the benefits sidebar on the right column.

#### Scenario: Stacking benefits sidebar on mobile (< 768px / md breakpoint)

- **Given** a guest user navigating to `/auth/register` on a viewport of width 375px
- **When** the page renders
- **Then** the benefits sidebar displays cleanly directly **above** the registration form inputs.

#### Scenario: Interactive hover states on benefits bullets

- **Given** the registration benefits sidebar is rendered on screen
- **When** the user hovers over a specific benefit bullet point
- **Then** the small accent-colored Lucide checkmark scales up smoothly (`scale-110`) and the benefit description text highlights to `--theme-fg`.

### Requirement: ADDED Legal Consent Microcopy

The system SHALL render a small-print legal consent statement underneath the Create Account submit button.

#### Scenario: Displaying legal links inside RegisterForm

- **Given** a guest user viewing the registration form
- **When** the form is displayed
- **Then** the text "By creating an account you agree to our Terms and Privacy Policy." is rendered beneath the submit button as `text-xs text-[var(--theme-fg-subtle)]`, with "Terms" and "Privacy Policy" behaving as hover-accented links stubbed with `href="#"` and carrying a TODO comment in the JSX.

## MODIFIED Requirements

### Requirement: MODIFIED Customizable Auth Layout Wrapper Sizing

The system SHALL allow the enclosing `AuthPageLayout` wrapper to support dynamic width adjustments to permit wider multi-column component cards while keeping default narrow forms centered.

#### Scenario: Dynamic Max Width Class Binding

- **Given** the `AuthPageLayout` component is mounted
- **When** an optional `maxWidth` property (such as `"max-w-3xl"`) is supplied
- **Then** the card outer wrapper replaces the default `"max-w-md"` class with `"max-w-3xl"`.

## REMOVED Requirements

- None. No existing features are removed.

## Traceability

- **Proposal element -> Requirement:**
  - Responsive multi-column layout -> ADDED Register Benefits Sidebar
  - Lucide checkmark bullet benefits -> ADDED Register Benefits Sidebar
  - Legal microcopy below the button -> ADDED Legal Consent Microcopy
  - Customizable auth card container -> MODIFIED Customizable Auth Layout Wrapper Sizing

- **Design decision -> Requirement:**
  - Decision 1 (Customizable width on AuthPageLayout) -> MODIFIED Customizable Auth Layout Wrapper Sizing
  - Decision 2 (Pure CSS columns reordering) -> ADDED Register Benefits Sidebar
  - Decision 3 (Interactive badges list) -> ADDED Register Benefits Sidebar

- **Requirement -> Task(s):**
  - MODIFIED Customizable Auth Layout Wrapper Sizing -> Task 1: Add maxWidth optional property to AuthPageLayout.tsx
  - ADDED Register Benefits Sidebar -> Task 2: Implement responsive columns grid layout in RegisterForm.tsx, Task 3: Build the visual Benefits Sidebar card and check icons
  - ADDED Legal Consent Microcopy -> Task 4: Insert legal links below form submit button
  - General Integration -> Task 5: Pass maxWidth="max-w-3xl" inside routes/auth/register.tsx, Task 6: Add test assertions to RegisterForm.test.tsx

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget / layout shift

- **Given** a user loading the registration page under standard connection speeds
- **When** the page renders
- **Then** the Cumulative Layout Shift (CLS) score remains exactly `0.0` with no visual reflows or hydration mismatches.

### Requirement: Security

#### Scenario: Link tag safety

- **Given** a user clicking the Terms or Privacy Policy links
- **When** the link fires
- **Then** the router securely handles local transitions, preventing open redirect risks.

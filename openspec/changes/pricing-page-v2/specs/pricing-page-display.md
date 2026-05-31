## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Billing Frequency Toggle

The system SHALL render an interactive Annual/Monthly toggle at the top of the pricing page, defaulting to Annual billing and showing a "Save 2 months" discount tag.

#### Scenario: Annual Billing Selected by Default

- **Given** an anonymous or authenticated user lands on `/pricing`
- **When** the page renders
- **Then** the billing toggle is in the "Annual" active state, the "Save 2 months" badge is visible, and the paid cards display the annual-equivalent monthly rate (e.g. `$2.33/mo` for Prep Cook) alongside the `"Billed annually · $27.99/yr"` caption.

#### Scenario: User Swaps to Monthly Billing

- **Given** the user is viewing `/pricing` in default Annual mode
- **When** the user clicks the "Monthly" option on the billing toggle
- **Then** the toggle updates its active state, the "Save 2 months" badge is hidden, and all paid cards instantly update their price labels to show the monthly rate directly (e.g. `$2.99/mo` for Prep Cook) with no annual caption underneath.

---

### Requirement: ADDED Cheapest Paid Tier Visual Highlight

The system SHALL visually emphasize the Prep Cook plan as the "Most popular" recommended plan.

#### Scenario: Prep Cook Visual Layout

- **Given** the pricing page renders
- **When** the user views the Prep Cook tier card
- **Then** the card displays a `"Most popular"` text badge at its top-center edge, renders with a distinct accent border and accent-colored ring, and features a solid accent-filled CTA button.

---

### Requirement: ADDED Reassurance Trust Row

The system SHALL display a 3-column reassurance row of trust and safety indicators below the pricing card grid.

#### Scenario: Reassurance Row Rendering

- **Given** the user scrolls below the tier card grid
- **When** the reassurance section renders
- **Then** 3 distinct columns are visible containing Lucide icons and headings: "Cancel anytime" (with `RefreshCw`), "30-day guarantee" (with `ShieldCheck`), and "Export anytime" (with `Download`).

---

### Requirement: ADDED FAQ Accordion

The system SHALL display a collapsible FAQ section containing pre-sales information, with the first question open by default.

#### Scenario: FAQ Default State and Interaction

- **Given** the FAQ section renders on page mount
- **When** the page finishes loading
- **Then** the first accordion item ("Can I cancel my subscription at any time?") is expanded and its answer text is fully visible, while all other answers are collapsed.
- **When** the user clicks on a collapsed FAQ item's header
- **Then** that item expands (revealing its answer), and the previously expanded item collapses automatically.

---

## MODIFIED Requirements

### Requirement: MODIFIED Context-aware Tier Card CTAs

The system SHALL render interactive, context-aware CTAs inside each tier card to replace the legacy global registration button.

#### Scenario: CTA Action for Non-Active Tier Card

- **Given** a user is logged in with active tier `home-cook`
- **When** the user views the other tier cards (Prep Cook, Sous Chef, Executive Chef)
- **Then** each card renders an active Link button pointing to `/change-tier` with text `"Upgrade"` or `"Get Started"`.

#### Scenario: CTA Action for Active Tier Card

- **Given** a user is logged in with active tier `prep-cook`
- **When** the user views the Prep Cook tier card
- **Then** the card renders a disabled button containing the text `"Current plan"`.

---

## REMOVED Requirements

### Requirement: REMOVED Static Side-by-Side Dual Prices

Reason for removal: Showing both yearly and monthly prices statically side-by-side on all cards is hard to scan and harms conversion. It is replaced by the interactive billing toggle.

### Requirement: REMOVED Single Global CTA Under Grid

Reason for removal: A single global CTA is less friction-free than per-card CTAs. Tiers will now contain direct, context-aware actions inside their cards.

---

## Traceability

- Proposal element: Annual/monthly toggle -> Requirement: ADDED Billing Frequency Toggle
- Proposal element: Prep Cook cheapest paid tier visual emphasis -> Requirement: ADDED Cheapest Paid Tier Visual Highlight
- Proposal element: Reassurance trust row -> Requirement: ADDED Reassurance Trust Row
- Proposal element: FAQ accordion -> Requirement: ADDED FAQ Accordion
- Proposal element: Contextual CTAs -> Requirement: MODIFIED Context-aware Tier Card CTAs
- Design decision: Decision 1 -> Requirement: ADDED Billing Frequency Toggle
- Design decision: Decision 2 -> Requirement: MODIFIED Context-aware Tier Card CTAs
- Design decision: Decision 3 -> Requirement: ADDED FAQ Accordion

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Instant State Repaint Latency

- **Given** the user is viewing the pricing page
- **When** the user clicks the billing toggle to swap frequencies
- **Then** the price text and descriptions update instantly (under 50ms) with zero layout thrashing and zero network requests made.

### Requirement: Accessibility & Operability

#### Scenario: Access Control & Keyboard Navigation

- **Given** a screen reader user navigates the page
- **When** interacting with the billing toggle
- **Then** all toggle options must have descriptive labels and support standard keyboard tab-selection.
- **When** viewing different themes
- **Then** all visual text elements on cards, reassurance columns, and the FAQ section must maintain a contrast ratio that conforms to WCAG AA guidelines.

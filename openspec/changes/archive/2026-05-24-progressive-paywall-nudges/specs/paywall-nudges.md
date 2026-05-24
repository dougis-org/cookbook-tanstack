## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Progressive Warning Thresholds (Soft & Loud)

The system SHALL monitor the user's recipe limit and render elegant, non-blocking notices when the count reaches key thresholds.

#### Scenario: Soft Nudge triggering at 70%–89% capacity

- **Given** a logged-in user with `7` recipes on a plan with a limit of `10`
- **When** the user loads their recipes page (`/recipes`)
- **Then** the page SHALL render an inline warning notice reading: *"You've saved 7 of 10 recipes. Plenty of room to keep going. View plan"*
- **And** the background SHALL use `--theme-accent` at low opacity.

#### Scenario: Session dismissal of Soft Nudge

- **Given** the user sees the inline soft nudge on `/recipes`
- **When** the user clicks the close `[X]` button
- **Then** the nudge SHALL immediately disappear
- **And** it SHALL NOT reappear during the same browser tab session (`sessionStorage` flag is preserved).

#### Scenario: Loud Nudge triggering at 90%–99% capacity

- **Given** a logged-in user with `9` recipes on a plan with a limit of `10`
- **When** the user loads their recipes page (`/recipes`)
- **Then** the page SHALL render a persistent banner with a warning-tone background (`bg-[var(--theme-warning-bg)]`)
- **And** the banner SHALL display: *"1 recipe left on the Home Cook plan"*
- **And** the banner SHALL contain a progress bar indicating `90%` fullness
- **And** a CTA button reading *"Upgrade — $2.99/mo"* linking to `/pricing` SHALL be present.
- **And** the close `[X]` button SHALL NOT be rendered (non-dismissable warning).

---

## MODIFIED Requirements

### Requirement: MODIFIED 100% Hard Wall Block Enforcement

The system SHALL prevent recipe creation once the recipe count reaches 100% capacity, updating both the inline list alert and the creation page `/recipes/new`.

#### Scenario: Accessing /recipes/new directly at 100% capacity

- **Given** a logged-in user with `10` recipes on a plan with a limit of `10`
- **When** the user navigates directly to `/recipes/new`
- **Then** the application SHALL immediately render `<TierWall reason="count-limit" display="modal" />` overlay
- **And** the modal SHALL render a "Today vs Prep Cook" comparison row comparing recipes (10 vs 100), cookbooks (1 vs 10), and price (Free vs $2.99/mo).
- **And** clicking "Not now" in the modal SHALL redirect the user back to `/recipes`.

---

## REMOVED Requirements

### Requirement: REMOVED Direct hard wall inline alert without comparison matrix

Reason for removal: replaced by updated visual `<TierWall>` which incorporates comparison grids and progressive notifications.

---

## Traceability

- **Proposal element -> Requirement**:
  - Proposal Soft Nudge -> ADDED Progressive Warning Thresholds (Soft Nudge Scenario)
  - Proposal Loud Nudge -> ADDED Progressive Warning Thresholds (Loud Nudge Scenario)
  - Proposal Hard Wall -> MODIFIED 100% Hard Wall Block Enforcement
- **Design decision -> Requirement**:
  - Decision 1 (decoupled copy) -> All scenarios
  - Decision 2 (UsageNudge component) -> Soft & Loud Nudge Scenarios
  - Decision 3 (form-entry blocking) -> MODIFIED 100% Hard Wall Block Scenario
- **Requirement -> Task(s)**:
  - ADDED Progressive Warning Thresholds -> Task 1 (Create copy helper), Task 2 (Create UsageNudge component), Task 4 (Mount nudge on list page)
  - MODIFIED 100% Hard Wall Block -> Task 3 (Update TierWall component), Task 5 (Enforce wall on new recipe page)

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Inline notification load latency

- **Given** a user accessing `/recipes` under normal load
- **When** entitlements and counts are resolved from cache
- **Then** the page layout SHALL shift layout smoothly, resolving the presence/absence of nudges within `50ms` of core data fetch completion to prevent layout thrashing.

### Requirement: Security

#### Scenario: Client-side wall bypass prevention

- **Given** a user at 100% limit who attempts to disable the `<TierWall>` modal using inspect-element or devtools
- **When** they fill the recipe creation form and submit the payload
- **Then** the server SHALL reject the tRPC mutation and return a `count-limit` error
- **And** the client SHALL immediately re-trigger the `<TierWall>` modal.

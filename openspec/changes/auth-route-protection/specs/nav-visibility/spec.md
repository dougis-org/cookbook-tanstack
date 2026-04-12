## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Hamburger nav hides auth-required items when unauthenticated

The system SHALL hide the "New Recipe" and "Import Recipe" navigation links in the hamburger sidebar when the user is not logged in.

#### Scenario: Links hidden when unauthenticated

- **Given** the user is not logged in (`session` is null)
- **When** the hamburger menu is opened
- **Then** "New Recipe" link is absent from the sidebar nav
- **And** "Import Recipe" link is absent from the sidebar nav

#### Scenario: Links visible when authenticated

- **Given** the user is logged in (`session` is non-null)
- **When** the hamburger menu is opened
- **Then** "New Recipe" link is visible in the sidebar nav
- **And** "Import Recipe" link is visible in the sidebar nav

#### Scenario: Links remain hidden during session load (isPending)

- **Given** `useAuth()` is in the pending/loading state (`isPending` is true)
- **When** the hamburger menu is opened
- **Then** "New Recipe" and "Import Recipe" links are not shown (treat pending as unauthenticated for display purposes)

## MODIFIED Requirements

### Requirement: MODIFIED Header hamburger nav renders auth-aware items

The header sidebar SHALL conditionally render "New Recipe" and "Import Recipe" based on session state, using the existing `useAuth()` hook.

#### Scenario: Session state change updates nav without page reload

- **Given** the user was logged out and the hamburger menu was open
- **When** the user logs in (session becomes available reactively)
- **Then** the "New Recipe" and "Import Recipe" links appear in the nav without a full page reload

## REMOVED Requirements

None.

## Traceability

- Proposal: "hide New Recipe and Import Recipe in hamburger nav when unauthenticated" → Requirement: ADDED hamburger nav hides auth-required items
- Proposal: "useAuth() hook for UI rendering" → Requirement: MODIFIED header renders auth-aware items
- Design Decision 7 (useAuth for reactive UI) → Both requirements in this spec
- Requirements → Tasks: Task: update Header.tsx nav items to conditionally render based on session

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Nav does not flicker on hydration

- **Given** the page is SSR-rendered and hydrating on the client
- **When** the session is loading (`isPending` is true)
- **Then** the nav links are hidden (not briefly shown then hidden), preventing a flash of unauthenticated content

### Requirement: Accessibility

#### Scenario: Hidden links are fully removed from DOM, not just visually hidden

- **Given** the user is not logged in
- **When** the hamburger menu renders
- **Then** "New Recipe" and "Import Recipe" are absent from the DOM (not `display:none` or `visibility:hidden`), so screen readers do not encounter them

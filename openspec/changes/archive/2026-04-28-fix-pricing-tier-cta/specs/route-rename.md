## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Route `/change-tier` exists and serves the tier-change page

The system SHALL serve the tier-change placeholder page at `/change-tier`.

#### Scenario: `/change-tier` route is navigable

- **Given** any user visits `/change-tier`
- **When** the route resolves
- **Then** the page renders without error (placeholder "coming soon" content)

## MODIFIED Requirements

### Requirement: MODIFIED All CTA links on pricing page point to `/change-tier`

The system SHALL use `/change-tier` as the destination for all Upgrade and Downgrade CTA links (previously `/upgrade`).

#### Scenario: Upgrade link points to /change-tier

- **Given** a logged-in user with tier `home-cook`
- **When** the pricing page is rendered
- **Then** all "Upgrade" links have `href="/change-tier"`

#### Scenario: Downgrade link points to /change-tier

- **Given** a logged-in user with tier `sous-chef`
- **When** the pricing page is rendered
- **Then** all "Downgrade" links have `href="/change-tier"`

## REMOVED Requirements

### Requirement: REMOVED Route `/upgrade` exists

Reason for removal: Route renamed to `/change-tier` to reflect that both upgrades and downgrades use the same endpoint.

## Traceability

- Proposal element (rename /upgrade → /change-tier) → ADDED /change-tier route, MODIFIED CTA links, REMOVED /upgrade
- Design decision 4 (single route for both directions) → all requirements in this spec
- All requirements → Task: rename-route in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No broken internal links after rename

- **Given** the rename is complete
- **When** `grep -r '/upgrade' src/` is run
- **Then** zero results are returned (all internal references updated)

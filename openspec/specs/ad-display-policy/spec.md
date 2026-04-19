## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Central Ad Eligibility Policy

The system SHALL determine ad display eligibility from page role, authentication state, user tier, and admin status
before rendering ad slots.

#### Scenario: Anonymous visitor sees ads on ad-enabled public page

- **Given** no active session
- **And** the current page role permits ads
- **When** the page evaluates ad eligibility
- **Then** ads are eligible to render

#### Scenario: Free logged-in user sees ads on ad-enabled page

- **Given** a logged-in user with tier `home-cook`
- **And** the user is not an admin
- **And** the current page role permits ads
- **When** the page evaluates ad eligibility
- **Then** ads are eligible to render

#### Scenario: Paid logged-in user does not see ads

- **Given** a logged-in user with tier `prep-cook`, `sous-chef`, or `executive-chef`
- **And** the current page role permits ads
- **When** the page evaluates ad eligibility
- **Then** ads are not eligible to render

#### Scenario: Admin user does not see ads

- **Given** a logged-in user with admin status
- **And** the current page role permits ads
- **When** the page evaluates ad eligibility
- **Then** ads are not eligible to render

### Requirement: ADDED Provider-Neutral Ad Slots

The system SHALL expose page-layout ad slot groundwork without requiring a live third-party ad provider.

#### Scenario: Eligible page can reserve an ad slot

- **Given** a page role that permits ads
- **And** a viewer who is ad-eligible
- **When** the layout renders
- **Then** a named ad slot or equivalent provider-neutral placeholder can render

#### Scenario: Ineligible viewer does not receive a slot

- **Given** a page role that permits ads
- **And** a viewer who is not ad-eligible
- **When** the layout renders
- **Then** no ad slot is rendered for that viewer

## MODIFIED Requirements

### Requirement: MODIFIED Page Layout Policy

The system SHALL distinguish page roles so ad display can be controlled without hard-coding ad decisions into each
route component.

#### Scenario: Public content page allows ad policy evaluation

- **Given** an anonymous visitor on a public recipe, cookbook, or discovery page
- **When** the page layout evaluates its role
- **Then** the layout can determine whether the page supports ad slots

#### Scenario: Protected task page suppresses ads

- **Given** any viewer on an auth, create, import, edit, admin, account/profile, or print surface
- **When** the page layout evaluates ad eligibility
- **Then** ads are not eligible to render

## REMOVED Requirements

### Requirement: REMOVED Session-Only Ad Decisions

Reason for removal: Ad display cannot be based only on whether a viewer is logged in. `home-cook` users are logged
in but ad-supported, while paid tiers and admins are ad-free.

#### Scenario: Logged-in state alone is insufficient

- **Given** two logged-in non-admin users
- **And** one user has tier `home-cook`
- **And** the other user has tier `prep-cook`
- **When** both users view the same ad-enabled public page
- **Then** only the `home-cook` user is eligible to see ads

### Requirement: REMOVED Route-Local Ad Conditionals

Reason for removal: Future ad provider integration should not require scattered route-specific conditionals that are
hard to audit and redesign.

#### Scenario: Shared policy controls route behavior

- **Given** multiple ad-enabled public page types
- **When** ad eligibility rules change in a future iteration
- **Then** the rule can be updated in the shared policy without rewriting each page's business conditionals

## Traceability

- Proposal element -> Requirement: Ads depend on page role, auth state, tier, and admin status -> ADDED Central
  Ad Eligibility Policy.
- Proposal element -> Requirement: Future ad provider integration should avoid scattered conditionals -> ADDED
  Provider-Neutral Ad Slots and REMOVED Route-Local Ad Conditionals.
- Proposal element -> Requirement: Anonymous and `home-cook` users may see ads while paid tiers/admins do not ->
  ADDED Central Ad Eligibility Policy.
- Design decision -> Requirement: Decision 2 -> MODIFIED Page Layout Policy.
- Design decision -> Requirement: Decision 3 -> ADDED Central Ad Eligibility Policy and REMOVED Session-Only Ad Decisions.
- Design decision -> Requirement: Decision 5 -> ADDED Provider-Neutral Ad Slots.
- Requirement -> Task(s): implementation tasks 5 and 6; validation tasks in `tests.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Ad policy is local and deterministic

- **Given** a route renders with known page role and session context
- **When** ad eligibility is evaluated
- **Then** eligibility is computed without requiring a network request to an ad provider

### Requirement: Security

#### Scenario: Paid and admin ad suppression is enforced before rendering slots

- **Given** a paid-tier user or admin user
- **When** an ad-enabled page renders
- **Then** the page does not render ad slots that could fetch third-party ad content

### Requirement: Reliability

#### Scenario: Missing or unknown tier is handled predictably

- **Given** a logged-in non-admin user with a missing or unrecognized tier
- **And** the current page role permits ads
- **When** the page evaluates ad eligibility
- **Then** the viewer is treated as `home-cook` for ad eligibility

### Requirement: Operability

#### Scenario: Future provider integration reuses existing slots

- **Given** a future implementation adds a third-party ad provider
- **When** the provider is wired into page layouts
- **Then** the provider uses the existing ad eligibility policy and named slot structure

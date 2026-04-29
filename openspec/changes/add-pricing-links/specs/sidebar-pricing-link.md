## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Sidebar shall include Pricing link for all users

The system SHALL display a "Pricing" link in the sidebar navigation between the Cookbooks link and the auth-only actions (New Recipe, Import Recipe) for all users, both authenticated and unauthenticated.

#### Scenario: Anonymous user sees Pricing in sidebar

- **Given** the user is not authenticated (no session)
- **When** the user opens the sidebar navigation
- **Then** the sidebar SHALL display links for Home, Recipes, Categories, Cookbooks, and Pricing (in that order)

#### Scenario: Authenticated user sees Pricing in sidebar

- **Given** the user is authenticated with a valid session
- **When** the user opens the sidebar navigation
- **Then** the sidebar SHALL display links for Home, Recipes, Categories, Cookbooks, Pricing, New Recipe, and Import Recipe (in that order)

#### Scenario: Pricing link uses correct route

- **Given** the sidebar is rendered
- **When** the user clicks the "Pricing" link
- **Then** the user SHALL be navigated to `/pricing`

#### Scenario: Pricing link shows active state on /pricing

- **Given** the user is on the `/pricing` page
- **When** the sidebar is open
- **Then** the Pricing link SHALL have active styling (accent background, white text) matching other active nav items

## MODIFIED Requirements

### Requirement: MODIFIED Sidebar nav item order

The system SHALL list destination pages (Home, Recipes, Categories, Cookbooks, Pricing) before action items (New Recipe, Import Recipe) in the sidebar.

#### Scenario: Nav item grouping

- **Given** the sidebar is rendered with a session
- **When** the user views the full nav list
- **Then** destination pages SHALL appear before auth-only action items, with Pricing included in the destination group

## REMOVED Requirements

### Requirement: REMOVED Sidebar without Pricing link

Reason for removal: Pricing page is complete and users need a navigation path to discover tier options.

## Traceability

- Proposal element: Add Pricing link to sidebar between Cookbooks and auth actions -> Requirement: Sidebar shall include Pricing link for all users
- Design decision: Decision 1 (placement) + Decision 2 (styling) -> Requirement: Sidebar shall include Pricing link for all users
- Requirement -> Task(s): Task 1 (add Pricing link to Header.tsx sidebar)

## Non-Functional Acceptance Criteria

### Requirement: Consistency

#### Scenario: Sidebar Pricing link matches existing nav item pattern

- **Given** the sidebar is rendered
- **When** the user inspects the Pricing link
- **Then** it SHALL use the same className pattern, `activeProps`, and icon structure as other nav items (Home, Recipes, Categories, Cookbooks)

### Requirement: Accessibility

#### Scenario: Pricing link is keyboard navigable

- **Given** the sidebar is open
- **When** the user tabs through nav items
- **Then** the Pricing link SHALL be focusable and activatable via Enter key

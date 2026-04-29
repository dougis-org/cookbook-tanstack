## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Anonymous home hero shall include "View Plans and Pricing" secondary CTA

The system SHALL display a "View Plans and Pricing" button in the anonymous home page (`/`) hero section alongside the existing "Browse Recipes" primary CTA. The button SHALL use an outline/border style to de-emphasize it relative to the primary CTA.

#### Scenario: Anonymous visitor sees pricing button on home page

- **Given** the user is not authenticated (no session)
- **When** the user visits the home page (`/`)
- **Then** the hero section SHALL display both "Browse Recipes" and "View Plans and Pricing" buttons

#### Scenario: Pricing button uses correct route

- **Given** the home page is rendered for an anonymous visitor
- **When** the user clicks "View Plans and Pricing"
- **Then** the user SHALL be navigated to `/pricing`

#### Scenario: Pricing button has outline style

- **Given** the home page is rendered for an anonymous visitor
- **When** the user inspects the "View Plans and Pricing" button
- **Then** it SHALL have `border-2 border-[var(--theme-accent)] text-[var(--theme-accent)]` styling (outline), distinct from the filled primary CTA

#### Scenario: Buttons stack on mobile, sit side-by-side on desktop

- **Given** the home page is rendered
- **When** the viewport is smaller than `sm` breakpoint
- **Then** the CTAs SHALL stack vertically (`flex-col`)
- **When** the viewport is `sm` or larger
- **Then** the CTAs SHALL sit side-by-side (`sm:flex-row`)

#### Scenario: Authenticated user is redirected away from home page

- **Given** the user is authenticated
- **When** the user visits `/`
- **Then** the user SHALL be redirected to `/home` (existing behavior, not modified)

## MODIFIED Requirements

### Requirement: MODIFIED Home page hero CTA section

The system SHALL provide two CTAs in the hero section for anonymous visitors: a primary "Browse Recipes" button and a secondary "View Plans and Pricing" button.

#### Scenario: Two CTAs present

- **Given** the home page hero is rendered for an anonymous visitor
- **When** the user counts the CTA buttons
- **Then** there SHALL be exactly two buttons: "Browse Recipes" and "View Plans and Pricing"

## REMOVED Requirements

### Requirement: REMOVED Single CTA on anonymous home hero

Reason for removal: Adding pricing discovery requires a second CTA in the hero section.

## Traceability

- Proposal element: Add "View Plans and Pricing" secondary CTA to anonymous home hero -> Requirement: Anonymous home hero shall include "View Plans and Pricing" secondary CTA
- Design decision: Decision 3 (button style) + Decision 4 (copy) -> Requirement: Anonymous home hero shall include "View Plans and Pricing" secondary CTA
- Requirement -> Task(s): Task 2 (add pricing button to index.tsx)

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Pricing button is accessible by role and name

- **Given** the home page is rendered for an anonymous visitor
- **When** the user queries for a link by role "link" and name /view plans and pricing/i
- **Then** the "View Plans and Pricing" link SHALL be found in the document

### Requirement: Visual hierarchy

#### Scenario: Primary CTA is visually dominant

- **Given** both CTAs are rendered
- **When** the user views the hero section
- **Then** "Browse Recipes" SHALL use filled accent styling and "View Plans and Pricing" SHALL use outline styling, creating clear visual hierarchy

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Authenticated Home Route

The system SHALL provide `/home` as an authenticated route that combines user workflow shortcuts with global
discovery entry points.

#### Scenario: Authenticated user views home workspace

- **Given** a logged-in user with any valid tier
- **When** the user navigates to `/home`
- **Then** the page renders authenticated workflow shortcuts for adding or managing content
- **And** the page renders global discovery links or sections for public recipes, cookbooks, or categories

#### Scenario: Anonymous user is redirected away from home workspace

- **Given** no active session
- **When** the visitor navigates to `/home`
- **Then** the visitor is redirected to the login flow with an auth-required reason

### Requirement: ADDED Public Landing Route Redirect

The system SHALL redirect authenticated users from `/` to `/home`.

#### Scenario: Authenticated root navigation

- **Given** an active logged-in session
- **When** the user navigates to `/`
- **Then** the router redirects the user to `/home`

#### Scenario: Anonymous root navigation

- **Given** no active session
- **When** the visitor navigates to `/`
- **Then** the visitor remains on `/`
- **And** the visitor sees the public landing page

## MODIFIED Requirements

### Requirement: MODIFIED Public Landing Content

The system SHALL present `/` as an anonymous-focused product landing page that encourages browsing and sign-up
without exposing protected creation/import actions.

#### Scenario: Anonymous landing page avoids protected actions

- **Given** no active session
- **When** the visitor views `/`
- **Then** the page does not show a `Create Recipe`, `New Recipe`, or `Import Recipe` call to action
- **And** the page includes a path to browse public recipes or cookbooks

#### Scenario: Landing page avoids technology-stack positioning

- **Given** no active session
- **When** the visitor views `/`
- **Then** the visible user-facing page copy does not market the implementation technology stack

### Requirement: MODIFIED Public Browsing Access

The system SHALL continue allowing anonymous visitors to view and navigate public recipes, public cookbooks, and
discovery routes while withholding content-creation actions.

#### Scenario: Anonymous visitor can browse public content

- **Given** no active session
- **When** the visitor navigates from the landing page to public recipe, cookbook, or category browsing
- **Then** the visitor can view public browsing surfaces without being forced to log in

#### Scenario: Anonymous visitor cannot start protected creation workflow

- **Given** no active session
- **When** the visitor reaches a public browsing surface
- **Then** protected creation, import, or edit affordances are not shown

## REMOVED Requirements

### Requirement: REMOVED Root Route as Universal Feature Dashboard

Reason for removal: `/` is no longer the universal home for both anonymous and authenticated users. Anonymous
visitors get the public landing page; authenticated users get `/home`.

#### Scenario: Authenticated users no longer see anonymous landing by default

- **Given** an active logged-in session
- **When** the user navigates to `/`
- **Then** the user does not remain on the anonymous landing page
- **And** the user is routed to `/home`

### Requirement: REMOVED Anonymous Create CTA on Landing Page

Reason for removal: Anonymous visitors cannot create recipes without signing in, so showing a creation CTA on the
public landing page is misleading.

#### Scenario: Anonymous landing removes create action

- **Given** no active session
- **When** the visitor views `/`
- **Then** the landing page does not render a create/import action as a primary or secondary CTA

## Traceability

- Proposal element -> Requirement: Authenticated users visiting `/` redirect to `/home` -> ADDED Public Landing
  Route Redirect.
- Proposal element -> Requirement: `/home` includes global discovery and workflow shortcuts -> ADDED
  Authenticated Home Route.
- Proposal element -> Requirement: Anonymous visitors can browse but not add content -> MODIFIED Public Browsing Access.
- Proposal element -> Requirement: Remove tech-stack copy and anonymous create CTA -> MODIFIED Public Landing
  Content and REMOVED Anonymous Create CTA on Landing Page.
- Design decision -> Requirement: Decision 1 -> ADDED Public Landing Route Redirect and ADDED Authenticated Home Route.
- Design decision -> Requirement: Decision 4 -> ADDED Authenticated Home Route.
- Requirement -> Task(s): implementation tasks 1 through 4; validation tasks in `tests.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Home route avoids unnecessary heavy data requirements

- **Given** an authenticated user navigates to `/home`
- **When** the page renders its initial view
- **Then** the route can render core navigation shortcuts without requiring new heavyweight recommendation or
  analytics queries

### Requirement: Security

#### Scenario: Protected workflows remain guarded

- **Given** an anonymous visitor
- **When** the visitor attempts to access protected create, import, edit, or authenticated home routes
- **Then** the visitor is redirected or denied by existing auth guard behavior

### Requirement: Reliability

#### Scenario: Page redesign preserves route contracts

- **Given** future visual redesign work changes landing or home sections
- **When** the route behavior is validated
- **Then** `/` still serves anonymous landing behavior and authenticated redirect behavior
- **And** `/home` remains the authenticated user workspace route

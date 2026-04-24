# Spec: /upgrade Stub Route

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `/upgrade` route renders stub acknowledging upgrade intent

The system SHALL render a page at `/upgrade` informing visitors that upgrade/payment functionality is coming soon, with a link back to `/pricing`.

#### Scenario: Stub renders for authenticated user

- **Given** a logged-in user follows an upgrade CTA from `/pricing`
- **When** they land on `/upgrade`
- **Then** the page renders without error and communicates that upgrade plans are coming; a link to `/pricing` is present

#### Scenario: Stub renders for unauthenticated visitor

- **Given** no active session
- **When** `/upgrade` is visited directly
- **Then** the page renders (no auth redirect); upgrade coming-soon message is shown

## MODIFIED Requirements

No existing requirements are modified.

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal: `/upgrade` stub as CTA destination → Requirement: stub route renders
- Design Decision 5 → `/upgrade` stub route
- Requirements → Tasks: `src/routes/upgrade.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No broken links from pricing CTAs

- **Given** a user on `/pricing` clicks any non-executive-chef upgrade CTA
- **When** the link is followed
- **Then** the browser navigates to `/upgrade` without a 404 or router error

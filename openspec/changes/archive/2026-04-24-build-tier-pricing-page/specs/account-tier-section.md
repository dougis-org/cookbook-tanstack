# Spec: Account Page Tier Section

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Account page displays current tier with usage vs. limit

The system SHALL render a tier section on `/account` for all authenticated users showing: current tier name and description, recipe count vs. limit, cookbook count vs. limit, next-tier preview, and a link to `/pricing`.

#### Scenario: Usage section visible for Home Cook user

- **Given** an authenticated Home Cook user with 7 recipes and 1 cookbook
- **When** they visit `/account`
- **Then** the page shows:
  - Tier name "Home Cook" and its description
  - Recipe progress: 7 of 10
  - Cookbook progress: 1 of 1
  - A "next tier" section showing Prep Cook's limits
  - A link to `/pricing`

#### Scenario: Usage section visible for Executive Chef user

- **Given** an authenticated Executive Chef user with 500 recipes and 10 cookbooks
- **When** they visit `/account`
- **Then** the page shows recipe progress (500 of 2500) and cookbook progress (10 of 200); no "next tier" section (already at max); link to `/pricing` still present

#### Scenario: Usage section shows correct limits per tier

- **Given** a Sous Chef user
- **When** they visit `/account`
- **Then** recipe limit shown is 500 and cookbook limit shown is 25, sourced from `TIER_LIMITS['sous-chef']`

---

### Requirement: ADDED Account page fetches usage counts via `usage.getOwned`

The system SHALL call `trpc.usage.getOwned` to populate recipe and cookbook counts on the account page.

#### Scenario: Loading state during fetch

- **Given** an authenticated user visits `/account`
- **When** `usage.getOwned` is pending
- **Then** the tier section shows a loading indicator (skeleton or spinner); no crash

#### Scenario: Counts update after fetch resolves

- **Given** `usage.getOwned` resolves with `{ recipeCount: 3, cookbookCount: 1 }`
- **When** the component re-renders
- **Then** progress bars display 3 and 1 respectively

## MODIFIED Requirements

### Requirement: MODIFIED Account page no longer renders "coming soon" stub

The system SHALL replace the "Account management is coming soon" stub with the full tier section.

#### Scenario: No stub text visible after change

- **Given** an authenticated user visits `/account`
- **When** the page renders
- **Then** "coming soon" text is not present; tier section is rendered instead

## REMOVED Requirements

No requirements are removed (stub text is replaced, not a tracked requirement).

## Traceability

- Proposal: account page tier section → Requirement: tier section with usage vs. limit
- Proposal: tRPC usage query → Requirement: fetch via `usage.getOwned`
- Design Decision 7 → all tiers including Executive Chef show usage
- Requirements → Tasks: `src/routes/account.tsx`, `usage.getOwned` query call

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Account page renders if `usage.getOwned` fails

- **Given** `usage.getOwned` returns an error (network failure, server error)
- **When** the account page renders
- **Then** the tier section degrades gracefully (e.g., shows "--" for counts or an error message); page does not crash

### Requirement: Security

#### Scenario: Account page requires authentication

- **Given** no active session
- **When** a user navigates to `/account`
- **Then** they are redirected to `/auth/sign-in` (existing auth-guard behavior; not changed by this PR)

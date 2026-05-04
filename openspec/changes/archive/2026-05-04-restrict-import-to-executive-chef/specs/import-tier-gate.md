## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED AC-3 — Inline upsell on import page for non-entitled users

The system SHALL display an inline tier-wall upsell in place of the import dropzone when a user without the `canImport` entitlement navigates to `/import/`.

#### Scenario: Sous Chef user visits /import/

- **Given** an authenticated user with tier `sous-chef`
- **When** they navigate to `/import/`
- **Then** the page renders "Import requires Executive Chef" inline (no dropzone visible)
- **And** an "Upgrade" link to `/pricing` is present

#### Scenario: Anonymous user visits /import/

- **Given** an unauthenticated user
- **When** they navigate to `/import/`
- **Then** `requireAuth()` redirects them before the page renders (no change from current behavior)

#### Scenario: Home Cook / Prep Cook user visits /import/

- **Given** an authenticated user with tier `home-cook` or `prep-cook`
- **When** they navigate to `/import/`
- **Then** the same inline upsell is shown (same as Sous Chef — all tiers below executive-chef are blocked)

## MODIFIED Requirements

### Requirement: MODIFIED AC-1 — Import nav link hidden for non-entitled users

The system SHALL hide the "Import Recipe" nav link from users where `canImport` is false (all tiers below `executive-chef`, plus unauthenticated).

Previously: link was hidden only for unauthenticated users.
Now: link is hidden for unauthenticated users AND for authenticated users with tier below `executive-chef`.

#### Scenario: Sous Chef user opens the sidebar

- **Given** an authenticated user with tier `sous-chef`
- **When** they open the mobile sidebar
- **Then** the "Import Recipe" link is not present in the navigation

#### Scenario: Prep Cook or Home Cook user opens the sidebar

- **Given** an authenticated user with tier `prep-cook` or `home-cook`
- **When** they open the mobile sidebar
- **Then** the "Import Recipe" link is not present in the navigation

### Requirement: MODIFIED AC-2 — Import nav link visible for Executive Chef

The system SHALL show the "Import Recipe" nav link only when the user has `canImport: true` (`executive-chef` tier).

Previously: link was shown to all authenticated users regardless of tier.
Now: link is shown only to executive-chef subscribers.

#### Scenario: Executive Chef user opens the sidebar

- **Given** an authenticated user with tier `executive-chef`
- **When** they open the mobile sidebar
- **Then** the "Import Recipe" link is present in the navigation

### Requirement: MODIFIED AC-4 — Full import UI for Executive Chef users

The system SHALL render the full import page (dropzone, preview modal) for users with `canImport: true`.

No behavioral change — this is explicitly preserved after the new gate is added.

#### Scenario: Executive Chef user visits /import/

- **Given** an authenticated user with tier `executive-chef`
- **When** they navigate to `/import/`
- **Then** the `ImportDropzone` is rendered (no tier wall inline)
- **And** file upload and import confirm flow works as before

## REMOVED Requirements

### Requirement: REMOVED — Import nav link shown to all authenticated users

Previously the "Import Recipe" link was shown to any authenticated user (regardless of tier).

Reason for removal: Import is now an Executive Chef exclusive feature. Showing the link to non-entitled users creates a misleading UX where the feature appears available but fails at the last step.

## Traceability

- Proposal element "Hide nav link for non-executive-chef users" → AC-1 (MODIFIED), AC-2 (MODIFIED)
- Proposal element "Show inline upsell on page load" → AC-3 (ADDED)
- Proposal element "Preserve executive-chef full import flow" → AC-4 (MODIFIED)
- Design Decision 1 (hide nav link) → AC-1, AC-2
- Design Decision 2 (inline TierWall on page load) → AC-3
- Design Decision 3 (hook placement) → AC-3, AC-4
- AC-1 → Task: update Header.tsx, update Header.test.tsx
- AC-2 → Task: update Header.tsx, update Header.test.tsx
- AC-3 → Task: update import/index.tsx, update -import.test.tsx
- AC-4 → Task: update -import.test.tsx (mock setup)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Nav render latency

- **Given** any authenticated user
- **When** the Header component mounts
- **Then** the import link visibility resolves synchronously (no async calls, no additional network requests)

### Requirement: Security

#### Scenario: Sous Chef direct URL access

- **Given** an authenticated user with tier `sous-chef`
- **When** they navigate directly to `/import/` by URL
- **Then** the backend tRPC mutation still rejects any import attempt with a tier-wall error (defense-in-depth; no change required)

### Requirement: Reliability

#### Scenario: Session tier field missing

- **Given** an authenticated user whose session object has no `tier` field
- **When** any component reads `useTierEntitlements`
- **Then** `resolveEntitlementTier` defaults to `home-cook`, `canImport` is false, and the upsell is shown (graceful degradation)

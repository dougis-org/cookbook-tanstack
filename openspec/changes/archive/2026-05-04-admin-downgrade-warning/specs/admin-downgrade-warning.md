## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Admin Tier Downgrade Warning

When an admin initiates a tier downgrade for a user via the admin panel, the confirmation dialog SHALL display a warning about content impact before the admin confirms the change.

#### Scenario: Downgrade confirmation shows warning

- **Given** an admin is viewing the Users table at `/admin/users`
- **When** the admin selects a lower tier for a user (detected by TIER_RANK decreasing)
- **Then** the confirmation modal SHALL display a warning block containing the message: "⚠️ This will make all private recipes and cookbooks public, and hide any content over the new tier's limit. Your oldest content is preserved first."

#### Scenario: Upgrade confirmation does not show warning

- **Given** an admin is viewing the Users table at `/admin/users`
- **When** the admin selects a higher tier for a user (detected by TIER_RANK increasing)
- **Then** the confirmation modal SHALL NOT display the downgrade warning block

#### Scenario: Same tier selection does not open modal

- **Given** an admin is viewing the Users table at `/admin/users`
- **When** the admin selects the user's current tier
- **Then** no confirmation modal is opened and no warning is displayed

### Requirement: ADDED Confirmation Buttons Remain Functional

The confirmation dialog SHALL retain functional Cancel and Confirm buttons after the warning is added.

#### Scenario: Cancel dismisses modal without mutation

- **Given** the confirmation modal is open with a downgrade warning visible
- **When** the admin clicks the Cancel button
- **Then** the modal is dismissed and no `setTier` mutation is called

#### Scenario: Confirm calls setTier with correct arguments

- **Given** the confirmation modal is open with a downgrade warning visible
- **When** the admin clicks the Confirm button
- **Then** `admin.users.setTier` is called with `{ userId: <target user ID>, tier: <selected tier> }`

## MODIFIED Requirements

None — this change is purely additive to existing behavior.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Add downgrade warning to confirmation modal" → Requirement "Admin Tier Downgrade Warning"
- Design Decision 1 "TIER_RANK comparison to detect downgrade" → Requirement "Admin Tier Downgrade Warning"
- Design Decision 2 "Static warning text" → Requirement "Admin Tier Downgrade Warning"
- Proposal element "Tests for warning visibility" → Task: Add tests to `users.test.tsx`
- Requirement "Admin Tier Downgrade Warning" → Task: Modify `src/routes/admin/users.tsx` modal

## Non-Functional Acceptance Criteria

### Requirement: Performance

No additional network requests are made as a result of this change. The warning uses static text computed from in-memory `TIER_RANK` values.

#### Scenario: No network overhead

- **Given** an admin is viewing the Users table at `/admin/users`
- **When** the admin selects a lower tier for a user
- **Then** the confirmation modal opens without any additional API calls beyond the existing user list query

### Requirement: Security

The downgrade warning is displayed only to authenticated admins viewing the admin panel. No additional access control changes are introduced.

#### Scenario: Non-admin cannot access admin panel

- **Given** a non-admin user is authenticated
- **When** the user navigates to `/admin/users`
- **Then** access is denied (existing behavior, unchanged)

### Requirement: Reliability

The confirmation dialog continues to function correctly if the warning fails to render (fails open — modal still works).

#### Scenario: Warning render failure does not block modal

- **Given** the confirmation modal is open
- **When** the warning block fails to render due to a rendering error
- **Then** the Cancel and Confirm buttons remain visible and functional
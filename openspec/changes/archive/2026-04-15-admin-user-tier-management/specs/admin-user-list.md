## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Display all users with tier in admin UI

The system SHALL display a table of all registered users including email, display name, and current tier when an admin visits `/admin/users`.

#### Scenario: Users listed with tier badges

- **Given** an authenticated admin user
- **When** they visit `/admin/users`
- **Then** a table renders with one row per user showing email, name (or blank if unset), and current tier label

#### Scenario: User with no tier stored defaults to home-cook

- **Given** a user document in MongoDB with no `tier` field
- **When** the admin views the user list
- **Then** that user's tier displays as "Home Cook" (the default tier)

#### Scenario: Empty user list

- **Given** the database contains only the admin user's own record
- **When** the admin views `/admin/users`
- **Then** the table renders with at least one row (the admin themselves)

### Requirement: ADDED Per-user audit log placeholder link

The system SHALL render a "View audit log" link per user row that links to `/admin/audit?userId=<id>` (disabled/noted as coming soon until #338 is implemented).

#### Scenario: Audit log link present per row

- **Given** an admin viewing the user list
- **When** the table renders
- **Then** each row contains a link or button labeled "View audit log" referencing the user's ID

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "List all users with current tier" → Requirement: Display all users with tier
- Proposal element "Placeholder audit log link per user row" → Requirement: Per-user audit log placeholder link
- Design decision 2 (`admin.users.list` procedure) → Requirement: Display all users with tier
- Requirement: Display all users with tier → Task: Create `admin.users.list` tRPC procedure
- Requirement: Display all users with tier → Task: Create `/admin/users` route component with table
- Requirement: Per-user audit log placeholder link → Task: Add disabled audit log link per row

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: User list load time

- **Given** a database with up to 1,000 users
- **When** the admin loads `/admin/users`
- **Then** the page renders within 2 seconds under normal network conditions

### Requirement: Operability

#### Scenario: No pagination required at this scale

- **Given** user counts expected in the hundreds for this application
- **When** the list query runs
- **Then** all users are returned in a single query (pagination deferred to a future issue if needed)

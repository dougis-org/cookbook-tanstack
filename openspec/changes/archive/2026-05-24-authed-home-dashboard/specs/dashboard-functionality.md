## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Authed Home Dashboard Conversion

The system SHALL render a personalized dashboard for authenticated users loading `/home` that displays their greeting, usage metrics, quick actions, and recent activity.

#### Scenario: Rendering the full dashboard with usage statistics and activity date

- **Given** a logged-in user with `7` recipes and `1` cookbook on a `home-cook` plan
- **When** the user loads their homepage `/home`
- **Then** the page SHALL display the greeting `"Welcome back, {firstName}"` where `{firstName}` is derived from the user's name
- **And** the sub-greeting SHALL display the formatted today's date (e.g. `"Sunday, May 24, 2026"`)
- **And** the usage card SHALL render two horizontal blocks showing:
  - Recipes: value `"7 of 10"`, progress bar at `70%`, and plan caption `"Home Cook"`
  - Cookbooks: value `"1 of 1"`, progress bar at `100%`, and plan caption `"Home Cook"`
- **And** the third block for `"This Month"` SHALL display the number of user recipes saved in the current month with no progress bar.

#### Scenario: Displaying Quick Actions and restricting Import Recipe by tier

- **Given** a logged-in user on a `home-cook` tier
- **When** they view the Quick Actions section on `/home`
- **Then** the `"Create Recipe"` button SHALL be active and link to `/recipes/new`
- **And** the `"Import Recipe"` button SHALL be disabled, display a lock icon or an `"Executive Chef"` tier badge, and prevent navigation to `/recipes/import` when clicked.

#### Scenario: Recently Saved Recipes list and zero-state handling

- **Given** a logged-in user who has saved `3` recipes
- **When** they view the Recently Saved section on `/home`
- **Then** the section SHALL display a horizontal grid containing `3` recipe preview thumbnails fetched using `trpc.recipes.list` sorted by `createdAt` desc
- **And** each thumbnail card SHALL link to its respective recipe details page at `/recipes/$recipeId`
- **And** a `"View all →"` link SHALL route the user to `/recipes`.

#### Scenario: Empty state for recently saved section

- **Given** a logged-in user who has saved `0` recipes
- **When** they load the homepage `/home`
- **Then** the Recently Saved section SHALL render an elegant empty state prompt reading: *"No recipes saved yet. Create or import your first recipe to get started!"*

### Requirement: ADDED Smart Contextual Upgrade Nudges

The system SHALL evaluate the user's current counts and attempt timestamps to conditionally display an upgrade nudge banner at the bottom of the dashboard.

#### Scenario: Cookbook limit reached triggers upgrade nudge

- **Given** a logged-in user with `1` cookbook (equal to `home-cook` plan limit of `1`)
- **When** the user loads `/home`
- **Then** the page SHALL display an upgrade nudge banner at the bottom containing:
  - Copy: *"Ready to build a second cookbook? Upgrade to Prep Cook."*
  - CTA button: *"Upgrade — $2.99/mo"* linking to `/pricing`.

#### Scenario: Recipe limit approaching triggers upgrade nudge

- **Given** a logged-in user with `8` recipes (80% of `home-cook` plan limit of `10`)
- **When** the user loads `/home`
- **Then** the page SHALL display an upgrade nudge banner at the bottom containing:
  - Copy: *"Running out of room? Upgrade to Prep Cook to save up to 100 recipes."*
  - CTA button: *"Upgrade — $2.99/mo"* linking to `/pricing`.

#### Scenario: Recent paid action attempt triggers upgrade nudge

- **Given** a logged-in user who attempted a paid action (like private recipe creation or URL import) `3` days ago (recorded as ISO string under localStorage `last_paid_action_attempt`)
- **And** they currently have `4` recipes (40% capacity, below the 80% threshold)
- **When** the user loads `/home`
- **Then** the page SHALL display an upgrade nudge banner at the bottom containing:
  - Copy: *"Unlock premium capabilities with Prep Cook."*
  - CTA button: *"Upgrade — $2.99/mo"* linking to `/pricing`.

#### Scenario: No warning thresholds met hides upgrade nudge

- **Given** a logged-in user with `4` recipes (40% capacity) and `0` cookbooks
- **And** no `last_paid_action_attempt` recorded in localStorage in the last 7 days
- **When** the user loads `/home`
- **Then** the upgrade nudge banner SHALL NOT be rendered.

---

## MODIFIED Requirements

### Requirement: MODIFIED /home Route View Layout

The system SHALL update the default `/home` layout route from a static two-column links menu to a dynamic personalized developer dashboard.

#### Scenario: Dashboard route presentation

- **Given** an authenticated user loading `/home`
- **When** the page renders
- **Then** the page title SHALL remain `"Welcome Home"` and preserve its `role="authenticated-home"` accessibility attribute for ad placements.

---

## REMOVED Requirements

### Requirement: REMOVED Static Links columns without data-query triggers

Reason for removal: Replaced by the active, personalized dashboard layout which satisfies user engagement and contextual funnel metrics.

---

## Traceability

- **Proposal element -> Requirement**:
  - Proposal Greeting and Stats -> ADDED Authed Home Dashboard Conversion (Greeting scenario)
  - Proposal Usage Card -> ADDED Authed Home Dashboard Conversion (Usage scenario)
  - Proposal Quick Actions Restriction -> ADDED Authed Home Dashboard Conversion (Quick Actions scenario)
  - Proposal Recently Saved -> ADDED Authed Home Dashboard Conversion (Recently Saved scenarios)
  - Proposal Upgrade Nudge -> ADDED Smart Contextual Upgrade Nudges (Nudge scenarios)
- **Design decision -> Requirement**:
  - Decision 1 (Rewrite home.tsx) -> ADDED Authed Home Dashboard Conversion (All scenarios)
  - Decision 2 (Component reuse) -> ADDED Authed Home Dashboard Conversion (Usage / Recently Saved scenarios)
  - Decision 3 (LocalStorage attempt tracking) -> ADDED Smart Contextual Upgrade Nudges (Paid action scenario)
  - Decision 4 (CSS-Grid layout) -> MODIFIED /home Route View Layout (Dashboard route scenario)
- **Requirement -> Task(s)**:
  - ADDED Authed Home Dashboard Conversion -> Task 1 (Create inline components), Task 2 (Rewrite home.tsx queries & layout), Task 3 (Recently saved grid)
  - ADDED Smart Contextual Upgrade Nudges -> Task 4 (Implement nudge selection logic), Task 5 (Integrate localStorage triggers)

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a logged-in user loading `/home`
- **When** data is requested from `trpc` routers
- **Then** skeleton loader cards matching the usage card and recently saved grid dimensions SHALL render immediately
- **And** layout shifts SHALL resolve smoothly within `50ms` of query completion to prevent layout thrashing.

### Requirement: Security

#### Scenario: Access control

- **Given** a user below the Executive Chef tier
- **When** they click or inspect-element on the "Import Recipe" quick action
- **Then** the UI SHALL lock navigation and disable interaction, and the tRPC handler SHALL reject direct manual network queries with a `PAYMENT_REQUIRED` error.

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

---

### Requirement: ADDED Unverified user access to recipe creation

The system SHALL allow authenticated-but-unverified users to access `/recipes/new` and submit the recipe form.

#### Scenario: Unverified user reaches the new recipe page

- **Given** a user who is authenticated but has `emailVerified: false`
- **When** they navigate to `/recipes/new`
- **Then** the page renders normally (no redirect to `/auth/verify-email`)

#### Scenario: Unverified user cannot access the page without being logged in

- **Given** an unauthenticated user
- **When** they navigate to `/recipes/new`
- **Then** they are redirected to `/auth/login` with `reason=auth-required`

---

### Requirement: ADDED Pending recipe saved on unverified submit

The system SHALL save a recipe with `pendingVerification: true` when the submitting user is unverified, and navigate to the post-submit verification gate.

#### Scenario: Unverified user submits the recipe form

- **Given** a user with `emailVerified: false` who has filled in the recipe form
- **When** they submit the form
- **Then** a recipe document is created in the database with `pendingVerification: true`
- **And** the user is shown the `PostSubmitVerifyGate` component

#### Scenario: Verified user submits the recipe form

- **Given** a user with `emailVerified: true` who has filled in the recipe form
- **When** they submit the form
- **Then** a recipe document is created with `pendingVerification` absent/false (existing behaviour unchanged)
- **And** the user is navigated to the recipe detail page (existing behaviour unchanged)

#### Scenario: Multiple pending recipes accumulate

- **Given** an unverified user who has already submitted one recipe (pending)
- **When** they submit another recipe
- **Then** a second recipe is saved with `pendingVerification: true`
- **And** both recipes remain pending until the user verifies

---

### Requirement: ADDED PostSubmitVerifyGate component

The system SHALL display a verification gate after an unverified user submits a recipe, showing a summary of the saved recipe and a prompt to verify email with a resend option.

#### Scenario: Gate renders with recipe summary

- **Given** an unverified user who has just submitted a recipe
- **When** the `PostSubmitVerifyGate` is rendered
- **Then** the recipe name is displayed above the gate
- **And** the gate copy reads "One more step — verify your email to publish this recipe."
- **And** a "Resend verification email" button is present and functional
- **And** no emoji appear in the copy

#### Scenario: Resend button sends a verification email

- **Given** the `PostSubmitVerifyGate` is displayed
- **When** the user clicks "Resend verification email"
- **Then** a verification email is dispatched to the user's address
- **And** the button enters a loading state during the request
- **And** a success or error message is shown after the request completes

---

### Requirement: ADDED publishPendingRecipes service

The system SHALL provide a `publishPendingRecipes(userId)` service that atomically clears the `pendingVerification` flag from all pending recipes owned by a given user.

#### Scenario: User has pending recipes at verification time

- **Given** a user with one or more recipes where `pendingVerification: true`
- **When** `publishPendingRecipes(userId)` is called
- **Then** all matching recipes have `pendingVerification` unset (or set to `false`)
- **And** the recipes become visible in public queries

#### Scenario: User has no pending recipes at verification time

- **Given** a user with no pending recipes
- **When** `publishPendingRecipes(userId)` is called
- **Then** the function completes without error and no documents are modified

---

### Requirement: ADDED Email verification triggers automatic recipe publishing

The system SHALL automatically call `publishPendingRecipes(userId)` when a user's email is verified, regardless of which device or client initiated the verification.

#### Scenario: User verifies on the same device

- **Given** a user who submitted a pending recipe and is viewing `PostSubmitVerifyGate`
- **When** they click the verification link in their email client (same browser session)
- **Then** the `afterEmailVerification` hook fires server-side
- **And** `publishPendingRecipes(userId)` is called
- **And** the recipe is no longer pending

#### Scenario: User verifies on a different device

- **Given** a user who submitted a pending recipe on device A
- **When** they open the verification email on device B and click the link
- **Then** the `afterEmailVerification` hook fires server-side
- **And** `publishPendingRecipes(userId)` is called
- **And** the recipe is published, visible on the next page load on any device

---

## MODIFIED Requirements

### Requirement: MODIFIED Recipe list query — exclude pending recipes from non-owner views

The system SHALL filter out recipes with `pendingVerification: true` from all public and non-owner-scoped `recipes.list` queries.

#### Scenario: Public recipe list excludes pending recipes

- **Given** a database containing one published recipe and one pending recipe (same owner)
- **When** an unauthenticated user calls `recipes.list`
- **Then** only the published recipe is returned
- **And** the pending recipe does not appear in results, counts, or pagination totals

#### Scenario: Owner's own recipe list includes pending recipes

- **Given** a user with one published and one pending recipe
- **When** they call `recipes.list` filtered to their own userId
- **Then** both the published and pending recipes are returned
- **And** the pending recipe is visually distinguishable (e.g., flagged in the response)

---

### Requirement: MODIFIED Recipe byId — non-owners blocked from pending recipes

The system SHALL return a not-found or unauthorized error when a non-owner requests a recipe with `pendingVerification: true` by ID.

#### Scenario: Non-owner attempts to view a pending recipe by ID

- **Given** a pending recipe with a known ID
- **When** a user who does not own the recipe calls `recipes.byId` with that ID
- **Then** a not-found error is returned (same as for deleted recipes)

#### Scenario: Owner views their own pending recipe by ID

- **Given** a pending recipe owned by the authenticated user
- **When** the owner calls `recipes.byId` with that ID
- **Then** the full recipe document is returned

---

### Requirement: MODIFIED Usage count — pending recipes excluded from tier limit

The system SHALL exclude pending recipes from the owned recipe count used for tier limit enforcement.

#### Scenario: Pending recipes do not consume tier slots

- **Given** a free-tier user at their recipe limit who has one pending recipe
- **When** `usage.getOwned` is called
- **Then** the pending recipe is not included in the count
- **And** the user is not shown as blocked from creating more recipes

#### Scenario: Published recipes still count toward tier limit

- **Given** a free-tier user who has the maximum number of published recipes
- **When** `usage.getOwned` is called
- **Then** the count equals the limit
- **And** the user is correctly blocked from creating additional recipes

---

### Requirement: MODIFIED Taxonomy counts — exclude pending recipes

The system SHALL exclude pending recipes from all taxonomy aggregation counts (meals, courses, preparations) in public/non-owner contexts.

#### Scenario: Taxonomy count does not include pending recipes

- **Given** a pending recipe tagged with a meal type and a published recipe tagged with the same meal type
- **When** the taxonomy meal count is retrieved in a public context
- **Then** the count reflects only the published recipe

---

## REMOVED Requirements

No requirements are removed by this change. The `requireVerifiedAuth()` guard is removed from `/recipes/new` only; it is retained on `/import` and `/change-tier`.

---

## Traceability

- Proposal element: Remove `requireVerifiedAuth()` from `/recipes/new` → Requirement: ADDED Unverified user access to recipe creation
- Proposal element: Save with `pendingVerification: true` on unverified submit → Requirement: ADDED Pending recipe saved on unverified submit
- Proposal element: `PostSubmitVerifyGate` component → Requirement: ADDED PostSubmitVerifyGate component
- Proposal element: `publishPendingRecipes` service → Requirement: ADDED publishPendingRecipes service
- Proposal element: `afterEmailVerification` hook → Requirement: ADDED Email verification triggers automatic recipe publishing
- Proposal element: Pending recipes invisible in public queries → Requirement: MODIFIED Recipe list query; MODIFIED Recipe byId
- Proposal element: Pending recipes excluded from tier counts → Requirement: MODIFIED Usage count
- Design Decision 1 (DB flag) → ADDED Pending recipe saved; MODIFIED Recipe list; MODIFIED byId; MODIFIED Usage count
- Design Decision 2 (Option C hook) → ADDED Email verification triggers publishing
- Design Decision 3 (owner visibility) → MODIFIED byId
- Design Decision 4 (pending excluded from tier count) → MODIFIED Usage count
- Design Decision 5 (service layer) → ADDED publishPendingRecipes service

---

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Pending recipe not accessible via direct URL by non-owner

- **Given** a pending recipe with a known ID owned by User A
- **When** User B (authenticated) requests `recipes.byId` with that ID
- **Then** a not-found error is returned — the pending recipe is not exposed

#### Scenario: Pending recipe not returned in any public list query

- **Given** a seeded DB with pending and published recipes
- **When** any public `recipes.list` query variant is executed (no auth, filtered by taxonomy, by source, paginated)
- **Then** no pending recipe appears in the response

### Requirement: Reliability

#### Scenario: Cross-device verification publishes pending recipes

- **Given** a pending recipe created on device A
- **When** the verification link is clicked on device B
- **Then** `publishPendingRecipes` is called server-side
- **And** the recipe is published regardless of client state on device A

#### Scenario: publishPendingRecipes is idempotent

- **Given** a user whose pending recipes have already been published
- **When** `publishPendingRecipes(userId)` is called again
- **Then** the function completes without error and no unintended side effects occur

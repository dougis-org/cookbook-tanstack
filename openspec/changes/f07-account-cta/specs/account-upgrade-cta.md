## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Dynamic Upgrade CTA Button

The system SHALL render a primary action button on `/account` that targets the user's immediate next subscription tier and shows its display name and monthly price.

#### Scenario: Active user with a next tier available

- **Given** An authenticated user with current tier `"home-cook"` (whose next tier is `"prep-cook"` with monthly price `$2.99`).
- **When** The user visits `/account`.
- **Then** A primary CTA button is visible with the label `"Upgrade to Prep Cook — $2.99/mo"`.
- **And** The button links to `/pricing?focus=prep-cook`.

#### Scenario: Active user already on the top tier

- **Given** An authenticated user with current tier `"executive-chef"` (which has no next tier).
- **When** The user visits `/account`.
- **Then** No upgrade CTA button is rendered.
- **And** A static banner displaying the text `"You're on the top plan"` is visible.

### Requirement: ADDED Pricing Query Parameter Validation

The system SHALL allow `/pricing` to accept and validate the `focus` query parameter through TanStack Router.

#### Scenario: Route parses search parameters

- **Given** A user navigating to `/pricing?focus=prep-cook`.
- **When** The route search validation logic is executed.
- **Then** The URL parameter is correctly parsed as `{ focus: "prep-cook" }`.
- **And** No router compilation or type-checking errors are generated.

---

## MODIFIED Requirements

### Requirement: MODIFIED /account Tier Layout Hierarchy

The system SHALL render the upgrade CTA block above the next tier preview block in `/account`'s main information card.

#### Scenario: Visual order of upgrade components

- **Given** An authenticated user with current tier `"prep-cook"`.
- **When** The user views the tier details card on `/account`.
- **Then** The primary CTA button and secondary `"Compare all plans"` link are positioned directly below the usage bars.
- **And** The `"Next tier: Sous Chef"` preview box is rendered below the upgrade CTA links.

---

## REMOVED Requirements

### Requirement: REMOVED "View pricing plans" Underlined Text Link

- **Reason for removal**: The low-contrast text link is replaced by the primary action upgrade button and consolidated secondary `"Compare all plans"` link for improved layout hierarchy and higher conversion rates.

---

## Traceability

- **Proposal element** (Upgrade CTA) -> **Requirement**: Dynamic Upgrade CTA Button.
- **Proposal element** (Link to pricing with focus) -> **Requirement**: Pricing Query Parameter Validation.
- **Proposal element** (Move upgrade CTA up) -> **Requirement**: /account Tier Layout Hierarchy.
- **Design decision** (Query parameter validation) -> **Requirement**: Pricing Query Parameter Validation.
- **Design decision** (Consolidated upgrade block rendering) -> **Requirement**: /account Tier Layout Hierarchy.
- **Requirement** (Upgrade CTA Button) -> **Task(s)**: Implement upgraded CTA component in `account.tsx`.
- **Requirement** (Pricing query validation) -> **Task(s)**: Add `validateSearch` to `pricing.tsx`.

---

## Non-Functional Acceptance Criteria

### Requirement: Security & Access Control

#### Scenario: Unauthorized visitor block

- **Given** A visitor who is not logged in.
- **When** The visitor attempts to navigate directly to `/account`.
- **Then** They are immediately redirected to `/auth/login?reason=auth-required` as enforced by the `requireAuth` route guard.

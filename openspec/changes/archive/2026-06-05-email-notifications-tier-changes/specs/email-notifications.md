## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Dynamic Tier Email Variants

The system SHALL render distinct email notifications depending on the nature of the tier change, supporting upgrades, downgrades, trial expirations, and administrative updates.

#### Scenario: Upgrade Email Layout

- **Given** a user is upgraded to the Executive Chef tier
- **When** the `TierNotificationEmail` component is rendered with `changeType: 'upgrade'`
- **Then** the email header welcomes the user to the Executive Chef tier and lists the benefits (e.g. 2500 recipes, 200 cookbooks, and 1-click recipe imports).

#### Scenario: Downgrade Email Layout

- **Given** a user is downgraded to the Home Cook tier and has 15 recipes and 3 cookbooks hidden during reconciliation
- **When** the `TierNotificationEmail` component is rendered with `changeType: 'downgrade'` and reconciliation counts `recipesHidden: 15` and `cookbooksHidden: 3`
- **Then** the email says "Your tier has been adjusted to Home Cook" and displays "15 recipes and 3 cookbooks have been hidden to comply with your new tier limits".

#### Scenario: Trial Expiration Email Layout

- **Given** a user's trial is expiring soon
- **When** the `TierNotificationEmail` component is rendered with `changeType: 'trial-expiring'` and `tier: 'home-cook'`
- **Then** the email header says "Your Trial is Expiring Soon" and the intro text says "Your trial is expiring soon, and your tier will be adjusted to Home Cook."

#### Scenario: Administrative Update Email Layout

- **Given** a user's tier is modified by an administrator
- **When** the `TierNotificationEmail` component is rendered with `changeType: 'admin-change'`
- **Then** the email header says "Your Culinary Tier is now [Tier Name]" and the intro text explains that an administrator has updated their culinary tier.

## MODIFIED Requirements

### Requirement: MODIFIED Admin setTier Email Trigger

The system SHALL trigger the refined `TierNotificationEmail` asynchronously upon a successful user tier change.

#### Scenario: Admin setTier triggers notification

- **Given** an administrator changes user "Bob" tier from Prep Cook to Sous Chef
- **When** the `admin.users.setTier` mutation runs successfully
- **Then** the `sendEmail` utility is called asynchronously with `changeType: 'upgrade'` and Bob's email.

## REMOVED Requirements

### Requirement: REMOVED Static Tier Change Wording

Reason for removal: The static text template is replaced by dynamic templates to differentiate upgrades, downgrades, and admin-initiated actions.

## Traceability

- **Proposal element -> Requirement:**
  - Update email templates -> Requirement: ADDED Dynamic Tier Email Variants
  - Update admin setTier -> Requirement: MODIFIED Admin setTier Email Trigger
- **Design decision -> Requirement:**
  - Decision 1 (Dynamic Email Types) -> Requirement: ADDED Dynamic Tier Email Variants
  - Decision 2 (Asynchronous Delivery) -> Requirement: MODIFIED Admin setTier Email Trigger

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Mutation response latency

- **Given** an admin user
- **When** `admin.users.setTier` is invoked
- **Then** the mutation completes in under 200ms because email delivery is triggered in a non-blocking background promise.

### Requirement: Security

#### Scenario: Unsubscription footer

- **Given** any tier change email layout
- **When** the template footer is rendered
- **Then** it must include text explaining the transactional nature of the email and providing a link to `/account` settings.

### Requirement: Reliability

#### Scenario: SMTP server down

- **Given** the SMTP server is temporarily unreachable
- **When** `admin.users.setTier` is called
- **Then** the user tier change persists successfully in the database and a warning is logged on the server instead of throwing a TRPC error.

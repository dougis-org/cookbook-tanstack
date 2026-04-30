## Requirements

### Requirement: Disabled create buttons at tier limit

The system SHALL disable "New Recipe" and "New Cookbook" buttons and display an inline TierWall when the user has reached their tier's count limit.

#### Scenario: New Recipe button disabled at limit

- **Given** a `home-cook` user who already has 10 recipes
- **When** they view the recipes page
- **Then** the "New Recipe" button is disabled and an inline TierWall with `reason="count-limit"` is shown adjacent to it

#### Scenario: New Recipe button enabled below limit

- **Given** a `home-cook` user who has 7 recipes (below their limit of 10)
- **When** they view the recipes page
- **Then** the "New Recipe" button is enabled and no TierWall is shown

#### Scenario: New Cookbook button disabled at limit

- **Given** a `home-cook` user who already has 1 cookbook (their limit)
- **When** they view the cookbooks page
- **Then** the "New Cookbook" button is disabled and an inline TierWall with `reason="count-limit"` is shown

### Requirement: Private toggle hidden for ineligible tiers

The system SHALL hide the "Set to private" toggle for Home Cook and Prep Cook users.

#### Scenario: Private toggle hidden for prep-cook

- **Given** a `prep-cook` user is on the recipe create or cookbook create form
- **When** the form renders
- **Then** the "Set to private" toggle is not present in the DOM

#### Scenario: Private toggle shown for sous-chef

- **Given** a `sous-chef` user is on the recipe create or cookbook create form
- **When** the form renders
- **Then** the "Set to private" toggle is present and interactive

### Requirement: Import entry point hidden for ineligible tiers

The system SHALL hide or disable the recipe import entry point for Home Cook and Prep Cook users.

#### Scenario: Import entry point hidden for home-cook

- **Given** a `home-cook` user views any page with a recipe import button or link
- **When** the component renders
- **Then** the import entry point is not present or is visually disabled with an inline TierWall for `reason="import"`

#### Scenario: Import entry point visible for sous-chef

- **Given** a `sous-chef` user views the same page
- **When** the component renders
- **Then** the import entry point is present and interactive

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Affordances degrade gracefully during session hydration

- **Given** the session is still loading (`isPending: true`) on first render
- **When** the recipes or cookbooks page renders
- **Then** buttons default to the home-cook restriction (disabled if at home-cook limit) until the session resolves — no flash of unrestricted state

### Requirement: Security

#### Scenario: Pre-emptive UI is not the enforcement boundary

- **Given** a user bypasses the disabled button via direct API call
- **When** the tRPC mutation is invoked with a count at or above the tier limit
- **Then** the server rejects the request with `PAYMENT_REQUIRED` — the server is always authoritative

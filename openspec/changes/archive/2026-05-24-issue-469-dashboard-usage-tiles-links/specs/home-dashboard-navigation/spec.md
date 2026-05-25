## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Dashboard usage tiles support full-link navigation

The system SHALL allow the full Recipes and Cookbooks usage tiles on the authenticated dashboard to navigate to their corresponding collection routes.

#### Scenario: Recipes tile full-link navigation

- **Given** an authenticated user is on `/home`
- **When** the user activates the Recipes usage tile (click or keyboard activation)
- **Then** the app navigates to `/recipes`

#### Scenario: Cookbooks tile full-link navigation

- **Given** an authenticated user is on `/home`
- **When** the user activates the Cookbooks usage tile (click or keyboard activation)
- **Then** the app navigates to `/cookbooks`

## MODIFIED Requirements

### Requirement: MODIFIED Dashboard keeps duplicate navigation affordances

The system SHALL keep existing Discovery links to Recipes and Cookbooks while adding tile-based navigation.

#### Scenario: Existing discovery links remain available

- **Given** an authenticated user is on `/home`
- **When** tile links are introduced for Recipes and Cookbooks
- **Then** Discovery section links to `/recipes` and `/cookbooks` are still rendered and usable

## REMOVED Requirements

### Requirement: REMOVED Usage tiles are non-interactive summary containers

Reason for removal: Issue #469 requires Recipes and Cookbooks summary tiles to be actionable links rather than static-only containers.

## Traceability

- Proposal element -> Requirement:
  - "Make Recipes usage tile clickable" -> ADDED Dashboard usage tiles support full-link navigation
  - "Make Cookbooks usage tile clickable" -> ADDED Dashboard usage tiles support full-link navigation
  - "Preserve duplicate Discovery links" -> MODIFIED Dashboard keeps duplicate navigation affordances
- Design decision -> Requirement:
  - Decision 1 (semantic Link wrappers) -> ADDED Dashboard usage tiles support full-link navigation
  - Decision 2 (keep Discovery links) -> MODIFIED Dashboard keeps duplicate navigation affordances
  - Decision 3 (exclude analytics) -> Non-goal validation and execution constraints
- Requirement -> Task(s):
  - ADDED Dashboard usage tiles support full-link navigation -> `tasks.md` Execution items 1-2 and test updates
  - MODIFIED Dashboard keeps duplicate navigation affordances -> `tasks.md` Execution item 3 and tests
  - REMOVED non-interactive requirement -> `tasks.md` Execution implementation + regression verification

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional data fetching

- **Given** the `/home` dashboard loads with existing queries
- **When** Recipes and Cookbooks tiles are converted to links
- **Then** no new query hooks or network requests are introduced by the tile-link change

### Requirement: Security

#### Scenario: Internal route-only navigation

- **Given** the dashboard tile link implementation
- **When** link targets are rendered
- **Then** targets are fixed internal routes (`/recipes`, `/cookbooks`) with no user-injected destination values

### Requirement: Reliability

#### Scenario: Loading-state stability

- **Given** the dashboard is in usage-loading state
- **When** the loading skeleton is rendered
- **Then** it remains renderable without navigation errors and transitions to valid tile links once data loads

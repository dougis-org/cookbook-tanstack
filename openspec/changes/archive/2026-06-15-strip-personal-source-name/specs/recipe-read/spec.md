## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Strip personalSourceName from tRPC recipe responses

The system SHALL completely omit/strip `personalSourceName` from any tRPC response returning recipe data unless the authenticated viewer is the owner of the recipe.

#### Scenario: Owner viewing recipe

- **Given** the user is the owner of the recipe
- **When** the recipe is returned via tRPC (e.g. `byId`, `list`, or nested in a cookbook)
- **Then** the recipe object contains the `personalSourceName` key (valued as the stored string or null)

#### Scenario: Different authenticated user viewing recipe

- **Given** the user is authenticated but is not the owner of the recipe
- **When** the recipe is returned via tRPC (e.g. `byId`, `list`, or nested in a cookbook)
- **Then** the `personalSourceName` key is completely absent from the returned object

#### Scenario: Anonymous visitor viewing recipe

- **Given** the visitor is not authenticated
- **When** the recipe is returned via tRPC (e.g. `byId`, `list`, or nested in a cookbook)
- **Then** the `personalSourceName` key is completely absent from the returned object

## MODIFIED Requirements

None

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Centralized helper to delete `personalSourceName` -> ADDED Strip personalSourceName from tRPC recipe responses
- Design decision -> Requirement: Decision 1 (Shared Helper) -> ADDED Strip personalSourceName from tRPC recipe responses
- Design decision -> Requirement: Decision 2 (delete operator) -> ADDED Strip personalSourceName from tRPC recipe responses
- Requirement -> Task(s): See [tasks.md](../../tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** normal load
- **When** running the shared `sanitizeRecipePersonalSource` helper on query results
- **Then** the helper runs synchronously in under 1ms per batch

### Requirement: Security

See functional scenarios: "Owner viewing recipe", "Different authenticated user viewing recipe", "Anonymous visitor viewing recipe"

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a recipe has a missing/corrupted `userId` in the database
- **When** a query retrieves this recipe
- **Then** the system treats the recipe as owned by nobody and safely strips the `personalSourceName` without throwing errors

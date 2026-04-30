# visibilityFilter hiddenByTier Regression Tests

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED — visibilityFilter excludes hiddenByTier documents for all users including owners

The system SHALL exclude documents with `hiddenByTier: true` from all visibility-gated queries for every caller context — anonymous and authenticated — even when the authenticated caller is the document owner.

#### Scenario: Owner with one visible and one hidden cookbook — list returns only the visible one

- **Given** a user "owner" exists with a visible cookbook `C1` (`isPublic: true`, `hiddenByTier: false`) and a hidden cookbook `C2` (`isPublic: true`, `hiddenByTier: true`) both owned by "owner"
- **When** "owner" calls `cookbooks.list()`
- **Then** the response contains exactly 1 cookbook with `id === C1.id`; C2 is absent

#### Scenario: Owner with a hidden cookbook — byId returns null

- **Given** a user "owner" exists with a hidden cookbook `C1` (`isPublic: true`, `hiddenByTier: true`) owned by "owner"
- **When** "owner" calls `cookbooks.byId({ id: C1.id })`
- **Then** the response is `null`

#### Scenario: Owner with one visible and one hidden recipe — list returns only the visible one

- **Given** a user "owner" exists with a visible recipe `R1` (`isPublic: true`, `hiddenByTier: false`) and a hidden recipe `R2` (`isPublic: true`, `hiddenByTier: true`) both owned by "owner"
- **When** "owner" calls `recipes.list({ userId: owner.id })`
- **Then** the response contains exactly 1 recipe item with `id === R1.id`; R2 is absent

#### Scenario: Owner with a hidden recipe — byId returns null

- **Given** a user "owner" exists with a hidden recipe `R1` (`isPublic: true`, `hiddenByTier: true`) owned by "owner"
- **When** "owner" calls `recipes.byId({ id: R1.id })`
- **Then** the response is `null`

#### Scenario: Anonymous user cannot see hidden documents

- **Given** a user "owner" exists with only a hidden cookbook `C1` (`isPublic: true`, `hiddenByTier: true`) owned by "owner"
- **When** an anonymous caller calls `cookbooks.list()`
- **Then** the response contains 0 cookbooks

### Requirement: ADDED — visibilityFilter behavior validated with real MongoDB documents

The `visibilityFilter` function SHALL be validated through end-to-end query execution with real MongoDB documents, not only through filter-structure assertion.

#### Scenario: visibilityFilter with cookbooks — owner sees only non-hidden documents

- **Given** a user "owner" exists with 2 cookbooks: one visible (`hiddenByTier: false`) and one hidden (`hiddenByTier: true`)
- **When** the `visibilityFilter({ id: owner.id })` is applied via a `Cookbook.find()` query and executed against the database
- **Then** the query returns exactly 1 document (the visible one)

#### Scenario: visibilityFilter with recipes — owner sees only non-hidden documents

- **Given** a user "owner" exists with 2 recipes: one visible (`hiddenByTier: false`) and one hidden (`hiddenByTier: true`)
- **When** the `visibilityFilter({ id: owner.id })` is applied via a `Recipe.find()` query and executed against the database
- **Then** the query returns exactly 1 document (the visible one)

## MODIFIED Requirements

None — no existing requirements are modified by this change.

## REMOVED Requirements

None — no requirements are removed by this change.

## Traceability

| Proposal Element | Requirement | Task(s) |
|---|---|---|
| Add behavioral tests for `cookbooks.list` — owner with hidden cookbook cannot see it | visibilityFilter excludes hiddenByTier documents for all users including owners (Scenario 1) | T-1 |
| Add behavioral tests for `cookbooks.byId` — owner requesting own hidden cookbook returns null | visibilityFilter excludes hiddenByTier documents for all users including owners (Scenario 2) | T-2 |
| Add behavioral tests for `recipes.list` — owner with hidden recipe cannot see it | visibilityFilter excludes hiddenByTier documents for all users including owners (Scenario 3) | T-3 |
| Add behavioral tests for `recipes.byId` — owner requesting own hidden recipe returns null | visibilityFilter excludes hiddenByTier documents for all users including owners (Scenario 4) | T-4 |
| Add `visibilityFilter` behavior tests in `helpers.test.ts` with real DB documents | visibilityFilter behavior validated with real MongoDB documents (Scenarios 6 & 7) | T-5 |
| Optionally add anonymous-user tests for hidden doc exclusion | visibilityFilter excludes hiddenByTier documents for all users including owners (Scenario 5) | T-6 (follow-up) |

## Non-Functional Acceptance Criteria

### Requirement: Testability

#### Scenario: All new tests run deterministically with in-memory MongoDB

- **Given** the test environment uses `withCleanDb` with a real MongoDB instance
- **When** `npm run test` is executed
- **Then** all new tests pass without flakiness, timing dependencies, or external service dependencies beyond the local MongoDB instance

#### Scenario: Test execution time remains reasonable

- **Given** the existing test suite runs in ~X seconds (baseline from CI)
- **When** new tests are added
- **Then** total test suite execution time increases by no more than 10%
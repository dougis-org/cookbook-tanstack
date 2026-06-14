## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Recipe Personal Source Name

The system SHALL allow saving and retrieving an optional `personalSourceName` string for a Recipe, bounded to 80 characters.

#### Scenario: Valid personalSourceName

- **Given** a new or existing recipe being saved
- **When** the payload includes a `personalSourceName` of 80 characters or fewer
- **Then** the recipe is saved successfully and the field is returned on subsequent reads

#### Scenario: Exceeds maxlength validation

- **Given** a new or existing recipe being saved
- **When** the payload includes a `personalSourceName` of 81 characters or more
- **Then** the save operation throws a Mongoose/Zod validation error

#### Scenario: Empty string representation

- **Given** a new or existing recipe being saved
- **When** the payload includes an empty string for `personalSourceName`
- **Then** the recipe is saved successfully without raising a validation error, and the empty string is semantically equivalent to "no name"

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Add `personalSourceName` -> Requirement: ADDED Recipe Personal Source Name
- Design decision -> Requirement: Decision 1 & 2 -> Requirement: ADDED Recipe Personal Source Name
- Requirement -> Task(s): ADDED Recipe Personal Source Name -> (See Tasks 1-5)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the recipe query load
- **When** retrieving recipes
- **Then** the addition of the optional string field must not degrade read latency (no new indexes required)

### Requirement: Security

> If access-control rejections are already fully specified by functional scenarios above, replace the scenario below with a cross-reference: "See functional scenarios: [scenario name(s)]". Only add a distinct scenario here if there is a security property not expressed by the functional requirements (e.g., audit log written, token not leaked in error body).

Deferred: Privacy controls for this field are deferred to a subsequent issue (Issue E).

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a failed save due to validation (e.g., >80 chars)
- **When** the client retries with a shortened string
- **Then** the save succeeds seamlessly

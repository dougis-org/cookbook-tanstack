## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Audit log entry written on every tier change

The system SHALL write a document to the `adminAuditLog` collection whenever a user's tier is successfully changed, capturing email snapshots of both the acting admin and the target user, along with the before and after tier values.

#### Scenario: Audit log entry created on tier change

- **Given** admin A changes user B's tier from "home-cook" to "sous-chef"
- **When** the `setTier` mutation completes the MongoDB user update
- **Then** a document is inserted into `adminAuditLog` with:
  - `adminId`: admin A's user ID
  - `adminEmail`: admin A's email at time of change
  - `targetUserId`: user B's user ID
  - `targetEmail`: user B's email at time of change
  - `action`: `"set-tier"`
  - `before`: `{ tier: "home-cook" }`
  - `after`: `{ tier: "sous-chef" }`
  - `createdAt`: timestamp of the change

#### Scenario: No audit entry on same-tier no-op

- **Given** user B is already on tier "sous-chef"
- **When** admin sets user B's tier to "sous-chef"
- **Then** no document is inserted into `adminAuditLog`

### Requirement: ADDED Audit log write failure does not roll back tier change

The system SHALL treat audit log writes as informational — if the write fails, the tier change is not rolled back and the error is logged server-side only.

#### Scenario: Audit write fails after successful tier update

- **Given** the MongoDB user update succeeds
- **When** the `adminAuditLog` insert throws an error
- **Then** the `setTier` mutation returns success to the caller, and the error is captured in server-side logs

### Requirement: ADDED `adminAuditLog` Mongoose model

The system SHALL have a Mongoose model for the `adminAuditLog` collection with the defined schema, barrel-exported from `src/db/models/index.ts`.

#### Scenario: Model registered and usable

- **Given** the app starts and MongoDB connects
- **When** `getMongoClient().db().collection("adminAuditLog")` is called inside a mutation
- **Then** the collection is accessible and inserts succeed with the documented schema

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Audit log or confirmation step before making changes" → Requirement: Audit log entry written
- Design decision 3 (separate collection, write-only, email snapshots) → All audit log requirements
- Requirement: Audit log entry written → Task: Create `src/db/models/admin-audit-log.ts`
- Requirement: Audit log entry written → Task: Add audit log write inside `setTier` mutation
- Requirement: Audit write failure does not roll back → Task: Wrap audit insert in try/catch, log error, continue

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tier change succeeds even when audit write fails

- **Given** the user update succeeds but `insertOne` on `adminAuditLog` throws
- **When** the mutation completes
- **Then** the caller receives a success response and the tier is persisted; server logs contain the audit write error

### Requirement: Operability

#### Scenario: Audit log collection schema is consistent

- **Given** multiple tier changes have occurred
- **When** the `adminAuditLog` collection is queried
- **Then** all documents contain `adminId`, `adminEmail`, `targetUserId`, `targetEmail`, `action`, `before`, `after`, and `createdAt` fields

## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Seeding Personal Source

The system SHALL idempotently seed a default "Personal" source with slug "personal" and name "Personal" upon database seeding.

#### Scenario: Running db:seed on clean database seeds Personal source

- **Given** the database contains no sources with slug "personal"
- **When** `npm run db:seed` is executed
- **Then** a source with slug "personal" and name "Personal" is created in the database

#### Scenario: Running db:seed when Personal source exists is idempotent

- **Given** the database already contains a source with slug "personal" and name "Personal"
- **When** `npm run db:seed` is executed
- **Then** the database is not duplicated and no error is thrown, leaving exactly one source with slug "personal"

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Seed "Personal" source with slug "personal" -> ADDED Seeding Personal Source
- Design decision -> Requirement: Decision 1 (seedSources() function) -> ADDED Seeding Personal Source
- Design decision -> Requirement: Decision 2 (seed execution order) -> ADDED Seeding Personal Source
- Requirement -> Task(s): ADDED Seeding Personal Source -> (See tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior, cross-reference it here instead of repeating it.

### Requirement: Performance

See functional scenarios. No latency budget or throughput limits affected.

### Requirement: Security

See functional scenarios. No new access control properties introduced.

### Requirement: Reliability

#### Scenario: Idempotency under concurrent runs

- **Given** the database seeding script runs concurrently or is called repeatedly
- **When** multiple upsert operations for slug "personal" are requested
- **Then** the database uses unique indexes on slug to enforce exactly one document and remains consistent without crash

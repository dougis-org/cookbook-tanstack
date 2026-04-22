# Spec: Migration Script — hiddenByTier Backfill

## ADDED Requirements

### Requirement: ADDED Migration script backfills hiddenByTier on existing documents

The system SHALL provide an idempotent migration script that sets `hiddenByTier: false` on all existing Recipe and Cookbook documents that lack the field.

#### Scenario: First run backfills all documents

- **Given** a database with N Recipe documents and M Cookbook documents, none having a `hiddenByTier` field
- **When** `npm run db:migrate-hidden-by-tier` is executed
- **Then** all N Recipe documents and M Cookbook documents have `hiddenByTier: false`; script exits with code 0 and logs modified counts

#### Scenario: Second run is a no-op

- **Given** all Recipe and Cookbook documents already have `hiddenByTier` set
- **When** `npm run db:migrate-hidden-by-tier` is executed again
- **Then** `modifiedCount` is 0 for both collections; no documents are overwritten; script exits with code 0

#### Scenario: Script handles missing MONGODB_URI

- **Given** `MONGODB_URI` environment variable is not set
- **When** the migration script is invoked
- **Then** the script logs an error and exits with code 1 without connecting to any database

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Migration script for hiddenByTier backfill" → Requirement: ADDED Migration script backfills hiddenByTier
- Design decision 5 (migration location and pattern) → script at `scripts/migrate-hidden-by-tier.ts`
- Requirements → Tasks: task "Create migrate-hidden-by-tier.ts script", task "Add db:migrate-hidden-by-tier npm script"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Safe to run on production data

- **Given** a production database with existing Recipe and Cookbook documents
- **When** the migration script runs
- **Then** only documents missing `hiddenByTier` are modified; no existing field values are overwritten; script is safe to run during off-hours without downtime

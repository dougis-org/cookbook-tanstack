# Spec: Migration Script

Capability: `scripts/migrate-user-tiers.ts` — one-time idempotent migration

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED migration script sets executive-chef for all existing users

The system SHALL provide a script at `scripts/migrate-user-tiers.ts` that sets `tier: 'executive-chef'` and `isAdmin: false` on all `user` documents where `tier` is not already set.

#### Scenario: All users without tier receive executive-chef

- **Given** two user documents in the `user` collection with no `tier` field
- **When** the migration script runs
- **Then** both documents have `tier: 'executive-chef'` and `isAdmin: false`

#### Scenario: Script is idempotent

- **Given** the migration has already been run once
- **When** the migration script runs a second time
- **Then** no documents are modified (update count is 0); no errors are thrown; existing `tier` values are not overwritten

#### Scenario: Script does not overwrite a manually-set tier

- **Given** a user document with `tier: 'prep-cook'` already set
- **When** the migration script runs
- **Then** the document retains `tier: 'prep-cook'` unchanged

---

### Requirement: ADDED migration script flags doug@dougis.com as admin

The system SHALL set `isAdmin: true` on the user document where `email: 'doug@dougis.com'`, regardless of whether the document already had `isAdmin` set.

#### Scenario: Admin flag is set on target account

- **Given** a user document with `email: 'doug@dougis.com'`
- **When** the migration script runs
- **Then** the document has `isAdmin: true`

#### Scenario: Other user accounts are not flagged as admin

- **Given** user documents with emails other than `doug@dougis.com`
- **When** the migration script runs
- **Then** those documents have `isAdmin: false` (or retain their existing value if already set)

---

### Requirement: ADDED npm script db:migrate-tiers

The system SHALL provide a `db:migrate-tiers` entry in `package.json` that runs the migration script.

#### Scenario: Script is runnable via npm

- **Given** a configured `MONGODB_URI` environment variable
- **When** `npm run db:migrate-tiers` is executed
- **Then** the migration completes and logs a summary (users updated, admin flagged)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Migration script" → Requirement: ADDED migration sets executive-chef, ADDED admin flag
- Design Decision 5 (conservative $set + conditional update) → Requirement: ADDED migration is idempotent, ADDED does not overwrite
- Proposal constraint "two existing users" → Scenario: all users without tier receive executive-chef
- Proposal constraint "doug@dougis.com is admin" → Scenario: admin flag is set on target account
- Requirement "npm script" → Task: add db:migrate-tiers to package.json

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Script fails safely if MongoDB is unreachable

- **Given** `MONGODB_URI` points to an unavailable MongoDB instance
- **When** `npm run db:migrate-tiers` is executed
- **Then** the script exits with a non-zero code and logs a clear error message; no partial writes occur

#### Scenario: Script logs result summary

- **Given** a successful migration run
- **When** the script completes
- **Then** output includes: count of documents updated with `tier`, whether `doug@dougis.com` was found and flagged, and a confirmation that the run completed successfully

### Requirement: Operability

#### Scenario: Script can be run safely in production without downtime

- **Given** the production MongoDB instance
- **When** the migration script runs
- **Then** it completes using standard MongoDB `updateMany`/`updateOne` without locking collections or requiring application downtime

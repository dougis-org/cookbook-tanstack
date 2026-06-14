## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-source-slug-backfill/design.md) document, not a replacement.

### Requirement: ADDED Source slug field on schema

The system SHALL include a `slug` field on every `Source` document — a unique, indexed, kebab-cased string derived from the source's `name`.

#### Scenario: Source document has a slug after backfill

- **Given** the `sources` collection contains documents without a `slug` field
- **When** `backfillSourceSlugs()` is executed
- **Then** every Source document has a non-empty `slug` string

#### Scenario: Slug uniqueness constraint is enforced

- **Given** a Source with `slug: "bon-appetit"` already exists in the database
- **When** a second Source is inserted with the same `slug: "bon-appetit"`
- **Then** Mongoose throws a duplicate key error and the insert is rejected

#### Scenario: Slug is required on new Source documents

- **Given** the updated `sourceSchema` is active
- **When** a new Source document is saved without a `slug` field
- **Then** Mongoose validation rejects the save with a required field error

#### Scenario: Slug is indexed for lookup performance

- **Given** the `sources` collection with the updated schema
- **When** the collection indexes are inspected
- **Then** an index exists on the `slug` field

### Requirement: ADDED Idempotent backfill of existing Source slugs

The system SHALL provide a `backfillSourceSlugs()` function that derives a slug from each Source's `name` using the established `slugify()` function, and skips documents that already have a slug.

#### Scenario: Backfill derives correct slug from name

- **Given** a Source document with `name: "Bon Appetit"` and no `slug`
- **When** `backfillSourceSlugs()` is executed
- **Then** the document is updated with `slug: "bon-appetit"`

#### Scenario: Backfill derives correct slug for .com source names

- **Given** a Source document with `name: "allrecipies.com"` and no `slug`
- **When** `backfillSourceSlugs()` is executed
- **Then** the document is updated with `slug: "allrecipiescom"` (dots stripped — intentional website signal)

#### Scenario: Backfill is idempotent — skips already-slugged documents

- **Given** Source documents where some already have a `slug` and some do not
- **When** `backfillSourceSlugs()` is executed twice in sequence
- **Then** no document has its slug overwritten on the second run, and no errors are thrown

#### Scenario: Backfill logs zero-document warning

- **Given** the `sources` collection is empty or all documents already have slugs
- **When** `backfillSourceSlugs()` is executed
- **Then** the function logs a warning that zero documents were updated (not a silent no-op)

### Requirement: ADDED Source seed wired into standard seed entrypoint

The system SHALL call `backfillSourceSlugs()` from `src/db/seeds/index.ts` so it runs as part of `npm run db:seed`.

#### Scenario: Seed entrypoint includes source backfill

- **Given** the standard seed command `npm run db:seed`
- **When** the command runs against a database with un-slugged Source documents
- **Then** all Source documents receive their slug and the command exits successfully

## MODIFIED Requirements

None. This change is purely additive to the Source model.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Add slug to ISource and sourceSchema" -> Requirement: Source slug field on schema
- Proposal element "Backfill existing 150 prod documents" -> Requirement: Idempotent backfill of existing Source slugs
- Proposal element "Wire into db:seed" -> Requirement: Source seed wired into standard seed entrypoint
- Design Decision 1 (reuse slugify) -> Requirement: Idempotent backfill — backfill spec scenarios
- Design Decision 2 (deploy order) -> Requirement: Source slug field — required constraint scenario
- Design Decision 3 (seeds location) -> Requirement: Source seed wired into standard seed entrypoint
- Design Decision 4 (skip-if-present) -> Requirement: Idempotent backfill — idempotency scenario
- Requirement "Source slug field on schema" -> Task: Update source.ts model
- Requirement "Idempotent backfill" -> Task: Create src/db/seeds/sources.ts
- Requirement "Source seed wired into entrypoint" -> Task: Update src/db/seeds/index.ts

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Backfill does not fail silently on zero documents

See functional scenario: "Backfill logs zero-document warning" — this scenario fully specifies the reliability property.

### Requirement: Performance

#### Scenario: Backfill completes within acceptable time

- **Given** a `sources` collection of up to 500 documents
- **When** `backfillSourceSlugs()` is executed
- **Then** the function completes in under 5 seconds (sequential at this scale; no batching required)

### Requirement: Security

See functional scenarios above — no access-control or secret-handling concerns exist for a seed/backfill script that runs in a trusted server context.

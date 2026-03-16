## Why

Milestone 9 is the point where the new TanStack Start application stops being a feature-complete rewrite and becomes a usable replacement for the legacy Laravel system. The repository already migrated the runtime stack to MongoDB and Mongoose, but there is still no repeatable path to move legacy recipes, taxonomies, and cookbooks from the preserved SQL dump into the new database.

## Problem Space

The launch path now depends on a verified cutover from legacy Laravel data into MongoDB. The raw dump at `dump-recipe_laravel-202603111712.sql` contains normalized MySQL tables, legacy foreign keys, nullable and zero-date timestamp edge cases, and legacy ownership relationships that do not yet map cleanly to the document model used by this application.

Without a scripted migration flow, the team cannot reliably:

- extract the legacy dataset into reviewable intermediate artifacts
- transform relational records and pivot tables into MongoDB document shapes
- import data idempotently into the current Mongoose models
- assign imported recipes and cookbooks to a default admin owner while preserving enough lineage for later ownership reassignment
- prove that migrated recipes, cookbooks, search, filters, and relationships still work

This work is time-sensitive because Milestone 10 testing, Milestone 11 performance, and Milestone 12 production cutover all depend on having realistic migrated data in place.

## Scope

In scope:

- parse the preserved Laravel SQL dump into validated intermediate JSON artifacts
- document source-to-target field mappings from Laravel MySQL tables to MongoDB collections and embedded document structures
- transform legacy relational records, pivot tables, and timestamps into import-ready MongoDB documents
- import taxonomy, recipes, cookbooks, and relationship data into MongoDB with idempotent upsert behavior, default admin ownership, and failure reporting
- preserve legacy ownership lineage needed for later bulk ownership assignment without requiring initial user migration
- verify and document that no legacy image migration step is required
- add migration verification coverage that checks counts, references, default ownership assignment, representative application queries, and spot-check workflows
- produce repeatable reports and manifests needed to rerun or audit the migration

Out of scope:

- changing the user-facing UI or route structure
- redesigning the recipe, cookbook, taxonomy, or auth data models beyond what is required to populate existing schemas
- launching production cutover orchestration, downtime handling, or deployment automation from Milestone 12
- broad post-migration cleanup features that are not required to make Milestone 9 pass

## What Changes

- add a repeatable legacy data extraction workflow for the Laravel SQL dump, including row-count and relationship validation
- add transformation scripts and mapping documentation that convert legacy relational records into MongoDB-ready documents and embedded arrays
- add import scripts with batch processing, idempotent upserts, default admin ownership assignment, logging, and critical-failure handling
- add explicit verification output confirming whether legacy recipe image migration is required
- add automated verification scripts and test coverage for migrated counts, relationships, default ownership assignment, and representative product workflows
- document operational prerequisites, rollback inputs, and rerun expectations for staging-first migration execution

## Capabilities

### New Capabilities

- `legacy-data-migration`: End-to-end migration of legacy Laravel data into the MongoDB-backed CookBook application with extraction, transformation, import, and verification workflows.

### Modified Capabilities

- None.

## Impact

- Affected code: `scripts/`, `src/db/`, `src/lib/`, `src/server/`, `src/test-helpers/`, and migration-focused tests under `src/` or `tests/` as needed
- Affected data sources: `dump-recipe_laravel-202603111712.sql`, generated migration artifacts, and MongoDB collections
- Affected documentation: milestone-aligned migration docs, field mapping documentation, and operator runbooks created under `docs/` or `openspec/changes/laravel-data-migration/`
- Operational impact: requires staging-first execution, database backup before import, and preserved raw artifacts for rollback and audit

## Risks

- legacy data inconsistencies may break transforms or produce orphaned references that need explicit quarantine rules
- ownership lineage may be lost or assigned incorrectly if legacy owner identifiers are not preserved alongside the default admin ownership fallback
- large import batches can create partial-write states unless batch sizing, idempotency, and failure logging are designed carefully
- inaccurate verification criteria would create false confidence and push defects into later launch milestones

## Open Questions

- Which existing admin account should be treated as the canonical default owner for the initial import?
- What lineage fields must be retained so later bulk ownership reassignment can run without needing a second legacy extract?

## Non-Goals

- introducing new product features during migration
- replacing the preserved SQL dump with a different source of truth
- modifying the OpenSpec workflow or milestone ordering
- treating manual one-off database edits as an acceptable primary migration strategy

## Change Control

If the approved migration scope changes after this proposal is reviewed, the proposal, design, specs, and tasks for `openspec/changes/laravel-data-migration/` must be updated before implementation begins.

## Approval Expectation

This proposal should be explicitly reviewed and approved by a human before implementation starts, even if subsequent design, spec, and task artifacts are prepared now for planning completeness.
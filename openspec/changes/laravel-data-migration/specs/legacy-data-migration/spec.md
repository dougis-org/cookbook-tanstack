## ADDED Requirements

### Requirement: Validated legacy extraction artifacts
The system SHALL extract the preserved Laravel SQL dump into reviewable intermediate artifacts for all migration-critical tables and SHALL validate that extracted row counts and legacy relationships match the source dump before transformation proceeds.

Traceability: Proposal scope for dump extraction and validation; Design Decision 1.

#### Scenario: Successful table extraction
- **WHEN** the extraction workflow runs against `dump-recipe_laravel-202603111712.sql`
- **THEN** it produces machine-readable artifacts for recipes, classifications, sources, meals, courses, preparations, cookbooks, required pivot data, and any lineage data needed for later ownership reassignment

#### Scenario: Row-count mismatch blocks progression
- **WHEN** extracted row counts or foreign-key reference totals do not match the source dump
- **THEN** the workflow records the discrepancy in a validation report and prevents downstream transformation from being marked successful

### Requirement: Deterministic relational-to-document transformation
The system SHALL transform extracted relational records into MongoDB-ready documents that conform to the current Mongoose model boundaries, normalize legacy timestamps and text encoding issues, and preserve lineage needed to resolve embedded references and cookbook ordering.

Traceability: Proposal scope for field mapping and transformation; Design Decision 2 and Decision 3.

#### Scenario: Pivot data becomes embedded references
- **WHEN** recipe taxonomy pivots and cookbook recipe ordering are transformed
- **THEN** the output contains deterministic relationship mappings that can materialize `mealIds`, `courseIds`, `preparationIds`, and cookbook recipe entries with `orderIndex`

#### Scenario: Invalid legacy values are normalized or quarantined
- **WHEN** the transformation workflow encounters zero timestamps, malformed nullable fields, or unresolved legacy references
- **THEN** it either emits normalized import-ready values according to documented mapping rules or records the record in an explicit exception report

### Requirement: Default admin ownership with preserved legacy lineage
The system SHALL assign imported recipes and cookbooks to a configured admin user during the initial load and SHALL preserve legacy ownership lineage needed for later bulk ownership reassignment.

Traceability: Proposal scope for default ownership and deferred user migration; Design Decision 6.

#### Scenario: Imported content receives default admin ownership
- **WHEN** recipes and cookbooks are imported into MongoDB during the initial load
- **THEN** their ownership fields reference the configured admin user rather than migrated legacy user accounts

#### Scenario: Legacy ownership lineage is retained
- **WHEN** legacy recipes and cookbooks carry owner identifiers in the source dump
- **THEN** the migration artifacts retain those identifiers in approved lineage outputs so later ownership reassignment can run without a second legacy extraction

### Requirement: Idempotent MongoDB import with failure reporting
The system SHALL import transformed migration artifacts into MongoDB using deterministic upsert behavior, structured logging, and batch-level error handling so that rerunning the import does not duplicate records or silently lose relationships.

Traceability: Proposal scope for import scripts and reruns; Design Decision 4 and Decision 8.

#### Scenario: Repeated import remains stable
- **WHEN** the same transformed migration artifacts are imported more than once into the same target database
- **THEN** the resulting collection counts, embedded relationships, cookbook order data, and default owner assignment remain stable without duplicate records

#### Scenario: Critical import failures are surfaced
- **WHEN** schema validation, missing-reference resolution, or batch write failures occur during import
- **THEN** the system records the failures with actionable detail and marks the import run unsuccessful until operators resolve or approve the exceptions

### Requirement: Explicit verification of no legacy image migration
The system SHALL verify whether legacy recipe records contain image assets that require migration and SHALL record a no-image migration outcome when no such assets exist.

Traceability: Proposal scope for image migration; Design Decision 5.

#### Scenario: No legacy images are present
- **WHEN** extraction and transformation inspect legacy recipe image fields and find no image assets to migrate
- **THEN** the migration output records that no image transfer is required and does not create upload work for recipe media

#### Scenario: Unexpected legacy images are surfaced
- **WHEN** extraction finds legacy recipe image assets after the migration has been scoped as image-free
- **THEN** verification marks the run as requiring review so the migration plan can be updated before launch progression

### Requirement: Executable post-migration verification
The system SHALL provide executable verification checks that compare extracted and imported data totals, validate default ownership assignment and representative application workflows, and report migration readiness with measurable pass or fail outcomes.

Traceability: Proposal scope for verification coverage and launch readiness; Design Decision 7 and Decision 9.

#### Scenario: Verification confirms migrated application behavior
- **WHEN** post-migration verification runs against a completed staging import
- **THEN** it reports whether recipe counts, cookbook counts, taxonomy relationships, default admin ownership, and representative search or filter workflows match expected outcomes

#### Scenario: Performance and integrity regressions are reported
- **WHEN** representative migrated queries exceed agreed performance thresholds or integrity checks find unresolved discrepancies
- **THEN** the verification output marks the run as failing and identifies the blocking checks that must be resolved before launch progression
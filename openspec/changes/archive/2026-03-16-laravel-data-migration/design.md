## Context

Milestone 9 is the first launch-path milestone that operates on real legacy production-shaped data instead of synthetic seeds. The repository already completed the database platform migration to MongoDB and Mongoose, but it does not yet have a repeatable process for converting the preserved Laravel SQL dump into MongoDB collections and embedded document structures used by the current application.

The preserved source artifact is `dump-recipe_laravel-202603111712.sql`. The target system is the existing MongoDB-backed application data model under `src/db/models/`. The migration must preserve auditability, rerunnability, and launch readiness while minimizing one-off manual intervention.

Constraints:

- the raw SQL dump must remain the immutable source backup
- migration work must be staging-first and repeatable before any production cutover effort
- import logic must match the current Mongoose schemas and not invent a parallel runtime model
- launch milestones after M09 depend on migrated data being available for realistic QA and performance validation

Proposal-to-design mapping:

- extraction workflow and validation → Decision 1
- relational-to-document transformation and field mapping → Decision 2 and Decision 3
- idempotent import with error handling → Decision 4 and Decision 8
- explicit no-image verification → Decision 5
- default admin ownership and lineage preservation → Decision 6 and Decision 8
- verification coverage for counts and workflows → Decision 7 and Decision 9
- operational prerequisites and rerun expectations → Decision 9

## Goals / Non-Goals

**Goals:**

- provide a deterministic migration pipeline from SQL dump to MongoDB collections
- preserve enough lineage metadata to trace every migrated record back to its legacy identifiers
- preserve enough ownership lineage to support a later bulk ownership reassignment without migrating legacy users during the initial load
- keep extraction, transformation, import, and verification stages independently runnable and reviewable
- support idempotent reruns so staging validation and production rehearsal do not require manual cleanup
- make failures diagnosable through manifests, validation reports, and structured logs
- define testability for functional and non-functional migration requirements before implementation

Testability notes:

- extraction correctness is validated by schema documentation, row counts, and foreign-key reference checks
- transformation correctness is validated by mapping fixtures, orphan detection, and document-shape validation against Mongoose models
- import correctness is validated by idempotent rerun tests, count checks, default admin ownership checks, and sample query verification
- legacy media assumptions are validated by extraction output confirming whether any recipe images exist to migrate
- end-to-end migration readiness is validated by automated verification scripts plus representative application workflow checks

**Non-Goals:**

- redesigning the runtime application architecture or user-facing UX
- performing production deployment orchestration or downtime management in this change
- solving every historical data-quality issue automatically when quarantine plus reporting is safer
- introducing speculative schema changes unrelated to loading legacy data into the existing application model

## Decisions

### Decision 1: Stage the migration as extract, transform, import, verify

Chosen: a four-stage pipeline with materialized artifacts between stages.

Alternatives considered:

- single pass SQL-to-Mongo import script
- ad hoc manual exports plus direct database edits

Rationale:

- staged artifacts make row-count review, replay, and audit practical
- failures can be isolated to one stage without rerunning the full pipeline
- the milestone explicitly calls for backup artifacts, validation reports, and repeatability

Validation approach:

- each stage produces machine-readable outputs and a summary report
- stage boundaries become discrete test and verification targets

### Decision 2: Represent legacy relational links through explicit mapping tables before materializing ObjectId references

Chosen: generate stable intermediate mapping artifacts from legacy IDs to imported ObjectIds before writing embedded relationship arrays.

Alternatives considered:

- resolve all references in memory during a single import pass
- preserve legacy IDs directly as runtime foreign keys

Rationale:

- pivot-table relationships and cookbook ordering require deterministic ID resolution across collections
- stable mapping artifacts simplify orphan detection, reruns, and manual investigation
- preserving lineage metadata helps verification and rollback analysis without polluting runtime APIs

Validation approach:

- transformation tests assert that every referenced legacy ID either resolves to an imported target or appears in an explicit orphan report

### Decision 3: Use schema-aware transformation modules aligned to current Mongoose models

Chosen: transform each source table into import-ready shapes that correspond directly to `src/db/models/` collections and embedded structures.

Alternatives considered:

- raw JSON passthrough with validation deferred until import
- introducing temporary migration-only schemas that diverge from runtime models

Rationale:

- early shape validation catches incompatible timestamps, null handling, and text normalization before import
- using the current model boundaries avoids drift between migration code and runtime behavior

Validation approach:

- unit tests cover field mapping, timestamp normalization, ingredient/instruction formatting, pivot-to-array transformations, and ownership-lineage preservation
- transformed artifacts are validated against model expectations before import begins

### Decision 4: Make imports idempotent through upsert keys and resumable batch logging

Chosen: collection imports use deterministic matching keys, batch execution, and structured failure logs so reruns are safe.

Alternatives considered:

- destructive full reload for every run
- append-only imports with later deduplication

Rationale:

- Milestone 9 requires repeated staging runs and production rehearsal without manual cleanup
- idempotent writes reduce risk after partial failures and support verification reruns

Validation approach:

- integration tests rerun the same import twice and assert stable counts, relationships, order indexes, and default owner assignment
- logs record failed records, validation errors, and batch summaries for operator review

### Decision 5: Treat legacy image handling as an explicit no-op unless extraction proves otherwise

Chosen: verify during extraction and transformation whether legacy recipes have image assets to migrate, and record a no-image outcome when none exist instead of building an upload pipeline.

Alternatives considered:

- optimistic URL rewrite during recipe import
- implementing a full image upload pipeline despite having no source images

Rationale:

- the clarified requirement is that there are no existing images to migrate
- an explicit no-image check prevents unnecessary storage work while still catching unexpected image-bearing records

Validation approach:

- extraction and verification outputs must record whether recipe image fields are absent or empty and whether image migration is required

### Decision 6: Default imported ownership to a configured admin user and preserve legacy owner lineage

Chosen: do not migrate legacy users or passwords during the initial load; instead assign imported recipes and cookbooks to a configured admin user while preserving legacy ownership identifiers for later bulk reassignment.

Alternatives considered:

- migrate all legacy users and password hashes during the initial load
- import content with null ownership and reconcile ownership manually afterward

Rationale:

- the clarified requirement is that user migration and password reuse are not needed for the initial milestone
- assigning a default admin owner keeps imported content immediately operable in the application
- preserving lineage keeps later ownership reassignment feasible without coupling Milestone 9 to auth migration

Validation approach:

- transformation and import checks assert that imported recipes and cookbooks point to the configured admin owner
- verification outputs confirm that legacy owner identifiers are preserved in approved lineage artifacts for later backfill work

### Decision 7: Ship migration verification as executable checks, not only narrative sign-off

Chosen: create automated verification scripts and targeted tests for counts, references, default ownership assignment, representative queries, and sampled workflows.

Alternatives considered:

- spreadsheet-only sign-off
- manual spot checks without executable assertions

Rationale:

- Milestone 10 and later launch gates need repeatable evidence, not one-time observations
- executable verification reduces regression risk when the migration is rerun after fixes

Validation approach:

- scripts compare extracted counts to imported counts and relationship totals
- tests exercise representative recipe, cookbook, search, and filter flows against migrated data
- non-functional checks flag slow representative queries beyond agreed thresholds

### Decision 8: Define policy for invalid data and quarantined records

Chosen: malformed rows, unresolved references, and ownership-lineage gaps enter explicit exception reports rather than being silently dropped.

Alternatives considered:

- hard fail on any problematic record
- silently skip invalid records and continue

Rationale:

- launch decisions require visibility into what was preserved, quarantined, or remediated
- some issues may be acceptable if they are isolated and resolved through documented fallback procedures

Validation approach:

- verification outputs enumerate quarantined records by type and severity
- any recipe or cookbook lacking valid lineage for later ownership reassignment is surfaced for approval or remediation

### Decision 9: Block implementation completion on validation evidence, not only script presence

Chosen: the change is not complete until migration scripts, reports, and verification commands succeed in staging and unresolved blocking findings are triaged.

Alternatives considered:

- consider the change done when scripts compile
- defer verification rigor to later milestones

Rationale:

- this milestone is inherently operational and cannot be considered complete without evidence

Validation approach:

- tasks require test execution, report generation, and blocker resolution flow before merge

Operational blocking policy:

- if CI fails, fix the failure before adding scope
- if review finds migration correctness gaps, update proposal, design, specs, and tasks when the approved behavior changes
- if security review flags high or critical issues in new migration code or dependencies, stop release progression until findings are fixed or an explicit risk acceptance is recorded

## Risks / Trade-offs

- Large dump parsing cost → Use streaming or chunked parsing and checkpointed progress reporting.
- Legacy zero dates and nulls may not map cleanly → Normalize during transformation and emit explicit exception records for unresolved cases.
- Default admin ownership could be misconfigured → Require an explicit configured admin owner and fail import setup when it is missing or ambiguous.
- Partial imports could leave mixed state → Use resumable upserts, per-stage manifests, and pre-import backup requirements.
- Mistaken assumptions about legacy images could add unnecessary scope → Record extraction evidence that no image migration is required and fail verification if image-bearing records unexpectedly appear.
- Extra artifact generation increases implementation scope → Accept the overhead because auditability and reruns are core milestone requirements.

## Rollback / Mitigation

- preserve `dump-recipe_laravel-202603111712.sql` as the immutable raw source artifact
- back up the target MongoDB database before every full import attempt
- keep extraction outputs, transformation outputs, ID mapping manifests, import logs, and verification reports versioned or archived per run
- if a staging or rehearsal import fails critically, restore the MongoDB backup, fix the failing stage, and rerun from the last clean artifact boundary instead of editing records manually
- if approved scope changes after review, update `openspec/changes/laravel-data-migration/proposal.md`, `design.md`, `specs/legacy-data-migration/spec.md`, and `tasks.md` before implementation continues

## Open Questions

- Which existing admin account should be the configured default owner during initial import?
- Should quarantined non-critical records block launch, or can launch proceed with an approved issue log and remediation plan?
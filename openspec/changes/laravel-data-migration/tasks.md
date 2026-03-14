# 1. Execution

- [x] 1.1 Confirm ownership metadata in the change record: assign an
  implementer, assign at least one reviewer, and confirm human approval is
  required before applying `openspec/changes/laravel-data-migration/`
- [x] 1.2 Create a feature branch for the implementation work and verify the
  branch targets the approved `laravel-data-migration` change scope only
- [x] 1.3 Add migration workspace structure under project-root-relative paths
  for extraction outputs, transformed artifacts, manifests, and run reports
- [x] 1.4 Implement SQL dump analysis and extraction code that parses
  `dump-recipe_laravel-202603111712.sql` into machine-readable artifacts for
  required legacy tables and pivot data
- [x] 1.5 Implement extraction validation that checks row counts, required
  tables, and foreign-key reference totals before downstream stages can
  succeed
- [x] 1.6 Document the Laravel-to-MongoDB field mapping and lineage strategy,
  including legacy ID handling, legacy ownership preservation, timestamp
  normalization rules, and quarantine criteria
- [x] 1.7 Implement transformation modules that map extracted recipes,
  classifications, sources, meals, courses, preparations, cookbooks, and pivot
  data into MongoDB-ready document shapes while preserving ownership lineage
- [x] 1.8 Implement mapping-manifest generation for legacy IDs to imported
  ObjectIds so embedded relationships, cookbook order, and later ownership
  reassignment can be materialized deterministically
- [x] 1.9 Implement import code that upserts target collections in dependency
  order, assigns configured default admin ownership, and writes structured logs
  for successes, partial failures, and blocking failures
- [x] 1.10 Implement extraction-time checks that confirm whether legacy recipe
  image assets exist and emit a no-image migration report when none are
  present
- [x] 1.11 Implement post-migration verification scripts that compare extracted
  totals to imported totals, validate default admin ownership and
  representative application workflows, and emit pass or fail reports
- [x] 1.12 Review new migration code for duplication and unnecessary complexity before leaving execution complete

## 2. Validation

- [x] 2.1 Add unit tests for SQL parsing, timestamp normalization, field
  mapping, pivot-to-array transformation, and quarantine handling
- [x] 2.2 Add integration tests that run extraction, transformation, and
  import against representative fixtures and assert stable reruns without
  duplicate records
- [x] 2.3 Add verification coverage for default admin ownership, recipe
  queries, cookbook ordering, search or filter behavior, and the no-image
  migration outcome
- [x] 2.4 Run the focused test commands introduced for migration code and
  record the exact verification commands in the change notes or documentation
- [x] 2.5 Run `npm run test` and fix any failures attributable to the migration change
- [x] 2.6 Run `npm run build` and fix any type or build regressions introduced by the migration change
- [x] 2.7 Run security analysis for newly added first-party migration code and
  remediate any high or critical findings before requesting review
- [x] 2.8 Execute a staging migration rehearsal from raw dump through
  verification, archive the generated reports, and confirm all blocking checks
  pass

## 3. PR and Merge

- [ ] 3.1 Update documentation affected by the migration workflow, including
  operator instructions, mapping references, and any milestone-linked docs
  required for execution clarity
- [ ] 3.2 Open a pull request that references
  `openspec/changes/laravel-data-migration/` and summarizes extraction,
  transformation, import, verification, and the confirmed no-image migration
  behavior
- [ ] 3.3 Request review from the assigned reviewer and include the staging
  rehearsal evidence, verification reports, and any approved exception lists
- [ ] 3.4 Resolve all review comments and CI failures before merge; if
  feedback changes approved behavior, update `proposal.md`, `design.md`,
  `specs/legacy-data-migration/spec.md`, and `tasks.md` before continuing
- [ ] 3.5 Resolve security findings before merge or document explicit approved
  risk acceptance for any non-blocking residual issue
- [ ] 3.6 Enable auto-merge only after required reviews, CI checks, and
  migration verification evidence are complete

Ownership metadata:

- Implementer: GitHub Copilot
- Reviewer(s): repository maintainer or designated human reviewer
- Required approvals: explicit human approval before apply and at least one
  human review before merge

## 4. Post-Merge

- [ ] 4.1 Sync any approved spec deltas from
  `openspec/changes/laravel-data-migration/specs/legacy-data-migration/spec.md`
  back into `openspec/specs/` during the archive workflow
- [ ] 4.2 Archive the completed change with OpenSpec after implementation, validation, and merge are finished
- [ ] 4.3 Clean up the feature branch after merge according to repository workflow
- [ ] 4.4 Preserve final migration runbooks, reports, and exception logs in
  their approved long-term location for future rehearsal or production cutover
  work
- [ ] 4.5 Create follow-up issues for any approved non-blocking migration
  exceptions or deferred ownership-reassignment work identified during
  rehearsal

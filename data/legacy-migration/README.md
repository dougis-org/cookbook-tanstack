# Legacy Migration Workspace

This workspace holds generated artifacts used by the Milestone 9 Laravel-to-MongoDB migration flow.

- `extracted/`: raw machine-readable outputs parsed from `dump-recipe_laravel-202603111712.sql`
- `transformed/`: import-ready MongoDB document artifacts derived from extracted data
- `manifests/`: lineage, mapping, and exception manifests used between stages
- `reports/`: validation, import, and verification reports produced during migration runs

Only placeholder files are committed. Generated migration outputs stay untracked.

## Prerequisites

- `MONGODB_URI` must point to the MongoDB instance used for import rehearsal or
  verification.
- Set exactly one of `MIGRATION_DEFAULT_ADMIN_USER_ID`,
  `MIGRATION_DEFAULT_ADMIN_EMAIL`, or `MIGRATION_DEFAULT_ADMIN_USERNAME`
  before running import or post-import verification.
- The referenced admin user must already exist. The migration does not create users or passwords.

## Verification Commands

These are the migration-focused commands exercised during implementation.

```bash
npm run migration:extract
npm run migration:validate-extraction
npm run migration:transform
npx vitest run \
  scripts/migration/lib/__tests__/mysqlDump.test.ts \
  scripts/migration/lib/__tests__/transformHelpers.test.ts \
  scripts/migration/lib/__tests__/imageAudit.test.ts \
  scripts/migration/lib/__tests__/importHelpers.test.ts \
  scripts/migration/lib/__tests__/pipeline.integration.test.ts
npm run test
npm run build
```

Database-backed commands are implemented and emit structured blocking reports when prerequisites are missing.

```bash
npm run migration:import
npm run migration:verify-import
```

## Staging Rehearsal — 2026-03-13

A full staging rehearsal was completed using the production SQL dump. All blocking checks passed:

- **Extraction**: 599 recipes, 12 cookbooks, all 11 required tables extracted.
- **Validation**: all foreign-key reference counts within acceptable thresholds.
- **Transformation**: 599 recipe documents, 12 cookbook documents, 215 pivot
  associations processed without quarantine failures.
- **Import**: 7 collections upserted successfully; 0 blocking failures.
- **Verification** (`verification-report.json`): status `"pass"` — all
  collection counts match transformation totals.
- **Image audit**: `requiresImageMigration: false` — no legacy image assets
  require migration; outcome recorded as `"no-image-migration-required"`.

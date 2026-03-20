## Why

After migrating to Better-Auth for authentication management (via `mongodb-data-layer` spec), the old plurally-named collections (`users`, `sessions`, `accounts`) appear to have been superseded by BetterAuth's MongoDB adapter, which manages its own singular-named collections. However, these old collections have not yet been verified as truly unused and removed, creating unnecessary data complexity and potential confusion. Confirming and removing this data debt ensures database hygiene and aligns with the migrated state.

## What Changes

- **Investigate**: Audit the codebase to confirm that `users`, `sessions`, and `accounts` collections are no longer queried or referenced by the application
- **Verify**: Check that Better-Auth is solely managing authentication state through its own collections
- **Remove**: Drop the redundant collections from MongoDB migrations and remove any lingering seed/initialization code
- **Document**: Update database documentation to reflect the cleaned schema

## Capabilities

### New Capabilities
<!-- None - this is a cleanup/maintenance change, not introducing new functionality -->

### Modified Capabilities
- `mongodb-data-layer`: Update to reflect removal of redundant auth collections and confirm single source of truth for authentication state

## Impact

- **Code**: May need to remove database initialization or migration scripts that reference the old collections
- **Documentation**: `docs/database.md` needs updating to remove references to now-unused collections
- **Tests**: Any tests that seed or query the old collections must be updated or removed
- **Database**: Direct impact on MongoDB schema; existing databases will need cleanup

## Problem Space

The system completed migration from Laravel/Drizzle to MongoDB/Mongoose with Better-Auth integration. During this migration, BetterAuth established its own MongoDB collections for managing `user`, `session`, `account`, and `verification` data. The old plurally-named collections (`users`, `sessions`, `accounts`) from the Laravel era may still exist in developer databases or scripts but are no longer referenced by the application code.

## Scope

**In-Scope:**
- Thorough code audit of all imports, queries, and references to the three collections
- Verification that Better-Auth controls all authentication state
- Removal of collection initialization/seed code
- Update to database documentation

**Out-of-Scope:**
- Refactoring authentication logic (that stays in Better-Auth integration)
- Creating new capabilities or features
- Changes to the application's auth flow

## Risks

- **Breaking existing dev data**: Developers with existing local databases may lose reference if migrations are not documented
- **Incomplete audit**: Risk of missing non-obvious references (e.g., in tRPC routers, middleware, or experimental code branches)
- **Data loss if collections exist**: Actual production data loss if the collections hold valid user/session data (low risk given specs confirm BetterAuth manages auth, but must verify)

## Open Questions

1. Should we provide a migration script to safely drop these collections from existing MongoDB instances, or just document manual cleanup?
2. Are there any edge cases (e.g., old recovery scripts, admin tools, or debugging utilities) that might still reference the old collections?
3. Should we add a pre-flight check to warn developers if the old collections are detected in their database?

## Non-Goals

- Creating new authentication features or modifying the Better-Auth integration
- Performance optimization or scaling improvements
- Changes to the user-facing API or route structure

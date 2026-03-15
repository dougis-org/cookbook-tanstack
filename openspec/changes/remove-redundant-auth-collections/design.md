## Context

The CookBook application was migrated from Laravel/Drizzle to MongoDB/Mongoose with Better-Auth integration. The migration established BetterAuth's MongoDB adapter as the single source of truth for authentication data (user, session, account, verification). However, the old Laravel collections (`users`, `sessions`, `accounts`) were never removed from the schema, seed scripts, or database initialization code. These collections are believed to be unused, but this has not been formally verified. This design establishes how to audit, verify, and safely remove them.

## Goals / Non-Goals

**Goals:**
- Establish a comprehensive audit process to confirm the three collections are not referenced anywhere in the codebase
- Verify that Better-Auth is the single source of truth for all authentication state
- Remove seed/initialization code that attempts to create or populate the old collections
- Update database documentation to reflect the cleaned schema
- Provide safe removal guidance for existing development and production databases

**Non-Goals:**
- Modify or refactor Better-Auth integration
- Change authentication flows or security policies
- Create new features or capabilities
- Performance optimization of auth system

## Decisions

### Decision 1: Code Audit Strategy
**Chosen Approach:** Systematic grep-based audit of all source code, config, and migration files to identify references to the three collections.

**Rationale:** 
- Direct and verifiable: grep patterns are objective and can be repeated
- Catches obvious references in variable names, routes, queries, documentation
- Combined with MongoDb client tooling to verify no actual queries execute against these collections

**Alternatives Considered:**
- Runtime tracing: Would catch only queries that execute in tests/dev, missing unused code paths
- Static analysis via linting rules: Over-engineering for a one-time cleanup
- Manual code review: More time-intensive and error-prone

**Verification Approach:**
- Search for collection names in imports, Mongoose schema definitions, queries, route definitions, tests
- Check for references in `.env` files, migration scripts, seed files
- Verify no Mongoose models export `User`, `Session`, or `Account` (instead of BetterAuth's singular names)

### Decision 2: Removal Strategy
**Chosen Approach:** Linear removal in this sequence:
1. Remove any Mongoose model definitions or schema files for the three collections from `src/db/models/`
2. Remove seed/initialization scripts that create these collections
3. Remove any environment/config references
4. Update documentation

**Rationale:**
- Models must be removed before tests/routes to avoid import errors
- Seeds removed early prevent accidental recreation
- Documentation update is final confirmation of single source of truth

**Alternatives Considered:**
- Parallel removal: Riskier due to potential import reconciliation issues
- Keep collections in DB but mark as deprecated: Adds long-term technical debt

**Verification Approach:**
- After removal, run TypeScript compiler to verify no broken imports
- Run test suite to confirm no tests reference removed models
- Visually inspect `src/db/models/index.ts` barrel export

### Decision 3: Migration/Cleanup for Existing Databases
**Chosen Approach:** Document manual cleanup steps for developers and recommend a migration helper script (not auto-executed).

**Rationale:**
- Code change should be deployment-agnostic; database cleanup is orthogonal
- Manual step gives developers time to verify their local state
- Helper script is opt-in, reducing risk of accidental data loss

**Alternatives Considered:**
- Auto-drop via migration script at startup: Too risky, could drop user data in production
- Require database drop and reseed: Heavy-handed, breaks developer workflows

**Migration/Rollback Approach:**
- **Deploy**: Remove code references and documentation
- **Cleanup**: Developers run provided MongoDB script to drop collections (instructions in MIGRATION_NOTES.md)
- **Rollback**: If needed, restore database from backup; code changes are generally not reversible without re-introducing model definitions

### Decision 4: Documentation Updates
**Chosen Approach:** Update `docs/database.md` to remove any references to the three old collections.

**Rationale:**
- Single source of truth for schema documentation
- Reduces confusion for new contributors
- Aligns docs with code

**Verification Approach:**
- Confirm `users`, `sessions`, `accounts` no longer appear in collection tables or diagrams
- Verify Better-Auth collections are explained as managed by the adapter

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Incomplete audit**: Non-obvious references missed** | Re-run audit scripts after code review; require second pair of eyes on grep results |
| **Breaking existing dev databases** | Document cleanup process clearly; provide optional helper script instead of auto-removal |
| **Ambiguity about what Better-Auth manages** | Explicitly list Better-Auth collections in updated schema doc (`user`, `session`, `account`, `verification`) |
| **Historical confusion in git history** | Accept that old commits reference removed models; document decision in commit messages |

## Rollback / Mitigation

- **If old collections are referenced somewhere**: Halt removal, add to audit findings, resolve code, retry
- **If developer data is lost locally**: Developers can recreate by reseeding and re-populating from fresh database backup
- **If production issue occurs**: Restore from database backup; code removal is generally not reversible without manually re-adding models

## Open Questions

1. Should we provide a shell script `.db/cleanup-legacy-collections.sh` that developers can run optionally to drop the old collections from local MongoDB?
2. Are there archived branches or experimental features that might reference the old collections?
3. Should we add a comment in `.env.example` explaining what happened to the old auth collections?

## Mapping to Proposal

- **Proposal: "Investigate"** → Design Decision 1 (Code Audit Strategy)
- **Proposal: "Verify"** → Design Decision 1 (Verification Approach)
- **Proposal: "Remove"** → Design Decision 2 (Removal Strategy)
- **Proposal: "Document"** → Design Decision 4 (Documentation Updates)
- **Proposal: Impact on code/tests** → Design Decision 2 & 3 (Removal sequence and migration)

## Operational Blocking Policy

- If code audit reveals active references: **Block removal** until references are either migrated to Better-Auth collections or determined to be dead code
- If TypeScript compilation fails post-removal: **Block merge** until import errors resolved
- If tests fail: **Block merge** until tests updated or removed
- If CI security checks flag the change: **Address before merge** per Codacy/Snyk standards

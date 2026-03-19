## 1. Code Audit & Investigation

- [x] 1.1 Search codebase for legacy collection references (`users`, `sessions`, `accounts`)
  - Run: `grep -r "users\|sessions\|accounts" src/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules`
  - Document findings in audit log
  
- [x] 1.2 Verify no Mongoose models for User, Session, Account in `src/db/models/`
  - Check that `src/db/models/` does not contain `user.model.ts`, `session.model.ts`, or `account.model.ts`
  - Confirm barrel export `src/db/models/index.ts` doesn't reference these models
  
- [x] 1.3 Audit `src/db/seeds/` for legacy collection initialization
  - Grep seeds directory for any references to `users`, `sessions`, or `accounts` collections
  - Document which seed files (if any) attempt to populate legacy collections
  
- [x] 1.4 Check tRPC routers and middleware for direct auth collection queries
  - Search `src/server/trpc/` and `src/lib/middleware.ts` for direct queries to legacy collections
  - Verify all auth access goes through Better-Auth APIs
  
- [x] 1.5 Review environment variables and configuration files
  - Check `.env.example`, `src/lib/auth.ts`, and `src/db/index.ts` for legacy collection setup or references
  - Ensure no connection strings or collection names for `users`, `sessions`, `accounts`

## 2. Remove Model Definitions

- [x] 2.1 Delete model definition files (if present)
  - Remove `src/db/models/user.model.ts` if it exists
  - Remove `src/db/models/session.model.ts` if it exists  
  - Remove `src/db/models/account.model.ts` if it exists
  - Note: `src/db/models/verification.model.ts` may remain if used by Better-Auth hooks

- [x] 2.2 Update barrel export in `src/db/models/index.ts`
  - Remove any imports/exports of User, Session, Account models
  - Ensure only active models remain: Recipe, Cookbook, Classification, Source, Meal, Course, Preparation, RecipeLike, (Verification if retained)
  - Verify TypeScript compilation: `npx tsc --noEmit`

## 3. Remove Seed & Initialization Code

- [x] 3.1 Remove/update seed scripts in `src/db/seeds/`
  - Delete any seed files dedicated to users, sessions, or accounts collections
  - Update remaining seeds to NOT reference legacy collections
  - Verify `npm run db:seed` runs without error on clean database

- [x] 3.2 Clean up `src/db/index.ts` (MongoDB connection)
  - Remove any initialization code that creates or warms up the legacy collections
  - Ensure connection singleton only establishes Mongoose schemas for active models

- [x] 3.3 Update Docker and initialization scripts
  - Check `docker-compose.yml` and `Dockerfile` for any legacy collection setup
  - Remove MongoDB initialization scripts that reference the old collections
  - Check `scripts/` directory for any data migration or init code targeting legacy collections

## 4. Update Documentation

- [x] 4.1 Update `docs/database.md`
  - Remove `users`, `sessions`, `accounts` from collection tables/summaries
  - Confirm 8 active collections are listed (recipes, classifications, sources, cookbooks, meals, courses, preparations, recipelikes)
  - Add explicit note that Better-Auth manages `user`, `session`, `account`, `verification` collections exclusively
  - Update any diagrams or schemas that reference legacy collections

- [x] 4.2 Create migration/cleanup notes
  - Create `docs/MIGRATION_NOTES.md` section documenting the removal
  - Include optional MongoDB cleanup commands for developers:
    ```js
    // Drop legacy collections manually if they exist:
    use cookbook
    db.users.drop()
    db.sessions.drop()
    db.accounts.drop()
    ```
  - Document why these collections are no longer needed

## 5. Test & Verification

- [x] 5.1 Run TypeScript compilation
  - Execute: `npx tsc --noEmit`
  - Verify no type errors from removed models

- [x] 5.2 Run unit tests
  - Execute: `npm run test`
  - Verify all tests pass; remove/update any tests that reference legacy collections
  - If tests fail, update test files to use Better-Auth APIs instead

- [x] 5.3 Run E2E tests
  - Execute: `npm run test:e2e`
  - Verify authentication flows and user operations work correctly

- [x] 5.4 Verify database schema
  - Start dev server: `npm run dev`
  - Connect to MongoDB and confirm legacy collections do not exist or are empty: `db.users.countDocuments()` should return 0 or error
  - Verify Better-Auth collections exist: `db.user.countDocuments()` should work

## 6. Code Review & Quality Checks

- [x] 6.1 Verify no broken imports
  - Check build output for any undefined modules or missing exports
  - Search for any top-level imports of removed models

- [x] 6.2 Final audit for hidden references
  - Run grep search one more time to confirm zero references to legacy collections in production code
  - Check comments and documentation strings for stale references

- [x] 6.3 Run code quality checks
  - If Codacy available: `codacy_cli_analyze`
  - If Snyk available: Check for dependency or security issues
  - Address any flagged issues before merge

## 7. Pull Request & Merge

- [x] 7.1 Create feature branch and commit changes
  - Branch: `git checkout -b chore/remove-redundant-auth-collections`
  - Commit with clear message explaining removed models and why (reference issue #156)

- [x] 7.2 Create pull request
  - Title: "Chore: Remove redundant auth collections (users, sessions, accounts) - Issue #156"
  - Include link to issue  #156
  - Reference design decisions and audit results in PR body
  - Enable auto-merge once all checks pass

- [ ] 7.3 Resolve PR review comments
  - Address any feedback from code review
  - Ensure CI/CD checks pass (tests, TypeScript, linting, security scans)
  - Re-run tests if changes made

- [ ] 7.4 Monitor auto-merge
  - Verify PR merges automatically once all status checks pass and comments resolved
  - Check that branch is deleted after merge

## 8. Post-Merge

- [ ] 8.1 Archive the change
  - Run: `openspec archive change "remove-redundant-auth-collections"`
  - This syncs the delta spec back to `openspec/specs/mongodb-data-layer/spec.md`

- [ ] 8.2 Communicate cleanup to team
  - Post in team chat/issue that legacy collections have been removed
  - Include optional cleanup script for developers

- [ ] 8.3 Verify deployed state
  - If applicable, verify on staging/production that no attempts to access legacy collections occur
  - Monitor logs for any lingering references or errors

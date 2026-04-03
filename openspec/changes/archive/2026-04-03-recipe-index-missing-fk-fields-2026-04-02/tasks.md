## Ownership

| Role | Owner |
|---|---|
| Implementer | @dougis |
| Reviewer | Any maintainer |
| Approval required | 1 approving review + all CI checks green before merge |

## Blocking Criteria

| Blocker | Resolution |
|---|---|
| CI test failure | Diagnose root cause, fix in working branch, push, re-run CI — do not merge until green |
| Unresolved review comment | Address comment or reach explicit agreement to defer, push fix, re-request review — do not merge while blocking comments remain |
| Security finding (Codacy/Snyk) | Assess severity; critical/high must be resolved before merge; medium/low may be deferred with documented rationale |
| TypeScript error | Fix before pushing — `npx tsc --noEmit` must exit 0 |

## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b feat/recipe-index-missing-fk-fields`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/recipe-index-missing-fk-fields`

## 2. Execution

- [x] 2.1 Add six index declarations to `src/db/models/recipe.ts` after the existing `recipeSchema.index({ deleted: 1 })` line:
  ```ts
  recipeSchema.index({ classificationId: 1 });
  recipeSchema.index({ sourceId: 1 });
  recipeSchema.index({ mealIds: 1 });
  recipeSchema.index({ courseIds: 1 });
  recipeSchema.index({ preparationIds: 1 });
  recipeSchema.index({ isPublic: 1 });
  ```

## 3. Validation

- [x] 3.1 Run unit tests: `npm run test` — all tests must pass
- [x] 3.2 Run E2E tests: `npm run test:e2e` — all tests must pass
- [x] 3.3 Verify the Recipe model still loads without errors: `npm run db:connect`
- [x] 3.4 Confirm no TypeScript errors: `npx tsc --noEmit`

## 4. PR and Merge

- [x] 4.1 Commit changes: `git add src/db/models/recipe.ts && git commit -m "feat: add missing indexes on Recipe FK filter fields (closes #193)"`
- [x] 4.2 Push to remote: `git push`
- [x] 4.3 Open PR from `feat/recipe-index-missing-fk-fields` → `main` with auto-merge enabled
- [x] 4.4 Monitor CI checks — diagnose and fix any failures, push fixes, repeat until all checks pass
- [x] 4.5 Address any review comments, commit and push fixes, repeat until no unresolved comments remain
- [x] 4.6 Enable auto-merge once all CI checks are green and no blocking comments remain

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 5.2 Verify merged changes appear on `main`
- [x] 5.3 Sync approved spec deltas to `openspec/specs/mongodb-data-layer/spec.md`
- [x] 5.4 Archive the change (single atomic commit — copy to archive + delete original): `openspec archive recipe-index-missing-fk-fields-2026-04-02`
- [x] 5.5 Push archive commit to `main`
- [x] 5.6 Confirm no documentation updates required (this change adds no user-facing behavior)
- [x] 5.7 Prune merged local branch: `git branch -d feat/recipe-index-missing-fk-fields`

## 1. Execution

- [x] 1.1 Check out `main` and pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b feat/e2e-coverage-reporting`

## 2. Dependencies and Config

- [x] 2.1 Install the package: `npm install -D @bgotink/playwright-coverage`
- [x] 2.2 Add `e2e-coverage/` to `.gitignore`
- [x] 2.3 Update `playwright.config.ts`: import `defineCoverageReporterConfig` from `@bgotink/playwright-coverage` and add it to the `reporter` array with output dir `e2e-coverage` and `lcov` format

## 3. Spec File Import Updates

- [x] 3.1 Replace `import { test, expect } from "@playwright/test"` with `import { test, expect } from "@bgotink/playwright-coverage"` in `src/e2e/recipes-serving-adjuster.spec.ts`
- [x] 3.2 Same replacement in `src/e2e/recipes-export.spec.ts`
- [x] 3.3 Same replacement in `src/e2e/recipes-filters-ui.spec.ts`
- [x] 3.4 Same replacement in `src/e2e/recipes-favorites.spec.ts`
- [x] 3.5 Same replacement in `src/e2e/cookbooks-print.spec.ts`
- [x] 3.6 Same replacement in `src/e2e/dark-theme.spec.ts`
- [x] 3.7 Same replacement in `src/e2e/registration.spec.ts`
- [x] 3.8 Same replacement in `src/e2e/cookbooks-auth.spec.ts`
- [x] 3.9 Same replacement in `src/e2e/recipes-list.spec.ts`
- [x] 3.10 Same replacement in `src/e2e/recipes-import.spec.ts`
- [x] 3.11 Same replacement in `src/e2e/recipes-auth.spec.ts`
- [x] 3.12 Same replacement in `src/e2e/recipes-crud.spec.ts`

## 4. CI Workflow

- [x] 4.1 Update the `Upload coverage to Codacy` step in `.github/workflows/build-and-test.yml` to add E2E LCOV upload: after the existing Vitest partial uploads and before `--final`, add a guarded block that uploads `e2e-coverage/lcov.info` as `--partial` for both JavaScript and TypeScript

## 5. Validation

- [x] 5.1 Run `npm run build` — verify build succeeds with no errors
- [x] 5.2 Run `npm run test` — verify Vitest suite still passes
- [x] 5.3 Run `npm run test:e2e` locally (requires dev server) — verify `e2e-coverage/lcov.info` is produced after the run
- [x] 5.4 Confirm `e2e-coverage/` does not appear in `git status`
- [x] 5.5 Verify `e2e-coverage/lcov.info` contains `SF:` entries pointing to source files

## 6. PR and Merge

- [x] 6.1 Commit all changes with a descriptive message referencing issue #212
- [x] 6.2 Push branch and open PR against `main`
- [x] 6.3 Enable auto-merge on the PR
- [ ] 6.4 Verify CI uploads both `coverage/lcov.info` and `e2e-coverage/lcov.info` in the Codacy upload step logs
- [ ] 6.5 Resolve any CI failures or review comments before merge

## 7. Post-Merge

- [ ] 7.1 Confirm Codacy dashboard reflects increased coverage after merge
- [ ] 7.2 Run `/opsx:archive` to archive this change
- [ ] 7.3 Sync approved spec deltas to `openspec/specs/` (update `github-actions-maintenance/spec.md`; create `e2e-coverage/spec.md`)
- [ ] 7.4 Delete local feature branch: `git branch -d feat/e2e-coverage-reporting`

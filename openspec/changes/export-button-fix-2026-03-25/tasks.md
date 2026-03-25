# Tasks

## Execution

- [x] Task 1: Check out main and create feature branch
  - `git checkout main && git pull --ff-only`
  - `git checkout -b fix/export-button-cache-miss`

- [x] Task 2: Update `ExportButton` props and remove cache logic
  - Change `ExportButtonProps` from `{ recipeId: string }` to `{ recipe: Recipe }`
  - Remove `useQueryClient` hook, `trpc` import, and the cache-lookup lines in `onExport`
  - Update `onExport` to use the `recipe` prop directly
  - File: `src/components/recipes/ExportButton.tsx`

- [x] Task 3: Update the call site
  - Pass `recipe={recipe}` (instead of `recipeId={recipeId}`) to `<ExportButton />`
  - File: `src/routes/recipes/$recipeId.tsx`

- [x] Task 4: Update unit tests
  - Remove the `useQueryClient` / `trpc` mocks (no longer needed)
  - Update test to render `<ExportButton recipe={mockRecipe} />` with a full `Recipe` fixture
  - Remove the "does nothing when recipe not in cache" test (scenario no longer possible)
  - File: `src/components/recipes/__tests__/ExportButton.test.tsx`

- [x] Task 5: Review for duplication and unnecessary complexity
- [x] Task 6: Confirm acceptance criteria are covered

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks per project standards

Verification requirements (all must pass before PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

## PR and Merge

- [ ] Open PR from `fix/export-button-cache-miss` → `main`
- [ ] Reference issue #180 in PR description
- [ ] Wait for agent reviews and CI checks
- [ ] Resolve all review comments
- [ ] Resolve all blocking checks (tests, duplication, quality, security)
- [ ] Enable auto-merge when all required checks are green

Ownership metadata:

- Implementer: —
- Reviewer(s): —
- Required approvals: per project standards

Blocking resolution flow:

- CI failure → fix → re-run checks
- Security finding → remediate → re-scan
- Review blocker → address comments or escalate after defined timeout

## Post-Merge

- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change under `openspec/changes/archive/`
- [ ] Confirm default branch contains final merged artifacts
- [ ] Prune merged local feature branches and stale remote-tracking refs

Suggested cleanup after archive: `git fetch --prune` and `git branch -d fix/export-button-cache-miss`

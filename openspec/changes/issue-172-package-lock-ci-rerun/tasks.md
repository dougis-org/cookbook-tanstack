## 1. Change Setup

- [ ] 1.1 Create new change directory and files: `openspec/changes/issue-172-package-lock-ci-rerun/`
- [ ] 1.2 Ensure this change is based on the `main` branch and up to date.
- [ ] 1.3 Create a new feature branch: `git checkout -b issue-172-package-lock-ci-rerun`

## 2. Workflow Update

- [ ] 2.1 Modify `.github/workflows/build-and-test.yml`:
  - Remove `[skip ci]` from the lockfile auto-commit message
  - Keep the rest of the commit-and-push block unchanged for behavior parity
- [ ] 2.2 Add an inline comment explaining the purpose and safe semantics.

## 3. Validation

- [ ] 3.1 Run `npx js-yaml .github/workflows/build-and-test.yml` to validate YAML syntax.
- [ ] 3.2 Run `npm run test -- --coverage` locally (or in CI) to confirm no functional breakage.

## 4. Behavior Verification

- [ ] 4.1 Create a PR that triggers lockfile correction in `build-and-test` and verify that the update commit runs CI.
- [ ] 4.2 Confirm on the second run that no further lockfile commit occurs if lockfile already up-to-date.

## 5. Finish and Archive

- [ ] 5.1 Commit changes and push branch.
- [ ] 5.2 Open PR with reference `fixes #172`.
- [ ] 5.3 After merge, run `openspec archive change issue-172-package-lock-ci-rerun`.

## 6. Post-Merge Cleanup

- [ ] 6.1 Delete feature branch.
- [ ] 6.2 Confirm issue #172 is closed automatically or manually.

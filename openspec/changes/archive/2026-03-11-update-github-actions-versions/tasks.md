## 1. Branch Setup

- [x] 1.1 Create feature branch: `git checkout -b feat/update-github-actions-versions`

## 2. Audit Workflow Files

- [x] 2.1 Review `.github/workflows/build-and-test.yml` and list all action pins
- [x] 2.2 Review `.github/workflows/resolve-outdated-comments.yml` and confirm `actions/checkout@v6` is the current stable release (verify against https://github.com/actions/checkout/releases)

## 3. Update Action Versions

- [x] 3.1 In `.github/workflows/build-and-test.yml`, update `actions/checkout@v4` → `actions/checkout@v6`
- [x] 3.2 In `.github/workflows/build-and-test.yml`, update `actions/setup-node@v4` → `actions/setup-node@v6`
- [x] 3.3 In `.github/workflows/build-and-test.yml`, update first `actions/upload-artifact@v4` → `actions/upload-artifact@v6` (Upload test results step)
- [x] 3.4 In `.github/workflows/build-and-test.yml`, update second `actions/upload-artifact@v4` → `actions/upload-artifact@v6` (Upload test traces step)
- [x] 3.5 In `.github/workflows/resolve-outdated-comments.yml`, confirm `actions/checkout@v6` is already correct (no change expected)

## 4. Validation

- [x] 4.1 Run `grep -r "uses: actions/" .github/workflows/` and confirm no `@v4` or earlier pins remain
  > **Note:** `deploy.yml` also contained `actions/checkout@v4` (not in original scope) — updated to `@v6` during this audit.
- [x] 4.2 Validate workflow YAML syntax: `npx js-yaml .github/workflows/build-and-test.yml && npx js-yaml .github/workflows/resolve-outdated-comments.yml`

## 5. PR and Merge

- [x] 5.1 Commit changes: `git add .github/workflows/ && git commit -m "chore: update GitHub Actions to Node 22+ compatible versions"`
- [x] 5.2 Push branch and open pull request targeting `main`
- [x] 5.3 Enable auto-merge on the PR
- [x] 5.4 Confirm CI (`build-and-test` workflow) passes on the PR
- [x] 5.5 Address any CI failures (if failures occur, revert and investigate per blocking policy in design.md before re-attempting)
- [x] 5.6 Confirm PR merges automatically once checks pass

## 6. Post-Merge

- [x] 6.1 Delete feature branch after merge
- [x] 6.2 Sync approved spec delta back to `openspec/specs/github-actions-maintenance/spec.md`
- [x] 6.3 Archive this change: run `openspec archive change update-github-actions-versions`

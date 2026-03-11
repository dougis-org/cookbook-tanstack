## ADDED Requirements

### Requirement: All GitHub Actions pins use Node-22+ compatible versions
All action version pins in `.github/workflows/` SHALL reference releases that run on Node.js 22 or later. No workflow file SHALL reference a `@v4` (or earlier) pin for `actions/checkout`, `actions/setup-node`, or `actions/upload-artifact`.

#### Scenario: build-and-test uses checkout v6
- **WHEN** the `build-and-test.yml` workflow is inspected
- **THEN** `actions/checkout` SHALL be pinned to `@v6` or later

#### Scenario: build-and-test uses setup-node v6
- **WHEN** the `build-and-test.yml` workflow is inspected
- **THEN** `actions/setup-node` SHALL be pinned to `@v6` or later

#### Scenario: build-and-test uses upload-artifact v6 (test results)
- **WHEN** the `build-and-test.yml` workflow is inspected
- **THEN** the `Upload test results` step SHALL use `actions/upload-artifact@v6` or later

#### Scenario: build-and-test uses upload-artifact v6 (traces)
- **WHEN** the `build-and-test.yml` workflow is inspected
- **THEN** the `Upload test traces` step SHALL use `actions/upload-artifact@v6` or later

### Requirement: CI passes after action version updates
After updating action pins, the CI pipeline SHALL continue to pass all existing jobs without regressions.

#### Scenario: CI green after update
- **WHEN** a commit updating the action pins is pushed to a branch
- **THEN** the `build-and-test` workflow SHALL complete successfully with all jobs green

### Requirement: resolve-outdated-comments workflow uses a current checkout action
The `resolve-outdated-comments.yml` workflow SHALL use a current, stable, non-deprecated version of `actions/checkout`.

#### Scenario: resolve-outdated-comments checkout is current
- **WHEN** the `resolve-outdated-comments.yml` workflow is inspected
- **THEN** `actions/checkout` SHALL be pinned to `@v6` or later

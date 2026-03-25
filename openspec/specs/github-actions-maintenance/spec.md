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

### Requirement: CI uploads E2E coverage to Codacy as partial reports

The `build-and-test` workflow SHALL upload `e2e-coverage/lcov.info` to Codacy as additional `--partial` reports (for both JavaScript and TypeScript) after E2E tests complete, before the existing `--final` call.

#### Scenario: E2E LCOV uploaded when present

- **WHEN** E2E tests produce `e2e-coverage/lcov.info`
- **THEN** the Codacy upload step SHALL call `report --partial -l Javascript -r e2e-coverage/lcov.info` and `report --partial -l TypeScript -r e2e-coverage/lcov.info` before invoking `--final`

#### Scenario: E2E LCOV upload is skipped gracefully when absent or empty

- **WHEN** `e2e-coverage/lcov.info` does not exist or is empty (e.g. coverage generation failed or production build lacks source maps)
- **THEN** the Codacy upload step SHALL skip the E2E partial uploads without failing the workflow step

#### Scenario: Codacy final only called when partials were uploaded

- **WHEN** at least one coverage partial was successfully uploaded
- **THEN** `codacy-coverage-reporter.sh final` SHALL be called exactly once at the end of the upload step
- **WHEN** no coverage partials were uploaded
- **THEN** the upload step SHALL skip `--final` and log a message

### Requirement: resolve-outdated-comments workflow uses a current checkout action
The `resolve-outdated-comments.yml` workflow SHALL use a current, stable, non-deprecated version of `actions/checkout`.

#### Scenario: resolve-outdated-comments checkout is current
- **WHEN** the `resolve-outdated-comments.yml` workflow is inspected
- **THEN** `actions/checkout` SHALL be pinned to `@v6` or later

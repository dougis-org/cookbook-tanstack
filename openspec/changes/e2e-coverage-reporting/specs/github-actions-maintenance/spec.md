## ADDED Requirements

### Requirement: CI uploads E2E coverage to Codacy as partial reports

The `build-and-test` workflow SHALL upload `e2e-coverage/lcov.info` to Codacy as additional `--partial` reports (for both JavaScript and TypeScript) after E2E tests complete, before the existing `--final` call.

#### Scenario: E2E LCOV uploaded when present

- **WHEN** E2E tests produce `e2e-coverage/lcov.info`
- **THEN** the Codacy upload step SHALL call `report --partial -l Javascript -r e2e-coverage/lcov.info` and `report --partial -l TypeScript -r e2e-coverage/lcov.info` before invoking `--final`

#### Scenario: E2E LCOV upload is skipped gracefully when absent

- **WHEN** `e2e-coverage/lcov.info` does not exist (e.g. coverage generation failed)
- **THEN** the Codacy upload step SHALL skip the E2E partial uploads without failing the workflow step

#### Scenario: Codacy final called after all partials

- **WHEN** both Vitest and E2E coverage uploads are complete
- **THEN** `codacy-coverage-reporter.sh final` SHALL be called exactly once at the end of the upload step

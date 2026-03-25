## ADDED Requirements

### Requirement: E2E tests collect V8 browser coverage

The system SHALL collect V8 JavaScript coverage from Chromium during all Playwright E2E test runs using `@bgotink/playwright-coverage`.

#### Scenario: Coverage collected during local E2E run

- **WHEN** a developer runs `npm run test:e2e` locally
- **THEN** `e2e-coverage/lcov.info` is written to the project root after the run completes

#### Scenario: Coverage collected in CI E2E run

- **WHEN** the E2E step runs in the build-and-test workflow against the production Nitro build
- **THEN** `e2e-coverage/lcov.info` is produced without error

### Requirement: E2E coverage output is in LCOV format

The system SHALL produce E2E coverage output as an LCOV file at `e2e-coverage/lcov.info`.

#### Scenario: LCOV file format

- **WHEN** E2E tests complete
- **THEN** `e2e-coverage/lcov.info` exists and conforms to LCOV format (begins with `SF:` source file entries)

### Requirement: E2E coverage directory is gitignored

The system SHALL exclude `e2e-coverage/` from version control.

#### Scenario: Generated coverage not committed

- **WHEN** a developer runs E2E tests and checks `git status`
- **THEN** `e2e-coverage/` does not appear as an untracked or modified path

### Requirement: Spec file imports use coverage-wrapped test API

All Playwright spec files SHALL import `test` and `expect` from `@bgotink/playwright-coverage` instead of `@playwright/test`.

#### Scenario: Spec files use coverage package

- **WHEN** any file in `src/e2e/*.spec.ts` is inspected
- **THEN** the `test` and `expect` imports come from `@bgotink/playwright-coverage`, not `@playwright/test`

#### Scenario: Helper files are unaffected

- **WHEN** files in `src/e2e/helpers/` are inspected
- **THEN** `import type` statements from `@playwright/test` remain unchanged

## Requirements

### Requirement: Playwright E2E tests collect V8 browser coverage

All Playwright spec files in `src/e2e/` SHALL import `test` and `expect` from `@bgotink/playwright-coverage` instead of `@playwright/test`, enabling V8 coverage collection per test via Chromium's coverage API.

#### Scenario: Spec files use coverage-enabled test fixture

- **WHEN** any `*.spec.ts` file in `src/e2e/` is inspected
- **THEN** it SHALL import `test` (and `expect`) from `@bgotink/playwright-coverage`
- **AND** SHALL NOT import `test` from `@playwright/test` (type-only imports in helpers are exempt)

### Requirement: Coverage reporter outputs LCOV to `e2e-coverage/`

The `playwright.config.ts` SHALL include the `@bgotink/playwright-coverage` reporter configured to write LCOV output to `e2e-coverage/lcov.info`.

#### Scenario: Coverage directory is produced after E2E run

- **WHEN** `npm run test:e2e` completes successfully against a dev server
- **THEN** `e2e-coverage/lcov.info` SHALL exist and contain `SF:` entries referencing source files

#### Scenario: Coverage directory is gitignored

- **WHEN** `e2e-coverage/` is present on disk
- **THEN** it SHALL not appear in `git status` (gitignored)

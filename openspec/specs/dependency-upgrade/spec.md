## ADDED Requirements

### Requirement: TanStack packages upgraded to target versions
After the upgrade, all TanStack Router/Start ecosystem packages and React Query SHALL be installed at or above the target versions specified in issue #249, with `package.json` specifiers updated to reflect the new baseline.

#### Scenario: Installed versions meet targets
- **WHEN** `npm ls` is run after the upgrade
- **THEN** `@tanstack/react-router` resolves to ≥ 1.168.10
- **THEN** `@tanstack/react-start` resolves to ≥ 1.167.16
- **THEN** `@tanstack/router-plugin` resolves to ≥ 1.167.12
- **THEN** `@tanstack/react-router-devtools` resolves to ≥ 1.166.11
- **THEN** `@tanstack/react-router-ssr-query` resolves to ≥ 1.166.10
- **THEN** `@tanstack/react-query` resolves to ≥ 5.96.2

### Requirement: Build passes with no type errors
After the upgrade, `npm run build` SHALL complete successfully with zero TypeScript errors.

#### Scenario: Clean production build
- **WHEN** `npm run build` is executed after the package upgrade
- **THEN** the build exits with code 0
- **THEN** no TypeScript type errors are reported

### Requirement: Unit and integration tests pass
After the upgrade, the full Vitest test suite SHALL pass without new failures.

#### Scenario: Vitest test run passes
- **WHEN** `npm run test` is executed after the package upgrade
- **THEN** all tests pass with no new failures compared to pre-upgrade baseline

### Requirement: E2E tests pass
After the upgrade, the full Playwright E2E suite SHALL pass, including the unsaved-changes guard flow.

#### Scenario: E2E suite passes
- **WHEN** `npm run test:e2e` is executed after the package upgrade
- **THEN** all E2E tests pass with no new failures

#### Scenario: Unsaved changes guard still fires
- **WHEN** a user edits a recipe form without saving and attempts to navigate away
- **THEN** the navigation blocker dialog appears, confirming `useBlocker` is still functional

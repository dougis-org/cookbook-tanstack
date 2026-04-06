## ADDED Requirements

### Requirement: tRPC packages upgraded to target versions
After the upgrade, all three tRPC packages SHALL be installed at 11.16.0, with `package.json` specifiers updated to `^11.16.0`.

#### Scenario: Installed versions meet targets
- **WHEN** `npm ls` is run after the upgrade
- **THEN** `@trpc/client` resolves to ≥ 11.16.0
- **THEN** `@trpc/server` resolves to ≥ 11.16.0
- **THEN** `@trpc/tanstack-react-query` resolves to ≥ 11.16.0

### Requirement: Build passes after tRPC upgrade
After the tRPC upgrade, `npm run build` SHALL complete successfully with zero TypeScript errors.

#### Scenario: Clean production build
- **WHEN** `npm run build` is executed after the tRPC package upgrade
- **THEN** the build exits with code 0
- **THEN** no TypeScript type errors are reported

### Requirement: Unit and integration tests pass after tRPC upgrade
After the tRPC upgrade, the full Vitest test suite SHALL pass without new failures.

#### Scenario: Vitest test run passes
- **WHEN** `npm run test` is executed after the tRPC package upgrade
- **THEN** all tests pass with no new failures compared to pre-upgrade baseline

### Requirement: E2E tests pass after tRPC upgrade
After the tRPC upgrade, the full Playwright E2E suite SHALL pass.

#### Scenario: E2E suite passes
- **WHEN** `npm run test:e2e` is executed after the tRPC package upgrade
- **THEN** all E2E tests pass with no new failures

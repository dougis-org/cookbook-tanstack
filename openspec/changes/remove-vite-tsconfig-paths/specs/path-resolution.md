## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Native tsconfig path resolution

The system SHALL resolve `@/*` path aliases using Vite 8's native `resolve.tsconfigPaths` option without the `vite-tsconfig-paths` plugin.

#### Scenario: Dev server resolves @/ imports

- **Given** `vite.config.ts` has `resolve: { tsconfigPaths: true }` and no `vite-tsconfig-paths` plugin
- **When** the dev server starts and a route component using `@/` imports is loaded
- **Then** all imports resolve without errors and the page renders correctly

#### Scenario: Vitest resolves @/ imports in unit tests

- **Given** `vitest.config.ts` has `resolve: { tsconfigPaths: true }` and no `vite-tsconfig-paths` plugin
- **When** `npm run test` runs the full unit test suite
- **Then** all tests pass and no module-not-found errors occur for `@/` imports

#### Scenario: Playwright E2E resolves @/ imports through SSR

- **Given** the app is started via `npm run dev -- --mode test` (Playwright's webServer command)
- **When** Playwright runs E2E tests against `http://localhost:3000`
- **Then** all routes load correctly, confirming SSR resolves `@/` imports

## MODIFIED Requirements

### Requirement: MODIFIED Plugin order test accuracy

The system SHALL have a passing `vite.config.test.ts` that accurately reflects the actual plugin chain without referencing the removed plugin.

#### Scenario: Plugin order test passes after removal

- **Given** `vite-tsconfig-paths` has been removed from all configs
- **When** `npx vitest run vite.config.test.ts` runs
- **Then** the test passes with zero assertions referencing `vite-tsconfig-paths`

#### Scenario: Remaining plugin order is still enforced

- **Given** `vite.config.test.ts` retains assertions for `devtools → nitro → tailwindcss → tanstackStart → react`
- **When** the ordering test runs
- **Then** all remaining ordering assertions pass

## REMOVED Requirements

### Requirement: REMOVED vite-tsconfig-paths plugin dependency

The `vite-tsconfig-paths` npm package SHALL NOT be present in `package.json` dependencies or `node_modules`.

Reason for removal: Superseded by Vite 8 native `resolve.tsconfigPaths`. Plugin emits a deprecation warning and adds an unnecessary external dependency.

### Requirement: REMOVED Deprecation warning

The Vite startup output SHALL NOT contain the `vite-tsconfig-paths` deprecation warning.

Reason for removal: Warning is produced by the plugin that is being removed. Once the plugin is gone, the warning cannot appear.

#### Scenario: No deprecation warning on dev server start

- **Given** `vite-tsconfig-paths` plugin has been removed
- **When** `npm run dev` starts the dev server
- **Then** stdout/stderr contains no line matching `"vite-tsconfig-paths" is detected`

## Traceability

- Proposal: Remove plugin from `vite.config.ts` → Requirement: Native tsconfig path resolution
- Proposal: Remove plugin from `vitest.config.ts` → Requirement: Native tsconfig path resolution (Vitest)
- Proposal: Update `vite.config.test.ts` → Requirement: Plugin order test accuracy
- Proposal: Remove package → Requirement: vite-tsconfig-paths plugin dependency REMOVED
- Design Decision 1 → Requirement: Native tsconfig path resolution
- Design Decision 2 → Requirement: Plugin order test accuracy
- Design Decision 3 → Requirement: vite-tsconfig-paths plugin dependency REMOVED
- Requirement: Native tsconfig path resolution → Tasks: update vite.config.ts, update vitest.config.ts
- Requirement: Plugin order test accuracy → Task: update vite.config.test.ts
- Requirement: vite-tsconfig-paths REMOVED → Task: npm uninstall vite-tsconfig-paths

## Non-Functional Acceptance Criteria

### Requirement: Operability — clean warning output

#### Scenario: No noise in CI logs

- **Given** the change is applied
- **When** CI runs build, test, and E2E steps
- **Then** no `vite-tsconfig-paths` deprecation warning appears in any log output

### Requirement: Reliability — no regression in resolution

#### Scenario: Full test suite passes after change

- **Given** all five file changes have been applied
- **When** `npm run test` and `npm run test:e2e` complete
- **Then** all tests pass with the same results as before the change

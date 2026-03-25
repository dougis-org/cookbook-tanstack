## Why

E2E tests cover significant user-facing behaviour that unit tests cannot reach, yet that coverage is currently invisible to Codacy. Instrumenting Playwright runs with V8 coverage closes the gap so metrics reflect the full test suite.

## What Changes

- Add `@bgotink/playwright-coverage` as a dev dependency
- Update `playwright.config.ts` to add the coverage reporter (LCOV output to `e2e-coverage/`)
- Replace `@playwright/test` imports in all 11 spec files with `@bgotink/playwright-coverage` (type-only helper imports are unchanged)
- Extend the Codacy upload step in `.github/workflows/build-and-test.yml` to upload `e2e-coverage/lcov.info` as additional `--partial` reports (JS + TypeScript) before the existing `--final` call

## Capabilities

### New Capabilities

- `e2e-coverage`: Collection and CI reporting of Playwright E2E test coverage via LCOV to Codacy

### Modified Capabilities

- `github-actions-maintenance`: The build-and-test workflow gains an additional coverage upload step for E2E LCOV

## Impact

- **Dependencies:** `@bgotink/playwright-coverage` added to `devDependencies`
- **Config:** `playwright.config.ts` — adds `defineCoverageReporterConfig` reporter block
- **Test files:** `src/e2e/*.spec.ts` (×11) — single import line change per file
- **CI:** `.github/workflows/build-and-test.yml` — Codacy upload step extended
- **Coverage output:** new `e2e-coverage/` directory produced during E2E runs (gitignored)
- **No build changes:** V8 mode collects coverage directly from Chromium; the existing production Nitro build used in CI is unchanged

## Scope

**In scope:**
- V8-mode browser coverage from Playwright tests
- LCOV output uploaded to Codacy alongside existing Vitest coverage
- CI integration via the existing partial/final pattern

**Out of scope:**
- Istanbul/source-map instrumented builds
- Server-side SSR coverage from E2E sessions
- Coverage thresholds or gates in CI

## Risks

- `@bgotink/playwright-coverage` adds overhead to each E2E test (coverage collection per test). Impact should be minor for a suite of this size.
- V8 coverage maps to the compiled bundle; source-map accuracy depends on the build's sourcemap output. Verify LCOV file paths are meaningful in Codacy after first upload.

## Open Questions

None — approach is well-defined by issue #212.

## Non-Goals

- Changing the Vitest coverage setup
- Adding coverage enforcement (fail CI below threshold)
- Collecting SSR/Node.js coverage during E2E runs

## Context

Currently, only Vitest unit/integration coverage (`coverage/lcov.info`) is uploaded to Codacy. Playwright E2E tests run in CI but produce no coverage data. The E2E suite runs against a production Nitro build (`node .output/server/index.mjs`) for stability.

The Codacy upload step already uses the `--partial` + `--final` pattern, making it straightforward to add a second partial upload for E2E LCOV.

## Goals / Non-Goals

**Goals:**
- Collect V8 browser coverage from all Playwright spec runs
- Output coverage in LCOV format to `e2e-coverage/`
- Upload `e2e-coverage/lcov.info` to Codacy as additional partial reports (JS + TypeScript) before the existing `--final` call
- Zero changes to the production build pipeline

**Non-Goals:**
- Istanbul-instrumented builds or source-map rewriting
- Server-side (SSR/Node.js) coverage during E2E
- Coverage thresholds or CI failure gates based on E2E coverage

## Decisions

### D1: V8 coverage mode (not Istanbul)

**Decision:** Use `@bgotink/playwright-coverage` in V8 mode.

**Rationale:** V8 coverage is collected directly from Chromium with no build changes. Istanbul mode requires a specially instrumented bundle (e.g. via `vite-plugin-istanbul`), which conflicts with CI running a plain production build. V8 mode works against any JS served by the app.

**Alternative considered:** Building a separate "coverage build" with `vite-plugin-istanbul` — rejected due to build time cost and added CI complexity.

### D2: Spec file import replacement

**Decision:** Replace `import { test, expect } from "@playwright/test"` with `import { test, expect } from "@bgotink/playwright-coverage"` in all 12 spec files. Leave helper files (`src/e2e/helpers/`) unchanged since they only use `import type` from `@playwright/test`.

**Rationale:** `@bgotink/playwright-coverage` wraps and re-exports the full Playwright API, so the replacement is a drop-in swap. Type-only imports are not affected by coverage instrumentation.

### D3: LCOV output directory

**Decision:** Output to `e2e-coverage/lcov.info` (separate from `coverage/` used by Vitest).

**Rationale:** Keeps Vitest and Playwright coverage artifacts isolated, avoiding accidental merging or overwriting. The directory should be gitignored.

### D4: CI upload order

**Decision:** Upload Vitest LCOV (existing), then E2E LCOV (new), then call `--final`.

**Rationale:** Codacy stitches all partial reports together on `--final`. Order does not affect correctness, but uploading E2E after Vitest is a natural sequence matching test execution order.

**Mapping from proposal to decisions:**
| Proposal element | Design decision |
|---|---|
| Add `@bgotink/playwright-coverage` | D1 — V8 mode, no build changes |
| Update 12 spec file imports | D2 — drop-in import replacement |
| LCOV output location | D3 — `e2e-coverage/lcov.info` |
| Extend Codacy CI step | D4 — additional partials before `--final` |

## Risks / Trade-offs

- **V8 coverage vs. source accuracy** → V8 maps to compiled output; source maps in the production build determine how accurately Codacy displays file paths. If Codacy shows minified paths, enabling sourcemaps in the Nitro/Vite build would fix it — that's a follow-up concern, not a blocker.
- **Test execution overhead** → V8 coverage collection adds minor per-test overhead. Not expected to be significant for this suite size; monitor if CI times increase materially.
- **`e2e-coverage/` not gitignored** → Must add to `.gitignore` to avoid accidental commits of generated files.

## Rollback / Mitigation

All changes are additive and isolated:
- Reverting the import change in spec files restores normal Playwright behaviour
- Removing the reporter from `playwright.config.ts` disables E2E coverage without affecting the Vitest upload
- The Codacy upload step is guarded by `if [ -f e2e-coverage/lcov.info ] && [ -s e2e-coverage/lcov.info ]` so it is a no-op if coverage generation is disabled, fails, or produces an empty file (e.g. production build without source maps)

## Open Questions

None — approach is fully defined.

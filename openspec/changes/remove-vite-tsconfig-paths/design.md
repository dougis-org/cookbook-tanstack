## Context

- Relevant architecture: Vite 8 build pipeline with TanStack Start + Nitro for SSR. Two Vite configs: `vite.config.ts` (app) and `vitest.config.ts` (unit tests). Plugin order is tested in `vite.config.test.ts` and documented in `CLAUDE.md`.
- Dependencies: `vite-tsconfig-paths` npm package (to be removed); Vite 8 built-in `resolve.tsconfigPaths` option.
- Interfaces/contracts touched: `vite.config.ts`, `vitest.config.ts`, `vite.config.test.ts`, `package.json`, `CLAUDE.md`.

## Goals / Non-Goals

### Goals

- Silence the Vite 8 deprecation warning by switching to native `resolve.tsconfigPaths: true`
- Keep `@/*` alias resolution working identically in all contexts: dev server, build, SSR, Vitest, Playwright
- Remove the `vite-tsconfig-paths` package entirely
- Keep the plugin-order test accurate and meaningful

### Non-Goals

- Changing tsconfig paths or aliases
- Modifying any other Vite, Nitro, or TanStack plugin configuration

## Decisions

### Decision 1: Use `resolve.tsconfigPaths: true` in both vite.config.ts and vitest.config.ts

- Chosen: Add `resolve: { tsconfigPaths: true }` at the top level of each config object; remove `tsconfigPaths()` from the plugins array in both files.
- Alternatives considered: Keep the plugin but suppress the warning (e.g., via Vite config shim) — adds complexity with no benefit.
- Rationale: Vite 8 natively supports this. The project has a single flat tsconfig with one alias; no edge cases that would require the plugin's extra capabilities.
- Trade-offs: None meaningful at this project's complexity level.

### Decision 2: Delete the vitest-config ordering `it` block in vite.config.test.ts

- Chosen: Remove the entire second `it` block ("keeps vitest config aligned..."). After the change, `vitest.config.ts` contains only `viteReact()` — there is nothing to order. Keep the first `it` block but remove `vite-tsconfig-paths` existence/ordering assertions from it.
- Alternatives considered: Rewrite the second `it` to assert react plugin exists — trivial test with no guard value.
- Rationale: Tests should guard against real regressions. A one-plugin config has no ordering to protect.
- Trade-offs: Slight reduction in test surface, but the removed assertions were guarding a plugin that no longer exists.

### Decision 3: Remove vite-tsconfig-paths from package.json and update lockfile

- Chosen: `npm uninstall vite-tsconfig-paths` to remove from dependencies and update `package-lock.json`.
- Alternatives considered: Leave in package.json as unused dep — adds noise, could confuse future contributors.
- Rationale: Clean removal prevents stale dependency confusion.
- Trade-offs: None.

### Decision 4: Update CLAUDE.md plugin order documentation

- Chosen: Update the documented plugin order from `devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react` to `devtools → nitro → tailwindcss → tanstackStart → react`.
- Rationale: CLAUDE.md is the authoritative human-readable doc for plugin ordering. It must stay in sync with the actual config.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Remove `tsconfigPaths()` from `vite.config.ts`
  - Design decision: Decision 1
  - Validation approach: `vite.config.test.ts` ordering test passes; dev server starts without warning
- Proposal element: Remove `tsconfigPaths()` from `vitest.config.ts`
  - Design decision: Decision 1
  - Validation approach: `npm run test` passes; all `@/*` imports resolve in unit tests
- Proposal element: Update `vite.config.test.ts`
  - Design decision: Decision 2
  - Validation approach: Test file passes with no references to removed plugin
- Proposal element: Remove `vite-tsconfig-paths` from `package.json`
  - Design decision: Decision 3
  - Validation approach: `npm install` succeeds; `node_modules/vite-tsconfig-paths` absent
- Proposal element: Update `CLAUDE.md`
  - Design decision: Decision 4
  - Validation approach: Manual review; documented order matches `vite.config.ts`

## Functional Requirements Mapping

- Requirement: `@/*` imports resolve correctly in dev server
  - Design element: `resolve.tsconfigPaths: true` in `vite.config.ts`
  - Acceptance criteria reference: specs/path-resolution.md — dev server resolution
  - Testability notes: Playwright E2E tests exercise routes that use `@/` imports

- Requirement: `@/*` imports resolve correctly in Vitest unit tests
  - Design element: `resolve.tsconfigPaths: true` in `vitest.config.ts`
  - Acceptance criteria reference: specs/path-resolution.md — vitest resolution
  - Testability notes: `npm run test` — any import failure surfaces as module-not-found error

- Requirement: No deprecation warning emitted
  - Design element: Plugin removed entirely
  - Acceptance criteria reference: specs/path-resolution.md — no warning
  - Testability notes: Run `npm run dev` and `npm run test`; grep output for "vite-tsconfig-paths" warning string

- Requirement: Plugin order test remains accurate
  - Design element: Decision 2 — trim `vite.config.test.ts`
  - Acceptance criteria reference: specs/path-resolution.md — test accuracy
  - Testability notes: `vite.config.test.ts` passes with zero references to removed plugin

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Fewer dependencies to maintain
  - Design element: Decision 3 — uninstall package
  - Acceptance criteria reference: `package.json` no longer contains `vite-tsconfig-paths`
  - Testability notes: `grep "vite-tsconfig-paths" package.json` returns no match

## Risks / Trade-offs

- Risk/trade-off: Native `resolve.tsconfigPaths` handles tsconfig `extends` differently than the plugin
  - Impact: Low — project has no `extends` chain; single flat tsconfig
  - Mitigation: Full test suite (unit + E2E) runs as part of implementation verification

- Risk/trade-off: Nitro SSR pass doesn't inherit `resolve` config
  - Impact: Medium if true — server-side `@/` imports would fail
  - Mitigation: Playwright E2E tests run against the full SSR stack and will catch this immediately

## Rollback / Mitigation

- Rollback trigger: Any `@/*` import fails to resolve in unit tests, build, or E2E; or Nitro SSR crashes on startup.
- Rollback steps: Revert `vite.config.ts` and `vitest.config.ts` to re-add `tsconfigPaths()` plugin; re-add `vite-tsconfig-paths` to `package.json`; restore `vite.config.test.ts` assertions; restore `CLAUDE.md` plugin order line.
- Data migration considerations: None.
- Verification after rollback: `npm run test` passes; `npm run dev` starts without errors; `npm run test:e2e` passes.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Diagnose failure — most likely cause is `@/*` resolution in a context not covered by local testing. Fix before proceeding.
- If security checks fail: Do not merge. Removing a dependency can surface hidden transitive dependency issues; investigate before overriding.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. After 48 hours with no response, escalate or self-merge if change is trivially safe (this change qualifies as low-risk).
- Escalation path and timeout: Author judgment after 48 hours given low risk level of this change.

## Open Questions

No open questions. Design is fully determined by the proposal and codebase review.

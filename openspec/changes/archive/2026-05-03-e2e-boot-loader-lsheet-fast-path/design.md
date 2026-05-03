## Context

- Relevant architecture: Boot-loader script is inline-minified inside `src/routes/__root.tsx` (the `bootLoaderScript` template literal). The `l.sheet` guard handles the race where cached CSS populates `link.sheet` synchronously before `init()` runs. Existing E2E tests live in `src/e2e/fouc-prevention.spec.ts` and use `@bgotink/playwright-coverage`'s `test` fixture.
- Dependencies: Playwright, `@bgotink/playwright-coverage` 0.3.2 (wraps `page` with `resetOnNavigation: false`, no `addInitScript` usage — compatible). Nitro production server serves `/assets/**` with `Cache-Control: public, max-age=31536000, immutable`.
- Interfaces/contracts touched: `src/e2e/fouc-prevention.spec.ts` only — no production code changes.

## Goals / Non-Goals

### Goals

- Add one test that exercises the `l.sheet` fast-path in the boot-loader
- The test must fail if `l.sheet` check is removed from the boot-loader script
- The test must be reliable in CI (GitHub Actions, Chromium, Nitro production build)

### Non-Goals

- No changes to the boot-loader script
- No new test files
- No coverage of unrelated boot-loader paths (slow-timer, failure, retry)

## Decisions

### Decision 1: Double-navigation strategy for cache priming

- Chosen: Navigate to `'/'` twice in the same test. First navigation fetches CSS from network and populates the browser context's HTTP cache. Second navigation serves CSS from in-process memory cache, causing `link.sheet` to be non-null before `init()` runs.
- Alternatives considered:
  - `page.route` + `route.fulfill()` with immediate CSS response: rejected — React 19 `data-precedence="default"` makes stylesheets render-blocking; Playwright's DevTools protocol round-trip introduces enough latency that Chrome suspends HTML parsing, making the DOM inaccessible.
  - `document.querySelector` mock via `addInitScript` to fake `link.sheet`: rejected — patches a global that affects all querySelector calls, brittle against boot-loader internals changing.
- Rationale: Double-navigation uses real browser caching behaviour (the scenario the `l.sheet` guard was written for). Nitro's `immutable` headers guarantee the cache is warm. The Playwright browser context HTTP cache persists across `page.goto()` calls within the same test.
- Trade-offs: Relies on real browser cache behaviour; if a future Playwright or Chrome version changes cache semantics between navigations, the test's precondition (`sheetWasNonNull`) catches it explicitly.

### Decision 2: `addInitScript` spy for fast-path verification

- Chosen: After the first `page.goto()`, register an `addInitScript` that patches `EventTarget.prototype.addEventListener` in the browser context to set `window.__cssLoadListenerAttached = true` if a `'load'` listener is attached to any `<link>` element. On the second navigation, assert this flag is `false` (fast-path taken) and that `link.sheet` is non-null.
- Alternatives considered:
  - Assert only that `#app-shell` is visible on second load: insufficient — if caching didn't work and the slow path ran normally, the test would still pass.
  - Timing-based assertions (fast-path should resolve in <100ms): flaky, environment-dependent.
- Rationale: The spy directly observes which code branch was taken. If `l.sheet` check is removed, the spy captures the `addEventListener` call immediately and `fastPathTaken` flips to `false` — test fails without waiting for any timeout.
- Trade-offs: Patches a global browser API. Scoped to the browser context (not Node.js) and only active for one navigation, so blast radius is minimal.

### Decision 3: Placement in existing `fouc-prevention.spec.ts`

- Chosen: Add the test to the `FOUC prevention` describe block in `src/e2e/fouc-prevention.spec.ts`.
- Rationale: Cohesion — all boot-loader startup behaviour tests live in one file. No new test infrastructure needed.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: `l.sheet` branch has no E2E coverage
  - Design decision: Decision 1 (double-navigation) + Decision 2 (spy)
  - Validation approach: `fastPathTaken` assertion in the new test

- Proposal element: Test must fail if `l.sheet` check removed
  - Design decision: Decision 2 — `addEventListener` spy detects the else branch immediately
  - Validation approach: Manual verification by temporarily removing `l.sheet` guard and confirming test failure

- Proposal element: CSS interception not viable with React 19
  - Design decision: Decision 1 — avoids all CSS interception
  - Validation approach: No `page.route` for CSS in the new test

- Proposal element: CI reliability
  - Design decision: Nitro `immutable` headers + `sheetWasNonNull` assertion + Playwright `retries: 2`
  - Validation approach: CI run on PR

## Functional Requirements Mapping

- Requirement: Test exercises `l.sheet` fast-path, not the `addEventListener` slow path
  - Design element: `addInitScript` spy on `EventTarget.prototype.addEventListener`
  - Acceptance criteria reference: specs/fouc-prevention/cached-lsheet.md — `fastPathTaken` is `true`
  - Testability notes: Boolean flag read via `page.evaluate`; deterministic

- Requirement: `#app-shell` is visible after cached load
  - Design element: `expect(page.locator('#app-shell')).toBeVisible()` on second navigation
  - Acceptance criteria reference: specs/fouc-prevention/cached-lsheet.md
  - Testability notes: Standard Playwright locator assertion

- Requirement: `link.sheet` is non-null after second navigation
  - Design element: `page.evaluate` to read `link.sheet` from the DOM
  - Acceptance criteria reference: specs/fouc-prevention/cached-lsheet.md — `sheetWasNonNull` is `true`
  - Testability notes: Fails with explicit error if cache priming didn't work

- Requirement: Test fails if `l.sheet` check is removed from boot-loader
  - Design element: `fastPathTaken` assertion (`!__cssLoadListenerAttached`)
  - Acceptance criteria reference: specs/fouc-prevention/cached-lsheet.md
  - Testability notes: Removal of guard causes else branch to run, spy fires, assertion fails immediately

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Test must not be flaky in CI across reruns
  - Design element: `sheetWasNonNull` precondition assertion distinguishes cache miss from test logic failure; `retries: 2` provides resilience
  - Acceptance criteria reference: specs/fouc-prevention/cached-lsheet.md
  - Testability notes: If `sheetWasNonNull` fails, it signals an environment issue, not a code regression

- Requirement category: performance
  - Requirement: Test does not add significant runtime to the suite
  - Design element: Two sequential `page.goto('/')` calls with no artificial delays
  - Acceptance criteria reference: N/A (non-blocking concern)
  - Testability notes: Expected to complete in <5s on warm CI runner

## Risks / Trade-offs

- Risk/trade-off: `EventTarget.prototype.addEventListener` patch may interact unexpectedly with React hydration or Playwright coverage instrumentation
  - Impact: False positive (test passes when it shouldn't) or spurious failure
  - Mitigation: Patch is browser-side only, registered after first navigation, narrowly checks `type === 'load'` and `tagName === 'LINK'`. `@bgotink/playwright-coverage` uses DevTools Protocol (not addEventListener) — no conflict.

- Risk/trade-off: Cache priming may not work on dev server (Vite serves with no-cache headers)
  - Impact: Test always takes slow path locally, `fastPathTaken` assertion fails for developers running locally
  - Mitigation: Local dev server returns different cache headers than production. If this is a problem, the test can be skipped locally using `test.skip(!process.env.CI, ...)`, or the issue can be documented. Investigate during implementation.

## Rollback / Mitigation

- Rollback trigger: New test consistently fails in CI in a way that can't be diagnosed as a real regression
- Rollback steps: Revert the addition of the new test case from `src/e2e/fouc-prevention.spec.ts`. No other files change.
- Data migration considerations: None.
- Verification after rollback: CI passes without the new test.

## Operational Blocking Policy

- If CI checks fail: Investigate test output. If `sheetWasNonNull` fails, the cache priming precondition didn't hold — check Nitro headers. If `fastPathTaken` fails, either the `l.sheet` guard was removed or the spy isn't working.
- If security checks fail: No security surface changed; escalate to workflow maintainer.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to maintainer after 48h.
- Escalation path and timeout: Maintainer (dougis) has final say; no external escalation needed.

## Open Questions

No unresolved questions. All design decisions are fully resolved.

## GitHub Issues

- #435

## Why

- Problem statement: The boot-loader script in `src/routes/__root.tsx` includes an `l.sheet` guard to handle cached-stylesheet loads — when the browser already has the app CSS in memory cache, the `load` event fires before `init()` attaches a listener, causing the boot-loader to spin forever without the guard. This guard has no E2E test coverage; a regression (e.g. the check being removed or the condition inverted) would pass the entire test suite undetected.
- Why now: The gap was surfaced in PR #433 review. It's a small, well-defined addition that closes a real coverage hole before it becomes a shipped regression.
- Business/user impact: Without this test, a developer could accidentally remove the `l.sheet` check and ship a build where the app never loads on any browser that has the CSS cached (i.e. all return visits). The impact is total app failure on second load.

## Problem Space

- Current behavior: `fouc-prevention.spec.ts` covers fresh-load (CSS fetched from network, `load` event fires normally) and failure (CSS never loads). The `l.sheet` branch — where `link.sheet` is non-null by the time `init()` runs — is never exercised.
- Desired behavior: A test exercises the `l.sheet` fast-path, asserts `#app-shell` becomes visible, confirms no `load` event listener was attached to the stylesheet link (proving the fast-path was taken), and verifies `link.sheet` is non-null. The test must fail if the `l.sheet` check is removed from the boot-loader.
- Constraints:
  - Playwright CSS interception (via `page.route`) is not viable here: React 19 marks stylesheets with `data-precedence="default"`, making them render-blocking. Chrome suspends HTML parsing while waiting for an intercepted CSS response, so the DOM is inaccessible during that window.
  - The test must work in CI (GitHub Actions, Ubuntu, Chromium via Playwright).
- Assumptions:
  - Nitro production server serves `/assets/**` with `Cache-Control: public, max-age=31536000, immutable`. Confirmed in `.output/server/index.mjs`.
  - Within a single Playwright test (same browser context), a second `page.goto()` to the same origin will serve previously-fetched content-hashed CSS from the browser's in-process HTTP cache, causing `link.sheet` to be non-null before `init()` runs.
  - `page.addInitScript()` called after the first `page.goto()` registers for subsequent navigations only — the spy therefore does not interfere with the first (cache-priming) navigation.
  - `@bgotink/playwright-coverage` wraps `page` using `resetOnNavigation: false` and does not use `addInitScript`; it is fully compatible with this approach.
- Edge cases considered:
  - CSS URL changes between navigations: not possible within a single test run (same build, content-hashed filename is fixed).
  - `link.sheet` might be null on second nav if caching fails: the `sheetWasNonNull` assertion catches this and fails the test with a clear signal rather than a confusing timeout.
  - CI runner cold-start / slow disk cache: the `fastPathTaken` assertion fails immediately (not after 10s) if the slow path is taken, giving a clear failure mode.

## Scope

### In Scope

- One new E2E test added to `src/e2e/fouc-prevention.spec.ts` in the existing `FOUC prevention` describe block
- The test uses a double-navigation strategy with an `addInitScript` spy

### Out of Scope

- Changes to the boot-loader script itself
- Changes to any other test files
- Unit tests for the boot-loader (the logic is inline-minified, not unit-testable in isolation)
- Coverage for `markFailed`, slow-timer, or retry paths (already covered or separately tracked)

## What Changes

- `src/e2e/fouc-prevention.spec.ts`: add one test — `'cached stylesheet uses l.sheet fast-path on second load'`

## Risks

- Risk: Browser HTTP cache behaviour differs between local dev (`npm run dev`) and CI (Nitro production build).
  - Impact: Test passes locally but flakes or fails in CI, or vice versa.
  - Mitigation: The `sheetWasNonNull` assertion distinguishes "fast-path taken" from "fast-path triggered but sheet still null". CI uses the production build with confirmed `immutable` cache headers. Playwright config has `retries: 2` in CI.

- Risk: `EventTarget.prototype.addEventListener` patch interferes with Playwright internals or React.
  - Impact: False positive or test crash.
  - Mitigation: The patch is applied inside an `addInitScript` which only runs in the browser context (not Node.js), and only for the second navigation. The patch is narrowly scoped: it only sets a flag when `type === 'load'` and the target is a `<link>` element.

## Open Questions

No unresolved ambiguity. The approach was fully investigated before this proposal: CI caching confirmed, `@bgotink/playwright-coverage` compatibility confirmed, `addEventListener` spy approach validated.

## Non-Goals

- Achieving 100% boot-loader branch coverage (slow-timer and failure paths are out of scope here)
- Replacing or refactoring the existing `delayAppStylesheet` helper
- Testing the `l.sheet` path for the print stylesheet

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

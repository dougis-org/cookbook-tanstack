## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-16-fix-e2e-hydration-wait/design.md) document, not a replacement.

### Requirement: ADDED Deterministic navigation-readiness signal

The system SHALL expose a boolean DOM marker (`data-hydrated` on `<html>`) that is present if and only if the current route's React tree has committed and TanStack Router's status is `idle` (no pending navigation, lazy route-chunk load, or loader in flight). `waitForHydration(page)` SHALL wait on this marker instead of a `networkidle` heuristic and a fixed sleep.

#### Scenario: Fresh navigation to a route with lazy-loaded code

- **Given** a Playwright test calls `gotoAndWaitForHydration(page, '/cookbooks/:id/toc')`, a route that loads its module via code-splitting
- **When** the navigation begins
- **Then** `data-hydrated` is absent on `<html>` until the route's lazy chunk resolves and the router status reaches `idle`, and `waitForHydration` does not resolve until that point — even if `#app-shell` became visible earlier via the boot-loader's stylesheet gate

#### Scenario: Client-side navigation after initial hydration

- **Given** a page has already completed initial hydration (`data-hydrated="true"`) and a test triggers an in-app navigation (e.g. clicking a `Link`) to a different route
- **When** the navigation begins
- **Then** `data-hydrated` is removed while the router status is `pending`, and is re-set only once the new route's status reaches `idle`, so a `waitForHydration` call issued after the navigation trigger correctly waits for the new route rather than reading the stale marker from the previous route

#### Scenario: `networkidle` and fixed sleep are no longer part of the wait path

- **Given** a route that keeps a non-blocking background request open (e.g. an analytics beacon) past the point the router reaches `idle`
- **When** `waitForHydration(page)` is called
- **Then** it resolves once `data-hydrated="true"` is present, without waiting on or being affected by outstanding network activity, and without any unconditional sleep

### Requirement: ADDED Post-interaction settle assertions use native retrying expectations, not the hydration marker

The system SHALL verify same-page state changes that occur after initial hydration (e.g. a theme selection commit) using Playwright's auto-retrying assertions (`toHaveClass`, `toHaveCSS`, etc.) scoped to the specific state being changed, rather than a fixed sleep or the navigation-readiness marker.

#### Scenario: Theme dropdown commit followed by a computed-style read

- **Given** a test on `/` has already completed initial hydration and selects "Light (cool)" via the theme dropdown with `commit: true`
- **When** the test needs to read `getComputedStyle` on the header background to assert a color change
- **Then** the test first awaits `expect(page.locator('html')).toHaveClass(/light-cool/)`, which retries until the class mutation lands, before reading computed style — no `waitForTimeout` call is used

### Requirement: ADDED Fix `networkidle` instance in `cookbooks-collaboration.spec.ts`

The system SHALL NOT use `page.waitForLoadState("networkidle")` in
`src/e2e/cookbooks-collaboration.spec.ts`. Its `inviteCollaborator()` helper
SHALL use the hydration/readiness helpers in `src/e2e/helpers/app.ts` (or a
retrying Playwright expectation scoped to the specific state change being
awaited) instead.

#### Scenario: Collaborator invite flow no longer waits on networkidle

- **Given** `cookbooks-collaboration.spec.ts`'s `inviteCollaborator()` helper
- **When** this change is applied
- **Then** no call site in that file uses `waitForLoadState("networkidle")`
- **And** the existing collaboration test scenarios (TC-COL-1, TC-COL-2, and any
  others in the file) continue to pass with no behavior change

### Requirement: ADDED Cross-context readiness wait for concurrent multi-user tests

The system SHALL provide a reusable Playwright helper in
`src/e2e/helpers/app.ts` that waits for a second, concurrently open browser
context's page to reflect a state change caused by an action taken in a first
context (e.g. a badge appearing after a grant, or an entry becoming unavailable
after a revoke), using a retrying Playwright expectation rather than
`networkidle` or a fixed sleep.

#### Scenario: Recipient context observes an owner's action

- **Given** two `Page` objects in two separate `BrowserContext`s, authenticated
  as the owner and the recipient respectively, both already past initial
  hydration
- **When** the owner's page performs an action that changes server state visible
  to the recipient (e.g. granting or revoking a library share)
- **Then** the new helper, applied to the recipient's page, resolves once the
  expected state is observable there, using a retrying Playwright expectation
  rather than `networkidle` or `waitForTimeout`
- **And** the helper first attempts a synthetic focus/visibilitychange dispatch
  so the client's own refetch-on-window-focus behavior can satisfy the
  assertion without any navigation; only if that doesn't produce the expected
  state within a short grace period does it fall back to re-requesting the
  current route, since headless multi-context browser pages don't reliably
  deliver a real OS-level focus signal

## Traceability

- Proposal element: "Replace networkidle/fixed-sleep guess chain with a real signal" -> Requirement: ADDED Deterministic navigation-readiness signal
- Proposal element: "Fix parallel anti-pattern instance at theme.spec.ts:417" -> Requirement: ADDED Post-interaction settle assertions use native retrying expectations, not the hydration marker
- Design decision: Decision 1 (marker) + Decision 2 (`waitForHydration` rewrite) -> Requirement: ADDED Deterministic navigation-readiness signal
- Design decision: Decision 3 (`theme.spec.ts` fix) -> Requirement: ADDED Post-interaction settle assertions use native retrying expectations, not the hydration marker
- Requirement: ADDED Deterministic navigation-readiness signal -> Task(s): implement `RootDocument` effect; rewrite `waitForHydration`; add regression test against #589 repro route; full e2e suite validation run
- Requirement: ADDED Post-interaction settle assertions use native retrying expectations, not the hydration marker -> Task(s): fix `theme.spec.ts:417`
- Proposal element (`share-my-library-account-section`): Fixing the existing
  `networkidle` gap in `cookbooks-collaboration.spec.ts` -> Requirement: ADDED
  Fix `networkidle` instance in `cookbooks-collaboration.spec.ts`
- Proposal element (`share-my-library-account-section`): Two-browser-context
  E2E round trip -> Requirement: ADDED Cross-context readiness wait for
  concurrent multi-user tests
- Requirement: ADDED Fix `networkidle` instance in
  `cookbooks-collaboration.spec.ts` -> Task(s): replace the two
  `waitForLoadState("networkidle")` call sites in `inviteCollaborator()`;
  re-run the file's existing suite
- Requirement: ADDED Cross-context readiness wait for concurrent multi-user
  tests -> Task(s): add `waitForContextToReflect` to `src/e2e/helpers/app.ts`;
  `library-sharing-account.spec.ts` consumes it for both the grant/revoke
  round trip and the tier-downgrade scenario

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No new flakes introduced by removing `networkidle`

- **Given** the full e2e suite passes on `main` before this change (excluding any pre-existing known flakes)
- **When** the full e2e suite is run after this change lands
- **Then** no new, reproducible failures are attributable to the marker settling before route content is ready or to the removal of the `networkidle` check; any such failure blocks merge per the Operational Blocking Policy in `design.md`

### Requirement: Performance

#### Scenario: Wait path is no slower than the previous guess chain

- **Given** the previous `waitForHydration` implementation included a `networkidle` attempt with up to a 5s timeout plus an unconditional 100ms sleep on every call
- **When** the new marker-based `waitForHydration` is used across the suite
- **Then** aggregate e2e suite wall-clock time does not regress, since the new wait resolves as soon as the router is actually idle with no fixed floor and no worst-case multi-second stall

#### Scenario: No new flakes introduced by the cross-context helper

- **Given** the full e2e suite passes on `main` before the
  `share-my-library-account-section` change (excluding any pre-existing known
  flakes)
- **When** the full e2e suite is run after that change lands, including the
  two-context `library-sharing-account.spec.ts`
- **Then** no new, reproducible failures are attributable to the cross-context
  helper's timing or to the removal of `networkidle` from
  `cookbooks-collaboration.spec.ts`

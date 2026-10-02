## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED E2E waits use state-based signals, never `networkidle` or fixed sleeps

The E2E suite under `src/e2e/**` SHALL wait on an explicit, state-based
readiness signal — the hydration marker (`waitForHydration` /
`gotoAndWaitForHydration` / `waitForRouterIdle`) for post-navigation
readiness, or a specific locator/text assertion for a post-mutation,
same-page state change — instead of `page.waitForLoadState("networkidle")`
or `page.waitForTimeout(...)`.

#### Scenario: Post-navigation wait after a client-side route change

- **Given** a test has just triggered a navigation (via `page.waitForURL(...)`
  resolving, a helper that internally navigates, or an explicit `page.goto`)
  and no subsequent step in that test yet confirms the destination page has
  hydrated
- **When** the test needs to interact with or assert against the
  destination page
- **Then** the test calls `waitForHydration(page)` (or
  `gotoAndWaitForHydration` for a fresh `goto`) immediately after the
  navigation resolves, and contains no `page.waitForLoadState("networkidle")`
  call for that purpose

#### Scenario: Redundant wait removed when an adjacent step already guarantees readiness

- **Given** a `networkidle` or `waitForTimeout` call is immediately preceded
  or followed by another wait or assertion that already guarantees the same
  precondition (e.g. an explicit `waitForHydration(page)` call on the next
  line, a locator's `.waitFor({ state: "visible" | "hidden" })`, or an
  `expect(...)` assertion that already retries)
- **When** the migration is applied to that file
- **Then** the redundant `networkidle`/`waitForTimeout` call is deleted
  entirely, and the test's pass/fail behavior for every existing assertion
  is unchanged

#### Scenario: Autosave completion is asserted via visible status text, not a sleep

- **Given** a test has just triggered a form change that is autosaved (via
  `useAutoSave`'s debounce), on either the local-only (new recipe) or
  server-backed (edit) path
- **When** the test needs to confirm the autosave has completed before
  proceeding (e.g. before reloading to check draft restoration, or before
  asserting server-persisted state)
- **Then** the test asserts `expect(page.getByText("Saved")).toBeVisible()`
  (with an appropriate timeout covering the debounce plus any mutation
  round-trip) instead of `page.waitForTimeout(...)`

## Traceability

- Proposal element: "Every `page.waitForLoadState("networkidle")` call
  under `src/e2e/**`" (Scope/What Changes) -> Requirement: ADDED E2E waits
  use state-based signals
- Proposal element: "Every `page.waitForTimeout(...)` call under
  `src/e2e/**`" (Scope/What Changes) -> Requirement: ADDED E2E waits use
  state-based signals (autosave scenario)
- Design decision: Decision 1 (classification table) -> Requirement: ADDED
  E2E waits use state-based signals (all three scenarios)
- Design decision: Decision 2 (`cookbooks-collaboration.spec.ts` in scope)
  -> Requirement: ADDED E2E waits use state-based signals (post-navigation
  and redundant-wait scenarios apply to lines 91 and 132 respectively)
- Requirement: ADDED E2E waits use state-based signals -> Task(s): see
  `tasks.md`, one task per file in the design.md classification table

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No increase in flake rate from the swapped waits

- **Given** the full `npm run test:e2e` suite passes before this change
- **When** this change's edits are applied and the suite (at minimum, every
  touched spec file) is run repeatedly (e.g. 3 consecutive runs)
- **Then** every run passes with no new intermittent failures attributable
  to a wait that resolves before its precondition is actually true

### Requirement: Performance

#### Scenario: Suite wall-clock time does not regress

- **Given** a baseline wall-clock duration for `npm run test:e2e` captured
  before this change
- **When** the same suite is run after this change
- **Then** total duration is equal to or lower than the baseline (expected
  improvement from removing ~7s of fixed sleeps in
  `recipe-persistence.spec.ts` and replacing `networkidle`'s full-network
  wait with a narrower marker wait)

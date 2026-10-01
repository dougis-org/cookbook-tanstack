## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement. It extends the
`e2e-test-reliability` capability (`openspec/specs/e2e-test-reliability/spec.md`)
with one specific anti-pattern fix and one new cross-context wait primitive this
change needs.

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

#### Scenario: Recipient context observes an owner's action without reload

- **Given** two `Page` objects in two separate `BrowserContext`s, authenticated
  as the owner and the recipient respectively, both already past initial
  hydration
- **When** the owner's page performs an action that changes server state visible
  to the recipient (e.g. granting or revoking a library share)
- **Then** the new helper, applied to the recipient's page, resolves once the
  expected state is observable there, without the recipient's page reloading or
  the test using `networkidle` or `waitForTimeout`

## Traceability

- Proposal element: Fixing the existing `networkidle` gap in
  `cookbooks-collaboration.spec.ts` -> Requirement: ADDED Fix `networkidle`
  instance in `cookbooks-collaboration.spec.ts`
- Proposal element: Two-browser-context E2E round trip -> Requirement: ADDED
  Cross-context readiness wait for concurrent multi-user tests
- Design decision: Decision 5 (fix the one-file gap in this change's scope) ->
  Requirement: ADDED Fix `networkidle` instance in
  `cookbooks-collaboration.spec.ts`
- Design decision: Decision 6 (genuine two-`BrowserContext` scaffolding) ->
  Requirement: ADDED Cross-context readiness wait for concurrent multi-user tests
- Requirement: ADDED Fix `networkidle` instance in
  `cookbooks-collaboration.spec.ts` -> Task(s): replace the two
  `waitForLoadState("networkidle")` call sites; re-run the file's existing suite
- Requirement: ADDED Cross-context readiness wait for concurrent multi-user tests
  -> Task(s): add the helper to `src/e2e/helpers/app.ts`; new sharing E2E spec
  consumes it for both the grant/revoke round trip and the tier-downgrade
  scenario

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No new flakes introduced by the cross-context helper

- **Given** the full e2e suite passes on `main` before this change (excluding any
  pre-existing known flakes)
- **When** the full e2e suite is run after this change lands, including the new
  two-context sharing spec
- **Then** no new, reproducible failures are attributable to the cross-context
  helper's timing or to the removal of `networkidle` from
  `cookbooks-collaboration.spec.ts`; any such failure blocks merge per the
  Operational Blocking Policy in `design.md`

### Requirement: Security

#### Scenario: Access control

- Not applicable to this capability delta — no access-control behavior is
  introduced by test-infrastructure changes. See the `library-sharing` capability
  delta in this change for the relevant functional access-control scenarios.

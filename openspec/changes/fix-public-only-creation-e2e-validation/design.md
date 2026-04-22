<!-- markdownlint-disable MD013 -->

## Context

- Relevant architecture: Playwright E2E tests under `src/e2e/`, E2E helpers under `src/e2e/helpers/`, Better Auth user defaults in `src/lib/auth.ts`, and cookbook TRPC visibility enforcement in `src/server/trpc/routers/cookbooks.ts`.
- Dependencies: `registerAndLogin`, `createCookbook`, any existing user/tier setup helpers, and the MongoDB-backed cookbook model if direct fixture seeding is selected.
- Interfaces/contracts touched: Test-only fixture setup for private cookbook print-route coverage. Production TRPC/API contracts are not expected to change.

## Goals / Non-Goals

### Goals

- Make the private cookbook print-route E2E test set up a genuinely private cookbook under current tier rules.
- Preserve server-side public-only creation enforcement for restricted tiers.
- Ensure CI validates the corrected scenario before merge.
- Keep the follow-up focused and auditable as a post-merge correction to PR #396.

### Non-Goals

- No production behavior change to cookbook or recipe entitlement enforcement.
- No broad rewrite of E2E auth helpers.
- No UI changes for tier selection, upgrades, or private-content controls.
- No data migration.

## Decisions

### Decision 1: Treat The E2E As Access-Control Coverage

- Chosen: Preserve the test's assertion that anonymous users see `Cookbook not found` for private cookbook print routes, but change fixture setup so the cookbook is actually private.
- Alternatives considered: Remove the test, or change it to expect the cookbook to be public after coercion.
- Rationale: The test is located in `cookbooks-print.spec.ts` and documents private print-route access control. Coercion behavior is already covered by TRPC router tests.
- Trade-offs: Fixture setup may be less representative of the exact UI flow if direct seeding is used, but the test will more accurately exercise route access control.

### Decision 2: Prefer Minimal Valid Fixture Setup

- Chosen: Use the smallest reliable setup path that creates a private cookbook under current rules: either authenticate a `sous-chef`/admin user before using the UI helper, or seed a private cookbook directly if tiered UI setup is not already ergonomic.
- Alternatives considered: Temporarily disabling public-only enforcement in tests, or making `home-cook` users able to create private cookbooks in E2E.
- Rationale: Test setup should respect production entitlement rules instead of relying on a now-invalid lower-tier private creation path.
- Trade-offs: A direct seed bypasses the create UI, while tiered UI setup may require extra helper code. Implementation should choose whichever is smaller and clearer.

### Decision 3: Validate The Previously Failed Gate

- Chosen: Run the affected E2E spec after fixing the fixture, plus normal unit/type/build checks expected for a PR.
- Alternatives considered: Only run unit tests because the production logic is unchanged.
- Rationale: The defect surfaced in E2E, so E2E validation is required to prove the fix.
- Trade-offs: E2E takes longer than focused unit validation but is necessary for confidence.

### Decision 4: Keep OpenSpec Housekeeping Separate But Accurate

- Chosen: If this implementation touches the archived `enforce-public-only-creation` task checklist, correct stale unchecked items without rewriting the original feature history.
- Alternatives considered: Reopen the archived change.
- Rationale: The original feature is merged and archived; this is a follow-up correction.
- Trade-offs: Two related changes exist in history, but the separation reflects what happened.

## Proposal to Design Mapping

- Proposal element: Existing E2E fixture creates a private cookbook as a default `home-cook`
  - Design decision: Decision 1 and Decision 2
  - Validation approach: Confirm the fixture creates or seeds a private cookbook before anonymous print-route assertion.
- Proposal element: Preserve public-only creation enforcement
  - Design decision: Decision 2
  - Validation approach: Leave TRPC router enforcement code unchanged and keep existing router tests passing.
- Proposal element: Validate the failed merged PR gate
  - Design decision: Decision 3
  - Validation approach: Run the affected Playwright spec and report results.
- Proposal element: Correct stale OpenSpec task state if touched
  - Design decision: Decision 4
  - Validation approach: Review markdown checklist state and run markdown tooling if the file is edited.

## Functional Requirements Mapping

- Requirement: Private cookbook print-route E2E setup must create a private cookbook that remains private after setup.
  - Design element: Replace invalid default-user UI setup with valid tier/admin setup or direct private fixture seeding.
  - Acceptance criteria reference: AC1
  - Testability notes: Inspect persisted cookbook state or rely on the anonymous not-found assertion plus stable fixture setup.
- Requirement: Anonymous users must not see private cookbook print content.
  - Design element: Existing `gotoAndWaitForHydration` print-route assertion remains `Cookbook not found`.
  - Acceptance criteria reference: AC2
  - Testability notes: Run `src/e2e/cookbooks-print.spec.ts`.
- Requirement: Restricted-tier creation enforcement must remain unchanged.
  - Design element: No production router changes unless required by discovered defect.
  - Acceptance criteria reference: AC3
  - Testability notes: Run focused cookbook/recipe router tests or full `npm run test`.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: CI should no longer fail due to an invalid E2E fixture assumption.
  - Design element: Correct fixture setup and validate the affected spec.
  - Acceptance criteria reference: NFR1
  - Testability notes: A clean Playwright run for the affected spec is required before merge.
- Requirement category: security
  - Requirement: Private cookbook print routes remain inaccessible to anonymous users.
  - Design element: Preserve the not-found assertion for anonymous access.
  - Acceptance criteria reference: AC2
  - Testability notes: E2E should fail if private print content becomes visible anonymously.
- Requirement category: operability
  - Requirement: OpenSpec artifacts and task state must accurately describe the follow-up and any archive housekeeping.
  - Design element: Keep this change active until validation is complete; do not reopen the archived feature change.
  - Acceptance criteria reference: NFR2
  - Testability notes: `openspec status --change fix-public-only-creation-e2e-validation` should show apply-ready before implementation.

## Risks / Trade-offs

- Risk/trade-off: Choosing direct database seeding may reduce UI-path coverage in this one test.
  - Impact: Low.
  - Mitigation: Keep UI creation coverage elsewhere and use direct seeding only for route access-control setup.
- Risk/trade-off: Tiered user setup may need helper changes.
  - Impact: Medium.
  - Mitigation: Keep helper changes test-only and narrowly scoped.
- Risk/trade-off: E2E failure may reveal a second issue unrelated to fixture setup.
  - Impact: Medium.
  - Mitigation: Pause implementation if corrected setup still fails and update artifacts before expanding scope.

## Rollback / Mitigation

- Rollback trigger: Corrected E2E setup introduces broader E2E instability or masks route access-control regressions.
- Rollback steps: Revert changes to `src/e2e/cookbooks-print.spec.ts` and any helper changes, then select a different fixture strategy.
- Data migration considerations: None.
- Verification after rollback: Re-run the affected Playwright spec and router tests.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Inspect whether failure is the affected E2E, another E2E, or infrastructure; update artifacts before expanding scope.
- If security checks fail: Treat high/critical findings as blocking and remediate before merge.
- If required reviews are blocked/stale: Re-request review after validation evidence is posted.
- Escalation path and timeout: If the affected E2E remains flaky after two local attempts, document the failure and pause for a decision on fixture strategy.

## Open Questions

- None.

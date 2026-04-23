<!-- markdownlint-disable MD013 -->

## GitHub Issues

- Follow-up to #389 and PR #396

## Why

- Problem statement: PR #396 enforced public-only creation for restricted tiers, and its failing CI run exposed that the private cookbook print-route E2E fixture needed explicit validation that its setup still creates a genuinely private cookbook. The original failure mode was a lower-tier fixture path being coerced to public; after syncing `main`, the test already used `sous-chef`, so this follow-up hardens the test by verifying the persisted cookbook remains private before asserting anonymous access is denied.
- Why now: The merged PR's final `build-and-test` workflow failed in `cookbooks-print.spec.ts`, and the failure was plausibly caused by this fixture mismatch rather than unrelated infrastructure.
- Business/user impact: CI must accurately verify that private cookbook print routes remain inaccessible to anonymous users while preserving the intended tier enforcement for public-only users.

## Problem Space

- Current behavior: `src/e2e/cookbooks-print.spec.ts` creates a private cookbook fixture, clears cookies, then expects anonymous access to show `Cookbook not found`, but before this follow-up it did not verify that the persisted cookbook used by that assertion was actually private under current tier rules.
- Desired behavior: The private cookbook print-route E2E test creates a genuinely private cookbook using setup that is valid under current tier rules, then verifies anonymous access sees the not-found state.
- Constraints: Keep the production public-only creation enforcement unchanged. Preserve the E2E's intent: print-route access control for private cookbooks, not cookbook creation entitlement behavior.
- Assumptions: The failing E2E should not be removed because anonymous access control for private print routes remains a real requirement.
- Edge cases considered:
  - A UI-created fixture must authenticate as a tier that can create private content or an admin.
  - A direct database/API fixture must avoid bypassing the route under test in a way that hides routing regressions.
  - The test should continue to prove anonymous users cannot view private cookbook print content.
  - The archived `enforce-public-only-creation` task checklist should accurately describe the post-merge state if touched.

## Scope

### In Scope

- Update the private cookbook print-route E2E fixture so it creates or seeds a genuinely private cookbook under the new tier rules.
- Add or adjust focused validation so a regression in this fixture is caught locally and in CI.
- Document the required validation steps for the follow-up.
- Correct stale task checklist state in `openspec/changes/archive/2026-04-21-enforce-public-only-creation/tasks.md` if implementation touches OpenSpec housekeeping.

### Out of Scope

- Changing `cookbooks.create` entitlement behavior.
- Changing `recipes.create`, `recipes.import`, or update enforcement behavior.
- Adding new UI for tier upgrades or private-content affordances.
- Reworking the full E2E authentication helper suite beyond what this fix requires.

## What Changes

- Adjust `src/e2e/cookbooks-print.spec.ts` and/or its helpers so the private cookbook fixture is created by a user allowed to create private cookbooks, or seeded directly as a private cookbook while retaining route-level validation.
- Run the affected E2E spec and standard validation gates.
- Optionally update the archived task checklist for `enforce-public-only-creation` so it no longer claims all remaining tasks were completed while leaving unchecked items.

## Risks

- Risk: Seeding the fixture directly could reduce coverage of UI cookbook creation.
  - Impact: Low, because this test's purpose is print-route access control.
  - Mitigation: Keep creation-entitlement coverage in router tests and make the E2E fixture setup explicit.
- Risk: Using an elevated tier through the UI could require extra test helper support.
  - Impact: Medium if it introduces brittle admin/tier setup.
  - Mitigation: Prefer the smallest reliable setup path already established in E2E helpers or database fixtures.
- Risk: The CI E2E failure could include another unrelated timing issue.
  - Impact: Medium.
  - Mitigation: Run the affected spec after the fixture fix and inspect failures before merge.

## Open Questions

- No unresolved ambiguity exists. The corrective intent is to make the E2E fixture valid under the merged public-only creation rules.

## Non-Goals

- Reopening or rewriting the already-merged `enforce-public-only-creation` feature.
- Weakening public-only creation enforcement for `home-cook` or `prep-cook`.
- Marking the original failed PR check as passing retroactively.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

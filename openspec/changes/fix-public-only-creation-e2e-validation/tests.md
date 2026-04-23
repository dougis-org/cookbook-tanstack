---
name: tests
description: Tests for the fix-public-only-creation-e2e-validation change
---

<!-- markdownlint-disable MD013 -->

# Tests

## Overview

This document outlines the tests for the `fix-public-only-creation-e2e-validation` change. All work should follow a strict TDD process: capture the failing fixture assumption first, implement the smallest correction, then refactor only if needed.

## Testing Steps

For each task in `tasks.md`:

1. **Write or identify a failing test:** Before implementation, run or isolate the test that captures the requirement. For this change, the known failure is the private cookbook print-route E2E fixture under public-only creation enforcement.
2. **Write code to pass the test:** Update the fixture setup so the cookbook used by the anonymous print-route assertion is genuinely private.
3. **Refactor:** Reduce helper duplication or clarify fixture naming while keeping the affected E2E and router tests passing.

## Test Cases

### Task 1: Confirm Fixture Failure Mode

- [ ] Run or inspect `src/e2e/cookbooks-print.spec.ts` to show the private print-route scenario currently relies on `registerAndLogin(page)` plus `createCookbook(..., { isPublic: false })`.
  - Maps to: `ADDED valid private cookbook print fixture` / Scenario: fixture does not depend on restricted-tier private creation.
- [ ] Confirm with code inspection or a focused assertion that default Better Auth users are `home-cook` and lower-tier cookbook creation is coerced to public.
  - Maps to: `REMOVED lower-tier UI fixture may create private cookbook` / Scenario: default registered user private creation assumption is invalid.

### Task 2: Correct Private Cookbook Print Fixture

- [ ] Update the E2E fixture so the cookbook used by `unauthenticated user sees not-found state for a private cookbook print route` is persisted with `isPublic: false`.
  - Maps to: `ADDED valid private cookbook print fixture` / Scenario: fixture creates private cookbook through allowed setup.
- [ ] Run the affected scenario and verify anonymous navigation to `/cookbooks/:cookbookId/print?displayonly=1` shows `Cookbook not found`.
  - Maps to: `MODIFIED private cookbook print-route validation` / Scenario: anonymous user sees not-found state for private cookbook print route.
- [ ] Verify private cookbook title/recipe content is not visible in the unauthenticated browser context.
  - Maps to: Non-Functional Acceptance Criteria / Security / Scenario: anonymous private print-route access denied.

### Task 3: Preserve Entitlement Regression Coverage

- [ ] Run `npm run test -- src/server/trpc/routers/__tests__/recipes.test.ts src/server/trpc/routers/__tests__/cookbooks.test.ts` and confirm restricted-tier create coercion still passes.
  - Maps to: `REMOVED lower-tier UI fixture may create private cookbook` / Scenario: default registered user private creation assumption is invalid.
- [ ] If production entitlement code changes unexpectedly, add focused router coverage before implementation proceeds.
  - Maps to: `ADDED valid private cookbook print fixture` / Scenario: fixture does not depend on restricted-tier private creation.

### Task 4: OpenSpec Housekeeping

- [ ] If `openspec/changes/archive/2026-04-21-enforce-public-only-creation/tasks.md` is edited, verify checklist state no longer contradicts itself.
  - Maps to: Non-Functional Acceptance Criteria / Operability / Scenario: validation evidence is available before merge.
- [ ] Run markdown formatting/linting for edited Markdown files where tooling is available.
  - Maps to: Non-Functional Acceptance Criteria / Operability / Scenario: validation evidence is available before merge.

### Task 5: Review And Validation

- [ ] Run `CI=1 npm run test:e2e -- src/e2e/cookbooks-print.spec.ts --reporter=line`.
  - Maps to: Non-Functional Acceptance Criteria / Reliability / Scenario: CI validates corrected fixture.
- [ ] Run `npm run test`.
  - Maps to: Non-Functional Acceptance Criteria / Reliability / Scenario: CI validates corrected fixture.
- [ ] Run `npx tsc --noEmit`.
  - Maps to: Non-Functional Acceptance Criteria / Operability / Scenario: validation evidence is available before merge.
- [ ] Run `npm run build`.
  - Maps to: Non-Functional Acceptance Criteria / Operability / Scenario: validation evidence is available before merge.

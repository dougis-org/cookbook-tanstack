## GitHub Issues

- #394

## Why

- Problem statement: The tier enforcement stack is fully implemented (issues #387–#392 closed) but the consolidation issue (#394) requires integration tests, edge-case tests, and developer documentation that no individual issue covered.
- Why now: All enforcement work is merged. Closing #394 is the final gate before the tier enforcement milestone is considered done.
- Business/user impact: Without these tests, the null-tier path, the admin→reconcile→list full path, and the admin bypass on update mutations are untested. A regression in any of these paths would silently break enforcement. Without the documentation, future developers have no map of where enforcement lives.

## Problem Space

- Current behavior: Unit tests exist for each enforcement layer in isolation. The admin test file mocks the DB and cannot exercise the real reconcile path. No test passes `tier: undefined` to verify the home-cook default. The `docs/user-tier-feature-sets.md` ends with "this doc doesn't define implementation details." `src/lib/tier-entitlements.ts` has a single source-of-truth comment but no contract description.
- Desired behavior: Every enforcement contract is exercised by at least one test. An integration test verifies the full admin→reconcile→recipes.list path with a real DB. The docs map enforcement areas to implementation files. The entitlements module explains the contract to future developers.
- Constraints: Must not duplicate existing tests. New integration test must use `withCleanDb` (real DB), not mocks. `canImport` correctly requires executive-chef only — issue #394 text contained a bug saying sous-chef; code is correct, tests must reflect reality.
- Assumptions: All enforcement logic is complete and correct. These changes add verification and documentation only, no new behavior.
- Edge cases considered:
  - `tier: null` / `tier: undefined` → all enforcement points default to home-cook
  - Admin with `tier: 'home-cook'` can still set `isPublic: false` on update
  - Downgrade with over-limit content → oldest N preserved, rest hidden; upgrade restores all
  - Race condition: +1 over limit is acceptable; no locking needed and no test needed — only a comment

## Scope

### In Scope

- Add null-tier test cases to `recipes.test.ts`, `cookbooks.test.ts`, and `helpers.test.ts`
- Add admin-bypass-on-update test to `recipes.test.ts`
- Add TierWall `/pricing` link assertion to `-recipes.test.tsx`
- New integration test file `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`
- Add "Implementation" section to `docs/user-tier-feature-sets.md`
- Add enforcement contract comment to `src/lib/tier-entitlements.ts`
- Add race-condition tolerance comment to `src/server/trpc/routers/_helpers.ts`

### Out of Scope

- Any changes to enforcement logic
- New enforcement rules or behaviors
- E2E (Playwright) browser tests for tier flows
- Tests for the change-tier UI route beyond what already exists
- Cookbooks page TierWall `/pricing` link assertion (already covered via component render)

## What Changes

- `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts` — new file, ~70 lines, real-DB integration tests for the full setTier→reconcile→list path
- `src/server/trpc/routers/__tests__/recipes.test.ts` — 2 new test cases: null-tier create blocked at 10, admin-with-home-cook-tier can set private on update
- `src/server/trpc/routers/__tests__/cookbooks.test.ts` — 1 new test case: null-tier create blocked at 1
- `src/server/trpc/routers/__tests__/helpers.test.ts` — 1 new test case: enforceContentLimit with undefined tier defaults to home-cook
- `src/routes/__tests__/-recipes.test.tsx` — 1 assertion added to existing tier affordance test: TierWall Upgrade link points to `/pricing`
- `docs/user-tier-feature-sets.md` — replace "Implementation Planning Output" section with "Implementation" section containing enforcement-area-to-file table
- `src/lib/tier-entitlements.ts` — add block comment describing enforcement contract
- `src/server/trpc/routers/_helpers.ts` — add inline comment to `enforceContentLimit` noting +1 race tolerance is intentional

## Risks

- Risk: Integration test requires a real MongoDB instance
  - Impact: Tests fail in environments without Docker/MongoDB running
  - Mitigation: Uses the same `withCleanDb` pattern already used by `reconcile-user-content.test.ts` — no new infrastructure needed; CI already supports this
- Risk: Existing test file modifications could accidentally break passing tests
  - Impact: CI failure
  - Mitigation: New test cases are additive only; no existing test logic is modified

## Open Questions

No unresolved ambiguity. All decisions were made during the exploration phase:
- `canImport` requires executive-chef (not sous-chef). The issue text had a bug; the code is correct.
- Race tolerance is documented via comment only, not a concurrent test.
- TierWall link assertion goes in `-recipes.test.tsx` (inline display path), not a new test file.

## Non-Goals

- Changing any enforcement behavior
- Adding Playwright E2E tests for the tier enforcement UI flows
- Testing the change-tier route UI beyond existing coverage
- Adding cookbook-specific TierWall link test (cookbook modal test already exercises this path)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

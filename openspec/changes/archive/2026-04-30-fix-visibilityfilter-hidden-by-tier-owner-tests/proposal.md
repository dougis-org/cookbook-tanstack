## GitHub Issues

- #410: visibilityFilter: exclude hiddenByTier docs even for owner

## Why

- **Problem statement**: Issue #410 filed Apr 29 2026 describes that `visibilityFilter()` in `src/server/trpc/routers/_helpers.ts` does not exclude `hiddenByTier: true` documents for the owning user. The fix was implemented in commit `83dfcdc` (PR #412, merged Apr 30 00:39), but the issue remains open because behavioral regression tests are missing.

- **Why now**: The code fix is already merged. The issue cannot be properly closed until tests prove the behavior works and prevent future regressions.

- **Business/user impact**: Without these tests, a future refactor or accidental filter change could reintroduce the bug — owners could see their own hidden tier-enforcement content, undermining tier limit enforcement.

## Problem Space

- **Current behavior**: `visibilityFilter()` correctly applies `hiddenByTier: { $ne: true }` to both public and owner-match branches (code fix from PR #412). However, only filter-shape unit tests exist — no integration tests verify that a hidden document owned by a user is actually absent from query results.

- **Desired behavior**: Behavioral tests confirm that:
  - Owner with a `hiddenByTier: true` cookbook/recipe cannot see it in `cookbooks.list`, `cookbooks.byId`, `recipes.list`, or `recipes.byId`
  - Anonymous user also cannot see hidden documents (already partially tested via `enforceContentLimit` count tests)

- **Constraints**:
  - Must not change existing behavior, only add test coverage
  - Tests must be integration-style (real DB, real query path) not just pure unit assertions
  - Follow existing test patterns in `cookbooks.test.ts` and `recipes.test.ts`

- **Assumptions**:
  - `withCleanDb` is the established pattern for integration tests with real MongoDB
  - `makeAuthCaller`, `makeAnonCaller`, `seedUser`, `seedCookbook`, `seedRecipe` are the standard helpers
  - New describe blocks extend the existing `hiddenByTier in response` test sections

- **Edge cases considered**:
  - Public cookbook with `hiddenByTier: true` — owner can see public ones but not hidden ones
  - Private cookbook with `hiddenByTier: true` — owner must not see it either
  - Mix of visible and hidden cookbooks for same owner — list should return only visible ones
  - Same coverage needed for recipes, and for both `list` and `byId` endpoints

## Scope

### In Scope

- Add behavioral tests for `cookbooks.list` — owner with hidden cookbook cannot see it
- Add behavioral tests for `cookbooks.byId` — owner requesting their own hidden cookbook returns `null`
- Add behavioral tests for `recipes.list` — owner with hidden recipe cannot see it
- Add behavioral tests for `recipes.byId` — owner requesting their own hidden recipe returns `null`
- Add `visibilityFilter` behavior tests in `helpers.test.ts` with actual DB documents
- Optionally add anonymous-user tests for hidden doc exclusion (extend existing null-case patterns)

### Out of Scope

- Any code changes — the `visibilityFilter` fix is already in place
- Changes to `reconcileUserContent` logic
- Changes to `enforceContentLimit` logic
- E2E / Playwright tests
- Changes to any other router or helper

## What Changes

1. **`src/server/trpc/routers/__tests__/helpers.test.ts`**: Add new `describe("visibilityFilter — behavior")` block with DB-backed tests that create hidden and visible docs and assert filtered query results.

2. **`src/server/trpc/routers/__tests__/cookbooks.test.ts`**: Extend existing `cookbooks.list — hiddenByTier in response` describe block (line 919) with owner-cannot-see tests; add new `cookbooks.byId — hiddenByTier` describe block.

3. **`src/server/trpc/routers/__tests__/recipes.test.ts`**: Extend existing `recipes.list — hiddenByTier in response` describe block (line 1838); add new `recipes.byId — hiddenByTier` describe block.

## Risks

- **Risk**: Tests might duplicate existing coverage accidentally
  - **Impact**: Low — new test cases are clearly distinct from existing shape-only assertions
  - **Mitigation**: Place new tests in clearly labeled `describe` blocks; verify before/after test count if desired
- **Risk**: The fix might already be verified implicitly through other integration tests
  - **Impact**: Could mean tests are redundant, but given the specific acceptance criteria in #410 ("owner cannot see hiddenByTier docs"), explicit tests are warranted
  - **Mitigation**: Ensure tests follow the acceptance criteria exactly, covering each endpoint listed

## Open Questions

- **Question**: Should anonymous-user tests for hidden doc exclusion also be added?
  - **Needed from**: Author of #410 or project lead
  - **Blocker for apply**: No — can be added later as follow-up

## Non-Goals

- No code changes to `visibilityFilter()` or any router logic
- No changes to `enforceContentLimit`, `reconcileUserContent`, or other helpers
- No schema or model changes
- No E2E / Playwright tests
- No changes to production behavior

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
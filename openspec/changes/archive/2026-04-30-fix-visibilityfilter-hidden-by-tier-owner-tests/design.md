## Context

- **Relevant architecture**: `visibilityFilter()` in `src/server/trpc/routers/_helpers.ts` is called by `cookbooks.list`, `cookbooks.byId`, `recipes.list`, and `recipes.byId` to gate which documents are returned. It applies `hiddenByTier: { $ne: true }` to all branches (code fix from PR #412 already merged).

- **Dependencies**: The test files use `withCleanDb`, `makeAuthCaller`, `makeAnonCaller`, `seedUser`, `seedCookbook`, `seedRecipe` from test-helpers.ts and `@/test-helpers/with-clean-db`.

- **Interfaces/contracts touched**: No production interfaces change. Only test files and test helpers are modified.

## Goals / Non-Goals

### Goals

- Add behavioral regression tests confirming `visibilityFilter` excludes `hiddenByTier: true` documents for the owner across all four endpoints: `cookbooks.list`, `cookbooks.byId`, `recipes.list`, `recipes.byId`
- Add `visibilityFilter` behavior tests in `helpers.test.ts` that exercise the full query path with real MongoDB documents
- Ensure tests match the acceptance criteria from GitHub issue #410 exactly

### Non-Goals

- No production code changes
- No E2E / Playwright tests
- No changes to `enforceContentLimit`, `reconcileUserContent`, or other helper logic
- No schema or model changes

## Decisions

### Decision 1: Test placement — extend existing `hiddenByTier in response` describe blocks

- **Chosen**: Add owner-hidden-behavior tests as new `describe` blocks near the existing `hiddenByTier in response` tests in `cookbooks.test.ts` and `recipes.test.ts`, rather than creating a new top-level `describe("visibilityFilter — integration")` block in those files.

- **Alternatives considered**:
  - Create a shared `visibilityFilter.integration.test.ts` — would centralize tests but requires new file and deviates from per-router test co-location pattern
  - Add to `helpers.test.ts` only — covers the helper in isolation but doesn't test the full call path through the actual router endpoints

- **Rationale**: Existing `hiddenByTier` tests in `cookbooks.test.ts` (line 919) and `recipes.test.ts` (line 1838) already follow the per-router co-location pattern. Extending those blocks maintains consistency and makes the relationship to existing coverage clear. `helpers.test.ts` gets its own separate behavior tests that directly exercise the full filter with real docs.

- **Trade-offs**: Tests are split across two files per domain (router test + helpers test), but this matches established patterns and keeps tests close to the code they exercise.

### Decision 2: Document creation approach — raw `collection.insertOne` vs. Mongoose model `.save()`

- **Chosen**: Use `Recipe.collection.insertOne(...)` / `Cookbook.collection.insertOne(...)` for documents with `hiddenByTier: true` (following the pattern already used in `helpers.test.ts` lines 97 and 145), and Mongoose `.save()` for normal documents (as used in router tests).

- **Alternatives considered**:
  - Use `.save()` for all documents — cleaner API but requires providing all required fields including empty arrays for `mealIds`, `courseIds`, etc.
  - Use `insertOne` for all — consistent but more verbose for normal docs

- **Rationale**: The existing tests in `helpers.test.ts` for hiddenByTier docs use `insertOne` to bypass Mongoose defaults and validation. Following this pattern for consistency. For visible docs, `.save()` is sufficient and matches the router test style.

- **Trade-offs**: Mixing insert methods within tests is slightly inconsistent, but the difference is cosmetic and the existing precedent is clear.

### Decision 3: No new test infrastructure

- **Chosen**: No new helpers, no new test files, no new fixtures — reuse existing `withCleanDb`, `seedUser`, `makeAuthCaller`, `makeAnonCaller`, `seedCookbook`, `seedRecipe`.

- **Alternatives considered**: Create a shared `seedHiddenDocument` helper — over-engineered for a one-off pattern.

- **Rationale**: The existing infrastructure is sufficient. New tests follow the same patterns already established for hiddenByTier tests elsewhere in the codebase.

- **Trade-offs**: Tests are slightly more verbose but are immediately readable against existing code.

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation |
|---|---|---|
| Add behavioral tests for `cookbooks.list` — owner with hidden cookbook cannot see it | Decision 1 — extend `cookbooks.list — hiddenByTier` describe block in `cookbooks.test.ts` | Test creates visible + hidden cookbooks, owner calls `cookbooks.list()`, asserts length 1 and name matches visible only |
| Add behavioral tests for `cookbooks.byId` — owner requesting own hidden cookbook returns null | Decision 1 — new `cookbooks.byId — hiddenByTier` describe block in `cookbooks.test.ts` | Test creates hidden cookbook, owner calls `cookbooks.byId()`, expects null |
| Add behavioral tests for `recipes.list` — owner with hidden recipe cannot see it | Decision 1 — extend `recipes.list — hiddenByTier` describe block in `recipes.test.ts` | Test creates visible + hidden recipes, owner calls `recipes.list({ userId })`, asserts length 1 and name matches visible only |
| Add behavioral tests for `recipes.byId` — owner requesting own hidden recipe returns null | Decision 1 — new `recipes.byId — hiddenByTier` describe block in `recipes.test.ts` | Test creates hidden recipe, owner calls `recipes.byId()`, expects null |
| Add visibilityFilter behavior tests in `helpers.test.ts` with real DB | Decision 1 — new `describe("visibilityFilter — behavior")` block in `helpers.test.ts` | Test creates visible + hidden cookbooks/recipes, runs full filter through `cookbooks.list()` / `recipes.list()` callers, verifies hidden absent |
| Follow existing test patterns | Decisions 2 and 3 | Use `withCleanDb`, `seedUser`, `makeAuthCaller`, `insertOne` for hidden docs |

## Functional Requirements Mapping

| Requirement | Design Element | Acceptance Criteria Reference | Testability Notes |
|---|---|---|---|
| Owner cannot see `hiddenByTier: true` cookbooks in `cookbooks.list` | New `it("owner cannot see hiddenByTier cookbook in list")` in `cookbooks.test.ts` | #410: "owner cannot see hiddenByTier docs" | Create 2 cookbooks (1 normal, 1 hidden), call `cookbooks.list()` as owner, assert length 1 |
| Owner cannot see `hiddenByTier: true` cookbook in `cookbooks.byId` | New `it("owner cannot see own hiddenByTier cookbook byId")` in `cookbooks.test.ts` | #410: "owner cannot see hiddenByTier docs" | Create hidden cookbook, call `cookbooks.byId()` as owner, assert null |
| Owner cannot see `hiddenByTier: true` recipes in `recipes.list` | New `it("owner cannot see hiddenByTier recipe in list")` in `recipes.test.ts` | #410: "owner cannot see hiddenByTier docs" | Create 2 recipes (1 normal, 1 hidden), call `recipes.list({ userId })` as owner, assert length 1 |
| Owner cannot see `hiddenByTier: true` recipe in `recipes.byId` | New `it("owner cannot see own hiddenByTier recipe byId")` in `recipes.test.ts` | #410: "owner cannot see hiddenByTier docs" | Create hidden recipe, call `recipes.byId()` as owner, assert null |
| Anonymous cannot see `hiddenByTier: true` documents | Already partially covered; optionally extend anon null-case tests | #410: "anonymous cannot see hiddenByTier docs" | Owner has only hidden doc → anon caller gets empty list |

## Non-Functional Requirements Mapping

| Category | Requirement | Design Element | Testability Notes |
|---|---|---|---|
| Testability | Tests run independently without external dependencies beyond MongoDB | Use `withCleanDb` for isolated DB per test | Each test is self-contained |
| Maintainability | Tests follow existing patterns and co-location conventions | Decision 1 — extend existing describe blocks | No new patterns to learn |
| Reliability | Tests are deterministic, no flaky timing or async races | Use `await` on all async calls; direct query assertions | Straightforward async/await patterns |

## Risks / Trade-offs

- **Risk**: Test-only changes are low-risk but may be seen as unnecessary if coverage is perceived as sufficient
  - **Impact**: Low — tests clearly target a specific regression scenario described in #410
  - **Mitigation**: Ensure test names are self-documenting and match #410 acceptance criteria language
- **Risk**: Adding tests without code changes means no production behavior verification
  - **Impact**: Tests validate existing code, not new code — no risk of breaking production
  - **Mitigation**: This is intentional; the code fix is already merged, we are only adding regression prevention

## Rollback / Mitigation

- **Rollback trigger**: If tests fail unexpectedly or require changes to production code to pass
- **Rollback steps**: Revert test file changes to prior state; issue remains open until tests are resolved
- **Data migration considerations**: None — no data changes
- **Verification after rollback**: Existing test suite passes without modification

## Operational Blocking Policy

- If unit tests (`npm run test`) fail: block apply, fix tests first
- If TypeScript compilation fails: block apply, fix type errors
- If integration tests fail: block apply, diagnose — likely indicates test setup issue (not code issue since code fix is already merged and tested)
- If required review is blocked/stale: ping author; after 48h escalate to maintainer
- No security, Codacy, or Snyk changes expected (no production code changes)

## Open Questions

- **Question**: Should anonymous-user tests for hidden doc exclusion be added now, or as a follow-up?
  - **Considers**: The #410 acceptance criteria explicitly say "anonymous cannot see hiddenByTier docs" — but this is already partially validated by the `enforceContentLimit` tests which insert hidden docs and verify the count filter excludes them. A full integration test (anon calls endpoint and gets empty list for owner who only has hidden docs) could be added as a follow-up.
  - **Decision needed from**: Author or project lead
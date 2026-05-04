## Context

- Relevant architecture: Tier enforcement spans four layers — entitlements module (`src/lib/tier-entitlements.ts`), tRPC routers (`recipes.ts`, `cookbooks.ts`, `admin.ts`, `_helpers.ts`), reconciliation logic (`src/lib/reconcile-user-content.ts`), and client-side hook (`src/hooks/useTierEntitlements.ts`). TierWall UI (`src/components/ui/TierWall.tsx`) renders enforcement feedback.
- Dependencies: `withCleanDb` test helper from `src/test-helpers/with-clean-db.ts`; `makeAuthCaller`, `seedUserWithBetterAuth` from `src/server/trpc/routers/__tests__/test-helpers.ts`; real MongoDB via Docker (same infra as reconcile tests).
- Interfaces/contracts touched: `enforceContentLimit` signature in `_helpers.ts`; `admin.users.setTier` tRPC mutation; `recipes.list` tRPC query; `TierWall` component render output.

## Goals / Non-Goals

### Goals

- Verify null/undefined tier defaults to home-cook across all enforcement points
- Verify admin bypass works on update mutations (not just create)
- Verify TierWall renders a `/pricing` link
- Verify the full admin→setTier→reconcile→list path with a real DB
- Document the enforcement contract and race-tolerance in code
- Map implementation files to enforcement areas in `docs/user-tier-feature-sets.md`

### Non-Goals

- Changing any enforcement logic
- Adding Playwright browser tests
- Closing coverage gaps in unrelated areas

## Decisions

### Decision 1: Integration test location and pattern

- Chosen: New file `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts` using `withCleanDb` and real MongoDB, mirroring the reconcile test pattern. Does NOT mock `@/db`.
- Alternatives considered: (a) Extend `admin.test.ts` — rejected because that file mocks `@/db` and switching it would break its existing isolated tests. (b) Playwright E2E — rejected as too heavy; the goal is server-side path verification, not UI interaction.
- Rationale: The reconcile tests already demonstrate that `withCleanDb` is the correct pattern for DB-level integration. The admin test mocking is intentional for unit isolation. A separate file preserves both.
- Trade-offs: One more test file to maintain; offset by the clear separation of unit vs. integration concerns.

### Decision 2: Null-tier test placement

- Chosen: Add cases to existing `describe` blocks in `recipes.test.ts`, `cookbooks.test.ts`, and `helpers.test.ts` rather than new describe blocks or new files.
- Alternatives considered: A dedicated `null-tier-edge-cases.test.ts` — rejected as unnecessary overhead for ~3 small test cases.
- Rationale: The null-tier cases are variants of existing limit enforcement tests. Placing them near the limit tests makes the intent obvious and keeps the test count low.
- Trade-offs: None.

### Decision 3: Race condition — comment only, no test

- Chosen: Add an inline comment to `enforceContentLimit` in `_helpers.ts` documenting that +1 over-limit is an accepted race tolerance. No concurrent test.
- Alternatives considered: A test with two sequential creates past limit asserting the second succeeds — rejected because it would assert a tolerance, not a correctness property, and would confuse future maintainers into thinking it's a desired behavior to maintain.
- Rationale: The issue explicitly calls this a tolerance. The code already does count-then-create without a lock. Documenting the intent is sufficient.
- Trade-offs: The tolerance is not machine-verified, but it's also not a correctness guarantee — just an accepted race window.

### Decision 4: docs update — replace "Implementation Planning Output" section

- Chosen: Replace the existing "Implementation Planning Output" section (which explicitly says it doesn't define implementation details) with an "Implementation" section containing a file→area mapping table.
- Alternatives considered: Appending a new section — rejected because the existing section is now stale and would be misleading alongside a new Implementation section.
- Rationale: The existing section was a placeholder written before enforcement was built. It should be replaced, not supplemented.
- Trade-offs: Minor git diff noise; worth it for doc accuracy.

### Decision 5: Enforcement contract comment in tier-entitlements.ts

- Chosen: A block comment (multi-line, plain text, not JSDoc) placed above the `TIER_LIMITS` export explaining the three-layer contract: server enforcement in routers, client hook for UI affordances only, reconcile for retroactive downgrade.
- Alternatives considered: JSDoc on each function — rejected as verbose and redundant with function signatures. A separate `docs/tier-enforcement-contract.md` — rejected as unnecessary indirection.
- Rationale: The file is already the single source of truth for entitlement values. The contract note belongs here and is most likely to be read by a developer touching enforcement.
- Trade-offs: Slightly longer file header.

## Proposal to Design Mapping

- Proposal element: Null-tier edge cases untested
  - Design decision: Decision 2
  - Validation approach: Unit tests in existing files; `makeAuthCaller` called without `tier` option

- Proposal element: Admin bypass on update paths untested
  - Design decision: Decision 2
  - Validation approach: Test in `recipes.test.ts`: admin caller with `tier: 'home-cook'` calls `recipes.update` with `isPublic: false` — expects success

- Proposal element: TierWall `/pricing` link unasserted
  - Design decision: N/A (straightforward addition to existing test)
  - Validation approach: `screen.getByRole('link', { name: /upgrade/i })` + `toHaveAttribute('href', '/pricing')` in `-recipes.test.tsx`

- Proposal element: admin→reconcile→list full path untested
  - Design decision: Decision 1
  - Validation approach: Real-DB integration test in new file

- Proposal element: Race condition tolerance
  - Design decision: Decision 3
  - Validation approach: Comment only; no machine verification

- Proposal element: docs/user-tier-feature-sets.md missing implementation references
  - Design decision: Decision 4
  - Validation approach: Manual review; no test needed for docs

- Proposal element: tier-entitlements.ts missing contract note
  - Design decision: Decision 5
  - Validation approach: Manual review; no test needed

## Functional Requirements Mapping

- Requirement: `tier: undefined` in `recipes.create` is blocked at the home-cook limit (10)
  - Design element: New test in `recipes.test.ts`
  - Acceptance criteria reference: specs/null-tier-edge-cases.md
  - Testability notes: `makeAuthCaller(userId)` with no tier option; create 10 recipes first

- Requirement: `tier: undefined` in `cookbooks.create` is blocked at the home-cook limit (1)
  - Design element: New test in `cookbooks.test.ts`
  - Acceptance criteria reference: specs/null-tier-edge-cases.md
  - Testability notes: same pattern

- Requirement: `enforceContentLimit` with `tier: undefined` uses home-cook limit
  - Design element: New test in `helpers.test.ts`
  - Acceptance criteria reference: specs/null-tier-edge-cases.md
  - Testability notes: direct function call; no router needed

- Requirement: Admin with home-cook tier can set `isPublic: false` on recipe update
  - Design element: New test in `recipes.test.ts`
  - Acceptance criteria reference: specs/admin-bypass.md
  - Testability notes: `makeAuthCaller(userId, { tier: 'home-cook', isAdmin: true })`

- Requirement: TierWall inline/modal renders a link to `/pricing`
  - Design element: Assertion in `-recipes.test.tsx`
  - Acceptance criteria reference: specs/tierwall-link.md
  - Testability notes: `screen.getByRole('link', { name: /upgrade/i })`

- Requirement: setTier to home-cook with 15 recipes → recipes.list returns 10
  - Design element: Integration test in `admin-tier-integration.test.ts`
  - Acceptance criteria reference: specs/admin-tier-integration.md
  - Testability notes: withCleanDb; seed 15 recipes; call setTier; query list

- Requirement: setTier to executive-chef after downgrade → all 15 recipes restored
  - Design element: Integration test in `admin-tier-integration.test.ts`
  - Acceptance criteria reference: specs/admin-tier-integration.md
  - Testability notes: continuation of prior test

- Requirement: Oldest 10 recipes preserved; newest 5 have `hiddenByTier: true`
  - Design element: Integration test in `admin-tier-integration.test.ts`
  - Acceptance criteria reference: specs/admin-tier-integration.md
  - Testability notes: seed recipes with staggered `createdAt`; verify by DB query

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: New tests must not require test infrastructure beyond what already exists
  - Design element: Decision 1 (uses existing `withCleanDb` / Docker MongoDB)
  - Acceptance criteria reference: CI green on existing infra
  - Testability notes: Run `npm run test` locally and in CI — no new setup steps

- Requirement category: operability
  - Requirement: Documentation must be accurate as of the time of merge
  - Design element: Decisions 4 and 5
  - Acceptance criteria reference: Reviewer verification of file paths in the Implementation table
  - Testability notes: Grep each listed file path to confirm it exists

## Risks / Trade-offs

- Risk/trade-off: Integration test adds DB startup time to test run
  - Impact: Marginally slower CI
  - Mitigation: Reuses existing MongoDB Docker infra; single `withCleanDb` setup; negligible overhead

- Risk/trade-off: Docs file path table becomes stale if files are renamed
  - Impact: Misleading documentation
  - Mitigation: File paths are stable; renaming would be caught by the standard import audit

## Rollback / Mitigation

- Rollback trigger: Any new test that breaks CI unexpectedly
- Rollback steps: Revert the failing test file; the enforcement logic itself is unchanged
- Data migration considerations: None — test-only and docs-only changes
- Verification after rollback: `npm run test` passes; no behavior change

## Operational Blocking Policy

- If CI checks fail: Fix the failing test. Do not merge with failing tests.
- If security checks fail: Not applicable (test and docs only; no new dependencies, no auth changes).
- If required reviews are blocked/stale: Ping reviewer after 48h; escalate to maintainer after 72h.
- Escalation path and timeout: Tag issue #394 with `needs-review` after 72h of no response.

## Open Questions

No open questions. All decisions resolved during exploration.

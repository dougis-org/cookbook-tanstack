## Context

- Relevant architecture: `src/test-helpers/mocks.ts` already exports `createMockDb` and an unused `createRouterMock()`. 12 test files across `src/routes/__tests__/`, `src/routes/recipes/__tests__/`, `src/routes/admin/__tests__/`, `src/components/cookbooks/__tests__/`, and `src/hooks/__tests__/` each declare inline `vi.mock('@tanstack/react-router', ...)` blocks.
- Dependencies: Vitest (mock hoisting), React (createElement in mock Link), `@tanstack/react-router` (mocked surface).
- Interfaces/contracts touched: `src/test-helpers/mocks.ts` public exports only. No production code touched.

## Goals / Non-Goals

### Goals

- Single source of truth for `@tanstack/react-router` test mocks
- Factory covers all 12 existing use cases via options
- `createRouterMockForHooks()` handles `getRouteApi` pattern separately
- Fix `vi.hoisted()` latent bug in `cookbooks.$cookbookId_.print.test.tsx`
- All tests pass after migration

### Non-Goals

- Comprehensive TanStack Router mock harness
- Mocking non-router APIs
- Changing production code

## Decisions

### Decision 1: Extended `createRouterMock` signature

- Chosen: `createRouterMock(opts?: RouterMockOptions)` where:
  ```ts
  interface RouterMockOptions {
    params?: Record<string, string>
    search?: Record<string, unknown>
    extras?: Record<string, unknown>
  }
  ```
- Alternatives considered: Separate named exports per group (e.g., `createRouterMockWithParams`); overloaded function with union types.
- Rationale: Single entry point is simpler to discover and use. Options bag is extensible without breaking callers. Matches `createMockDb` pattern already in the file.
- Trade-offs: Slightly more complex internals vs. multiple simpler functions. Acceptable given small surface area.

### Decision 2: Unified `Link` with params substitution

- Chosen: One `Link` mock that handles both plain `to` strings and `to` + `params` prop (URL substitution via regex):
  ```ts
  Link: ({ children, to, params }) => {
    const href = params ? to.replace(/\$(\w+)/g, (_, k) => params[k] ?? '') : to
    return React.createElement('a', { href }, children)
  }
  ```
- Alternatives considered: Separate `LinkWithParams` export; keeping bespoke per-file Link variants.
- Rationale: Superset approach — plain `to` works identically to before. No behavioral regression. Eliminates two divergent implementations in cookbook tests.
- Trade-offs: Slightly more complex Link mock. Negligible.

### Decision 3: `createRouterMockForHooks()` separate export

- Chosen: Dedicated export for the `getRouteApi` pattern used in `useAuth.test.ts`:
  ```ts
  export function createRouterMockForHooks(
    useRouteContextFn: () => unknown
  ) {
    return {
      getRouteApi: () => ({ useRouteContext: useRouteContextFn }),
    }
  }
  ```
- Alternatives considered: Passing `getRouteApi` via `extras` in main factory.
- Rationale: `useAuth.test.ts` doesn't need `createFileRoute`, `Link`, `redirect`, or `useNavigate`. Mixing concerns into one factory blurs what each test is mocking. Named export is self-documenting.
- Trade-offs: Two exports instead of one. Worth it for clarity.

### Decision 4: `vi.hoisted()` fix for mutable params/search refs

- Chosen: Wrap `vi.fn()` declarations in `vi.hoisted()` in `cookbooks.$cookbookId_.print.test.tsx`:
  ```ts
  const mockUseParams = vi.hoisted(() => vi.fn().mockReturnValue({ cookbookId: 'cb-id' }))
  const mockUseSearch = vi.hoisted(() => vi.fn().mockReturnValue({ displayonly: undefined }))
  ```
  Then call `createRouterMock` with function overrides — or keep inline with hoisted refs directly in factory. Since params/search are mutable `vi.fn` refs (changed per test via `mockReturnValue`), the `createRouterMock` factory accepts them as-is in the `extras` or inline factory.
- Alternatives considered: Keep inline factory but just add `vi.hoisted()` without using `createRouterMock`. Acceptable — this file's mock shape diverges enough (no static params) that inline + `vi.hoisted()` fix is cleaner than forcing it through the factory.
- Rationale: The bug is latent — if Vitest's lazy factory evaluation happens to work currently, it won't be reliable across versions. Fix definitively.
- Trade-offs: Minor deviation from "all files use factory" — this file uses `vi.hoisted()` + inline factory, factory still calls `createRouterMock` shape. Acceptable.

## Proposal to Design Mapping

- Proposal element: Extend `createRouterMock()` with options
  - Design decision: Decision 1
  - Validation approach: All 12 migrated files pass `npm run test`
- Proposal element: Unified `Link` with params substitution
  - Design decision: Decision 2
  - Validation approach: CookbookRecipeCard and StandaloneLayout tests pass with correct href values
- Proposal element: `createRouterMockForHooks()` separate export
  - Design decision: Decision 3
  - Validation approach: `useAuth.test.ts` passes; `createRouterMockForHooks` is exported from `mocks.ts`
- Proposal element: Fix `vi.hoisted()` latent bug
  - Design decision: Decision 4
  - Validation approach: Print route tests pass; no undefined ref warnings

## Functional Requirements Mapping

- Requirement: All 12 test files use shared factory, no inline router mocks remain
  - Design element: Decisions 1–4
  - Acceptance criteria reference: specs/no-inline-router-mocks.md
  - Testability notes: Grep for `vi.mock('@tanstack/react-router'` — should only appear in `mocks.ts` and the one print test inline (with `vi.hoisted` fix)
- Requirement: `createRouterMock()` accepts `params`, `search`, `extras` options
  - Design element: Decision 1
  - Acceptance criteria reference: specs/factory-options.md
  - Testability notes: Unit tests on factory itself; or verify migrated tests that rely on specific params values pass
- Requirement: `Link` handles `params` prop URL substitution
  - Design element: Decision 2
  - Acceptance criteria reference: specs/factory-options.md
  - Testability notes: CookbookRecipeCard test asserts `href` contains substituted recipeId
- Requirement: `createRouterMockForHooks` exported and used by `useAuth.test.ts`
  - Design element: Decision 3
  - Acceptance criteria reference: specs/no-inline-router-mocks.md
  - Testability notes: `useAuth.test.ts` passes; export visible in `mocks.ts`

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Migration must not break any existing test assertions
  - Design element: Superset Link (Decision 2), options-based factory (Decision 1)
  - Acceptance criteria reference: Full test suite green
  - Testability notes: `npm run test` passes before and after each group migration

## Risks / Trade-offs

- Risk/trade-off: `createFileRoute` shape difference — some files wrap opts in `{ options: opts }`, others spread `...opts`, others return `opts` directly
  - Impact: Test failure if shape mismatch after migration
  - Mitigation: Migrate group by group, run tests after each group; fix shape mismatches before proceeding
- Risk/trade-off: `vi.hoisted()` changes evaluation timing in print test
  - Impact: Possible subtle behavior difference
  - Mitigation: Verify all print route tests pass after fix

## Rollback / Mitigation

- Rollback trigger: Any test failure that can't be immediately explained by mock shape mismatch
- Rollback steps: Revert individual test file to its original inline mock; investigate diff; re-apply with fix
- Data migration considerations: None — test-only change
- Verification after rollback: `npm run test` green

## Operational Blocking Policy

- If CI checks fail: Fix failing tests before merging — no exceptions for test-only refactor
- If security checks fail: N/A (no production code changed)
- If required reviews are blocked/stale: Tag Doug directly; don't merge without review
- Escalation path and timeout: 48h stale review → ping in PR; 96h → merge at discretion if CI green

## Open Questions

No open questions. All design decisions confirmed in explore session.

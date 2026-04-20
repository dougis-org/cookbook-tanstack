## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED No inline router mocks in test files

The system SHALL have no inline `vi.mock('@tanstack/react-router', ...)` blocks in any test file except where `vi.hoisted()` is required for mutable refs.

#### Scenario: Standard route test uses factory

- **Given** a test file for a route component (e.g., `-home.test.tsx`, `-index.test.tsx`)
- **When** the file is read
- **Then** it imports `createRouterMock` from `@/test-helpers/mocks` and calls `vi.mock('@tanstack/react-router', () => createRouterMock(...))`; no inline mock object literal is present

#### Scenario: Hook test uses hooks factory

- **Given** `src/hooks/__tests__/useAuth.test.ts`
- **When** the file is read
- **Then** it imports `createRouterMockForHooks` from `@/test-helpers/mocks` and uses it; no inline mock object literal for the router is present

#### Scenario: Print route test fixes hoisting bug

- **Given** `src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`
- **When** the file is read
- **Then** mutable `vi.fn()` refs for params/search are wrapped in `vi.hoisted()`; no module-level `vi.fn()` refs are used inside a factory without `vi.hoisted()`

## MODIFIED Requirements

### Requirement: MODIFIED `createRouterMock` in `src/test-helpers/mocks.ts`

The system SHALL export `createRouterMock(opts?)` accepting optional `params`, `search`, and `extras` options, and a unified `Link` that supports optional `params` prop URL substitution.

#### Scenario: Default call (no options)

- **Given** a test file calls `vi.mock('@tanstack/react-router', () => createRouterMock())`
- **When** the mocked module is used in a component under test
- **Then** `Link` renders an `<a>` with `href={to}`, `useParams()` returns `{}`, `useSearch()` returns `{}`, `redirect(opts)` returns `{ type: 'redirect', options: opts }`, `useNavigate()` returns a `vi.fn()`

#### Scenario: Custom params and search

- **Given** a test file calls `createRouterMock({ params: { cookbookId: 'cb-1' }, search: { displayonly: '1' } })`
- **When** a component calls `Route.useParams()` and `Route.useSearch()`
- **Then** they return `{ cookbookId: 'cb-1' }` and `{ displayonly: '1' }` respectively

#### Scenario: Link with params substitution

- **Given** a component renders `<Link to="/cookbooks/$cookbookId/recipes" params={{ cookbookId: 'abc' }}>`
- **When** rendered in a test using the mocked `Link`
- **Then** the rendered `<a>` has `href="/cookbooks/abc/recipes"`

#### Scenario: Extras pass-through

- **Given** a test file calls `createRouterMock({ extras: { Outlet: () => null } })`
- **When** the mocked module is imported
- **Then** `Outlet` is available on the mock and renders null

## REMOVED Requirements

### Requirement: REMOVED Inline router mock duplication

Reason for removal: Replaced by centralized factory. All 12 previously-inline mocks are eliminated in favor of `createRouterMock()` / `createRouterMockForHooks()` calls.

## Traceability

- Proposal: "12 test files with inline mocks" → Requirement: No inline router mocks
- Proposal: "Extend `createRouterMock()`" → Requirement: MODIFIED factory signature
- Design Decision 1 (options bag) → Requirement: MODIFIED factory signature
- Design Decision 2 (unified Link) → Scenario: Link with params substitution
- Design Decision 3 (hooks export) → Scenario: Hook test uses hooks factory
- Design Decision 4 (vi.hoisted fix) → Scenario: Print route test fixes hoisting bug
- Requirement: No inline mocks → Tasks: migrate-groups-1-2, migrate-group-3, migrate-groups-4-5-6
- Requirement: MODIFIED factory → Tasks: update-factory

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Full test suite passes after migration

- **Given** all 12 test files have been migrated to the factory
- **When** `npm run test` is executed
- **Then** all tests pass with zero failures and zero regressions vs. pre-migration baseline

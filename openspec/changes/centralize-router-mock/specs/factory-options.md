## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `RouterMockOptions` interface exported from `src/test-helpers/mocks.ts`

The system SHALL export a `RouterMockOptions` TypeScript interface with optional `params`, `search`, and `extras` fields, typed for discoverability.

#### Scenario: TypeScript consumers get type safety

- **Given** a test author writes `createRouterMock({ params: { recipeId: 'r1' } })`
- **When** TypeScript compiles the test
- **Then** no type errors; unknown option keys are flagged at compile time

#### Scenario: Unknown option key rejected

- **Given** a test author writes `createRouterMock({ typo: 'x' })`
- **When** TypeScript compiles the test
- **Then** a compile-time error is raised ("Object literal may only specify known properties")

### Requirement: ADDED `createRouterMockForHooks` export

The system SHALL export `createRouterMockForHooks(useRouteContextFn)` that returns a mock object with only `getRouteApi`.

#### Scenario: `getRouteApi` mock wired correctly

- **Given** `createRouterMockForHooks(() => mockCtx)` is passed to `vi.mock`
- **When** code under test calls `getRouteApi('__root__').useRouteContext()`
- **Then** it returns `mockCtx`

## MODIFIED Requirements

### Requirement: MODIFIED `createRouterMock` return type includes all previously-inline mock fields

The system SHALL return an object containing: `createFileRoute`, `Link`, `redirect`, `useNavigate`, and any fields passed via `extras`.

#### Scenario: All base fields present

- **Given** `createRouterMock()` called with no options
- **When** the return value is inspected
- **Then** it contains `createFileRoute`, `Link`, `redirect`, `useNavigate`

#### Scenario: Extras merged

- **Given** `createRouterMock({ extras: { Outlet: () => null } })`
- **When** return value is inspected
- **Then** it contains `Outlet` in addition to all base fields

## REMOVED Requirements

None.

## Traceability

- Design Decision 1 (options bag) → Requirement: `RouterMockOptions` interface
- Design Decision 2 (unified Link) → Scenario: Link with params substitution (in no-inline-router-mocks.md)
- Design Decision 3 (hooks export) → Requirement: `createRouterMockForHooks`
- Requirement: `RouterMockOptions` → Task: update-factory
- Requirement: `createRouterMockForHooks` → Task: update-factory

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Factory is discoverable

- **Given** a developer is writing a new route test
- **When** they import from `@/test-helpers/mocks`
- **Then** TypeScript autocomplete surfaces `createRouterMock` and `createRouterMockForHooks`

## GitHub Issues

- #366

## Why

- Problem statement: `vi.mock('@tanstack/react-router', ...)` is duplicated inline across 12 test files. A shared `createRouterMock()` factory already exists in `src/test-helpers/mocks.ts` but has zero users.
- Why now: Issue #366 explicitly calls this out. Wiring it up now prevents further drift as new test files are added.
- Business/user impact: Maintainability — changing the router mock shape today requires editing 12 files. After this change: 1 file.

## Problem Space

- Current behavior: Each test file declares its own inline `vi.mock('@tanstack/react-router', ...)` block. All are subtly different (different `Link` signatures, different `createFileRoute` shapes, missing `redirect`/`useNavigate` in some).
- Desired behavior: All tests import from `src/test-helpers/mocks.ts`. The factory handles all variants via options. One source of truth.
- Constraints:
  - Vitest hoists `vi.mock()` factories before module-level variable declarations — references to module-scope `vi.fn()` inside factories are `undefined` unless wrapped in `vi.hoisted()`.
  - Some tests need per-test-mutable params/search (Group 3) — the factory must accept function overrides, not just static values.
  - `useAuth.test.ts` uses `getRouteApi` — a different API surface. Needs its own named export, not overloaded onto the main factory.
- Assumptions: All 12 files can be migrated without changing test assertions.
- Edge cases considered:
  - `CookbookRecipeCard` and `CookbookStandaloneLayout` use a `Link` with `params` prop for URL substitution — unified `Link` handles this as a superset.
  - `cookbooks.$cookbookId_.print.test.tsx` currently has a latent hoisting bug (module-level `vi.fn()` refs used in factory without `vi.hoisted()`). Fix during migration.
  - `CookbooksPage.test.tsx` needs `Outlet` — passed via `extras`.

## Scope

### In Scope

- Extend `createRouterMock()` in `src/test-helpers/mocks.ts` to accept `{ params, search, extras }` options
- Add `createRouterMockForHooks()` named export for `getRouteApi`-style mocks
- Unify `Link` to support optional `params` prop URL substitution
- Migrate all 12 test files to use the factory
- Fix `vi.hoisted()` latent bug in `cookbooks.$cookbookId_.print.test.tsx`

### Out of Scope

- Changes to any non-test source files
- Adding new tests beyond fixing the hoisting bug
- Migrating non-router mocks (tRPC, react-query, etc.)

## What Changes

- `src/test-helpers/mocks.ts` — extend `createRouterMock()` signature; add `createRouterMockForHooks()`
- 12 test files — replace inline `vi.mock` blocks with factory calls
- `cookbooks.$cookbookId_.print.test.tsx` — add `vi.hoisted()` for mutable params/search refs

## Risks

- Risk: A test relied on subtly different mock shape (e.g., `createFileRoute` returning `opts` directly vs wrapped in `{ options: opts }`)
  - Impact: Test failure after migration
  - Mitigation: Run full test suite after each group migration; fix any shape mismatches before proceeding
- Risk: `vi.hoisted()` fix changes execution order in print test
  - Impact: Possible test behavior change
  - Mitigation: Verify all print route tests pass post-migration

## Open Questions

No unresolved ambiguity. Design decisions confirmed in explore session:
- `useAuth.test.ts` gets its own `createRouterMockForHooks()` export
- Unified `Link` with params substitution (superset approach)
- `vi.hoisted()` fix included in this change

## Non-Goals

- Making `createRouterMock` handle every possible TanStack Router API surface
- Creating a full router testing harness
- Touching production code

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

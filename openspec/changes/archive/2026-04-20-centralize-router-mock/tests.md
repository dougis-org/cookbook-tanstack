---
name: tests
description: Tests for the centralize-router-mock change
---

# Tests

## Overview

This change is a test-infrastructure refactor. The "tests" are the 12 existing route/component/hook test files themselves — migration correctness is verified by running the existing test suite green after each task.

Because this change does NOT add new production behavior, TDD here means: **red first via migration** (remove the inline mock, wire the factory → test fails if shape is wrong → fix factory → green).

## Testing Steps

For each migration task (Tasks 2–6):

1. **Red:** Remove the inline `vi.mock` block and add the factory import. Run the test — expect failures if mock shape mismatches.
2. **Green:** Adjust factory options or fix shape mismatch in `mocks.ts`.
3. **Refactor:** Verify no inline mock remains; ensure factory options are minimal.

## Test Cases

### Task 1 — Factory update (`src/test-helpers/mocks.ts`)

- [ ] `createRouterMock()` with no args returns object with `createFileRoute`, `Link`, `redirect`, `useNavigate`
  - Spec: `specs/factory-options.md` → "All base fields present"
- [ ] `createRouterMock({ params: { id: 'x' } })` — `useParams()` inside `createFileRoute` result returns `{ id: 'x' }`
  - Spec: `specs/no-inline-router-mocks.md` → "Custom params and search"
- [ ] `createRouterMock({ search: { q: 'foo' } })` — `useSearch()` returns `{ q: 'foo' }`
  - Spec: `specs/no-inline-router-mocks.md` → "Custom params and search"
- [ ] `createRouterMock({ extras: { Outlet: () => null } })` — mock includes `Outlet`
  - Spec: `specs/factory-options.md` → "Extras merged"
- [ ] `createRouterMock()` `Link` with plain `to="/foo"` renders `<a href="/foo">`
  - Spec: `specs/no-inline-router-mocks.md` → "Default call (no options)"
- [ ] `createRouterMock()` `Link` with `to="/cookbooks/$id"` and `params={{ id: 'abc' }}` renders `<a href="/cookbooks/abc">`
  - Spec: `specs/no-inline-router-mocks.md` → "Link with params substitution"
- [ ] `createRouterMockForHooks(fn)` — `getRouteApi().useRouteContext()` calls `fn`
  - Spec: `specs/factory-options.md` → "`getRouteApi` mock wired correctly"

### Task 2 — Group 1 migration (`-home`, `-index`)

- [ ] `src/routes/__tests__/-home.test.tsx` passes: `npx vitest run src/routes/__tests__/-home.test.tsx`
  - Task: Task 2 / Spec: `specs/no-inline-router-mocks.md` → "Standard route test uses factory"
- [ ] `src/routes/__tests__/-index.test.tsx` passes: `npx vitest run src/routes/__tests__/-index.test.tsx`

### Task 3 — Group 2 migration (param-based)

- [ ] `src/routes/recipes/__tests__/-$recipeId.test.tsx` passes
- [ ] `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` passes
- [ ] `src/components/cookbooks/__tests__/CookbookPrintPage.test.tsx` passes
- [ ] `src/routes/admin/__tests__/users.test.tsx` passes

### Task 4 — Group 3 migration + vi.hoisted fix

- [ ] `src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx` passes with `vi.hoisted()` refs
  - Spec: `specs/no-inline-router-mocks.md` → "Print route test fixes hoisting bug"
- [ ] All per-test `mockReturnValue` overrides still work correctly after hoisting fix

### Task 5 — Groups 4–5 migration (Link-only + extras)

- [ ] `src/components/cookbooks/__tests__/CookbookRecipeCard.test.tsx` passes — href contains substituted recipeId
  - Spec: `specs/no-inline-router-mocks.md` → "Link with params substitution"
- [ ] `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` passes
- [ ] `src/components/cookbooks/__tests__/CookbooksPage.test.tsx` passes — `Outlet` available via extras

### Task 6 — Group 6 migration (hooks)

- [ ] `src/hooks/__tests__/useAuth.test.ts` passes with `createRouterMockForHooks`
  - Spec: `specs/no-inline-router-mocks.md` → "Hook test uses hooks factory"

### Task 7 — Full suite

- [ ] `npm run test` — zero failures
- [ ] Grep: `grep -r "vi.mock('@tanstack/react-router'" src --include="*.ts" --include="*.tsx"` returns only `src/test-helpers/mocks.ts` and `src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`
  - Spec: `specs/no-inline-router-mocks.md` → "No inline router mocks in test files"

# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/centralize-router-mock` then immediately `git push -u origin feat/centralize-router-mock`

## Execution

### Task 1 — Update `src/test-helpers/mocks.ts`

- [ ] Add `RouterMockOptions` interface with optional `params?: Record<string, string>`, `search?: Record<string, unknown>`, `extras?: Record<string, unknown>`
- [ ] Update `createRouterMock(opts?: RouterMockOptions)` to use params/search from options (default `{}`)
- [ ] Replace `Link` with unified version that handles optional `params` prop URL substitution via `/\$(\w+)/g` regex
- [ ] Add `createRouterMockForHooks(useRouteContextFn: () => unknown)` export returning `{ getRouteApi: () => ({ useRouteContext: useRouteContextFn }) }`
- [ ] Verify: `npm run test -- src/test-helpers` (or full suite if no isolated test for mocks)

### Task 2 — Migrate Group 1: home + index (exact match to existing `createRouterMock`)

Files: `src/routes/__tests__/-home.test.tsx`, `src/routes/__tests__/-index.test.tsx`

- [ ] Replace inline `vi.mock('@tanstack/react-router', () => ({ ... }))` with `vi.mock('@tanstack/react-router', () => createRouterMock())`
- [ ] Add import: `import { createRouterMock } from '@/test-helpers/mocks'`
- [ ] Verify: `npx vitest run src/routes/__tests__/-home.test.tsx src/routes/__tests__/-index.test.tsx`

### Task 3 — Migrate Group 2: param-based route tests

Files:
- `src/routes/recipes/__tests__/-$recipeId.test.tsx` → `createRouterMock({ params: { recipeId: 'r1' } })`
- `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` → `createRouterMock({ params: { cookbookId: 'cb-1' } })`
- `src/components/cookbooks/__tests__/CookbookPrintPage.test.tsx` → `createRouterMock({ params: { cookbookId: 'cb1' }, search: { displayonly: '1' } })`
- `src/routes/admin/__tests__/users.test.tsx` → `createRouterMock()` (no params needed; verify `createFileRoute` shape matches)

- [ ] Replace inline mocks with factory calls + import
- [ ] Verify: `npx vitest run src/routes/recipes/__tests__ src/components/cookbooks/__tests__/CookbookDetail.test.tsx src/components/cookbooks/__tests__/CookbookPrintPage.test.tsx src/routes/admin/__tests__`

### Task 4 — Migrate Group 3: print route (vi.hoisted fix)

File: `src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`

- [ ] Wrap mutable `vi.fn()` refs in `vi.hoisted()`:
  ```ts
  const mockUseParams = vi.hoisted(() => vi.fn().mockReturnValue({ cookbookId: 'cb-id' }))
  const mockUseSearch = vi.hoisted(() => vi.fn().mockReturnValue({ displayonly: undefined }))
  ```
- [ ] Keep inline factory (refs are mutable per-test; factory passes them directly) but use hoisted refs
- [ ] Verify: `npx vitest run src/routes/__tests__/cookbooks.$cookbookId_.print.test.tsx`

### Task 5 — Migrate Groups 4–5: Link-only + extras

Files:
- `src/components/cookbooks/__tests__/CookbookRecipeCard.test.tsx` → `createRouterMock()` (unified Link handles params substitution)
- `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` → `createRouterMock()` (same)
- `src/components/cookbooks/__tests__/CookbooksPage.test.tsx` → `createRouterMock({ extras: { Outlet: () => null } })`

- [ ] Replace inline mocks + import
- [ ] Verify: `npx vitest run src/components/cookbooks/__tests__/CookbookRecipeCard.test.tsx src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx src/components/cookbooks/__tests__/CookbooksPage.test.tsx`

### Task 6 — Migrate Group 6: hooks

File: `src/hooks/__tests__/useAuth.test.ts`

- [ ] Replace inline mock with `createRouterMockForHooks(() => mockUseRouteContext())`
- [ ] Add import: `import { createRouterMockForHooks } from '@/test-helpers/mocks'`
- [ ] Verify: `npx vitest run src/hooks/__tests__/useAuth.test.ts`

### Task 7 — Full suite verification

- [ ] `npm run test` — all tests pass
- [ ] `grep -r "vi.mock('@tanstack/react-router'" src --include="*.ts" --include="*.tsx"` — only `mocks.ts` and `cookbooks.$cookbookId_.print.test.tsx` appear

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Grep confirms no remaining unauthorized inline router mocks
- [ ] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/centralize-router-mock` and push to remote
- [ ] Open PR from `feat/centralize-router-mock` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments; address, commit, validate locally, push; wait 180s; repeat until no unresolved comments
- [ ] **Monitor CI checks** — poll for check status; fix failures, commit, validate locally, push; wait 180s; repeat until all pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): Codacy bot, Doug
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` if applicable
- [ ] Archive: move `openspec/changes/centralize-router-mock/` to `openspec/changes/archive/YYYY-MM-DD-centralize-router-mock/` in a single atomic commit (copy + delete staged together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-centralize-router-mock/` exists and `openspec/changes/centralize-router-mock/` is gone
- [ ] Push archive commit to `main`
- [ ] Prune: `git fetch --prune` and `git branch -d feat/centralize-router-mock`

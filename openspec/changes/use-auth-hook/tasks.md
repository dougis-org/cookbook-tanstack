## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git pull --ff-only`)
- [x] 1.2 Create branch `feat/use-auth-hook` from `main` and push to remote immediately (`git push -u origin feat/use-auth-hook`)

## 2. Hook Implementation

- [x] 2.1 Create `src/hooks/useAuth.ts` — wraps `useSession`, returns `{ session, isPending, isLoggedIn, userId }`
- [x] 2.2 Create `src/hooks/__tests__/useAuth.test.ts` — unit tests for authenticated, unauthenticated, and pending states (mock `useSession` at the `@/lib/auth-client` level in the hook's own tests)

## 3. Migrate Production Call Sites

- [x] 3.1 Update `src/components/Header.tsx` — replace `useSession` import with `useAuth`, use `{ session, isPending }` from hook
- [x] 3.2 Update `src/components/auth/ProfileInfo.tsx` — replace `useSession` import with `useAuth`, use `{ session, isPending }`
- [x] 3.3 Update `src/routes/recipes/index.tsx` — replace `useSession` import with `useAuth`, use `{ isLoggedIn, userId }` (remove local `isLoggedIn` derivation)
- [x] 3.4 Update `src/routes/recipes/$recipeId.tsx` — replace `useSession` import with `useAuth`, use `{ isLoggedIn, userId }`, compute `isOwner = userId === recipe?.userId`
- [x] 3.5 Update `src/routes/cookbooks/index.tsx` — replace `useSession` import with `useAuth`, use `{ isLoggedIn }`
- [x] 3.6 Update `src/routes/cookbooks.$cookbookId.tsx` — replace `useSession` import with `useAuth`, use `{ userId }`, compute `isOwner = userId === cookbook?.userId`

## 4. Migrate Test Mocks (Option B)

- [x] 4.1 Update `src/components/auth/__tests__/Header.test.tsx` — change mock target from `@/lib/auth-client` `useSession` to `@/hooks/useAuth` `useAuth`, returning canonical shape
- [x] 4.2 Update `src/components/auth/__tests__/ProfileInfo.test.tsx` — same mock target change
- [x] 4.3 Update `src/routes/recipes/__tests__/$recipeId.test.tsx` — same mock target change
- [x] 4.4 Update `src/components/cookbooks/__tests__/CookbooksPage.test.tsx` — same mock target change
- [x] 4.5 Update `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` — change `vi.mock('@/lib/auth-client', ...)` to mock `@/hooks/useAuth`

## 5. Validation

- [x] 5.1 Run `npm run test` — all unit and integration tests pass
- [x] 5.2 Run `npm run test:e2e` — all E2E tests pass
- [x] 5.3 Verify no remaining `useSession` imports in production component/route files (`grep -r "useSession" src/components src/routes`)
- [x] 5.4 Run `npm run build` — no TypeScript errors

## 6. PR and Merge

- [ ] 6.1 Commit all changes to `feat/use-auth-hook` and push
- [ ] 6.2 Open PR targeting `main` — reference issue #200 in PR description
- [ ] 6.3 Enable auto-merge on the PR
- [ ] 6.4 Monitor CI checks — fix any failures, commit, push, repeat until green
- [ ] 6.5 Address any review comments — commit fixes, push, repeat until no unresolved comments

## 7. Post-Merge

- [ ] 7.1 Checkout `main` and pull — verify merged changes are present
- [ ] 7.2 Sync spec delta: copy `openspec/changes/use-auth-hook/specs/use-auth-hook/spec.md` → `openspec/specs/use-auth-hook/spec.md`
- [ ] 7.3 Archive the change (run `/opsx:archive` or `openspec archive use-auth-hook`) in a single atomic commit
- [ ] 7.4 Push archive commit to `main`
- [ ] 7.5 Prune local branch `feat/use-auth-hook`

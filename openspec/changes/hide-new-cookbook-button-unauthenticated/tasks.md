## 1. Execution

- [x] 1.1 Check out `main` and pull the latest remote changes
- [x] 1.2 Create feature branch: `git checkout -b feat/hide-new-cookbook-button-unauthenticated`

## 2. Implementation

- [x] 2.1 In `src/routes/cookbooks.tsx`, add `useSession` to the import from `@/lib/auth-client`
- [x] 2.2 Derive `isLoggedIn` inside `CookbooksPage`: `const { data: session } = useSession()` and `const isLoggedIn = !!session?.user`
- [x] 2.3 Wrap the "New Cookbook" header button (lines 24–30) in `{isLoggedIn && (...)}`
- [x] 2.4 Wrap the "Create your first cookbook" empty-state button (lines 46–50) in `{isLoggedIn && (...)}`

## 3. Validation

- [x] 3.1 Run unit tests: `npx vitest run src/components/cookbooks/__tests__/CookbooksPage.test.tsx`
- [x] 3.2 Write unit test: "New Cookbook button not rendered when logged out"
- [x] 3.3 Write unit test: "New Cookbook button rendered when logged in"
- [x] 3.4 Write unit test: "Create your first cookbook button not rendered when logged out (empty state)"
- [x] 3.5 Run full test suite: `npm run test`
- [x] 3.6 Run E2E tests locally: `npm run test:e2e`
- [x] 3.7 Run build to verify TypeScript: `npm run build`

## 4. PR and Merge

- [x] 4.1 Commit changes with message referencing issue: `fix(cookbooks): hide create buttons from unauthenticated users (closes #190)`
- [x] 4.2 Push branch and open PR; reference issue #190 in the PR body
- [x] 4.3 Enable auto-merge on the PR
- [ ] 4.4 Resolve any CI failures or review comments before merge

## 5. Post-Merge

- [ ] 5.1 Archive this change: `/opsx:archive`
- [ ] 5.2 Sync approved spec to `openspec/specs/cookbook-auth-gating/spec.md`
- [ ] 5.3 Delete local feature branch after merge

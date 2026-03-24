## 1. Execution

- [x] 1.1 Check out `main` and pull the latest remote changes
- [x] 1.2 Create feature branch: `git checkout -b fix/cookbook-detail-owner-controls`

## 2. Tests (RED — write failing tests first)

- [x] 2.1 Create `src/e2e/cookbooks-auth.spec.ts`
- [x] 2.2 Write test: Edit and Delete buttons hidden when logged out
  - Register and login → create cookbook via UI (fill title, submit) → clear cookies → visit cookbook URL
  - Assert Edit button not visible, Delete button not visible
- [x] 2.3 Write test: Edit and Delete buttons hidden for non-owner
  - User A creates cookbook → clear cookies → register/login as user B → visit cookbook URL
  - Assert Edit button not visible, Delete button not visible
- [x] 2.4 Write test: Edit and Delete buttons visible for owner
  - Register and login → create cookbook → visit cookbook URL → waitForLoadState('networkidle')
  - Assert Edit button visible, Delete button visible
- [x] 2.5 Write test: Add Recipe button hidden when logged out
  - Same setup as 2.2 → assert Add Recipe button not visible
- [x] 2.6 Write test: Add Recipe button hidden for non-owner
  - Same setup as 2.3 → assert Add Recipe button not visible
- [x] 2.7 Write test: Add Recipe button visible for owner
  - Same setup as 2.4 → assert Add Recipe button visible
- [x] 2.8 Write test: Drag handle and Remove button hidden when logged out
  - Create cookbook with a recipe → clear cookies → visit cookbook URL
  - Assert no element with aria-label "Drag to reorder" visible
  - Assert no element with aria-label matching "Remove …" visible
- [x] 2.9 Write test: Drag handle and Remove button hidden for non-owner
  - User A creates cookbook with a recipe → user B visits → same assertions as 2.8
- [x] 2.10 Write test: Drag handle and Remove button visible for owner
  - Owner visits cookbook with a recipe → assert drag handle visible, Remove button visible
- [x] 2.11 Confirm all new tests fail (RED): `npx playwright test src/e2e/cookbooks-auth.spec.ts`

## 3. Implementation (GREEN)

- [x] 3.1 In `src/routes/cookbooks.$cookbookId.tsx`, import `useSession` from `@/lib/auth-client`
- [x] 3.2 Derive `isOwner` in `CookbookDetailPage`: `const { data: session } = useSession()` and `const isOwner = session?.user?.id === cookbook?.userId`
  - Note: derive after the cookbook query resolves; `isOwner` will be `false` until both session and cookbook are loaded
- [x] 3.3 Gate Edit and Delete header buttons behind `{isOwner && (...)}`
- [x] 3.4 Gate Add Recipe button behind `{isOwner && (...)}`
- [x] 3.5 Gate empty-state Add Recipe CTA behind `{isOwner && (...)}`
- [x] 3.6 Add `StaticRecipeRow` component (no drag handle, no Remove button; same visual card as `SortableRecipeRow`)
- [x] 3.7 Conditionally render recipe list:
  - Owner: existing `DndContext` → `SortableContext` → `SortableRecipeRow` (unchanged)
  - Non-owner: plain `<div>` → `StaticRecipeRow` (no DnD context)
- [x] 3.8 Confirm all new tests pass (GREEN): `npx playwright test src/e2e/cookbooks-auth.spec.ts`

## 4. Validation

- [x] 4.1 Run full unit test suite: `npm run test`
- [x] 4.2 Run full E2E suite: `npm run test:e2e`
- [x] 4.3 Verify TypeScript: `npm run build`

## 5. PR and Merge

- [x] 5.1 Commit changes referencing the issue: `fix(cookbooks): hide owner-only controls from non-owners (closes #199)`
- [x] 5.2 Push branch and open PR; reference issue #199 in the PR body
- [x] 5.3 Enable auto-merge on the PR
- [x] 5.4 Resolve any CI failures or review comments before merge

## 6. Post-Merge

- [x] 6.1 Archive this change: `/opsx:archive`
- [x] 6.2 Sync approved spec to `openspec/specs/cookbook-detail-owner-gating/spec.md`
- [x] 6.3 Delete local feature branch after merge

## 1. Preparation

- [x] 1.1 Checkout the default branch (`main`) and pull with fast-forward only
- [x] 1.2 Create the working branch `feat/recipe-form-persistence` and push it to remote: `git push -u origin feat/recipe-form-persistence`

## 2. Execution

### useAutoSave Hook (TDD)
- [x] 2.1 Create unit test `src/hooks/__tests__/useAutoSave.test.ts`
  - Implement test cases for `localStorage` persistence based on "Requirement: LocalStorage Autosave".
  - Implement test cases for server-side mutation triggering based on "Requirement: Server-side Autosave (Edit Mode)".
- [x] 2.2 Implement `src/hooks/useAutoSave.ts`
  - Implement debounced `localStorage` logic to pass tests.
  - Implement TRPC mutation logic for `isEdit` mode to pass tests.
- [x] 2.3 Verify all `useAutoSave` unit tests pass: `npx vitest src/hooks/__tests__/useAutoSave.test.ts`

### StatusIndicator Component
- [x] 2.4 Create `src/components/recipes/StatusIndicator.tsx` and basic styles
- [x] 2.5 Add component tests for each state (`idle`, `saving`, `saved`, `error`) based on "Requirement: Save Status Feedback"

### RecipeForm Integration (BDD)
- [x] 2.6 Create E2E test `src/e2e/recipe-persistence.spec.ts`
  - Define Playwright scenarios for "Draft Restoration Prompt" and "Revert to Server State".
  - Define scenario for "Edit mode — autosaved changes do not block navigation" from the `unsaved-changes-guard` spec.
- [x] 2.7 Integrate `useAutoSave` and `StatusIndicator` into `RecipeForm.tsx`
- [x] 2.8 Implement draft restoration prompt UI and logic in `RecipeForm.tsx`
- [x] 2.9 Implement "Revert" button logic (Reset form + Purge local draft)
- [x] 2.10 Update `useBlocker` and `beforeunload` logic to check `autoSaveStatus === 'saved'`

## 3. Validation

- [x] 3.1 Run all unit tests: `npm run test`
- [x] 3.2 Run all E2E tests: `npx playwright test src/e2e/recipe-persistence.spec.ts`
- [x] 3.3 Verify no linting or type errors: `npm run lint && npx tsc --noEmit`
- [x] 3.4 Manually verify the "Failed to save" and "Retry" states by simulating a network error

## 4. PR and Merge

- [x] 4.1 Commit all changes to the working branch
- [x] 4.2 Push changes to remote
- [x] 4.3 Open a Pull Request from `feat/recipe-form-persistence` to `main`
- [ ] 4.4 Monitor CI checks and address any review comments
- [x] 4.5 Enable auto-merge once approved and CI is green

## 5. Post-Merge

- [ ] 5.1 Checkout `main` and pull latest changes
- [ ] 5.2 Verify merged changes appear on the default branch
- [ ] 5.3 Sync approved spec deltas from `openspec/changes/recipe-form-persistence/specs/` to `openspec/specs/`
- [ ] 5.4 Archive the change directory as a single atomic commit
- [ ] 5.5 Prune the merged local branch `feat/recipe-form-persistence`

# Tasks — unsaved-changes-guard

## 1. Branch Setup

- [x] 1.1 Checkout `main`
- [x] 1.2 Pull latest `main` from remote to ensure local is up to date
- [x] 1.3 Create and checkout feature branch `feat/unsaved-changes-guard` from `main`

## 2. `ConfirmDialog` Component

- [x] 2.1 Create `src/components/ui/ConfirmDialog.tsx` with props: `message: string`, `confirmLabel?: string` (default `"Discard Changes"`), `cancelLabel?: string` (default `"Keep Editing"`), `onConfirm: () => void`, `onCancel: () => void`
- [x] 2.2 Style with fixed full-screen overlay (`bg-black/50`) and centred card (`slate-800` background, `cyan-500` confirm button, gray cancel button)

## 3. `RecipeForm` — Dirty Detection

- [x] 3.1 Add `isDirty` to the destructured `formState` from `useForm`
- [x] 3.2 Add module-level `sortedEqual(a: string[], b: string[]): boolean` helper
- [x] 3.3 Memoize initial external state values: `initialMealIds`, `initialCourseIds`, `initialPrepIds`, `initialSourceId` (from `initialData`, computed once at mount via `useMemo`)
- [x] 3.4 Compute `hasExternalChanges` combining sorted comparisons of the four external state values
- [x] 3.5 Derive `isFormDirty = isDirty || hasExternalChanges`

## 4. `RecipeForm` — Navigation Guard

- [x] 4.1 Add `useBlocker` call: `shouldBlockFn: () => isFormDirty`, `enableBeforeUnload: true`, `withResolver: true`
- [x] 4.2 Render `<ConfirmDialog>` when `blocker.status === 'blocked'`, wiring `blocker.proceed` → `onConfirm` and `blocker.reset` → `onCancel`

## 5. `RecipeForm` — Cancel Button

- [x] 5.1 Add `useRouter()` import and call
- [x] 5.2 Replace the Cancel `onClick` handler with `handleCancel`: calls `router.history.back()` when `window.history.length > 1`, otherwise `navigate({ to: '/recipes' })`

## 6. Tests

- [x] 6.1 `src/components/ui/__tests__/ConfirmDialog.test.tsx` — unit tests covering all spec scenarios: message renders, onConfirm fires, onCancel fires, default labels, custom labels, overlay present
- [x] 6.2 `src/components/recipes/__tests__/RecipeForm.test.tsx` — unsaved-changes guard scenarios:
  - Clean form: no modal on navigation
  - Dirty via RHF field: modal shown on Cancel
  - Dirty via taxonomy selection: modal shown on Cancel
  - Dirty via source change: modal shown on Cancel
  - Confirm discard: proceed called
  - Cancel discard: reset called, user stays on form
  - No false positive on initial render (new form)
  - No false positive on initial render (edit form with existing data)
  - Deselect-and-reselect same taxonomy item: form considered clean

## 7. QA

- [x] 7.1 Run `npm run test` — all unit and integration tests pass
- [x] 7.2 Run `npm run test:e2e` — all E2E tests pass
- [x] 7.3 Run `npm run build` — production build succeeds with no TypeScript errors

## 8. Pull Request

- [x] 8.1 Commit all changes on `feat/unsaved-changes-guard`
- [x] 8.2 Push branch to remote
- [x] 8.3 Open PR targeting `main`, referencing issue #183 in the description
- [x] 8.4 Enable auto-merge on the PR
- [x] 8.5 Run `/code-review:code-review` to review the PR and address all findings
- [x] 8.6 Confirm all CI quality gates pass (tests, build, type-check, Codacy/Snyk scans)
- [x] 8.7 Address all PR comments — whether from human reviewers or automated agents — before proceeding; for each round of changes: commit, push, re-run `/code-review:code-review`, and repeat until no unresolved comments remain
- [x] 8.8 Confirm PR is merged to `main`

## 9. Post-Merge Cleanup

- [x] 9.1 Delete remote feature branch `feat/unsaved-changes-guard`
- [x] 9.2 Delete local feature branch `feat/unsaved-changes-guard`
- [x] 9.3 Pull latest `main` locally to confirm merge is present

## 10. Archive Change

- [ ] 10.1 On `main`, run `/openspec-archive-change` to move `openspec/changes/unsaved-changes-guard-2026-03-26/` to `openspec/changes/archive/`
- [ ] 10.2 Commit the archive move on `main`
- [ ] 10.3 Push archive commit to `main`
- [ ] 10.4 Confirm `openspec/changes/unsaved-changes-guard-2026-03-26/` no longer exists and archived copy is on remote `main`

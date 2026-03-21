## 1. Branch Setup

- [x] 1.1 Checkout `main`, pull latest remote changes
- [x] 1.2 Create feature branch `feat/recipe-edit-enhancements-2026-03-21`

## 2. MultiSelectDropdown — Selected-First Sort

- [x] 2.1 Write failing tests in `src/components/ui/__tests__/MultiSelectDropdown.test.tsx` for selected-first alphabetical sort behavior (covers all scenarios in `multiselect-selected-first/spec.md`)
- [x] 2.2 Update `src/components/ui/MultiSelectDropdown.tsx` to derive `sortedOptions` (selected alpha first, then unselected alpha) and render `sortedOptions` instead of `options`
- [x] 2.3 Update any existing `MultiSelectDropdown` tests that assert fixed option order to reflect the new sorted order
- [x] 2.4 Run `npx vitest run src/components/ui/__tests__/MultiSelectDropdown.test.tsx` — all pass

## 3. RecipeDetail — Actions Prop

- [x] 3.1 Write failing tests in `src/components/recipes/__tests__/RecipeDetail.test.tsx` for the `actions` prop: renders content in title row when provided, no extra element when omitted
- [x] 3.2 Add `actions?: React.ReactNode` prop to `RecipeDetail` interface and render it top-right alongside the `<h1>` title (wrap title row in `flex items-center justify-between`)
- [x] 3.3 Run `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx` — all pass

## 4. RecipeDetail Route — Wire Edit Button

- [x] 4.1 In `src/routes/recipes/$recipeId.tsx`, pass a styled `<Link to="/recipes/$recipeId/edit" params={{ recipeId }}>Edit Recipe</Link>` as the `actions` prop to `<RecipeDetail>` when `isOwner` is true
- [x] 4.2 Verify via E2E or manual check that Edit button appears at top of detail card for owner, not for non-owner

## 5. SourcePickerDropdown — New Component

- [x] 5.1 Write failing tests in `src/components/ui/__tests__/SourcePickerDropdown.test.tsx` covering: placeholder trigger, selected name display, search filtering, select-and-close, click-outside close, Escape close, empty state, clear button (covers all scenarios in `source-picker-dropdown/spec.md`)
- [x] 5.2 Create `src/components/ui/SourcePickerDropdown.tsx` implementing the filterable single-select dropdown using `trpc.sources.search` with 300ms debounce; include clear affordance
- [x] 5.3 Run `npx vitest run src/components/ui/__tests__/SourcePickerDropdown.test.tsx` — all pass

## 6. RecipeForm — Swap Source and Taxonomy Controls

- [x] 6.1 Update `src/components/recipes/__tests__/RecipeForm.test.tsx` — update/add tests for `SourcePickerDropdown` usage and `MultiSelectDropdown` taxonomy controls replacing tag buttons (covers `taxonomy-multiselect-edit/spec.md`)
- [x] 6.2 In `src/components/recipes/RecipeForm.tsx`, replace the `<SourceSelector>` import and usage with `<SourcePickerDropdown>`; update `selectedSourceId` state handler to receive `(id, name)` pair
- [x] 6.3 In `src/components/recipes/RecipeForm.tsx`, remove the three tag-button blocks (meals/courses/preparations); add a `flex flex-wrap gap-2` container after the Difficulty field with three `<MultiSelectDropdown>` instances for meals, courses, and preparations
- [x] 6.4 Run `npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx` — all pass

## 7. Validation

- [x] 7.1 Run full test suite: `npm run test` — all pass
- [x] 7.2 Run E2E tests: `npm run test:e2e` — all pass
- [x] 7.3 Build check: `npm run build` — no errors

## 8. PR and Merge

- [x] 8.1 Push branch and open PR referencing issue #174; title: `feat: recipe edit enhancements (edit button, source picker, taxonomy dropdowns)`
- [x] 8.2 Enable auto-merge on the PR
- [ ] 8.3 Resolve any CI failures or review comments before merge

## 9. Post-Merge

- [ ] 9.1 Run `/opsx:archive` to archive this change and sync spec deltas to `openspec/specs/`
- [ ] 9.2 Delete the local feature branch after merge is confirmed

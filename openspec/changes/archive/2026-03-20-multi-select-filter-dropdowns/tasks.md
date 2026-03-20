## 1. Execution

- [x] 1.1 Check out `main` and pull latest remote changes
- [x] 1.2 Create feature branch `feat/multi-select-filter-dropdowns`

## 2. Backend — tRPC router

- [x] 2.1 In `src/server/trpc/routers/recipes.ts`, rename `classificationId: objectId.optional()` → `classificationIds: z.array(objectId).optional()` and `sourceId: objectId.optional()` → `sourceIds: z.array(objectId).optional()` in the `list` input schema
- [x] 2.2 Update `list` query filter logic: replace `filter.classificationId = input.classificationId` with `filter.classificationId = { $in: input.classificationIds }` (guard on array length); same for source
- [x] 2.3 Update `src/server/trpc/routers/__tests__/recipes.test.ts` — rename param references from singular to plural and add a test case for multi-value filtering (e.g., two classificationIds returns recipes from either)

## 3. Filter config

- [x] 3.1 In `src/lib/filterConfig.ts`, update `ROW_2_FILTERS` tuple: `['classificationId', 'sourceId']` → `['classificationIds', 'sourceIds']`; update `Row2FilterKey` type accordingly
- [x] 3.2 In `src/components/recipes/filters/filterConfigs.ts`, update `DropdownConfig.filterKey` type and values: `'classificationId'` → `'classificationIds'`, `'sourceId'` → `'sourceIds'`

## 4. New MultiSelectDropdown component

- [x] 4.1 Create `src/components/ui/MultiSelectDropdown.tsx` with the interface defined in design.md (options, selectedIds, onChange, placeholder, label, counts, dataTestId, ariaLabel)
- [x] 4.2 Implement button label logic: placeholder when empty, option name when 1, `"{n} {label}s"` when 2+
- [x] 4.3 Implement checkbox list panel with `max-h` + `overflow-y-auto`; style consistent with existing dark Tailwind design system (slate-800, cyan-500 accent)
- [x] 4.4 Implement click-outside close via `useEffect` mousedown listener with cleanup; implement Escape key close
- [x] 4.5 Add `aria-expanded` to the summary button
- [x] 4.6 Create `src/components/ui/__tests__/MultiSelectDropdown.test.tsx` covering: placeholder shown when empty, name shown for 1, count label for 2+, checkbox panel opens on click, checking adds ID, unchecking removes ID, counts displayed when prop provided, click-outside closes, Escape closes, aria-expanded reflects open state

## 5. FilterRow2Dropdowns — adopt MultiSelectDropdown

- [x] 5.1 Update `FilterRow2Dropdowns` props: `classificationId: string | undefined` → `classificationIds: string[] | undefined`; `sourceId: string | undefined` → `sourceIds: string[] | undefined`; update `updateSearch` signature accordingly
- [x] 5.2 Replace `<select>` elements with `<MultiSelectDropdown>` for both classification and source, passing options, selectedIds, onChange, placeholder, counts
- [x] 5.3 Update `src/components/recipes/filters/__tests__/FilterRow2Dropdowns.test.tsx` — update prop names, add tests for multi-select behavior (selecting two options calls updateSearch with array)

## 6. Recipe list page — URL schema, state, active badges

- [x] 6.1 In `src/routes/recipes/index.tsx`, update `searchSchema`: `classificationId: z.string().optional()` → `classificationIds: z.array(z.string()).optional()`; same for source
- [x] 6.2 Update all destructured state variable names and tRPC call from singular to plural
- [x] 6.3 Update `hasActiveFilters` check: `classificationId ||` → `classificationIds?.length ||`; same for source
- [x] 6.4 Update active badges: replace the scalar `classificationId` badge entry with a `.map()` over `classificationIds` (one badge per ID, name lookup from `classifications`); same for `sourceIds`
- [x] 6.5 Update `clearFilters` function if it references old param names
- [x] 6.6 Pass updated prop names (`classificationIds`, `sourceIds`) to `FilterRow2Dropdowns`

## 7. Validation

- [x] 7.1 Run `npm run test` — all unit and integration tests pass
- [x] 7.2 Run `npm run build` — TypeScript strict mode compiles without errors
- [x] 7.3 Manual smoke test: start dev server (`npm run dev`), open recipe list, select two categories, confirm both filter the list and two badges appear, clear one badge, confirm only one filter removed
- [x] 7.4 Run `npm run test:e2e` — existing E2E filter tests pass (update selectors if needed)

## 8. PR and Merge

- [x] 8.1 Commit all changes with a descriptive message referencing issue #165
- [x] 8.2 Push branch and open PR against `main`; reference issue #165 in PR description
- [x] 8.3 Enable auto-merge on the PR
- [x] 8.4 Resolve any CI failures or review comments before merge (do not skip hooks or bypass checks)

## 9. Post-Merge

- [ ] 9.1 Run `/openspec-archive-change` to sync spec deltas to `openspec/specs/` and archive this change
- [ ] 9.2 Delete local feature branch after archive

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/category-dropdown-lazy-fetch` then immediately `git push -u origin feature/category-dropdown-lazy-fetch`

## Execution

- [x] **Create `CategoryPickerDropdown` Component**
  - [x] Implement `src/components/ui/CategoryPickerDropdown.tsx` wrapping `SingleSelectDropdown`.
  - [x] Manage open state `isOpen`.
  - [x] Lazy fetch categories with `trpc.classifications.list.queryOptions()`, enabled only when `isOpen` is true.
  - [x] Pass `onOpenChange={setIsOpen}` and options to `SingleSelectDropdown`.
- [x] **Update `RecipeForm` Schema & Defaults**
  - [x] In `RecipeForm.tsx`, add `classificationName: z.string().optional()` to `recipeFormSchema`.
  - [x] Update `formDefaults` to include `classificationName: originalDataRef.current?.classificationName ?? ""`.
- [x] **Update `RecipeForm` Category Dropdown**
  - [x] Remove the mount-time classifications query `trpc.classifications.list.queryOptions()`.
  - [x] Replace `<SingleSelectDropdown>` with `<CategoryPickerDropdown>` under the Category field.
  - [x] Pass `value={watch("classificationId") || ""}` and `selectedName={watch("classificationName") || ""}` to `CategoryPickerDropdown`.
  - [x] On select:
    ```typescript
    onChange={(id, name) => {
      setValue("classificationId", id, { shouldDirty: true });
      setValue("classificationName", name, { shouldDirty: true });
    }}
    ```
- [x] **Write Unit Tests**
  - [x] Implement `src/components/ui/__tests__/CategoryPickerDropdown.test.tsx` verifying:
    - [x] Displays placeholder when empty.
    - [x] Displays selected name immediately.
    - [x] Queries categories only when opened.
    - [x] Filters categories and handles selection.
  - [x] Update `src/components/recipes/__tests__/RecipeForm.test.tsx` to align with the new schema and mock values.

## Push & Merge

- [x] Push branch to remote: `git push origin feature/category-dropdown-lazy-fetch`
- [x] Create Pull Request (set to auto-merge) and ensure body includes `Closes #514`.

## Validation

- [x] Run all quality validation steps:
  - [x] Run unit tests: `npm run test`
  - [x] Run typescript checks: `npx tsc --noEmit`
  - [x] Run build: `npm run build`
- [x] Ensure all required CI checks pass and verify PR merge.

## Post-Merge / Archive

- [ ] Sync approved spec to `openspec/specs/category-picker-dropdown/spec.md`.
- [ ] Archive the change: move `openspec/changes/category-dropdown-lazy-fetch/` to `openspec/changes/archive/2026-06-19-category-dropdown-lazy-fetch/`.
- [ ] Push doc branch, create PR with auto-merge, and monitor to completion.

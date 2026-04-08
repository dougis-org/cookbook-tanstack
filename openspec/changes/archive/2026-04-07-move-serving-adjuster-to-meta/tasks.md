# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/serving-adjuster-to-meta` then immediately `git push -u origin feat/serving-adjuster-to-meta`

## Execution

### 1. Write/update unit tests first (TDD)

- [x] In `src/components/recipes/__tests__/RecipeDetail.test.tsx`:
  - [x] Remove the `hideServingAdjuster` test group (`describe("hideServingAdjuster prop", ...)`)
  - [x] Remove any test that imports or references `ServingSizeAdjuster` by component name
  - [x] Add test: controls (`[-]`, `[+]`) render adjacent to the Servings label in the meta grid (not in Ingredients section)
  - [x] Add test: `Reset` button absent when `currentServings === recipe.servings`
  - [x] Add test: `Reset` button present after clicking `[+]`
  - [x] Add test: clicking `Reset` returns serving count to original and hides Reset button
  - [x] Add test: ingredients scale correctly after clicking `[+]` (integration of state lift)
  - [x] Add test: all three buttons have `print:hidden` class
  - [x] Add test: no controls rendered when `recipe.servings` is null/undefined
  - [x] Add test: `currentServings` resets when `recipe.id` changes (re-render with different recipe prop)

### 2. Delete `ServingSizeAdjuster` component and tests

- [x] Delete `src/components/recipes/ServingSizeAdjuster.tsx`
- [x] Delete `src/components/recipes/__tests__/ServingSizeAdjuster.test.tsx`
- [x] Confirm no remaining imports of `ServingSizeAdjuster` anywhere in the codebase

### 3. Rewrite `RecipeDetail.tsx`

- [x] Remove `import ServingSizeAdjuster` from `src/components/recipes/RecipeDetail.tsx`
- [x] Remove `hideServingAdjuster` from `RecipeDetailProps` interface
- [x] Remove `hideServingAdjuster` from the destructured props
- [x] Add `const [currentServings, setCurrentServings] = useState(recipe.servings ?? 1)` state
- [x] Add `useEffect(() => { setCurrentServings(recipe.servings ?? 1) }, [recipe.id, recipe.servings])` reset on recipe change
- [x] Replace existing `scaledIngredientLines` state + callback pattern with:
  ```ts
  const scaledIngredientLines = useMemo(() => {
    if (!recipe.servings) return ingredientLines
    const factor = currentServings / recipe.servings
    return ingredientLines.map((line) => scaleQuantity(line, factor))
  }, [currentServings, ingredientLines, recipe.servings])
  ```
- [x] Add `import { scaleQuantity } from '@/lib/servings'` if not already present
- [x] In the Recipe Meta grid, replace the static Servings `<RecipeMetaItem>` with an inline Servings cell:
  - Display label "Servings" (matching existing style: `text-sm text-gray-500 dark:text-gray-400`)
  - If `recipe.servings` is null/undefined: display "N/A" as plain text (no controls)
  - If `recipe.servings` is defined: render `[-] {currentServings} [+]` with `print:hidden` class and correct `aria-label` attributes
  - Conditionally render `Reset` button with `print:hidden` when `currentServings !== recipe.servings`
- [x] Remove `<ServingSizeAdjuster>` from the Ingredients section
- [x] Update ingredient list rendering: always use `scaledIngredientLines` (remove the `recipe.servings && !hideServingAdjuster` conditional guard since scaling is now always active when servings is defined)

### 4. Update the print route

- [x] In `src/routes/cookbooks.$cookbookId_.print.tsx`: remove `hideServingAdjuster` from the `<RecipeDetail>` usage (line 89)

### 5. Update the E2E test

- [x] In `src/e2e/recipes-serving-adjuster.spec.ts`: verify the test still passes as-is (button aria-labels are unchanged: "increase servings", "reset"). If the test uses a positional selector or section context that breaks, update to remove the section constraint.

## Validation

- [x] Run unit/integration tests: `npm run test` — all tests must pass
- [x] Run E2E test for serving adjuster: `npx playwright test src/e2e/recipes-serving-adjuster.spec.ts`
- [x] Run E2E test for cookbook print: `npx playwright test src/e2e/cookbooks-print.spec.ts`
- [x] Run type checks and build: `npm run build` — must complete with zero TypeScript errors
- [x] Confirm no references to `ServingSizeAdjuster` or `hideServingAdjuster` remain in the codebase
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with zero errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/serving-adjuster-to-meta` and push to remote
- [x] Open PR from `feat/serving-adjuster-to-meta` to `main` — reference issue #272 in the PR body
- [ ] Enable auto-merge on the PR
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow all remote push validation steps, push; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — if any check fails, diagnose, fix, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for the PR to merge — never force-merge; if a human force-merges, proceed to Post-Merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CodeRabbit) + Doug Hubbard
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] No documentation changes required for this change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/move-serving-adjuster-to-meta/` to `openspec/changes/archive/YYYY-MM-DD-move-serving-adjuster-to-meta/` — stage both the new location and deletion of the old location in a single atomic commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-move-serving-adjuster-to-meta/` exists and `openspec/changes/move-serving-adjuster-to-meta/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] `git fetch --prune` and `git branch -d feat/serving-adjuster-to-meta`

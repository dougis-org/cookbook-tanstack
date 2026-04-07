## GitHub Issues

- #272

## Why

- Problem statement: The serving size adjuster (`ServingSizeAdjuster`) is rendered inside the Ingredients section, creating a UX disconnect — the "Servings" label already appears in the Recipe Meta grid, so users encounter the concept twice in two different visual contexts.
- Why now: The RecipeDetail component is actively being iterated on. Fixing the placement now avoids accumulating further tech debt around this component before a larger display redesign lands.
- Business/user impact: Users can adjust serving sizes from the natural location (the Servings meta field), reducing confusion. Print output is cleaner with controls suppressed via CSS rather than a prop.

## Problem Space

- Current behavior: `ServingSizeAdjuster` owns `currentServings` state and renders a `[-] n [+] [Reset]` widget inside the Ingredients section header. `RecipeDetail` passes `hideServingAdjuster` to the print route to suppress it entirely.
- Desired behavior: The `[-] n [+]` controls (and conditional Reset) live inline in the Servings meta cell. `currentServings` state lives in `RecipeDetail`. Controls are hidden in print via `print:hidden` Tailwind classes — no prop needed. `ServingSizeAdjuster.tsx` is deleted.
- Constraints: The meta grid cell is 1-of-4 columns. No layout changes are in scope — the buttons must fit as-is in the existing cell width.
- Assumptions: The cookbook print route (`cookbooks.$cookbookId_.print.tsx`) always renders recipes at default serving size (fresh state, no user selection persisted). Serving count and ingredient scale will always match in print.
- Edge cases considered:
  - Recipe with no `servings` value: show "N/A" static, no controls rendered.
  - `currentServings` drifts from `recipe.servings` when recipe prop changes (e.g., navigating between recipes): reset via `useEffect` on `recipe.id`, matching the existing pattern.
  - Ingredients list is empty: controls still render in the meta cell (they scale an empty list harmlessly).

## Scope

### In Scope

- Lift `currentServings` state into `RecipeDetail`
- Move `[-] n [+] [Reset]` controls into the Servings meta cell (inline, not a separate block)
- Reset button visible only when `currentServings !== recipe.servings`
- Apply `print:hidden` to all three buttons
- Remove `ServingSizeAdjuster` from the Ingredients section in `RecipeDetail`
- Delete `src/components/recipes/ServingSizeAdjuster.tsx`
- Delete `src/components/recipes/__tests__/ServingSizeAdjuster.test.tsx`
- Remove `hideServingAdjuster` prop from `RecipeDetailProps` and all call sites
- Update `src/routes/cookbooks.$cookbookId_.print.tsx` to remove `hideServingAdjuster`
- Update `src/e2e/recipes-serving-adjuster.spec.ts` — button context changes (now in meta grid, not ingredients header) but user actions are identical

### Out of Scope

- Layout changes to the meta grid (no column span changes)
- Persisting selected serving size across routes (e.g., to the print route)
- Redesigning the RecipeDetail page layout
- Any changes to `src/lib/servings.ts` or `scaleQuantity`

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: lift state, inline controls in Servings cell, remove `ServingSizeAdjuster` usage, remove `hideServingAdjuster` prop
- `src/components/recipes/ServingSizeAdjuster.tsx`: deleted
- `src/components/recipes/__tests__/ServingSizeAdjuster.test.tsx`: deleted
- `src/routes/cookbooks.$cookbookId_.print.tsx`: remove `hideServingAdjuster` prop from `<RecipeDetail>`
- `src/components/recipes/__tests__/RecipeDetail.test.tsx`: update tests — remove `hideServingAdjuster` test group, add tests for controls in meta cell
- `src/e2e/recipes-serving-adjuster.spec.ts`: verify buttons are still findable by aria-label (location changes, labels stay the same)

## Risks

- Risk: Existing `RecipeDetail` unit tests reference `ServingSizeAdjuster` by import or test-id.
  - Impact: Tests break until updated.
  - Mitigation: Update tests as part of this change (covered in tasks).

- Risk: `hideServingAdjuster` is referenced in tests as a prop; removing it could leave stale test assertions.
  - Impact: False-positive test pass or compile error.
  - Mitigation: Search all test files for `hideServingAdjuster` and remove/update references.

## Open Questions

No unresolved ambiguity. The following decisions were confirmed during exploration:
- Reset button: show only when `currentServings !== recipe.servings` (not always visible).
- Print behavior: always renders at default servings (fresh state); CSS `print:hidden` is sufficient.
- `ServingSizeAdjuster.tsx`: deleted entirely.
- Meta grid layout: unchanged (no column span changes).

## Non-Goals

- Persisting the user's serving size selection across navigation or to the print route
- Redesigning the Recipe Meta grid layout
- Adding any new serving-related features (max servings cap, fractional servings, etc.)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

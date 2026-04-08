## Context

- Relevant architecture: `RecipeDetail` is the primary recipe display component (`src/components/recipes/RecipeDetail.tsx`). It renders a meta grid (prep time, cook time, servings, difficulty), then ingredients and instructions sections. `ServingSizeAdjuster` (`src/components/recipes/ServingSizeAdjuster.tsx`) is a self-contained component that owns `currentServings` state and calls back with scaled ingredient lines. The scaling logic lives in `src/lib/servings.ts` (`scaleQuantity`), which is separate from the UI and is not changing.
- Dependencies: `scaleQuantity` from `src/lib/servings.ts` (unchanged). No external data dependencies — this is purely a UI/state reorganization.
- Interfaces/contracts touched:
  - `RecipeDetailProps`: remove `hideServingAdjuster?: boolean`
  - `ServingSizeAdjusterProps`: entire interface deleted
  - `cookbooks.$cookbookId_.print.tsx`: remove `hideServingAdjuster` prop usage

## Goals / Non-Goals

### Goals

- Relocate serving size controls to the Servings meta cell in `RecipeDetail`
- Lift `currentServings` state ownership to `RecipeDetail`
- Suppress controls in print via `print:hidden` CSS (no prop required)
- Delete `ServingSizeAdjuster` component and its tests
- Keep scaling behavior identical to current implementation

### Non-Goals

- Changing `scaleQuantity` or any scaling logic
- Persisting selected serving size across route navigations
- Modifying the meta grid layout (no column span changes)
- Any new serving-related features

## Decisions

### Decision 1: Lift `currentServings` state to `RecipeDetail`

- Chosen: `RecipeDetail` owns `const [currentServings, setCurrentServings] = useState(recipe.servings ?? 1)` and derives `scaledIngredientLines` inline via `useMemo`.
- Alternatives considered: Keep `ServingSizeAdjuster` but change it to a controlled component (pass `currentServings` and `setCurrentServings` as props). This avoids deleting the file but adds prop-drilling for little benefit.
- Rationale: The component's only job was managing this one piece of state and calling back. Lifting state up and deleting the component is simpler — fewer files, fewer indirections.
- Trade-offs: Slightly more logic in `RecipeDetail`, but the component was already the natural owner of `scaledIngredientLines`.

### Decision 2: `print:hidden` CSS instead of `hideServingAdjuster` prop

- Chosen: Apply `className="print:hidden"` to the `[-]`, `[+]`, and `Reset` buttons. Remove `hideServingAdjuster` prop entirely.
- Alternatives considered: Keep the prop, rename it `printMode`. This works but requires prop-threading and is inconsistent with the existing pattern (chiclet wrapper already uses `print:hidden`).
- Rationale: CSS-based suppression is the established pattern in this codebase. No prop needed, no call-site changes beyond removing the now-deleted prop.
- Trade-offs: The `/cookbooks/:id/print?displayonly=1` preview URL will still show controls on-screen (they only hide during actual browser print). This is acceptable — the preview is a screen view.

### Decision 3: Reset button visible only when changed

- Chosen: `{currentServings !== recipe.servings && <button ...>Reset</button>}`
- Alternatives considered: Always show Reset. Simpler logic, clearer affordance, but adds visual noise when nothing is changed.
- Rationale: Confirmed with requester. Conditional visibility matches the existing `ServingSizeAdjuster` behavior.
- Trade-offs: None significant.

### Decision 4: Inline the Servings cell rather than creating a new component

- Chosen: Special-case the Servings cell directly in `RecipeDetail`'s JSX. The other three meta cells continue using `<RecipeMetaItem>`.
- Alternatives considered: Create a `<ServingsMetaCell>` component. Adds a file for code that's used exactly once.
- Rationale: The CLAUDE.md guidance explicitly discourages single-use component abstractions. Inline is the right call here.
- Trade-offs: `RecipeDetail` JSX is slightly longer, but the logic is simple and localized.

### Decision 5: `scaledIngredientLines` derived via `useMemo` in `RecipeDetail`

- Chosen: Replace the `onScaledIngredientsChange` callback pattern with a `useMemo`:
  ```ts
  const scaledIngredientLines = useMemo(() => {
    if (!recipe.servings) return ingredientLines
    const factor = currentServings / recipe.servings
    return ingredientLines.map((line) => scaleQuantity(line, factor))
  }, [currentServings, ingredientLines, recipe.servings])
  ```
  The `useState(scaledIngredientLines)` + `useEffect` pattern in the current `RecipeDetail` is replaced by this memo.
- Alternatives considered: Keep the `useState` + callback approach. This was only necessary because the state lived in a child component. With state lifted, `useMemo` is simpler and avoids a render cycle.
- Rationale: `useMemo` is the idiomatic React pattern for derived values when the source data is already in scope.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Move `[-] n [+] [Reset]` controls to Servings meta cell
  - Design decision: Decision 4 (inline in RecipeDetail JSX)
  - Validation approach: Unit test asserts controls render inside the meta section; E2E test clicks increase/decrease buttons and verifies ingredient scaling

- Proposal element: Lift `currentServings` state to `RecipeDetail`
  - Design decision: Decision 1 + Decision 5
  - Validation approach: Unit tests verify `currentServings` state responds to button clicks and resets on `recipe.id` change

- Proposal element: Print suppression via `print:hidden`
  - Design decision: Decision 2
  - Validation approach: Unit test verifies buttons have `print:hidden` class; E2E print spec verifies controls absent (already tested via `cookbooks-print.spec.ts`)

- Proposal element: Delete `ServingSizeAdjuster.tsx`
  - Design decision: Decision 1 (state lifted; component has no remaining purpose)
  - Validation approach: Build passes with no import errors; no references remain in codebase

- Proposal element: Remove `hideServingAdjuster` prop
  - Design decision: Decision 2
  - Validation approach: TypeScript compiler errors if any call site still passes the prop

## Functional Requirements Mapping

- Requirement: Controls appear in the Servings meta cell, not the Ingredients section
  - Design element: Decision 4 — inline JSX in `RecipeDetail` meta grid
  - Acceptance criteria reference: specs/serving-controls-location.md
  - Testability notes: Unit test asserts `getByRole('button', { name: /increase servings/i })` is adjacent to the Servings label, not the Ingredients heading

- Requirement: Ingredient quantities scale with `currentServings`
  - Design element: Decision 5 — `useMemo` for `scaledIngredientLines`
  - Acceptance criteria reference: specs/ingredient-scaling.md
  - Testability notes: Unit test changes `currentServings` via button click and asserts ingredient text changes; E2E test verifies "3 cups flour" after incrementing from 2

- Requirement: Reset button appears only when `currentServings !== recipe.servings`
  - Design element: Decision 3 — conditional render
  - Acceptance criteria reference: specs/serving-controls-location.md
  - Testability notes: Unit test verifies Reset absent at default; present after increment; absent after reset click

- Requirement: Controls hidden in print
  - Design element: Decision 2 — `print:hidden` class
  - Acceptance criteria reference: specs/print-behavior.md
  - Testability notes: Unit test asserts `print:hidden` class on buttons; E2E print spec verifies no controls visible

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `currentServings` resets when navigating to a different recipe
  - Design element: `useEffect(() => { setCurrentServings(recipe.servings ?? 1) }, [recipe.id, recipe.servings])`
  - Acceptance criteria reference: specs/ingredient-scaling.md
  - Testability notes: Unit test re-renders with different recipe prop and asserts `currentServings` returns to new recipe's default

- Requirement category: operability
  - Requirement: TypeScript strict mode compliance — no unused props, no dead imports
  - Design element: Removing `hideServingAdjuster` from `RecipeDetailProps`; removing `ServingSizeAdjuster` import
  - Acceptance criteria reference: build passing with `noUnusedLocals` / `noUnusedParameters`
  - Testability notes: `npm run build` must pass with zero TS errors

## Risks / Trade-offs

- Risk/trade-off: Tests referencing `ServingSizeAdjuster` by import, component name, or `hideServingAdjuster` prop will break
  - Impact: Test suite fails until updated
  - Mitigation: Covered in tasks — delete `ServingSizeAdjuster.test.tsx`, update `RecipeDetail.test.tsx`

- Risk/trade-off: The `displayonly=1` print preview URL shows controls on-screen (they only hide at actual print time)
  - Impact: Minor visual inconsistency on the preview URL
  - Mitigation: Accepted as-is per proposal decisions

## Rollback / Mitigation

- Rollback trigger: Build fails, test suite regresses beyond the planned deletions, or unexpected behavioral change in ingredient scaling
- Rollback steps: `git revert` the commit(s) for this change; no database or infrastructure changes to undo
- Data migration considerations: None — purely UI/component change
- Verification after rollback: `npm run test` and `npm run build` pass; serving adjuster visible in Ingredients section as before

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding. Do not bypass with `--no-verify`.
- If security checks fail: Do not merge. This change has no auth/data surface, so security failures indicate a pre-existing or unrelated issue — flag for investigation.
- If required reviews are blocked/stale: Re-request review after 48 hours. Escalate to repo owner if blocked beyond 72 hours.
- Escalation path and timeout: Doug Hubbard (repo owner) is the escalation point. No external stakeholders required.

## Open Questions

No open questions. All decisions confirmed during exploration session prior to proposal.

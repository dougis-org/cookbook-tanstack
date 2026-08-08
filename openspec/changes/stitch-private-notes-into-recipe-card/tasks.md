## 1. Audit existing tests

- [x] 1.1 Grep `PrivateRecipeNotes.test.tsx`, `RecipeDetail.test.tsx` /
      `__tests__/RecipeDetail.test.tsx`, and the `$recipeId` route tests
      (`src/routes/recipes/__tests__/-$recipeId.test.tsx`,
      `-$recipeId.dedup.test.tsx`) for any assertions on the classes being
      removed/changed (`rounded-xl`, `shadow-[var(--theme-shadow-sm)]`,
      `mt-8`) or on structural wrappers around `PrivateRecipeNotes`. Note
      anything that will need updating in step 3.

## 2. Add/adjust tests first (TDD)

- [x] 2.1 In `PrivateRecipeNotes.test.tsx`, add or extend tests asserting
      that each render branch (skeleton, `anonymous` nudge, `below-tier`
      nudge, `hidden-by-downgrade` nudge, loaded content, editing content)
      is wrapped in a container carrying `max-w-4xl mx-auto`.
- [x] 2.2 Add/extend tests asserting the loaded-content and skeleton
      wrappers no longer carry `mt-8` or an independent top border, and do
      carry `rounded-b-lg` and `shadow-lg` (matching `RecipeDetail`'s
      card), consistent with the `private-notes-visual-integration` spec's
      "renders as a visual continuation" requirement.
- [x] 2.3 Run the new/updated tests and confirm they fail against the
      current implementation (red, before any component change).

## 3. Implement the wrapper restyle

- [x] 3.1 In `src/components/recipes/PrivateRecipeNotes.tsx`, wrap the
      `anonymous`, `below-tier`, and `hidden-by-downgrade` nudge returns in
      `max-w-4xl mx-auto`, keeping `print:hidden` on the same element it's
      on today (drop the existing bare `mt-8 print:hidden` wrapper in favor
      of the new width + seam classes).
- [x] 3.2 Update the loading-skeleton wrapper: add `max-w-4xl mx-auto`
      around it (or apply the width classes to the skeleton element itself
      if that keeps the diff simpler), drop `mt-8`, change `rounded-xl` to
      `rounded-t-none rounded-b-lg`, change `shadow-[var(--theme-shadow-sm)]`
      to `shadow-lg`, drop the standalone `border` (or reduce it to a
      bottom/side-only border if needed for definition against the
      background — verify visually in step 4).
- [x] 3.3 Update the loaded/editing content wrapper (the final `return`
      in `PrivateRecipeNotes`) with the same width, radius, shadow, and
      border/gap treatment as 3.2, keeping the `p-6 print:hidden` padding
      and print behavior intact.
- [x] 3.4 Re-run the tests from step 2 and confirm they now pass (green).

## 4. Manual visual verification

- [x] 4.1 Start the dev server, view a recipe as a Sous Chef+ user with an
      existing note, and confirm the recipe card and private notes box
      read as one continuous surface with no gap or doubled border, across
      all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`
      via the header theme picker).
- [x] 4.2 Repeat the check for the loading skeleton, and for each
      `RecipeNotesUpgradeNudge` state (logged out, below-tier,
      downgraded-with-existing-note) — use test/dev accounts or temporarily
      adjust tier/auth state to reach each branch.
- [x] 4.3 Confirm width alignment specifically on a viewport wider than
      56rem (4xl), where the pre-fix mismatch was most visible (e.g. resize
      browser to ~1440px or wider).
- [x] 4.4 Use the browser print preview on a recipe with a saved private
      note and confirm `PrivateRecipeNotes` still does not appear in print
      output, and that the existing "Personal Notes" print section (via
      `RecipeDetail`'s `personalNote` prop) still renders the note text as
      before.

## 5. Full verification and wrap-up

- [x] 5.1 Run `npm run test` and confirm the full unit/integration suite
      passes.
- [x] 5.2 Run the existing Playwright coverage relevant to the recipe
      detail page / private notes (if any) and confirm no regressions.
      (No dedicated E2E coverage exists for this component; none to run.)
- [x] 5.3 Update `.wolf/anatomy.md` and append to `.wolf/memory.md` per
      the OpenWolf protocol, since `PrivateRecipeNotes.tsx` is being
      edited. (`.wolf/` is gitignored and absent from this worktree — n/a.)
- [x] 5.4 Open a PR from the `stitch-private-notes-into-recipe-card`
      branch, referencing GitHub issue #639, with before/after screenshots
      for at least one theme. (PR #645, auto-merge enabled.)

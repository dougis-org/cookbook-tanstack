---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `e2e-hydration-wait-migration`
change. This change edits test code itself (Playwright specs and helpers),
not application code, so the "TDD" cycle here is: (1) confirm the spec file
passes *before* editing a wait call, so there's a known-good baseline; (2)
make the wait-call edit; (3) re-run the same spec file and confirm it still
passes with the same assertions exercising the same behavior — a "fail" at
step 3 means the replacement wait resolves too early or waits on the wrong
signal, which is a genuine finding, not a false fail to engineer around.

## Testing Steps

For each file touched in `tasks.md`'s Execution section:

1. **Baseline:** Run the target spec file in isolation (e.g.
   `npx playwright test src/e2e/<file>.spec.ts`) before editing and confirm
   it passes. This is the "test" the edit must not break.
2. **Edit:** Apply the single wait-call change (delete or replace) from the
   `tasks.md` checklist item / `design.md` classification table.
3. **Re-run and refactor:** Re-run the same spec file. It must pass with
   every pre-existing assertion still exercised. If it fails, the
   classification for that site was wrong — fix the wait condition (not the
   assertion) and repeat from step 3.

## Test Cases

### `src/e2e/helpers/recipes.ts:48` (delete)

- [ ] Baseline: `npx playwright test src/e2e/recipes-crud.spec.ts` passes before edit (one of many callers of `submitRecipeForm`)
- [ ] After deleting the `networkidle` line, `npx playwright test src/e2e/recipes-crud.spec.ts src/e2e/owner-icon.spec.ts src/e2e/recipes-auth.spec.ts` all still pass (multiple unrelated callers of the shared helper)

### `src/e2e/helpers/cookbooks.ts:25` (delete)

- [ ] Baseline: `npx playwright test src/e2e/cookbooks-auth.spec.ts` passes before edit
- [ ] After deleting the line, `npx playwright test src/e2e/cookbooks-auth.spec.ts src/e2e/cookbooks-chapters.spec.ts src/e2e/cookbooks-print.spec.ts` all still pass (multiple callers of `createCookbook`)

### `src/e2e/helpers/cookbooks.ts:95` (delete)

- [ ] Baseline: a spec exercising `createCookbookWithRecipe` passes before edit
- [ ] After deleting the line, the same spec(s) still pass

### `src/e2e/auth-session.spec.ts:28` (delete)

- [ ] Baseline: `npx playwright test src/e2e/auth-session.spec.ts` passes before edit
- [ ] After deleting the redundant line, `npx playwright test src/e2e/auth-session.spec.ts` still passes, confirming the remaining `waitForHydration(page)` call alone is sufficient

### `src/e2e/cookbooks-collaboration.spec.ts:91` (delete, pending #675 re-verify)

- [ ] Re-grep confirms the line's presence/absence against current `main` before acting
- [ ] If present: baseline run of `npx playwright test src/e2e/cookbooks-collaboration.spec.ts` passes before edit, and still passes after deletion
- [ ] If already absent (removed by #675): mark done, no test run needed for this line specifically — covered by the full-suite run in Validation

### `src/e2e/cookbooks-collaboration.spec.ts:132` (delete, pending #675 re-verify)

- [ ] Same re-grep and before/after run pattern as line 91

### Post-navigation sites replaced with `waitForHydration(page)`

For each of: `recipe-share.spec.ts:20`, `recipes-favorites.spec.ts:19`,
`cookbooks-auth.spec.ts:60`, `cookbooks-auth.spec.ts:105`,
`owner-icon.spec.ts:22`, `owner-icon.spec.ts:37`, `owner-icon.spec.ts:58`,
`recipes-auth.spec.ts:127`, `recipes-crud.spec.ts:204`:

- [ ] Baseline: the owning spec file passes before edit
- [ ] After swapping `page.waitForLoadState("networkidle")` for
      `waitForHydration(page)`, the same spec file passes with the same
      assertions
- [ ] `recipes-crud.spec.ts:204` specifically: confirm the post-delete
      `expect(page.getByRole("heading", { name: recipeName })).not.toBeVisible()`
      assertion still fails correctly if the delete didn't actually happen
      (i.e. the wait isn't short-circuiting the check) — verify by
      temporarily commenting out the delete button click locally during
      review and confirming the test fails, then restoring it; not a
      permanent test addition

### `src/e2e/recipe-persistence.spec.ts` (6 sites)

- [ ] Baseline: `npx playwright test src/e2e/recipe-persistence.spec.ts` passes before any edit (all 3 tests: draft restoration, server autosave, revert)
- [ ] After deleting lines 25, 51, 61, 83, 93 and replacing line 28 with
      `expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 })`,
      re-run `npx playwright test src/e2e/recipe-persistence.spec.ts` — all 3
      tests still pass
- [ ] Specifically confirm the "should show draft restoration prompt" test
      (line 28's context) still correctly shows the restore prompt after
      reload — this is the one case with no later assertion already
      covering the removed sleep's purpose, so it's the highest-risk edit
      in this file

### Full-suite and flake checks

- [ ] `grep -rn 'waitForLoadState("networkidle"\|waitForTimeout' src/e2e/` returns zero matches after all edits
- [ ] Full `npm run test:e2e` passes
- [ ] Full `npm run test:e2e` repeated 2 additional times with no new intermittent failures (maps to `specs/e2e-test-waits/spec.md`'s reliability NFAC scenario)
- [ ] `npm run test`, type checks, and `npm run build` all pass (maps to tasks.md Validation section)

---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `print-preferences` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Storage — Better-Auth `additionalFields` (tasks.md: Sub-task: Storage)

- [ ] Type-check confirms `src/lib/auth.ts` compiles with the five new `additionalFields` entries, each typed as boolean with `defaultValue: true`. (spec: ADDED Per-user print section preferences storage — "New user has all preferences default to shown")

### Shared preference-resolution helper (tasks.md: Sub-task: Shared preference-resolution helper)

- [ ] `resolvePrintPreferences(null)` returns all five preferences as `true`. (spec: ADDED Default-safe preference resolution — "Anonymous viewer prints a recipe")
- [ ] `resolvePrintPreferences(session)` where `session.user` has no `printShow*` fields returns all five preferences as `true`. (spec: ADDED Default-safe preference resolution — "Existing user session predates the new fields")
- [ ] `resolvePrintPreferences(session)` where all five fields are explicitly `true` returns all five as `true`. (spec: ADDED Per-user print section preferences storage — "New user has all preferences default to shown")
- [ ] `resolvePrintPreferences(session)` where one field (e.g. `printShowIngredients`) is `false` and the rest are `true`/absent returns only that field as `false`, others `true`. (spec: ADDED Per-user print section preferences storage — "User updates a single preference without affecting others")
- [ ] `resolvePrintPreferences(session)` where a field holds a non-boolean value (e.g. string `"true"`) resolves that field to `true`. (spec: NFAC Reliability — "Malformed preference value does not break rendering")

### `RecipeDetail` prop + print-only gating (tasks.md: Sub-task: `RecipeDetail` prop + print-only gating)

- [ ] `RecipeDetail` rendered with `printPreferences` omitted entirely renders all five sections in print exactly as before this change (baseline/regression guard). (spec: ADDED Default-safe preference resolution, implied baseline)
- [ ] `RecipeDetail` rendered with `printPreferences.printShowMeta = false` and prep/cook/servings data present: `data-testid="print-meta-line"` is absent from the DOM. (spec: ADDED Print section suppression — "Preference off suppresses the section in single-recipe print", applied to meta)
- [ ] `RecipeDetail` rendered with `printPreferences.printShowIngredients = false` and non-empty `ingredients`: the print-scoped ingredients rendering is absent, while the on-screen ingredients list is still present and unchanged in the same render. (spec: ADDED Print section suppression — "Preference off suppresses the section in single-recipe print" + "Preference on-off state does not change on-screen rendering")
- [ ] `RecipeDetail` rendered with `printPreferences.printShowInstructions = false` and non-empty `instructions`: the print-scoped instructions rendering is absent, on-screen instructions list unaffected. (spec: same as above, applied to instructions)
- [ ] `RecipeDetail` rendered with `printPreferences.printShowNotes = false` and non-empty `notes`: the print-scoped Notes section is absent, on-screen Notes section unaffected. (spec: same as above, applied to notes)
- [ ] `RecipeDetail` rendered with `printPreferences.printShowNotes = true` and empty `notes`: Notes section remains absent (content-presence check still governs). (spec: ADDED Print section suppression — "Preference off does not suppress content that is already absent")
- [ ] `RecipeDetail` rendered with `printPreferences.printShowPersonalNotes = false` and a non-empty `personalNote` prop: the print-only Personal Notes section is absent. (spec: ADDED Print section suppression — "Personal notes preference only affects display of an already-authorized note")
- [ ] `RecipeDetail` rendered with `printPreferences.printShowPersonalNotes = true` and `personalNote = null`: Personal Notes section remains absent (existing truthy-check still governs). (spec: same pattern as Notes content-presence case)
- [ ] `RecipeDetail` rendered with all five preferences `false` and full recipe content: all five print-only/print-scoped sections absent from print DOM; all on-screen content (title, image, ingredients, instructions, notes) remains visible and unaffected. (spec: ADDED Print section suppression — "Preference on-off state does not change on-screen (non-print) rendering")
- [ ] `RecipeDetail` rendered with all five preferences `true` and full recipe content: output is identical to pre-change baseline (regression guard).

### Wire preference resolution into both print-rendering routes (tasks.md: Sub-task: Wire preference resolution into both print-rendering routes)

- [ ] `src/routes/recipes/$recipeId.tsx` calls `resolvePrintPreferences` with the current session and passes the result to `RecipeDetail` as `printPreferences` (assert via component/route test with a mocked session having one preference `false`, confirming it reaches the rendered print DOM). (spec: ADDED Print section suppression — "Preference off suppresses the section in single-recipe print")
- [ ] `src/routes/cookbooks.$cookbookId_.print.tsx` calls `resolvePrintPreferences` with the current session and passes the result to each `RecipeDetail` render in the recipe loop (assert for at least two recipes in one cookbook, confirming the same preference suppresses the section for both). (spec: ADDED Print section suppression — "Preference off suppresses the section in cookbook print")
- [ ] `src/routes/cookbooks.$cookbookId_.print.tsx` does not pass a `personalNote` prop to `RecipeDetail` (regression guard — confirms this change did not accidentally add personal-note fetching to cookbook print, per proposal.md Non-Goals).

### Settings UI (tasks.md: Sub-task: Settings UI)

- [ ] `account_.settings.tsx` renders a "Print Preferences" section with five independently togglable controls, seeded from `session.user.printShow*` on mount. (spec: ADDED Print Preferences settings UI, implied setup)
- [ ] Toggling "Personal Notes" off and clicking Save calls `authClient.updateUser` with `printShowPersonalNotes: false`, shows a success indicator, and does not alter the other four preferences' saved values. (spec: ADDED Print Preferences settings UI — "User toggles a preference off and saves")
- [ ] When the save call fails (mocked `onError`), an error message is shown and the toggle's on-screen state remains as the user set it (not reverted). (spec: ADDED Print Preferences settings UI — "Save failure surfaces an error without silently discarding the change")

### E2E coverage (tasks.md: Sub-task: E2E coverage)

- [ ] E2E: a user with `printShowInstructions = false` prints a recipe via the single-recipe print view; the Instructions section is absent from the print-rendered DOM. (spec: ADDED Print section suppression — "Preference off suppresses the section in single-recipe print")
- [ ] E2E: a user with `printShowIngredients = false` prints a cookbook containing a recipe with non-empty ingredients via the cookbook print view; that recipe's Ingredients section is absent from the print-rendered DOM. (spec: ADDED Print section suppression — "Preference off suppresses the section in cookbook print")

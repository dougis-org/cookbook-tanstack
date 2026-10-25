---
name: tests
description: Tests for the customize-recipe-print-header-footer change
---

# Tests

## Overview

This document outlines the tests for the `customize-recipe-print-header-footer` change. All work follows strict TDD: write the failing test, make it pass with the simplest code, then refactor. Each case maps to a task in `tasks.md` and a scenario in `specs/`.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### PR 1 — Resolver and auth config (task 1.1-1.3; `src/lib/__tests__/printPreferences.test.ts`)

- [ ] Anonymous/missing session resolves Category `footer`, other four `none`, section toggles shown (print-preferences: Anonymous session)
- [ ] Table-driven: stored valid placements are returned unchanged (print-preferences: Stored placements are honored)
- [ ] No new fields and `printShowMeta` absent or `true` resolves Prep, Cook, Servings, Difficulty to `header`, Category `footer` (Legacy user with meta shown)
- [ ] No new fields and `printShowMeta: false` resolves the four to `none` (Legacy user with meta hidden)
- [ ] `printShowMeta: false` with `printServings: "footer"` resolves Servings `footer`, others `none` (New field wins over legacy flag)
- [ ] Invalid values (`"sideways"`, `7`, `null`, `{}`) fall back as if absent (Invalid placement value; NFAC Out-of-range stored value)
- [ ] `session.user` null, non-object, or fields wrong type never throws and returns a complete object (NFAC Malformed session data)
- [ ] Resolver given a session with none of the new fields requires no stored-data change (NFAC No data migration needed)
- [ ] Update with an invalid string (`"sideways"`) or non-string for each placement field is rejected by the `validator.input` schema through the real `updateUser` path and the stored value is unchanged (Server rejects invalid placement values; NFAC Security)
- [ ] Update with each allowed value succeeds and persists (Valid values are accepted)
- [ ] Auth config shape test: five new fields are `string` with the expected `defaultValue`s, and those defaults equal the resolver's new-account defaults (New account defaults)

### PR 1 — Settings UI (tasks 1.4-1.5; `src/components/account/__tests__/PreferencesSection.test.tsx`)

- [ ] Each of five elements shows exactly one selected option reflecting the session (Controls reflect current preferences)
- [ ] Meta toggle no longer rendered; the other four section toggles still render
- [ ] Changing Difficulty to Footer then Save calls `updateUser` with `printDifficulty: "footer"` and the other four placements, and shows success (Saving persists the placements)
- [ ] Arrow keys move selection and focus within a control (Controls are keyboard operable)
- [ ] Static layout sketch renders header, body and footer zones
- [ ] An unsaved edit is not overwritten by a session refresh (existing behavior preserved)
- [ ] Failed save shows the error message (existing behavior preserved)

### PR 2 — RecipeDetail (tasks 2.1-2.4; `src/components/recipes/__tests__/RecipeDetail.test.tsx`)

- [ ] All four meta elements in `header` render `Prep: 15m · Cook: 30m · Serves: 4 · Medium` in `print-meta-line` (Header elements shown)
- [ ] Elements placed in `footer` or `none` are absent from `print-meta-line` (Elements placed elsewhere are excluded)
- [ ] Null prep/cook in `header` omit `Prep:`/`Cook:` and show no `N/A` (NA times suppressed)
- [ ] No element has `print-meta-line` when nothing is in `header` and no "Added by" (Empty header line not rendered)
- [ ] Scaled servings show the scaled value in the header (Scaled servings reflected)
- [ ] `print-meta-line` keeps `hidden` and `print:block` classes
- [ ] Category `header` shows the classification name in the header line; `footer` shows it in the footer row; no classification shows nothing (Category in header; Category in the footer (default); No classification)
- [ ] "Added by" appears with all elements `none`, and not in a single-user cookbook (Added by with all elements set to none; Single-user cookbook)
- [ ] Footer row with footer items and no `printFooter` renders items only (Category in the footer (default))
- [ ] Footer row with items and `printFooter` renders both, items left and node right, one row (Footer items combined with cookbook page number)
- [ ] Footer row with only `printFooter` renders just that node (Cookbook with no footer items)
- [ ] No footer row when no items and no `printFooter` (Nothing to show)
- [ ] Footer row carries print-only classes and `break-inside: avoid` (Footer is print-only; Footer survives page breaks)
- [ ] Screen grid labels (Prep Time, Cook Time, Servings, Difficulty) still present (existing NFR1: Screen layout unchanged)
- [ ] Route `$recipeId` passes the resolved placements into `RecipeDetail` (`src/routes/recipes/__tests__/-$recipeId.test.tsx`)

### PR 2 — E2E single recipe (task 2.5)

- [ ] Playwright print emulation: with Category `footer` and Prep `header`, the header contains Prep and the footer contains the classification; screen view shows neither extra element

### PR 3 — Cookbook print (tasks 3.1-3.3)

- [ ] `CookbookPrintPage` renders footer items and `#N` in a single row per recipe (Footer items combined with cookbook page number)
- [ ] With all elements `none`, the row contains only `#N` (Cookbook with no footer items)
- [ ] Multiple recipes each get exactly one footer row
- [ ] E2E: cookbook print shows header items, footer items and `#N` for each recipe; nothing clipped within `@page cookbook-page` margins (Footer survives page breaks)
- [ ] E2E: "Added by" still prints in a collaborative cookbook with all elements `none` (Added by with all elements set to none)
- [ ] Legacy-user check (manual or seeded E2E): a user with `printShowMeta: false` and no new fields prints no meta line (Legacy user with meta hidden)

### Cross-cutting

- [ ] All four themes render the settings controls legibly (manual)
- [ ] `npm run build` and type checks pass with no remaining `printShowMeta` consumers outside the resolver

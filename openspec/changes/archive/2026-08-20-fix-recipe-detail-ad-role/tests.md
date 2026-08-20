---
name: tests
description: Tests for the fix-recipe-detail-ad-role change
---

# Tests

## Overview

This document outlines the tests for the `fix-recipe-detail-ad-role` change. Implementation
in this change preceded the artifact's discovery (the `.github/openspec-shared` submodule
was not yet initialized in the working worktree), so tests were written and run alongside
each implementation step in the same TDD spirit — write/extend the assertion, watch it
demonstrate the gap under the old code path, apply the one-line `role` fix, confirm green —
rather than as a separate pre-code phase. All cases below are implemented and passing.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** capture the requirement as an assertion; confirm it fails against the pre-fix behavior (no `role`, defaulting to `authenticated-task`).
2. **Write code to pass the test:** add `role="public-content"` at the relevant `<PageLayout>` call site.
3. **Refactor:** none needed — this is a one-property, three-call-site change with no structural rework.

## Test Cases

Maps to Execution tasks in `tasks.md` and to the acceptance scenario "Recipe detail page
assigns its public-content role on every render branch" in
`specs/ad-display-policy/spec.md`.

- [x] `src/routes/recipes/__tests__/-$recipeId.test.tsx` — `RecipeDetailPage` passes `role="public-content"` on the **loading** branch (`PageLayout` mock captures the prop).
- [x] `src/routes/recipes/__tests__/-$recipeId.test.tsx` — `RecipeDetailPage` passes `role="public-content"` on the **not-found** branch.
- [x] `src/routes/recipes/__tests__/-$recipeId.test.tsx` — `RecipeDetailPage` passes `role="public-content"` on the **success** branch, for anonymous and authenticated viewers alike.
- [x] `src/routes/recipes/__tests__/-$recipeId.ads.test.tsx` — anonymous (no-session) visitor to `/recipes/$recipeId` renders the ad-eligible layout (`right-rail` testid present), using the real `PageLayout`/`AdSlot` components (not mocked).
- [x] `src/routes/recipes/__tests__/-$recipeId.ads.test.tsx` — logged-in `home-cook` (free-tier) visitor renders the ad-eligible layout (`right-rail` present) — confirms tier-based eligibility, not just anonymous, is unaffected.
- [x] `src/routes/recipes/__tests__/-$recipeId.ads.test.tsx` — logged-in `prep-cook` (paid-tier) visitor suppresses ads (`right-rail` absent) — confirms tier-based suppression is untouched by this change.
- [x] `src/routes/recipes/__tests__/-$recipeId.ads.test.tsx` — logged-in admin visitor suppresses ads (`right-rail` absent) regardless of tier — confirms admin suppression is untouched.
- [x] `src/components/layout/__tests__/PageLayout.test.tsx` (pre-existing) — generic `role`-driven ad eligibility coverage (right-rail present/absent by role) unaffected by this change.
- [x] `src/lib/__tests__/ad-policy.test.ts` (pre-existing) — full `isPageAdEligible` tier/role matrix (anonymous, home-cook, paid tiers, admin, missing/unknown tier) unaffected by this change.
- [x] Manual verification (Playwright, local dev server against seeded MongoDB data): anonymous visit to a real recipe detail page renders the sponsor/ad slot ("Sponsored → Remove sponsors → Prep Cook") in the right rail, confirming the fix end-to-end beyond unit-test mocks.
- [x] Regression check: `grep` confirms no other route imports or renders `RecipeDetailPage` beyond `src/routes/recipes/$recipeId.tsx` itself, so no other surface inherits the previous `authenticated-task` default.
- [x] Full suite regression: `npm run test` — 163 test files / 2063 tests passing after the change, confirming no unrelated breakage.

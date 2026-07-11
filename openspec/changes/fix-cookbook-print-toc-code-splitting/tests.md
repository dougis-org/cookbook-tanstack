---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-cookbook-print-toc-code-splitting`
change. This is a build-configuration fix with no new application logic, so
"TDD" here centers on a failing *build-output* assertion and the pre-existing
e2e spec that already encodes the desired behavior — both must fail against
the current code and pass once the route-config change lands.

## Testing Steps

For each task in `tasks.md`:

1.  **Write/identify a failing check:** Before making the route-config change, establish the build-output baseline (Execution task: "Confirm the code-split hypothesis empirically") and confirm `cookbooks-print-theme-contrast.spec.ts` is capable of failing (it already fails intermittently in CI per issue #589 — no new test needs to be authored, but its failure mode should be understood, not just assumed).
2.  **Make the change:** Add `codeSplitGroupings` to both route files.
3.  **Confirm the checks now pass:** Re-run the build-output inspection and the e2e spec (repeated runs) to confirm the previously-possible failure mode is gone.

## Test Cases

- [ ] **Baseline case — separate chunk exists today:** Run `npm run build` on `main`/unmodified code and confirm the build manifest contains a distinct chunk for `cookbooks.$cookbookId_.toc` and/or `cookbooks.$cookbookId_.print` (or their compiled route IDs), separate from the main entry bundle. Maps to: Execution task "Confirm the code-split hypothesis empirically before changing anything"; Spec scenario "TOC/print route components are not emitted as a separate lazy bundle chunk" (this is the pre-change, failing state of that scenario).
- [ ] **Route-config change — toc route:** After adding `codeSplitGroupings` to `cookbooks.$cookbookId_.toc.tsx`, confirm the route still compiles and the route tree (`src/routeTree.gen.ts`) regenerates without errors. Maps to: Execution task "Add `codeSplitGroupings` to `src/routes/cookbooks.$cookbookId_.toc.tsx`".
- [ ] **Route-config change — print route:** Same check for `cookbooks.$cookbookId_.print.tsx`. Maps to: Execution task "Add `codeSplitGroupings` to `src/routes/cookbooks.$cookbookId_.print.tsx`".
- [ ] **Post-change build manifest — chunk is gone:** Re-run `npm run build` and confirm no separate JS chunk exists for either route's component. Maps to: Execution task "Rebuild and diff the chunk manifest"; Spec scenario "TOC/print route components are not emitted as a separate lazy bundle chunk" (post-change, passing state).
- [ ] **Post-change build manifest — CSS chunk check:** Inspect emitted CSS assets for any chunk still isolating `--theme-print-*`/`CookbookStandaloneLayout` utility classes away from the main stylesheet. If found, this test case fails and the associated Execution task must not be marked complete until resolved or explicitly rescoped with the user. Maps to: Design Open Question ("Does `codeSplitGroupings` affect CSS-chunk emission...").
- [ ] **e2e — background contrast spec passes without retries:** Run `npx playwright test cookbooks-print-theme-contrast --repeat-each=3` (or equivalent repeated invocation) and confirm all 12 parametrized tests (4 themes × 3 route variants) pass on every repetition, with zero retries consumed. Maps to: Validation task "Run E2E tests"; Spec scenario "TOC/print page background is light in every supported theme" and NFAC scenario "e2e background-contrast spec passes without relying on retries".
- [ ] **e2e — dark theme specific case:** Within the same spec run, confirm the `dark` theme's `toc`/`print`/`print?displayonly=1` variants specifically resolve to the light `--theme-print-bg` background (the exact scenario that produced `rgb(15, 23, 42)` failures in the original bug report). Maps to: Spec scenario "TOC/print page background is light in the dark theme".
- [ ] **e2e — no regression to actual print output:** Confirm `src/e2e/cookbooks-print.spec.ts` and `src/e2e/cookbooks-print-behavior.spec.ts` (existing suites covering print-route behavior) still pass unmodified, confirming the route-config change has no visible side effect on print behavior itself. Maps to: Spec scenario "Actual print output is unaffected".
- [ ] **Full regression suite:** Run `npm run test` and `npm run test:e2e` in full and confirm no unrelated regressions. Maps to: Validation section of `tasks.md`.
- [ ] **Bundle size sanity check:** Compare total main-bundle byte size before/after via the build output from the baseline and post-change manifest checks above; confirm the delta is small (roughly bounded by the size of `CookbookStandaloneLayout.tsx` plus the two route files) and no unrelated route chunks (e.g. `RecipeDetail`'s other consumers) were pulled into the main bundle as a side effect. Maps to: NFAC scenario "Bundle size impact stays negligible".

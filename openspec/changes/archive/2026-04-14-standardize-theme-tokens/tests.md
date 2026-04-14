---
name: tests
description: Tests for the standardize-theme-tokens change
---

# Tests

## Overview

This document outlines the tests for the `standardize-theme-tokens` change. All work should follow a strict TDD process: write the failing test, implement, then refactor.

Because this change is purely CSS + component class replacement (no logic changes), tests split into three layers:
1. **E2E visual tests** (Playwright) — primary correctness signal; verify rendered colors in each theme
2. **Component render tests** (Vitest + RTL) — verify no hardcoded color classes remain in rendered output
3. **Grep CI check** — automated regression guard for future PRs

---

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it; confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** without breaking the test.

---

## Test Cases

### Phase 1: CSS token foundation (tasks 1.1–1.5)

- [ ] **T1.1** — Spec: `component-migration.md` → "base.css imported before theme files"
  - E2E: `src/e2e/theme-tokens.spec.ts` — navigate to app with no theme class; inspect `--theme-error` via `page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--theme-error'))` — assert non-empty
  - Failing condition: token resolves to empty string (base.css not loaded or not before themes)

- [ ] **T1.2** — Spec: `semantic-status-tokens.md` → "Dark theme overrides base status hues"
  - E2E: `src/e2e/theme-tokens.spec.ts` — apply `html.dark` class; inspect `--theme-error-base` — assert resolves to a brighter red than `:root` default
  - Failing condition: value matches `:root` default (dark.css override not applied)

- [ ] **T1.3** — Spec: `semantic-status-tokens.md` → "Derived tokens update when base is overridden"
  - E2E: `src/e2e/theme-tokens.spec.ts` — apply `html.dark`; inspect `--theme-error-bg` — assert value contains `color-mix` result (non-transparent, non-empty, visually distinct from surface)
  - Failing condition: token is empty or transparent

- [ ] **T1.4** — Spec: `print-tokens.md` → "Print tokens resolve to light values in dark theme"
  - E2E: `src/e2e/theme-tokens.spec.ts` — apply `html.dark`; inspect `--theme-print-fg` — assert resolves to gray-900 equivalent, NOT white
  - Failing condition: value matches dark theme `--theme-fg` (white)

- [ ] **T1.5** — Spec: `print-tokens.md` → "PDF export accent color differs from default print"
  - E2E: `src/e2e/theme-tokens.spec.ts` — apply `data-pdf-export` attribute; inspect `--theme-print-accent` — assert it differs from the `:root` default
  - Failing condition: value is same as default (override block missing or not in cascade)

### Phase 2: CookbookStandaloneLayout migration (task 2.2)

- [ ] **T2.1** — Spec: `print-tokens.md` → "Dark theme does not bleed into cookbook print view"
  - E2E: `src/e2e/cookbook-print.spec.ts` — activate dark theme; navigate to cookbook standalone/TOC route; take screenshot; assert no computed background color on any `.print-layout` element is dark (e.g. no `rgb(15,` prefix)
  - Failing condition: screenshot shows dark backgrounds or text

- [ ] **T2.2** — Spec: `print-tokens.md` → "Printed cookbook is unaffected by theme switching"
  - E2E: render `CookbookStandaloneLayout` in all three themes; compare screenshots — assert they are visually identical (within pixel diff threshold)
  - Failing condition: screenshots differ between themes

- [ ] **T2.3** — Unit: `src/components/cookbooks/CookbookStandaloneLayout.test.tsx` — render component; assert no element has a className matching `/text-gray-[0-9]+|border-gray-[0-9]+/`
  - Failing condition: hardcoded gray class found in rendered output

### Phase 3: Status token migration (tasks 3.1–3.7)

- [ ] **T3.1** — Spec: `semantic-status-tokens.md` → "Status colors respond to theme switching"
  - Unit: `src/components/ui/FormError.test.tsx` — render `<FormError message="error" />`; assert rendered className includes `var(--theme-error-bg)` and `var(--theme-error)`, not `red-`
  - E2E: activate light-cool; render form with error; inspect computed color of error element — assert non-red-500 (i.e. resolved from theme token, not hardcoded)

- [ ] **T3.2** — Unit: `src/components/recipes/RecipeForm.test.tsx` — render with a validation error; assert error element className contains `var(--theme-error)`, not `text-red-500`

- [ ] **T3.3** — Unit: `src/components/recipes/StatusIndicator.test.tsx` — render in "active" state; assert className contains `var(--theme-success)`, not `text-green-500`

- [ ] **T3.4** — Unit: `src/components/recipes/ImportPreviewModal.test.tsx` — render warning banner; assert className contains `var(--theme-warning-bg)` and `var(--theme-warning)`, not `amber-`

### Phase 4: Badge token migration (tasks 4.1–4.2)

- [ ] **T4.1** — Spec: `badge-tokens.md` → "Badge renders correctly after removing dark: variants"
  - Unit: `src/components/ui/ClassificationBadge.test.tsx` — render badge; assert className does NOT contain `dark:` variants; assert className contains `var(--theme-badge-classification-bg)`
  - Failing condition: `dark:` class present OR token not referenced

- [ ] **T4.2** — Unit: `src/components/ui/TaxonomyBadge.test.tsx` — render each of `meal`, `course`, `prep` types; for each assert:
  - No `dark:` classes in className
  - className contains the appropriate `--theme-badge-{type}-bg` token reference
  - Failing condition: `dark:` class present for any type

- [ ] **T4.3** — Spec: `badge-tokens.md` → "Badge tokens produce distinct colors per category"
  - E2E: `src/e2e/badge-tokens.spec.ts` — render all three taxonomy types and classification badge; inspect computed background colors — assert all four are distinct values
  - Failing condition: any two badge types share the same computed background

### Phase 5: Remaining files (task 5.1)

- [ ] **T5.1** — Grep regression guard
  - CI step: `grep -rE "(text|bg|border)-(red|blue|cyan|amber|orange|green|gray|slate|zinc|neutral|stone|violet|emerald)-[0-9]+" src/ --include="*.tsx"` — any match without `/* theme-intentional */` on the same line fails the build
  - Failing condition: any un-annotated hardcoded color class remains after migration

---

## Non-Functional Test Cases

- [ ] **TN1** — Build size regression: `npm run build` succeeds; JS bundle size is not larger than pre-change baseline (CSS bundle may decrease)
- [ ] **TN2** — TypeScript: `npx tsc --noEmit` — zero errors after all migrations
- [ ] **TN3** — Contrast (manual): in light-warm theme, verify `--theme-error` text on `--theme-surface` passes 4.5:1 WCAG AA in browser devtools accessibility panel

---

## Test File Locations

| Test file | Type | Covers tasks |
|-----------|------|--------------|
| `src/e2e/theme-tokens.spec.ts` | E2E (new) | T1.1–T1.5 |
| `src/e2e/cookbook-print.spec.ts` | E2E (new or extend) | T2.1–T2.2 |
| `src/e2e/badge-tokens.spec.ts` | E2E (new) | T4.3 |
| `src/components/cookbooks/CookbookStandaloneLayout.test.tsx` | Unit (new) | T2.3 |
| `src/components/ui/FormError.test.tsx` | Unit (extend) | T3.1 |
| `src/components/recipes/RecipeForm.test.tsx` | Unit (extend) | T3.2 |
| `src/components/recipes/StatusIndicator.test.tsx` | Unit (extend) | T3.3 |
| `src/components/recipes/ImportPreviewModal.test.tsx` | Unit (extend) | T3.4 |
| `src/components/ui/ClassificationBadge.test.tsx` | Unit (extend) | T4.1 |
| `src/components/ui/TaxonomyBadge.test.tsx` | Unit (extend) | T4.2 |

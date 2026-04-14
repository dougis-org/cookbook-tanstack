## GitHub Issues

- dougis-org/cookbook-tanstack#316

## Why

- **Problem statement:** Many components use hardcoded Tailwind color classes (e.g. `text-red-400`, `bg-amber-500/10`, `text-gray-900`) instead of CSS custom property tokens. This means the UI is partially theme-aware — structural chrome responds to theme switches, but status indicators, badges, breadcrumbs, and form errors remain frozen to their original palette.
- **Why now:** The theme system just shipped (PR #324 — theme dropdown selector). Extending semantic tokens now, while the system is fresh, prevents accumulating further hardcoded drift and unblocks future theme additions without component rework.
- **Business/user impact:** Users switching to light themes see incorrect color combinations (e.g. dark-mode-tuned red-400 on a white surface, gray-400 text that may fail WCAG contrast). PDF export (planned) requires a separate print token namespace that doesn't exist yet.

## Problem Space

- **Current behavior:** Three theme files (`dark.css`, `light-cool.css`, `light-warm.css`) define structural tokens only. Status colors (error, success, warning) and categorical badge colors are hardcoded in 26 component/route files using Tailwind color classes with manual `dark:` variants.
- **Desired behavior:** All semantic colors flow through CSS custom properties. Themes define only what diverges from sensible base defaults. `color-mix()` derives tinted backgrounds and borders from a single base token, so themes override 1 value instead of 3. A `--theme-print-*` namespace serves the cookbook standalone/print layout and will support PDF export without component changes.
- **Constraints:**
  - Must not break existing dark theme visuals (current hardcoded values become the dark-theme overrides)
  - `CookbookStandaloneLayout` is a print/PDF context — its tokens must always resolve to explicit light values regardless of active theme
  - Tailwind 4 is in use; `color-mix()` in CSS custom properties is the appropriate derivation mechanism (no SCSS/PostCSS required)
- **Assumptions:**
  - `color-mix(in srgb, ...)` is acceptable browser target (supported in all modern browsers; headless Playwright for PDF export also supports it)
  - A single `base.css` injected before theme files in `src/styles.css` is sufficient for cascade ordering
  - Light-cool and light-warm themes need no status/badge overrides — red-600 on white is sufficient contrast; themes will be verified visually during implementation
- **Edge cases considered:**
  - `CookbookStandaloneLayout` intentionally uses light values even in dark mode — must use `--theme-print-*` tokens, not `--theme-*` tokens
  - Print media query should further override `--theme-print-*` for ink-saving (e.g. lighter borders)
  - PDF export will apply `[data-pdf-export]` attribute to `<html>` — the cascade must allow per-attribute overrides without theme interference
  - TaxonomyBadge uses three distinct categorical colors (meal/amber, course/violet, prep/emerald) — each needs its own badge token set, not a single semantic "badge" token

## Scope

### In Scope

- Create `src/styles/base.css` with `:root` defaults for all semantic token namespaces
- Define `--theme-error-*`, `--theme-success-*`, `--theme-warning-*` tokens (base + dark overrides)
- Define `--theme-badge-meal-*`, `--theme-badge-course-*`, `--theme-badge-prep-*`, `--theme-badge-classification-*` tokens
- Define `--theme-print-*` tokens (always-explicit light values, independent of active theme)
- Add `@media print` overrides for `--theme-print-*` in `src/styles/print.css`
- Add `[data-pdf-export]` block in `base.css` for future PDF renderer overrides
- Replace all hardcoded color classes in the 26 affected files with the appropriate token-based utilities
- Replace `text-gray-*` / `border-gray-*` instances that map to existing structural tokens (`--theme-fg`, `--theme-fg-muted`, `--theme-fg-subtle`, `--theme-border`)
- Migrate `CookbookStandaloneLayout` to `--theme-print-*` tokens throughout

### Out of Scope

- Adding new themes beyond the current three
- Changing the theme switching mechanism
- Modifying any structural tokens already in `dark.css`, `light-cool.css`, `light-warm.css`
- PDF export feature implementation (only the CSS token foundation is in scope)
- Accessibility audit (WCAG contrast checking is informational during implementation, not a deliverable)

## What Changes

- **New file:** `src/styles/base.css` — `:root` block with all new semantic tokens and `[data-pdf-export]` overrides
- **Modified:** `src/styles/themes/dark.css` — adds status base overrides and badge text/base overrides
- **Modified:** `src/styles/print.css` — adds `@media print` overrides for `--theme-print-*`
- **Modified:** `src/styles/styles.css` (or equivalent entry) — imports `base.css` before theme files
- **Modified (26 files):** All component and route files listed in #316 — hardcoded Tailwind color classes replaced with `var(--theme-*)` utilities

## Risks

- Risk: `color-mix()` producing unexpected tints if a base token is defined with `theme()` syntax and resolved at cascade time
  - Impact: Subtle visual differences from current hardcoded values
  - Mitigation: Verify each status color visually in all three themes during implementation; use Playwright screenshot tests for regression

- Risk: Light-theme status colors (red-600) may have insufficient contrast in `light-warm` (amber-tinted surface)
  - Impact: WCAG failure on warning/error text in light-warm theme
  - Mitigation: Check contrast ratios during implementation; add `light-warm` overrides if needed

- Risk: `CookbookStandaloneLayout` migration misses a class, leaving a dark-mode bleed in print view
  - Impact: Printed cookbook renders dark backgrounds on some elements
  - Mitigation: E2E test covers print rendering; audit entire file during migration

## Open Questions

No unresolved ambiguities remain. All design decisions were settled during exploration:
- Token derivation strategy: `color-mix(in srgb, base 10%/35%, transparent)` for bg/border
- Print/PDF split: `--theme-print-*` namespace in `:root`, overrideable via `@media print` and `[data-pdf-export]`
- Badge approach: per-category token sets (`meal`, `course`, `prep`, `classification`) with dark overrides for base + text only

## Non-Goals

- Adding new themes (light-contrast, high-contrast, etc.)
- Theming third-party component libraries
- Dark-mode print support (print is always light by design)
- Automated WCAG contrast enforcement (manual verification only)
- Changing how the theme class is applied to `<html>`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

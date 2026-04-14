## Context

- **Relevant architecture:** Three theme CSS files (`src/styles/themes/dark.css`, `light-cool.css`, `light-warm.css`) define structural tokens consumed via Tailwind utilities in components. `src/styles/print.css` handles `@media print` overrides. The entry stylesheet (`src/styles.css`) imports all theme files. Tailwind 4 is configured via `@tailwindcss/vite`; CSS custom properties are the canonical theming mechanism.
- **Dependencies:** No runtime JS dependencies. Pure CSS cascade. Components consume tokens via Tailwind's arbitrary-value syntax (`text-[var(--theme-fg)]`) or will use named utilities once tokens are defined.
- **Interfaces/contracts touched:**
  - `src/styles/base.css` (new) — establishes `:root` token defaults
  - `src/styles/themes/dark.css` — adds status/badge overrides
  - `src/styles/print.css` — adds `@media print` overrides for `--theme-print-*`
  - 26 component/route `.tsx` files — replace hardcoded Tailwind color classes with token-based utilities

---

## Goals / Non-Goals

### Goals

- All semantic colors (status, badges, print) flow through CSS custom properties
- A single base token per semantic color drives derived tints via `color-mix()` — themes override 1 value, not 3
- `--theme-print-*` tokens are always explicit light values, overrideable by `@media print` and `[data-pdf-export]`
- No visual regression in dark theme; light themes gain correct status/badge coloring
- Foundation in place for future themes to inherit sensible defaults without touching components

### Non-Goals

- Adding new themes beyond the current three
- WCAG automated enforcement
- PDF export feature itself
- Changing Tailwind configuration or build tooling

---

## Decisions

### Decision 1: Cascade via `base.css` `:root` block

- **Chosen:** New file `src/styles/base.css` with a `:root` block defining all semantic token defaults, imported before theme files in `src/styles.css`.
- **Alternatives considered:** Defining defaults inside `light-cool.css` as the "base" theme; defining defaults inline in each theme file.
- **Rationale:** `:root` has lower specificity than `html.dark` / `[data-theme="dark"]`, so theme overrides always win without `!important`. A separate file keeps theme files focused on divergence-only overrides. New themes get sensible defaults for free.
- **Trade-offs:** One more file to maintain; import order in `src/styles.css` becomes load-bearing.

### Decision 2: `color-mix()` for derived bg and border tokens

- **Chosen:** Status bg/border tokens derived from a single base using `color-mix(in srgb, var(--theme-X-base) N%, transparent)`.
- **Alternatives considered:** Explicit bg/border tokens per theme (3× the overrides); SCSS variables (not in use); CSS `color()` relative syntax (limited browser support at time of writing).
- **Rationale:** Themes override only `--theme-X-base`; the derived tokens update automatically. Reduces dark theme overrides from 9 status entries to 3. `color-mix(in srgb, ...)` is supported in all modern browsers and in Playwright/Chromium for PDF export.
- **Trade-offs:** Derived colors may differ subtly from the original hardcoded values; visual verification required. `transparent` as the mix target produces correct alpha behavior on any background.

### Decision 3: Badge tokens are per-category, not generic

- **Chosen:** Four independent badge token sets: `--theme-badge-meal-*`, `--theme-badge-course-*`, `--theme-badge-prep-*`, `--theme-badge-classification-*`. Each has `-base`, `-bg`, `-text`, `-border`.
- **Alternatives considered:** Single `--theme-badge-*` tokens with category conveyed by component logic; CSS `@property` hue rotation.
- **Rationale:** Meal/course/prep/classification are distinct semantic categories. A single badge token would force components to reintroduce hardcoded values for differentiation. Per-category tokens keep all color decisions in CSS.
- **Trade-offs:** 4 × 4 = 16 base tokens in `:root`. Dark overrides needed for each category's `-base` and `-text` (8 overrides). Manageable and self-documenting.

### Decision 4: `--theme-print-*` as an independent namespace

- **Chosen:** A dedicated `--theme-print-*` namespace in `:root` with hardcoded light values, separate from `--theme-*` structural tokens. Overrideable by `@media print` (ink-saving) and `[data-pdf-export]` attribute (rich PDF output).
- **Alternatives considered:** Reusing `--theme-surface` / `--theme-fg` tokens directly in the print layout (would bleed dark theme values into print view); separate print stylesheet with hardcoded values (inflexible, not overrideable per context).
- **Rationale:** Print must always render light regardless of active theme. A separate namespace makes this explicit and allows independent print vs. PDF overrides without impacting UI theme tokens.
- **Trade-offs:** `CookbookStandaloneLayout` components must be migrated to use `--theme-print-*` exclusively — a mechanical but non-trivial change.

### Decision 5: Token consumption via Tailwind arbitrary values

- **Chosen:** Consume tokens in components using Tailwind's arbitrary-value syntax: `text-[var(--theme-error)]`, `bg-[color:var(--theme-error-bg)]`, `border-[color:var(--theme-error-border)]`.
- **Alternatives considered:** Custom Tailwind plugin to define named utilities for tokens; inline `style` props.
- **Rationale:** Arbitrary values work in Tailwind 4 without plugin configuration. Named utilities would require plugin maintenance and regeneration. Inline styles would bypass Tailwind's responsive/state modifiers.
- **Trade-offs:** Arbitrary-value syntax is more verbose than named utilities. Acceptable for this scope; can be abstracted to utilities in a future cleanup if frequency warrants it.

---

## Proposal to Design Mapping

- Proposal element: 26 component files with hardcoded color classes
  - Design decision: Decision 5 (token consumption via Tailwind arbitrary values)
  - Validation approach: Grep for hardcoded color pattern after migration; visual review in all three themes

- Proposal element: Status tokens (error, success, warning)
  - Design decision: Decision 2 (`color-mix()` derivation from `-base` token)
  - Validation approach: Playwright visual screenshot comparison; contrast ratio check

- Proposal element: Categorical badge tokens (meal, course, prep, classification)
  - Design decision: Decision 3 (per-category token sets)
  - Validation approach: Visual review in dark + light-cool + light-warm; existing badge component tests

- Proposal element: `CookbookStandaloneLayout` print migration
  - Design decision: Decision 4 (`--theme-print-*` namespace)
  - Validation approach: E2E test rendering print view in dark theme; Playwright screenshot

- Proposal element: PDF export token foundation
  - Design decision: Decision 4 (`[data-pdf-export]` override block in `base.css`)
  - Validation approach: Manual test — apply `data-pdf-export` attribute, verify `--theme-print-accent` resolves to cyan override

---

## Functional Requirements Mapping

- Requirement: Status colors (error/success/warning) respond to theme changes
  - Design element: `--theme-*-base` overrides in `dark.css`; `:root` defaults in `base.css`
  - Acceptance criteria reference: specs/semantic-status-tokens.md
  - Testability notes: Screenshot test switching between themes with a component displaying each status state

- Requirement: Badge colors are distinct per category in all themes
  - Design element: Per-category token sets (Decision 3); dark overrides in `dark.css`
  - Acceptance criteria reference: specs/badge-tokens.md
  - Testability notes: Visual render of TaxonomyBadge and ClassificationBadge in all three themes

- Requirement: Print view is always light regardless of active theme
  - Design element: `--theme-print-*` tokens with hardcoded light values (Decision 4)
  - Acceptance criteria reference: specs/print-tokens.md
  - Testability notes: E2E test — activate dark theme, render `CookbookStandaloneLayout`, assert no dark colors appear

- Requirement: PDF export can independently override print tokens
  - Design element: `[data-pdf-export]` block in `base.css` (Decision 4)
  - Acceptance criteria reference: specs/print-tokens.md
  - Testability notes: Apply attribute, screenshot, verify accent color differs from default print

- Requirement: No hardcoded color classes remain in migrated files
  - Design element: Decision 5 (arbitrary-value token consumption)
  - Acceptance criteria reference: specs/component-migration.md
  - Testability notes: Automated grep in CI for the color class pattern from issue #316

---

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No visual regression in dark theme after migration
  - Design element: Hardcoded dark values become `dark.css` overrides verbatim
  - Acceptance criteria reference: specs/component-migration.md
  - Testability notes: Playwright before/after screenshot comparison in dark theme

- Requirement category: operability
  - Requirement: Future themes inherit correct status/badge defaults without component changes
  - Design element: `:root` base tokens (Decision 1) — new themes only need to override what diverges
  - Acceptance criteria reference: specs/semantic-status-tokens.md
  - Testability notes: Manual — add a hypothetical fourth theme CSS file with no overrides; verify status colors render from `:root`

- Requirement category: performance
  - Requirement: No additional JS bundle size or render cost
  - Design element: Pure CSS custom properties; no runtime computation
  - Acceptance criteria reference: n/a
  - Testability notes: Bundle size check — no new JS imports

---

## Risks / Trade-offs

- Risk/trade-off: `color-mix()` tint values differ from original hardcoded opacities
  - Impact: Subtle but noticeable visual change in error/warning backgrounds
  - Mitigation: Tune `color-mix()` percentages to visually match originals during implementation

- Risk/trade-off: Light-warm theme may have contrast issues with status colors inherited from `:root`
  - Impact: WCAG failure on amber-tinted surface with red-600 text
  - Mitigation: Check contrast during implementation; add `light-warm` overrides if ratio falls below 4.5:1

- Risk/trade-off: Import order in `src/styles.css` is load-bearing
  - Impact: Wrong import order causes theme overrides to be swallowed by `:root` defaults
  - Mitigation: Document order explicitly in `base.css` file header comment; CI grep to verify order

- Risk/trade-off: `CookbookStandaloneLayout` migration is large and print-only tested
  - Impact: A missed class leaves a dark-mode artifact in printed output — hard to catch without explicit print test
  - Mitigation: E2E test required before merge; file is well-scoped so full audit is feasible

---

## Rollback / Mitigation

- **Rollback trigger:** Visual regression in any theme, or CI screenshot diff above threshold
- **Rollback steps:** Revert all modified `.tsx` files to hardcoded classes; remove `base.css` import from `src/styles.css`; remove new override blocks from `dark.css` and `print.css`
- **Data migration considerations:** None — pure CSS change, no database or API impact
- **Verification after rollback:** Confirm all three themes render identically to pre-change baseline; re-run Playwright suite

---

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check before requesting re-review. Hardcoded color grep failures must be resolved — no exceptions.
- **If security checks fail:** Do not merge. This change is CSS-only so security failures are likely unrelated; triage before merge.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours; escalate to maintainer after 72 hours.
- **Escalation path and timeout:** If blocked for more than 5 days, rebase and reopen review. If blocked for more than 10 days, evaluate splitting into smaller PRs per token namespace.

---

## Open Questions

No open questions. All design decisions were resolved during the explore phase.

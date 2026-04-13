## Context

- **Relevant architecture:**
  - `src/styles.css` — Tailwind 4 entry point; currently defines `html.dark` and `html.light` blocks inline
  - `src/styles/themes/` — does not yet exist; this change creates it
  - `src/contexts/ThemeContext.tsx` — `THEMES` array drives both the selector UI and CSS class application; currently has `{ id: 'light', label: 'Light' }`
  - `src/routes/__root.tsx` — inline `<script>` in `<head>` reads localStorage and applies theme class before paint; allowlist includes `'dark'` and `'light'`
  - `src/components/layout/PageLayout.tsx` — `bg-gradient-to-b from-[var(--theme-bg)] via-[var(--theme-surface)] to-[var(--theme-bg)]`; in light the mid-stop is white, creating a white void that hides feature cards
  - `src/routes/index.tsx` — hero `<h1>` uses hardcoded `text-white`; CTA gradient uses `cyan-400/blue-400`
  - ~40 component files with hardcoded dark colours or light-inappropriate accent usages
- **Dependencies:** TanStack Start (SSR), Tailwind CSS 4, CSS custom properties, localStorage
- **Interfaces/contracts touched:**
  - `localStorage['cookbook-theme']` — value `'light'` must be migrated to `'light-cool'` via one-time shim
  - `html` class attribute — new valid value `'light-cool'`
  - CSS custom property namespace `--theme-*` — extended with `--theme-shadow-sm` and `--theme-shadow-md`
  - `ThemeContext.THEMES` — replaces `{ id: 'light' }` with `{ id: 'light-cool', label: 'Light (cool)' }`

## Goals / Non-Goals

### Goals

- Comprehensive, intentionally designed light theme with proper visual hierarchy
- All text passes WCAG AA contrast (4.5:1 minimum on all background surfaces)
- Shadow tokens provide elevation depth cues (the primary depth mechanism in light themes)
- Per-file theme architecture enables future themes with zero `styles.css` editing
- Zero hardcoded dark colours remaining in non-exempt component files after migration
- No regressions on dark theme or print output

### Non-Goals

- Light (warm) theme (tracked in #308)
- Runtime user-supplied theme loading
- `prefers-color-scheme` integration
- Theme transition animations
- `@custom-variant dark` removal (intentionally retained for badge and draft banner carve-outs)

## Decisions

### Decision 1: Per-file theme architecture

- **Chosen:** Extract theme token blocks into `src/styles/themes/dark.css` and `src/styles/themes/light-cool.css`. `src/styles.css` imports both with `@import "./styles/themes/dark.css"` etc.
- **Alternatives considered:** Keep all themes in `styles.css` as multiple `html.<name>` blocks; use a build-time theme generator.
- **Rationale:** Per-file architecture means adding a new theme = add one file + one `@import` line. No existing theme file is touched. Mirrors how design systems (e.g., Radix Themes, shadcn) handle multi-theme CSS. Path toward user-supplied themes (runtime `<link>` injection) is cleaner from a file-per-theme starting point.
- **Trade-offs:** Slightly more files. Tailwind must parse the imports — verified working with `@import` in Tailwind 4.

### Decision 2: Theme id `light-cool`, label `"Light (cool)"`

- **Chosen:** `THEMES` entry `{ id: 'light-cool', label: 'Light (cool)' }`. `html` class becomes `light-cool`. CSS selector is `html.light-cool { ... }`.
- **Alternatives considered:** Keep `'light'` id and update in place; use `'light-blue'`.
- **Rationale:** `'light-cool'` is semantically distinct from the placeholder `'light'`. Distinguishing the id now avoids confusion when `'light-warm'` (#308) arrives. The label "Light (cool)" in the selector communicates the palette character to the user.
- **Trade-offs:** Requires a localStorage migration shim for users who stored `'light'`.

### Decision 3: localStorage migration shim for `'light'` → `'light-cool'`

- **Chosen:** Add a one-time migration in the inline `<head>` script: if `localStorage['cookbook-theme'] === 'light'`, rewrite to `'light-cool'` before applying the class.
- **Alternatives considered:** Accept the regression (users see dark on first load); use a redirect/cookie approach.
- **Rationale:** Inline script already runs before paint; adding a one-line migration keeps the upgrade invisible to users. The shim can be removed after 4–6 weeks (after all active sessions have migrated).
- **Trade-offs:** Tiny extra bytes in the inline script. The shim is safe — it only rewrites a known stale value.

### Decision 4: Expand token contract with shadow tokens

- **Chosen:** Add `--theme-shadow-sm` and `--theme-shadow-md` to the token contract. Both themes define these tokens. Dark theme uses `0 0 0 0 transparent` (no visible effect). Light (cool) uses `slate-900` RGB at 8% opacity with cool tint.
- **Alternatives considered:** Use Tailwind's built-in shadow utilities; no shadow tokens (rely on borders only).
- **Rationale:** Light themes require shadows for perceived elevation — tonal difference alone between `slate-100` (bg) and `white` (surface) is imperceptible. CSS variable shadows unify the elevation system with the same token-driven approach used for colour. Tailwind's built-in shadows are not theme-aware.
- **Trade-offs:** Components must opt in to shadow tokens explicitly (`shadow-[var(--theme-shadow-sm)]`). Not all components need shadows; the token provides the option.

### Decision 5: Fix `--theme-fg-subtle` contrast

- **Chosen:** Change `--theme-fg-subtle` in light-cool from `gray-400` (`#9ca3af`, ~3.5:1 on white) to `slate-500` (`#64748b`, ~5:1 on white).
- **Alternatives considered:** Keep `gray-400`; use `slate-400`.
- **Rationale:** WCAG AA requires 4.5:1 for normal text. `slate-400` is still ~3.9:1 — marginal. `slate-500` provides clear headroom. This token is used for placeholder text, captions, and disabled states — contexts where the text must still be readable.
- **Trade-offs:** `slate-500` is slightly darker than the placeholder aesthetic some designs prefer. Acceptable — accessibility is not optional.

### Decision 6: Accent colour is theme-specific (`blue-600` for light-cool)

- **Chosen:** `--theme-accent: theme(colors.blue.600)` in light-cool. Dark theme retains `cyan-400`.
- **Alternatives considered:** Share `cyan-600` across both light themes; use `sky-600`.
- **Rationale:** Accent colour is part of the theme's design identity. `cyan-300/400` (used in the placeholder light theme) are too pale on white — insufficient contrast and wrong mood. `blue-600` is authoritative, readable on white (5.9:1), and characteristically cool. Per the design direction for this change: accent aligns with the theme's colour character, not a global brand constant.
- **Trade-offs:** The CookBook wordmark and some existing icon usages reference `cyan-400` specifically. These must be migrated to `var(--theme-accent)` or given a deliberate exception.

### Decision 7: PageLayout gradient redesign

- **Chosen:** Change the gradient in `PageLayout` from `from-[var(--theme-bg)] via-[var(--theme-surface)] to-[var(--theme-bg)]` to `from-[var(--theme-surface)] via-[var(--theme-bg)] to-[var(--theme-surface)]` — or preferably, a simpler flat `bg-[var(--theme-bg)]` with cards relying on shadows for contrast.
- **Alternatives considered:** Adjust token values so the gradient still works; add a section-specific background override.
- **Rationale:** The current gradient works in dark (slate-900 → slate-800 is perceivable) but creates a white void in light (gray.50 → white → gray.50 is near-invisible). Simplifying to a flat background removes the fragility and lets card shadows do the visual work.
- **Trade-offs:** The page background becomes flat. Acceptable — visual interest comes from the content cards with shadows, not the background gradient.

### Decision 8: Component migration scope and exempt carve-outs

- **Chosen:** All non-exempt component files with hardcoded dark colours must migrate to token references. Exempt carve-outs (retained `dark:` variants):
  - Taxonomy badges (`TaxonomyBadge.tsx`) — categorical colours (amber, violet, emerald)
  - Classification badges (`ClassificationBadge.tsx`) — same reason
  - `MultiSelectDropdown.tsx` checked item cyan tint — no token equivalent; documented
  - `RecipeForm.tsx` draft banner — `dark:text-cyan-300` retained (documented carve-out from #281)
  - `StatusIndicator.tsx` success/error colours (`green-600/dark:green-400`, `red-600/dark:red-400`) — semantic status colours, not theme surfaces
- **Rationale:** Consistent with the #281 decision to exempt categorical/semantic colours from the token system.
- **Trade-offs:** A small number of `dark:` variants remain; these are documented in code comments.

## Proposal to Design Mapping

- **Proposal element:** Per-file theme architecture
  - **Design decision:** Decision 1
  - **Validation approach:** Build succeeds; `@import` resolves; both themes apply correctly

- **Proposal element:** Theme id `light-cool`
  - **Design decision:** Decision 2 + Decision 3 (migration shim)
  - **Validation approach:** Unit test ThemeContext; E2E: verify `html.light-cool` class applied; verify shim migrates `'light'` → `'light-cool'`

- **Proposal element:** Shadow token layer
  - **Design decision:** Decision 4
  - **Validation approach:** Visual inspection — cards appear elevated in light; no shadow in dark

- **Proposal element:** WCAG AA contrast fix for `fg-subtle`
  - **Design decision:** Decision 5
  - **Validation approach:** E2E contrast assertion; manual contrast ratio check

- **Proposal element:** Theme-specific accent colour
  - **Design decision:** Decision 6
  - **Validation approach:** Visual inspection — CTAs, links, active states use blue in light-cool; grep confirms no remaining `text-cyan-300/400` in non-exempt files

- **Proposal element:** PageLayout gradient fix
  - **Design decision:** Decision 7
  - **Validation approach:** E2E: home page features section has visible card contrast in light-cool

- **Proposal element:** Component migration
  - **Design decision:** Decision 8
  - **Validation approach:** Post-migration grep for hardcoded dark colour classes in non-exempt files; E2E page-by-page smoke in light-cool

## Functional Requirements Mapping

- **Requirement:** All site surfaces render correctly in Light (cool) theme
  - **Design element:** Decisions 1, 6, 7, 8 (file architecture + full component migration)
  - **Acceptance criteria reference:** `specs/component-token-migration.md`
  - **Testability notes:** E2E Playwright tests on home, recipes, cookbooks, auth, recipe detail pages in light-cool

- **Requirement:** Theme id `light-cool` persists and restores correctly
  - **Design element:** Decisions 2, 3 (id + migration shim)
  - **Acceptance criteria reference:** `specs/theme-id-and-persistence.md`
  - **Testability notes:** Unit test ThemeContext; E2E reload test with `light-cool` in localStorage

- **Requirement:** Text contrast meets WCAG AA throughout
  - **Design element:** Decision 5 (fg-subtle fix) + Decision 6 (accent contrast)
  - **Acceptance criteria reference:** `specs/color-system.md`
  - **Testability notes:** E2E contrast assertions on key text; design-time contrast ratio table in proposal

- **Requirement:** Cards and overlays have perceivable elevation in light mode
  - **Design element:** Decision 4 (shadow tokens) + Decision 7 (gradient fix)
  - **Acceptance criteria reference:** `specs/color-system.md`
  - **Testability notes:** E2E: assert cards are visually distinct from page background (computed style check)

- **Requirement:** Adding a future theme requires only a new CSS file and THEMES entry
  - **Design element:** Decision 1 (per-file architecture)
  - **Acceptance criteria reference:** `specs/theme-file-architecture.md`
  - **Testability notes:** Code review — verify no component changes needed for stub theme

## Non-Functional Requirements Mapping

- **Requirement category:** Accessibility
  - **Requirement:** All non-exempt text elements meet WCAG AA (4.5:1) in light-cool
  - **Design element:** Decision 5 (`slate-500` fg-subtle), Decision 6 (`blue-600` accent)
  - **Acceptance criteria reference:** `specs/color-system.md`
  - **Testability notes:** Contrast assertions in E2E; design-time verification in proposal colour table

- **Requirement category:** Performance
  - **Requirement:** No visible theme flash on page load with `light-cool` stored in localStorage
  - **Design element:** Existing inline script (updated allowlist per Decision 2)
  - **Acceptance criteria reference:** `specs/theme-id-and-persistence.md`
  - **Testability notes:** E2E: load with `light-cool` in localStorage at `waitUntil: 'commit'`; assert `html.light-cool`

- **Requirement category:** Reliability
  - **Requirement:** Existing dark theme is unaffected; print output is unaffected
  - **Design element:** Decision 4 (shadow tokens transparent in dark), Decision 1 (themes isolated in own files)
  - **Acceptance criteria reference:** `specs/theme-file-architecture.md`
  - **Testability notes:** Existing dark theme and print E2E tests must continue to pass without modification

## Risks / Trade-offs

- **Risk/trade-off:** `'light'` → `'light-cool'` localStorage migration affects existing users
  - **Impact:** Brief dark flash for users with `'light'` stored, if shim is not present
  - **Mitigation:** Migration shim in inline script; verified by E2E test

- **Risk/trade-off:** Component audit coverage — grep may not catch all hardcoded colours
  - **Impact:** Residual light-mode rendering bugs after migration
  - **Mitigation:** E2E smoke across all major surfaces; post-migration grep check as a task step

- **Risk/trade-off:** `PageLayout` gradient change may subtly alter dark theme appearance
  - **Impact:** Minor visual change to dark page backgrounds
  - **Mitigation:** Dark theme regression test; explicit visual review

- **Risk/trade-off:** Shadow tokens add CSS specificity to component styles
  - **Impact:** Potential override conflicts with utility classes in unusual component combinations
  - **Mitigation:** Shadows are applied via Tailwind arbitrary value (`shadow-[var(--theme-shadow-sm)]`) — same specificity as other utility classes; no override risk

## Rollback / Mitigation

- **Rollback trigger:** Visual regression on dark theme; print isolation broken; hydration errors; WCAG failures persisting after fix
- **Rollback steps:** Revert PR; restore `src/styles.css` with inline `html.dark` and `html.light` blocks; restore `THEMES` to `{ id: 'light', label: 'Light' }` and inline script allowlist; localStorage `'light-cool'` reverts to dark (safe — dark is the default fallback)
- **Data migration considerations:** After rollback, users who upgraded to `'light-cool'` will see dark on first load. Acceptable — dark is the default.
- **Verification after rollback:** All existing E2E tests pass; print output correct; no hydration warnings

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before requesting re-review.
- **If security checks fail:** Do not merge. Codacy/Snyk findings on new code must be resolved or explicitly acknowledged as false-positives with a comment.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours. After 72 hours, escalate to project owner.
- **Escalation path and timeout:** If blocked > 5 business days with no response, reassess scope and priority with project owner.

## Open Questions

No open questions. All design decisions confirmed during exploration and proposal review.

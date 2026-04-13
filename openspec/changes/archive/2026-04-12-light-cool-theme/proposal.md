## GitHub Issues

- dougis-org/cookbook-tanstack#302
- dougis-org/cookbook-tanstack#308 (Light warm — depends on this change)

## Why

- **Problem statement:** The light theme shipped in #281 was an explicitly acknowledged placeholder — functional colour values but no design intent, no visual hierarchy, and no comprehensive component coverage. In practice it is broken: filter toggles use hardcoded dark colours (`bg-slate-800`), modals use `bg-slate-800`/`text-white`, the page gradient creates a white void in the features section, and key text fails WCAG AA contrast on light backgrounds (`gray-400` on white = ~3.5:1, below the 4.5:1 minimum). The result is a theme that looks accidental rather than designed.
- **Why now:** The theme architecture (#281) is proven and stable. The next logical step — before adding further themes — is to establish a comprehensively designed light theme that acts as the template for all future theme work, including the upcoming Light (warm) theme (#308).
- **Business/user impact:** Users who prefer or require light mode currently see a broken, unpolished interface. A properly designed light theme expands accessibility, provides a template for future theme additions (Solarized, high-contrast, warm), and establishes the per-file theme file architecture needed for eventual user-supplied theme support.

## Problem Space

- **Current behavior:** `html.light` is defined as a single block in `src/styles.css` with adequate token values but no shadow system, insufficient contrast on `--theme-fg-subtle` (fails WCAG AA), and an accent colour (`cyan-600`) that was chosen for functional parity with dark rather than design intent. Approximately 40+ component files contain hardcoded dark colours (`bg-slate-800`, `text-white`, `text-gray-400`, `text-cyan-300`, etc.) that are ignored by the CSS variable token system and render incorrectly in light mode. Several files marked as exempt (`dark:` variants on badges) are correctly exempt, but many others are erroneously bypassing the token system.
- **Desired behavior:** `html.light-cool` is defined in its own file (`src/styles/themes/light-cool.css`), with a fully designed cool blue-gray colour system following the 60-30-10 principle, shadow tokens for elevation hierarchy, WCAG AA-compliant text contrast throughout, and theme-specific accent colours. All components reference only CSS custom property tokens, ensuring the theme applies correctly across the entire site. The theme ID in the selector is `light-cool` with label `"Light (cool)"`.
- **Constraints:**
  - Print output must be unaffected by theme changes (established requirement from #281).
  - Badge colours (amber, violet, emerald for taxonomy classifications) remain exempt from token migration — categorical semantic colours, not UI surface roles.
  - Remaining intentional `dark:` variants on badges and the RecipeForm draft banner are retained as documented carve-outs.
  - No account required; theme stored in localStorage only.
  - TanStack Start SSR — theme must apply before hydration (existing inline script handles this; just needs `light-cool` id added to allowlist).
- **Assumptions:**
  - The existing `ThemeContext`/`useTheme()` architecture from #281 is kept as-is; only the `THEMES` array and the CSS files change.
  - The `@custom-variant dark` in `styles.css` is retained (as documented in the #281 scope delta) for the badge and draft banner carve-outs.
  - Tailwind arbitrary values (`bg-[var(--theme-surface)]`) remain the mechanism for token consumption in components.
- **Edge cases considered:**
  - SSR: the inline script in `__root.tsx` already falls back to `'dark'` for unknown ids; `'light-cool'` must be added to the allowlist so it is not silently ignored.
  - Components with both hardcoded colours and token-using siblings — full audit required, not grep-only.
  - `PrintLayout` — already uses CSS variable scoped overrides; no change needed, but must be verified under `light-cool`.
  - `ConfirmDialog` and `DeleteConfirmModal` — both use `bg-slate-800`/`text-white`; these are overlay components and must use surface/shadow tokens for proper elevation appearance in light.

## Color System

This section documents the full color system for the Light (cool) theme, following the 60-30-10 design principle: 60% dominant neutral, 30% secondary/structural, 10% accent. Avoid pure black (`#000000`) per design principle #7 — use `slate-900` (`#0f172a`) as the darkest value instead.

### Palette Foundation — Cool Blue-Gray Scale

The Light (cool) theme is built on Tailwind's `slate` scale for its blue-gray undertones, with `blue` as the accent family. All colour values are expressed as Tailwind theme references for use in CSS custom properties.

#### 60% — Dominant Neutral (backgrounds, surfaces)

| Token | Value | Hex | Purpose |
|---|---|---|---|
| `--theme-bg` | `slate-100` | `#f1f5f9` | Page canvas — slightly cool off-white, never pure white |
| `--theme-surface` | `white` | `#ffffff` | Card/panel surface — floats above canvas via shadow |
| `--theme-surface-raised` | `slate-50` | `#f8fafc` | Elements raised within cards (inputs, table rows) |
| `--theme-surface-hover` | `blue-50` | `#eff6ff` | Interactive hover state — cool blue tint |

#### 30% — Secondary (borders, structural text)

| Token | Value | Hex | Contrast on white | Purpose |
|---|---|---|---|---|
| `--theme-border` | `slate-200` | `#e2e8f0` | — | Standard dividers and card outlines |
| `--theme-border-muted` | `slate-100` | `#f1f5f9` | — | Hairline / subtle separators |
| `--theme-fg` | `slate-900` | `#0f172a` | ~17:1 ✓ | Primary text — near-black with cool undertone |
| `--theme-fg-muted` | `slate-600` | `#475569` | ~7:1 ✓ | Secondary text, headings, labels |
| `--theme-fg-subtle` | `slate-500` | `#64748b` | ~5:1 ✓ | Placeholder, disabled, caption text |

> **Note:** The current draft light theme uses `gray-400` for `--theme-fg-subtle`, which yields ~3.5:1 contrast on white — below the WCAG AA minimum of 4.5:1. `slate-500` corrects this.

#### 10% — Accent (calls to action, active states, interactive focus)

| Token | Value | Hex | Contrast on white | Purpose |
|---|---|---|---|---|
| `--theme-accent` | `blue-600` | `#2563eb` | ~5.9:1 ✓ | Primary CTA, links, active indicators |
| `--theme-accent-hover` | `blue-700` | `#1d4ed8` | ~7.8:1 ✓ | Hover state for accent elements |
| `--theme-accent-emphasis` | `blue-800` | `#1e40af` | ~10.1:1 ✓ | Pressed/active state, emphasis rings |

> **Design rationale:** Accent colour is theme-specific, not shared across themes. Dark uses `cyan-400`; Light (cool) uses `blue-600`. The cool blue accent is authoritative and calm — appropriate for a recipe management tool. Cyan-300/400 values (used in the current placeholder light theme) are too pale on white backgrounds and inappropriate for a light-mode accent.

### Shadow System (new token layer)

Light themes cannot rely on tonal contrast alone for elevation — the tonal difference between `slate-100` (bg) and `white` (surface) is too small to perceive without additional depth cues. Shadows are the primary elevation signal in light themes.

| Token | Value | Purpose |
|---|---|---|
| `--theme-shadow-sm` | `0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)` | Cards, form inputs, standard panels |
| `--theme-shadow-md` | `0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.08)` | Modals, dropdowns, overlays |

Shadow colour is `slate-900` RGB (`15 23 42`) at low opacity — gives shadows a cool blue-gray tint rather than neutral black. Dark theme also receives these tokens with near-zero opacity (shadows are not perceptible on dark backgrounds but the token contract must be complete).

### Colour Comparison: Dark vs Light (cool)

| Role | Dark theme | Light (cool) |
|---|---|---|
| Page background | `slate-900` | `slate-100` |
| Card surface | `slate-800` | `white` |
| Raised surface | `gray-800` | `slate-50` |
| Hover surface | `gray-700` | `blue-50` |
| Primary text | `white` | `slate-900` |
| Muted text | `gray-300` | `slate-600` |
| Subtle text | `gray-400` | `slate-500` |
| Accent idle | `cyan-400` | `blue-600` |
| Accent hover | `cyan-500` | `blue-700` |
| Elevation signal | Tonal contrast (borders) | Shadows + borders |

## Scope

### In Scope

- New per-file theme architecture: `src/styles/themes/dark.css` and `src/styles/themes/light-cool.css`; `src/styles.css` imports both
- Rename theme id from `'light'` to `'light-cool'` throughout codebase; update `ThemeContext.THEMES` label to `'Light (cool)'`
- Expand CSS custom property token contract: add `--theme-shadow-sm` and `--theme-shadow-md` to both themes
- Fix `--theme-fg-subtle` in light: `gray-400` → `slate-500` (WCAG AA compliance)
- Full component audit and migration — all hardcoded dark colours replaced with token references:
  - `FilterRow1Quick`, `FilterDropdowns` (filter toggle chips)
  - `ConfirmDialog`, `DeleteConfirmModal`, `ImportPreviewModal` (overlays/modals)
  - `CookbookCard` (Private badge), `CookbookFields`, `CookbookRecipeCard`
  - `RecipeForm` (draft banner, CTA buttons, checkbox), `RecipeDetail` (step numbers, quantity controls, source link)
  - `ImportDropzone` (border, text)
  - `StatusIndicator` (green/red status text — adopt token-aware approach)
  - `Header` (sign-in button `text-white`)
  - `AuthPageLayout`, `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm` (link colours)
  - `ActiveBadge` (filter chips on recipes page)
- Shadow token adoption on cards and overlays
- Redesign `PageLayout` gradient so it produces visual hierarchy in light (not a white void)
- Update home page hero: remove hardcoded `text-white`, use accent tokens for gradient text
- Update `src/routes/__root.tsx` inline script allowlist to include `light-cool`
- E2E and unit tests covering new theme id, WCAG contrast, and visual correctness

### Out of Scope

- Print output changes (must remain unaffected)
- Light (warm) theme — tracked in #308; depends on this change landing first
- Runtime user-supplied theme loading (future work)
- `prefers-color-scheme` auto-detection
- Account-level theme persistence
- `@custom-variant dark` removal (deferred per #281 scope delta; badge and draft banner carve-outs remain)

## What Changes

- `src/styles.css` — remove `html.dark` and `html.light` blocks; add `@import` for each theme file
- `src/styles/themes/dark.css` — new file: extracted dark token block + shadow tokens (near-zero opacity)
- `src/styles/themes/light-cool.css` — new file: full light cool token block per color system above
- `src/contexts/ThemeContext.tsx` — update `THEMES`: `{ id: 'light-cool', label: 'Light (cool)' }`; remove `{ id: 'light', ... }`
- `src/routes/__root.tsx` — update inline script theme allowlist from `['dark', 'light']` to `['dark', 'light-cool']`
- `src/components/layout/PageLayout.tsx` — redesign gradient for light hierarchy
- `src/routes/index.tsx` — remove hardcoded `text-white` from hero h1; adopt accent tokens for CTA gradient
- `src/routes/recipes/index.tsx` — `ActiveBadge` and `FilterToggle` use accent tokens
- ~20 additional component files — migrate hardcoded colours to CSS variable tokens (full list in design.md)

## Risks

- **Risk:** Renaming `'light'` → `'light-cool'` breaks existing users who have `'light'` stored in localStorage.
  - **Impact:** Users see dark theme instead of light on first load after deploy.
  - **Mitigation:** Update the inline script allowlist; add a migration shim: if localStorage reads `'light'`, rewrite to `'light-cool'` before applying. One-time migration, safe to remove after a few weeks.

- **Risk:** Component audit misses files — a grep-based audit may not catch all hardcoded colours.
  - **Impact:** Visual regressions remain on light-cool theme.
  - **Mitigation:** E2E tests cover all major page surfaces in `light-cool` theme; post-migration grep for `slate-[0-9]\|gray-[0-9]\|text-white\b` in component classNames provides a completeness check.

- **Risk:** `PageLayout` gradient redesign affects dark theme appearance.
  - **Impact:** Subtle visual regression on dark theme page backgrounds.
  - **Mitigation:** Dark theme E2E regression test; explicit visual review of home, recipes, cookbooks in dark after change.

- **Risk:** Shadow tokens change card appearance in dark theme.
  - **Impact:** Unwanted shadow effect in dark mode if opacity values are not near-zero.
  - **Mitigation:** Dark theme `--theme-shadow-sm/md` set to `0 0 0 0 transparent` — no visible effect.

## Open Questions

No unresolved ambiguity remains. All decisions confirmed during exploration:
- Theme id: `light-cool`, label: `"Light (cool)"`
- Accent: `blue-600` (theme-specific, not shared with dark)
- Shadow tokens: yes, `--theme-shadow-sm` and `--theme-shadow-md`
- Architecture: per-file themes in `src/styles/themes/`
- `fg-subtle` fix: `slate-500` (WCAG AA compliant)
- localStorage migration shim: yes, rewrite `'light'` → `'light-cool'`
- Warm theme: separate issue (#308), depends on this landing first

## Non-Goals

- Light (warm) theme
- Solarized or any other third theme
- Runtime user-supplied theme loading
- `prefers-color-scheme` media query integration
- Theme transition animations
- Account-level theme persistence

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

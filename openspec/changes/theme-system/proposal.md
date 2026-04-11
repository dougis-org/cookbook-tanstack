## GitHub Issues

- dougis-org/cookbook-tanstack#281

## Why

- **Problem statement:** The site is hardcoded to a single dark theme via `<html class="dark">` in `__root.tsx`. Users have no way to choose an alternative appearance, and adding any new theme today would require touching every component individually.
- **Why now:** Issue #211 (PrintLayout) has landed and explicitly deferred the `PrintLayout` DOM-manipulation hack to this change. The hack (`useLayoutEffect` removing `.dark` from `<html>` while mounted) is fragile and will break if any future theme is not named `dark`. Resolving it requires this work.
- **Business/user impact:** Users can personalise the appearance of the site. The architecture becomes extensible — adding a future theme (Solarized, high-contrast, etc.) requires only a CSS block and a selector entry, with zero component changes.

## Problem Space

- **Current behavior:** `<html class="dark">` is hardcoded. All theming is expressed via Tailwind `dark:` variants on 29 source files. `PrintLayout` removes `.dark` from `<html>` via a side-effectful `useLayoutEffect` to force light print output.
- **Desired behavior:** Theme is driven by a CSS custom property token set (`--theme-*`) defined per theme on `html.<theme-name>`. The active theme class is persisted to `localStorage` and applied before first paint. Users select their theme from an N-theme selector at the bottom of the hamburger menu. `PrintLayout` becomes a pure declarative component that locally overrides CSS variables.
- **Constraints:**
  - No account required to set a theme — localStorage only.
  - Classification badge colors (amber, emerald, violet, etc.) are categorical/semantic and are exempt from the token migration.
  - Print output must be unaffected by theme choice (requirement stated in #281).
  - TanStack Start uses SSR — the theme must be applied before hydration to avoid a flash of wrong theme.
- **Assumptions:**
  - The light theme shipped in this change is a functional draft only — colour accuracy and polish are explicitly out of scope.
  - Tailwind 4's `@custom-variant` approach continues to be used for the `dark` variant on any components that are not yet migrated (none expected, but as a safety net during migration).
- **Edge cases considered:**
  - SSR: server always renders `class="dark"` (default); an inline `<script>` in `<head>` corrects the class from localStorage before paint.
  - Multiple `PrintLayout` instances: the current ref-count logic is eliminated; CSS variable scoping handles nesting correctly by nature.
  - localStorage unavailable (private browsing, iframe sandbox): the inline script is wrapped in `try/catch`; falls back to dark.
  - Future theme addition: only requires a `html.themename { }` CSS block and a one-line registration in the theme selector config.

## Scope

### In Scope

- CSS custom property token system (`--theme-*` namespace) defined in `src/styles.css`
- Dark theme token values (canonical, replacing current inconsistent slate/gray mix)
- Draft light theme token values (functional, not polished)
- Migration of all 29 existing files that use `dark:` Tailwind variants to CSS variable tokens
- `ThemeContext` and `useTheme()` hook
- Inline `<script>` in `__root.tsx` `<head>` for flash-free SSR hydration
- N-theme selector component at the bottom of the hamburger menu sidebar
- `PrintLayout` refactor: drop `useLayoutEffect` DOM hack, replace with scoped CSS variable overrides

### Out of Scope

- Polishing the light theme colour palette
- Any additional themes beyond dark and draft light
- Persisting theme preference to the user's account/database
- A dedicated settings/preferences page
- System preference (`prefers-color-scheme`) auto-detection

## What Changes

- `src/styles.css` — token definitions for `html.dark` and `html.light`; retain `@custom-variant dark` as a compatibility safety net for remaining `dark:` usages (badge tints, draft banner) — full removal deferred to a follow-up change
- `src/routes/__root.tsx` — add inline theme-init script; `<html>` class becomes `dark` only as a server-rendered default
- `src/contexts/ThemeContext.tsx` — new file: context + provider + `useTheme` hook
- `src/components/Header.tsx` — add theme selector at bottom of hamburger sidebar; wrap app in `ThemeProvider`
- `src/components/cookbooks/PrintLayout.tsx` — replace `useLayoutEffect` hack with scoped CSS variable overrides
- 29 component/route files — replace `dark:*` Tailwind variants with `[var(--theme-*)]` arbitrary values (or Tailwind 4 utility classes if `@theme` registration proves cleaner)

## Risks

- **Risk:** Tailwind 4 `@theme` registration with `initial` values and runtime CSS variable overrides — behaviour may differ from what JIT expects.
  - **Impact:** Components render with no background/text colour.
  - **Mitigation:** Prototype the `@theme` approach on one component early in implementation. Fall back to Tailwind arbitrary values (`bg-[var(--theme-surface)]`) if registration misbehaves.

- **Risk:** SSR hydration mismatch — React state initialised on client from `document.documentElement.className` could differ from server-rendered `class="dark"`.
  - **Impact:** React hydration warning; potential layout flash.
  - **Mitigation:** The inline head script corrects the DOM class before React hydrates. `useTheme` initialises state from `document.documentElement.className` (client-only, lazy), avoiding a server/client mismatch.

- **Risk:** Migration scope — 29 files is a large diff; a missed `dark:` variant leaves a component broken on non-dark themes.
  - **Impact:** Visual regressions on light theme.
  - **Mitigation:** E2E smoke test for light theme covers the main surfaces. A grep for remaining `dark:` variants after migration acts as a completeness check.

## Open Questions

No unresolved ambiguity remains. All decisions were confirmed during exploration:
- Storage: localStorage
- Default: dark
- Toggle location: bottom of hamburger menu
- Toggle widget: N-theme selector (2 themes initially)
- Token namespace: `--theme-*`
- Badge colours: exempt
- Light theme: functional draft only
- PrintLayout: CSS variable scoped overrides

## Non-Goals

- Polished light theme
- Solarized or any third theme
- Per-user account-level theme persistence
- `prefers-color-scheme` media query integration
- Theme animation/transition effects

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

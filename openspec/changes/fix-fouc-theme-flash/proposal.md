## GitHub Issues

- #351

## Why

- Problem statement: On initial page load, users see a brief flash of an unstyled white page before the CSS theme loads. The `<html>` class is set correctly and immediately by an inline script, but all color values live in an external stylesheet — until that file downloads, `var(--theme-bg)` is undefined and the browser renders its default white background.
- Why now: Issue #351 was filed against the current site. A fourth theme is also incoming, making this the right moment to establish a maintainable pattern before the theme count grows further.
- Business/user impact: Jarring visual artifact on every first load (and hard-reload). Affects all three existing themes regardless of which the user has selected. Perceived quality impact is disproportionate to the actual fix effort.

## Problem Space

- Current behavior: `__root.tsx` injects a synchronous inline script that reads `localStorage` and sets the correct class on `<html>` before any paint. However, the color tokens (`--theme-bg`, `--theme-fg`) are only defined in `src/styles.css` and its theme imports — an external file loaded via `<link rel="stylesheet">` inside `<HeadContent />`. Until that file arrives over the network, the page renders white.
- Desired behavior: The page background and foreground color match the selected theme from the very first paint — no white flash, regardless of whether the CSS file has arrived.
- Constraints: TanStack Start with Nitro renders the `<head>` server-side. Inline `<style>` and `<script>` tags are safe to inject there. The existing `themeInitScript` pattern (inline JS before HeadContent) is the established precedent and must be extended, not replaced.
- Assumptions: The set of theme background/foreground colors is small (currently 3 themes, growing to 4) and changes infrequently. A hardcoded critical-CSS block is therefore low-maintenance. The `rel="preload"` hint is supported by all target browsers.
- Edge cases considered: User has no localStorage entry (defaults to `dark`); user has legacy `"light"` entry (migrated to `"light-cool"` by existing script); CSS file is already cached (preload is a no-op, inline CSS still correct); fourth theme added without updating inline block (flash returns for that theme — mitigated by documentation and a dev-time warning).

## Scope

### In Scope

- Inline critical CSS block in `__root.tsx` covering `background-color` and `color` for every current theme class (`dark`, `light-cool`, `light-warm`)
- `rel="preload"` hint for `appCss` added to the `head` links array
- Maintenance documentation: a comment block in `__root.tsx` listing exactly what must be updated when a theme is added or its background changes, plus a matching entry in `docs/theming.md` (created if it does not exist)
- `rel="preload"` hint for `printCss` (low-cost, consistent with the approach)

### Out of Scope

- Build-time critical CSS extraction (e.g., `vite-plugin-critical`) — deferred; adds tooling complexity
- HTTP Early Hints (103) via Nitro — deferred; Fly.io support is unclear
- Changing the theme token architecture or CSS variable naming
- The fourth theme itself (that is a separate change; this change prepares the pattern for it)

## What Changes

- `src/routes/__root.tsx` — add inline `<style>` block (after `themeInitScript`, before `<HeadContent />`) with hardcoded `background-color` and `color` per theme class; add `rel="preload"` link for `appCss`; add maintenance comment block
- `docs/theming.md` — created (or updated) with a "Theme Maintenance Checklist" section documenting every file that must change when a theme is added or modified

## Risks

- Risk: Hardcoded hex values in the inline style block drift from the CSS token values if a theme's background color is changed.
  - Impact: Flash returns for the affected theme.
  - Mitigation: Maintenance comment in `__root.tsx` explicitly lists the three (soon four) places to update. `docs/theming.md` adds the checklist. Low probability of drift — theme backgrounds are structural, not cosmetic, and rarely change.

- Risk: `rel="preload"` for a stylesheet occasionally triggers a browser console warning if the resource is also declared as a `<link rel="stylesheet">` without `as="style"` being honoured.
  - Impact: Console noise only; no functional regression.
  - Mitigation: Ensure the preload link uses `as="style"` and the `href` matches exactly.

## Open Questions

No unresolved ambiguity. The approach (inline critical CSS + preload), file locations, and maintenance strategy are all decided. The fourth theme's specific background color will be slotted into the inline block when that change is implemented.

## Non-Goals

- Eliminating all layout shift (CLS) — this change targets background flash only
- Preloading fonts or other assets beyond the two CSS files
- Automated CI enforcement that the inline block stays in sync with CSS tokens

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

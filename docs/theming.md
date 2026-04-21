# Theming Guide

CookBook uses a class-based dark-mode system. Theme selection is stored in
`localStorage` under the key `cookbook-theme` and applied synchronously before
first paint via an inline script in `src/routes/__root.tsx`.

## Theme Maintenance Checklist

### When adding a new theme

1. Create `src/styles/themes/<theme-name>.css` with all `--theme-*` tokens.
   Use an existing theme file as a template.
2. Add the theme to the `THEMES` array in `src/contexts/ThemeContext.tsx` with `id` and `label`.
3. Add the new theme entry to `criticalCss` in `src/routes/__root.tsx`.
   Source boot loader `background-color`, `color`, and spinner accent values
   from `--theme-bg`, `--theme-fg`, and `--theme-accent` in the new CSS file.
4. Update the hex reference table below with the new theme's values.
5. Confirm the boot gate rules in `src/styles.css` still hide `#boot-loader`
   and reveal `#app-shell` when the app stylesheet loads.

### When changing an existing theme's background color

1. Update `src/styles/themes/<theme-name>.css` — change `--theme-bg` and/or `--theme-fg`.
2. Update the corresponding entry in `criticalCss` in `src/routes/__root.tsx`.
   Keep boot loader background, foreground, and accent hex values in sync.
3. Update the hex reference table below.

## Current Theme Background Reference

### `dark`

- CSS file: `dark.css`
- `--theme-bg`: `theme(colors.slate.900)`, `#0f172a`
- `--theme-fg`: `theme(colors.white)`, `#ffffff`
- `--theme-accent`: `theme(colors.cyan.400)`, `#22d3ee`

### `light-cool`

- CSS file: `light-cool.css`
- `--theme-bg`: `theme(colors.slate.100)`, `#f1f5f9`
- `--theme-fg`: `theme(colors.slate.900)`, `#0f172a`
- `--theme-accent`: `theme(colors.blue.600)`, `#2563eb`

### `light-warm`

- CSS file: `light-warm.css`
- `--theme-bg`: `theme(colors.amber.50)`, `#fffbeb`
- `--theme-fg`: `theme(colors.stone.900)`, `#1c1917`
- `--theme-accent`: `theme(colors.amber.700)`, `#b45309`

### `dark-greens`

- CSS file: `dark-greens.css`
- `--theme-bg`: `#103c48` (Selenized Dark background)
- `--theme-fg`: `#adbcbc`
- `--theme-accent`: `#75b938` (Selenized green)

## Why critical CSS exists

The `criticalCss` constant in `src/routes/__root.tsx` is emitted by
`RootDocument` as a static SSR `<style>` element, alongside the inline init
script, before the external stylesheet loads. Without it, users see a white
flash on first page load because CSS custom properties (`--theme-bg`, etc.) are
only defined in the external stylesheet file.

The inline script sets the correct `<html>` class before any paint, and the
server-rendered critical CSS block maps those classes to actual color values.
That covers the window between "class is set" and "external stylesheet arrives".

## Boot Loader Sync Points

The first-paint boot loader is also part of the theme contract. Before
`src/styles.css` loads, `src/routes/__root.tsx` shows `#boot-loader` and cloaks
`#app-shell` using inline CSS only. Once the app stylesheet loads, the gate
rules near the top of `src/styles.css` hide `#boot-loader` and reveal
`#app-shell`.

Keep these files in sync whenever a theme changes:

- `src/routes/__root.tsx` for inline boot loader background, foreground, accent, and storage fallback values.
- `src/styles.css` for the stylesheet-loaded reveal gate.
- `src/styles/themes/*.css` for the full app theme tokens.
- `src/contexts/ThemeContext.tsx` for the list of valid theme IDs and labels.

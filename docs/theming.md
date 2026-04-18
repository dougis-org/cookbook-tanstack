# Theming Guide

CookBook uses a class-based dark-mode system. Theme selection is stored in `localStorage` under the key `cookbook-theme` and applied synchronously before first paint via an inline script in `src/routes/__root.tsx`.

## Theme Maintenance Checklist

### When adding a new theme

1. Create `src/styles/themes/<theme-name>.css` with all `--theme-*` tokens (use an existing theme file as a template).
2. Add the theme to the `THEMES` array in `src/contexts/ThemeContext.tsx` with `id` and `label`.
3. Add the new theme entry to `criticalCss` in `src/routes/__root.tsx` — `background-color` and `color` hex values sourced from `--theme-bg` and `--theme-fg` in the new CSS file.
4. Update the hex reference table below with the new theme's values.

### When changing an existing theme's background color

1. Update `src/styles/themes/<theme-name>.css` — change `--theme-bg` and/or `--theme-fg`.
2. Update the corresponding entry in `criticalCss` in `src/routes/__root.tsx` — keep hex values in sync.
3. Update the hex reference table below.

## Current Theme Background Reference

| Theme class | CSS file | `--theme-bg` | Hex | `--theme-fg` | Hex |
|---|---|---|---|---|---|
| `dark` | `dark.css` | `theme(colors.slate.900)` | `#0f172a` | `theme(colors.white)` | `#ffffff` |
| `light-cool` | `light-cool.css` | `theme(colors.slate.100)` | `#f1f5f9` | `theme(colors.slate.900)` | `#0f172a` |
| `light-warm` | `light-warm.css` | `theme(colors.amber.50)` | `#fffbeb` | `theme(colors.stone.900)` | `#1c1917` |
| *(4th theme)* | *(TBD)* | *(TBD)* | *(TBD)* | *(TBD)* | *(TBD)* |

## Why critical CSS exists

The `criticalCss` constant in `src/routes/__root.tsx` is injected as a `<style>` element via the inline init script before the external stylesheet loads. Without it, users see a white flash on first page load because CSS custom properties (`--theme-bg`, etc.) are only defined in the external stylesheet file.

The inline script sets the correct `<html>` class before any paint, and the critical CSS block maps those classes to actual color values — covering the window between "class is set" and "external stylesheet arrives".

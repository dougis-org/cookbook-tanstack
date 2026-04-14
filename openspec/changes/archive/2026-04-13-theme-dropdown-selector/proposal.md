## GitHub Issues

- #313

## Why

- **Problem statement:** The sidebar footer uses a flex row of `<button>` elements to switch themes. With 3 themes now live (`dark`, `light-cool`, `light-warm`) and a dark variant planned, the button group is visually cramped and will become unusable at 4+ entries.
- **Why now:** PR #314 (light-warm theme) just merged, making this a current UI problem rather than a future one. A 4th theme is in active planning.
- **Business/user impact:** Users cannot comfortably identify and select themes; discoverability degrades with every new theme added.

## Problem Space

- **Current behavior:** `Header.tsx` maps `THEMES` to a `<button>` per entry in a `flex gap-2` row. Selecting closes the sidebar immediately. No preview before committing.
- **Desired behavior:** A custom dropdown replaces the button group. Selecting an option previews the theme live (applied to `<html>` without saving). OK commits and closes the sidebar; Cancel reverts and closes the sidebar.
- **Constraints:**
  - Must use existing `var(--theme-*)` CSS custom properties — no new hardcoded color values in JS
  - `ThemeContext` interface (`theme`, `setTheme`) must remain unchanged
  - Must be accessible (keyboard nav, ARIA)
  - Must not affect print output
- **Assumptions:**
  - Live preview is acceptable UX (theme applies on select, before OK)
  - Cancel-closes-sidebar is the desired dismiss behavior (not Cancel-stays-open)
  - Color swatches per option improve discoverability, especially for `light-cool` vs `light-warm`
- **Edge cases considered:**
  - User opens dropdown, previews a theme, then clicks outside / presses Escape — treat as Cancel (revert + close sidebar)
  - User selects the already-committed theme — no pending change, OK/Cancel do not appear
  - localStorage unavailable — ThemeContext already handles this gracefully; preview/revert operates only on DOM class

## Scope

### In Scope

- Replace button group in sidebar footer with a custom dropdown
- Live preview: applying theme class to DOM on option select (no save)
- OK / Cancel buttons when a pending change exists
- Color swatches using `data-theme` attribute + `var(--theme-bg)` from each theme's CSS
- Add `[data-theme="<id>"]` selector to `dark.css`, `light-cool.css`, `light-warm.css`
- Unit and E2E test coverage for the new interaction

### Out of Scope

- Theme selection anywhere other than the sidebar footer
- A dedicated settings/preferences page
- Adding new themes (that work is independent)
- Persisting "last previewed" state across sessions

## What Changes

- `src/styles/themes/dark.css` — add `[data-theme="dark"]` to the root selector
- `src/styles/themes/light-cool.css` — add `[data-theme="light-cool"]` to the root selector
- `src/styles/themes/light-warm.css` — add `[data-theme="light-warm"]` to the root selector
- `src/components/Header.tsx` — replace button group with custom dropdown + local `previewId` state + OK/Cancel buttons
- `src/contexts/ThemeContext.tsx` — no interface change; grows naturally as new themes are registered

## Risks

- **Risk:** Live DOM class manipulation in Header could get out of sync with ThemeContext if the component unmounts mid-preview (e.g. route change while sidebar is open)
  - **Impact:** Page left in a previewed (unsaved) theme after navigation
  - **Mitigation:** `useEffect` cleanup on unmount reverts `document.documentElement.className` to the committed theme

- **Risk:** `data-theme` selector on each theme file creates a secondary cascade scope that could interfere with other CSS if `.dark` / `.light-cool` etc. are used as class names elsewhere
  - **Impact:** Unexpected variable inheritance inside a `data-theme`-attributed element subtree
  - **Mitigation:** Swatches are leaf `<span>` elements with no children; impact is contained. Grep for `data-theme` before shipping.

- **Risk:** Keyboard accessibility of custom dropdown requires explicit implementation (roving tabindex or `role="listbox"`)
  - **Impact:** Fails accessibility audit if not implemented
  - **Mitigation:** Implement `role="listbox"` / `role="option"` with keyboard event handlers in design phase

## Open Questions

No unresolved ambiguity remains. All design decisions were confirmed during the exploration session:
- Option B (custom dropdown) ✓
- Cancel closes sidebar ✓
- `data-theme` attribute for swatch scoping ✓
- Reuse `var(--theme-bg)` for swatch color ✓

## Non-Goals

- Redesigning the sidebar layout
- Adding theme preview thumbnails / full-page screenshots
- Supporting system-preference-based automatic theme switching
- Persisting the dropdown open/closed state

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

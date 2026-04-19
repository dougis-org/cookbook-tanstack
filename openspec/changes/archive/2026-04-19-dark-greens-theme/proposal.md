## GitHub Issues

- #350

## Why

- Problem statement: Users have only one dark theme option (blues/cyan). A Selenized Dark palette (earthy teal backgrounds, green accent) offers meaningful visual variety for users who prefer warmer or more natural dark tones.
- Why now: Issue filed by repo owner; the theme system is already token-driven and well-structured to accept a new theme with minimal risk.
- Business/user impact: Increases personalisation options; users who find the blue theme harsh gain an alternative dark mode without sacrificing the dark-first design philosophy.

## Problem Space

- Current behavior: Three themes exist — `dark` (blues/cyan), `light-cool`, `light-warm`. All labelled generically; `dark` gives no visual hint that it is specifically a blue/cyan palette.
- Desired behavior: Four themes — `dark` (renamed label: `Dark (blues)`), `dark-greens` (`Dark (greens)`) — both dark. Label rename disambiguates the existing theme without touching its CSS class or localStorage key.
- Constraints:
  - The `dark` CSS class is the Tailwind `@custom-variant dark` selector anchor in `styles.css`. The ID must not change.
  - The `criticalCss` inline `<style>` in `__root.tsx` must stay in sync with theme background/foreground hex values to prevent FOUC.
  - All dark-mode token consumers use CSS custom properties (no `dark:` Tailwind utility classes) — verified as of the `standardize-theme-tokens` refactor.
- Assumptions:
  - Selenized Dark hex values sourced from the iTerm2 colour scheme plist at the URL in the issue are accurate and final.
  - No user-facing migration is needed for `localStorage`; stored value `'dark'` remains valid.
- Edge cases considered:
  - Users with `'dark'` in localStorage continue to get `Dark (blues)` — no change in behaviour.
  - SSR/hydration: `__root.tsx` initialises with `className="dark"` and the inline script corrects it before paint; `dark-greens` must be added to the script's allowlist.
  - Print styles: existing print CSS is theme-agnostic (white background forced); no changes needed.

## Scope

### In Scope

- New CSS theme file `src/styles/themes/dark-greens.css` with Selenized Dark token values
- Import of new theme file in `src/styles.css`
- `ThemeContext.tsx` THEMES array: add `dark-greens` entry; change `dark` label to `Dark (blues)`
- `__root.tsx` FOUC prevention: add `dark-greens` bg/fg hex to `criticalCss`; add `dark-greens` slot comment
- `docs/theming.md` maintenance checklist update

### Out of Scope

- Changes to `dark` CSS class name or localStorage key
- Light theme additions or modifications
- System/OS preferred-colour-scheme auto-switching
- Per-user theme persistence in the database

## What Changes

- **New file:** `src/styles/themes/dark-greens.css` — Selenized Dark CSS custom property tokens
- **Modified:** `src/styles.css` — adds `@import` for `dark-greens.css`
- **Modified:** `src/contexts/ThemeContext.tsx` — adds `dark-greens` to THEMES; updates `dark` label
- **Modified:** `src/routes/__root.tsx` — `criticalCss` and slot comment updated for `dark-greens`
- **Modified:** `docs/theming.md` — theme registry entry added

## Risks

- Risk: `criticalCss` hex out of sync with actual CSS token
  - Impact: Flash of wrong background colour on `dark-greens` theme load
  - Mitigation: Single source of truth comment in `__root.tsx` already documents all bg/fg pairs; add `dark-greens` alongside existing entries with explicit hex

- Risk: Badge token colours clash or look poor on Selenized Dark backgrounds
  - Impact: Reduced readability of meal/course/prep/classification badges
  - Mitigation: Palette reviewed in explore session; prep badge uses orange (`#ed8649`) rather than duplicate green to ensure distinctiveness from accent

- Risk: Theme selector UI does not accommodate a fourth option gracefully
  - Impact: Selector wraps or overflows on small viewports
  - Mitigation: Inspect Header theme selector during implementation; adjust layout if needed (tracked as validation task)

## Open Questions

No unresolved ambiguity. All decisions confirmed in explore session:
- `dark` ID retained; label changed to `Dark (blues)`
- Prep badge colour: orange `#ed8649` (not green) to differentiate from `#75b938` accent
- New theme ID: `dark-greens`; new label: `Dark (greens)`

## Non-Goals

- Renaming the `dark` CSS class or localStorage key
- Adding a system-preference-based theme auto-selection feature
- Supporting themes beyond the four defined here
- Modifying light themes

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## Context

- Relevant architecture:
  - `src/contexts/ThemeContext.tsx` — THEMES array, `setTheme()`, localStorage persistence
  - `src/routes/__root.tsx` — inline `criticalCss` style + `themeInitScript` (FOUC prevention); `THEMES` imported here for script allowlist
  - `src/styles.css` — `@import` declarations for each theme file; `@custom-variant dark` directive
  - `src/styles/themes/dark.css` — reference implementation for token naming and selector pattern
  - `docs/theming.md` — maintenance checklist for adding themes
- Dependencies: None beyond existing codebase; no new npm packages required
- Interfaces/contracts touched:
  - `ThemeId` union type in `ThemeContext.tsx` — extended by `'dark-greens'`
  - CSS custom property token set — new theme must define all tokens declared by base theme
  - `criticalCss` string in `__root.tsx` — must include `dark-greens` bg/fg hex

## Goals / Non-Goals

### Goals

- Add `dark-greens` theme using Selenized Dark palette with full token coverage
- Rename `dark` display label to `Dark (blues)` without altering its CSS class or localStorage key
- Zero FOUC on `dark-greens` theme load
- No regression on existing three themes

### Non-Goals

- Renaming `dark` CSS class or localStorage key
- System-preference auto-switching
- Dark variant utility class (`dark:`) coverage for `dark-greens`

## Decisions

### Decision 1: Keep `dark` ID, change label only

- Chosen: `id: 'dark'` stays unchanged; only `label` in THEMES changes to `'Dark (blues)'`
- Alternatives considered: Rename ID to `dark-blues` (would require localStorage migration and CSS selector updates including `@custom-variant dark`)
- Rationale: `dark` is used as a CSS class, a Tailwind variant anchor, and a localStorage value. Changing it has broad blast radius for zero functional gain.
- Trade-offs: Users with stored `'dark'` continue receiving blues theme — correct and desirable behaviour

### Decision 2: CSS class selector pattern for dark-greens

- Chosen: `html.dark-greens, [data-theme="dark-greens"]` — matches existing pattern from `dark.css`
- Alternatives considered: Attribute-only selector `[data-theme="dark-greens"]`
- Rationale: `ThemeContext.setTheme()` sets `document.documentElement.className = validId`, so the theme ID becomes the class name directly. Both selectors needed for forward compatibility.
- Trade-offs: `dark-greens` class does not activate Tailwind's `@custom-variant dark` — acceptable because all dark-mode styling uses CSS tokens, not `dark:` utilities

### Decision 3: Selenized Dark token values

- Chosen: Hex values sourced from iTerm2 Selenized Dark plist; mapped to existing token names

| Token | Value | Selenized mapping |
|-------|-------|-------------------|
| `--theme-bg` | `#103c48` | Background |
| `--theme-surface` | `#184956` | Background variant 1 |
| `--theme-surface-raised` | `#1e555e` | Background variant 2 (interpolated) |
| `--theme-surface-hover` | `#2d5b69` | Background variant 3 / selection |
| `--theme-border` | `#2d5b69` | Dim 0 |
| `--theme-border-muted` | `#184956` | Surface level |
| `--theme-fg` | `#adbcbc` | Foreground |
| `--theme-fg-muted` | `#72898f` | Dim 1 |
| `--theme-fg-subtle` | `#486868` | Dim 2 |
| `--theme-accent` | `#75b938` | Green |
| `--theme-accent-hover` | `#8fd44a` | Green lightened |
| `--theme-accent-emphasis` | `#5e9429` | Green darkened |
| `--theme-shadow-sm` | `0 0 0 0 transparent` | Dark theme: no shadows |
| `--theme-shadow-md` | `0 0 0 0 transparent` | Dark theme: no shadows |
| `--theme-overlay` | `rgb(0 0 0 / 0.6)` | Same as dark |

- Alternatives considered: Using Tailwind named colours (no exact Selenized match exists)
- Rationale: Direct hex preserves Selenized palette fidelity; Tailwind palette doesn't have these teal-green tones
- Trade-offs: Hex values not tied to Tailwind design tokens — minor, since dark theme already uses `theme(colors.*)` which resolves to hex anyway

### Decision 4: Badge token palette for dark-greens

- Chosen:

| Badge | Base | Text |
|-------|------|------|
| meal | `#dbb32d` (yellow) | `#c9a028` |
| course | `#af88eb` (violet) | `#9e77da` |
| prep | `#ed8649` (orange) | `#db7438` |
| classification | `#41c7b9` (cyan) | `#30b6a8` |

- Rationale: Uses Selenized named palette colours for consistency; orange for prep avoids duplication with green accent (`#75b938`)
- Trade-offs: Prep badge colour differs from existing dark/light themes (amber → orange) — acceptable, each theme defines its own badge palette

### Decision 5: FOUC prevention for dark-greens

- Chosen: Add `html.dark-greens{background:#103c48;color:#adbcbc}` to `criticalCss` in `__root.tsx`
- Rationale: Existing pattern; inline `<style>` in `<head>` fires before any JS or CSS bundle loads
- Trade-offs: `criticalCss` string must be kept in sync manually — comment in source documents this obligation

### Decision 6: Status tokens

- Chosen: Keep same status colours as `dark.css` (red.400, green.400, amber.400) — these are semantic status signals, not theme-personality tokens
- Rationale: Status colour semantics are universal; Selenized's red/green/yellow are close enough but using Tailwind named colours keeps them consistent with existing themes
- Trade-offs: Minor colour mismatch vs pure Selenized palette — acceptable for semantic tokens

## Proposal to Design Mapping

- Proposal element: New `dark-greens` theme with Selenized Dark palette
  - Design decision: Decision 3 (token values) + Decision 2 (selector pattern)
  - Validation approach: Visual QC via `openwolf designqc`; E2E theme switching test

- Proposal element: Rename `dark` label to `Dark (blues)`
  - Design decision: Decision 1 (keep ID, change label only)
  - Validation approach: Unit test asserts `THEMES` array contains `{ id: 'dark', label: 'Dark (blues)' }`

- Proposal element: FOUC prevention
  - Design decision: Decision 5 (`criticalCss` update)
  - Validation approach: E2E FOUC spec + manual fast-reload check

- Proposal element: Badge palette
  - Design decision: Decision 4 (orange for prep)
  - Validation approach: Visual QC; badge rendering tests

## Functional Requirements Mapping

- Requirement: Theme picker shows four options with correct labels
  - Design element: `THEMES` array in `ThemeContext.tsx`
  - Acceptance criteria reference: `theme-selection` spec
  - Testability notes: Unit test THEMES export; E2E asserts four picker items

- Requirement: Selecting `Dark (greens)` applies Selenized colours immediately
  - Design element: `setTheme('dark-greens')` → `document.documentElement.className = 'dark-greens'` → CSS cascade
  - Acceptance criteria reference: `theme-selection` spec
  - Testability notes: E2E: click picker → assert `<html class="dark-greens">` + assert `--theme-bg` computed value

- Requirement: `Dark (greens)` theme persists across page reloads
  - Design element: `localStorage.setItem('cookbook-theme', 'dark-greens')` + init script reads it
  - Acceptance criteria reference: `theme-persistence` spec
  - Testability notes: E2E: set theme → reload → assert class on `<html>`

- Requirement: Existing `Dark (blues)` theme unaffected
  - Design element: No changes to `dark.css` or `dark` CSS class
  - Acceptance criteria reference: `theme-regression` spec
  - Testability notes: Existing theme E2E test suite must pass unchanged

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No flash of unstyled content on `dark-greens` theme load
  - Design element: Decision 5 — inline `criticalCss` in `<head>`
  - Acceptance criteria reference: `fouc-prevention` spec
  - Testability notes: Playwright FOUC spec captures screenshot before JS loads; asserts background colour

- Requirement category: reliability
  - Requirement: Theme system does not break if `dark-greens` is stored but CSS fails to load
  - Design element: `themeInitScript` already falls back to `'dark'` on error
  - Acceptance criteria reference: `theme-persistence` spec
  - Testability notes: Unit test: simulate invalid stored value → assert fallback to `'dark'`

## Risks / Trade-offs

- Risk/trade-off: `criticalCss` hex drift
  - Impact: FOUC on `dark-greens` sessions
  - Mitigation: Slot comment in `__root.tsx` documents hex values; update is part of implementation checklist

- Risk/trade-off: Theme selector UI overflow with four items on small viewports
  - Impact: Layout break on mobile header
  - Mitigation: Inspect selector during implementation; tracked as validation step in tasks

## Rollback / Mitigation

- Rollback trigger: Visual regression on any existing theme, or FOUC reports on production
- Rollback steps:
  1. Revert `src/styles.css` (remove `dark-greens` import)
  2. Revert `ThemeContext.tsx` (remove `dark-greens` entry; restore `dark` label)
  3. Revert `__root.tsx` `criticalCss` and slot comment
  4. Delete `src/styles/themes/dark-greens.css`
  5. `dark-greens` localStorage values fall back to `'dark'` automatically via init script
- Data migration considerations: None; localStorage is client-side and self-healing
- Verification after rollback: Run `npm run test` + `npm run test:e2e`; visual QC on header theme selector

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix failing checks before requesting re-review
- If security checks fail: Treat as blocker regardless of severity; escalate to repo owner
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours
- Escalation path and timeout: Repo owner (`dougis`) is final escalation; no external stakeholders

## Open Questions

No open questions. All decisions confirmed in explore session and reflected above.

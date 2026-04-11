## Context

- **Relevant architecture:**
  - `src/styles.css` — Tailwind 4 entry point; defines `@custom-variant dark`
  - `src/routes/__root.tsx` — SSR shell; hardcodes `<html class="dark">`
  - `src/components/Header.tsx` — hamburger sidebar; theme selector added here
  - `src/components/cookbooks/PrintLayout.tsx` — DOM-manipulation hack to remove `.dark` during print; replaced by this work
  - 29 component/route files using `dark:` Tailwind variants
- **Dependencies:** TanStack Start (SSR), Tailwind CSS 4, React 19, localStorage
- **Interfaces/contracts touched:**
  - `<html>` class attribute (theme name becomes the class)
  - `localStorage['cookbook-theme']` (string: theme name)
  - New React context: `ThemeContext` / `useTheme()`
  - CSS custom property namespace: `--theme-*`

## Goals / Non-Goals

### Goals

- Zero-flash theme application on SSR page load
- All site surfaces respond to theme changes without component edits
- `PrintLayout` is a pure declarative component (no DOM side effects)
- Adding a future theme requires only: one CSS block + one selector entry

### Non-Goals

- Polished light theme colour palette
- `prefers-color-scheme` integration
- Account-level theme persistence
- Theme transition animations

## Decisions

### Decision 1: CSS Custom Properties as the token layer

- **Chosen:** Define `--theme-*` custom properties on `html.<theme-name>`. Components reference `var(--theme-*)`.
- **Alternatives considered:** Tailwind class-variant per theme (`dark:`, `light:`); inline style props per component.
- **Rationale:** CSS variables are the only approach that lets theme switching happen at a single DOM point (`html` class) with zero JavaScript per component. Tailwind class-variants would require every component to enumerate every theme. Inline styles don't cascade.
- **Trade-offs:** Components can no longer use plain Tailwind colour utilities for themed surfaces — they must use arbitrary values or registered utilities. Slightly more verbose classnames.

### Decision 2: Tailwind arbitrary values over `@theme` registration

- **Chosen:** Components use `bg-[var(--theme-surface)]`, `text-[var(--theme-fg)]` etc. (Tailwind arbitrary values).
- **Alternatives considered:** Register tokens via `@theme { --color-theme-surface: initial; }` so components can write `bg-theme-surface`.
- **Rationale:** Tailwind 4's `@theme` with `initial` values and runtime CSS variable overrides is not documented behaviour and risks JIT tree-shaking issues. Arbitrary values are fully supported and explicit. If `@theme` registration proves clean in a future spike, migration is straightforward (rename classes).
- **Trade-offs:** Classnames are slightly more verbose (`bg-[var(--theme-surface)]` vs `bg-theme-surface`).

### Decision 3: Token namespace `--theme-*`

- **Chosen:** All theme tokens use the `--theme-` prefix with semantic VS Code-style naming:
  ```
  --theme-bg              page background
  --theme-surface         card / panel
  --theme-surface-raised  modal / dropdown
  --theme-surface-hover   interactive hover bg
  --theme-border          standard border
  --theme-border-muted    hairline / subtle border
  --theme-fg              primary text
  --theme-fg-muted        secondary text (headings, labels)
  --theme-fg-subtle       placeholder / disabled text
  --theme-accent          brand colour (cyan) — idle
  --theme-accent-hover    brand colour — hover
  --theme-accent-emphasis brand colour — pressed / active
  ```
- **Alternatives considered:** `--cb-*` prefix; Tailwind's `--color-*` namespace.
- **Rationale:** `--theme-` is self-documenting (these are theme tokens, not one-off values). Avoids collision with Tailwind's own `--color-*` design tokens.
- **Trade-offs:** None significant.

### Decision 4: Inline script in `<head>` for SSR flash prevention

- **Chosen:** A small synchronous inline script in `<head>` reads `localStorage['cookbook-theme']` and sets `document.documentElement.className` before the browser paints. The script content is a static string literal — no user data is interpolated — so there is no XSS surface.
- **Alternatives considered:** Cookie-based server-side theme; `useEffect` on mount.
- **Rationale:** `useEffect` runs after paint — causes visible flash. Cookie-based requires server middleware and complicates the no-account requirement. Inline script is the industry-standard pattern (used by Radix, shadcn, next-themes) and is already precedented in this codebase (HMR preamble script uses the same `script` + `__html` pattern in `__root.tsx`).
- **Trade-offs:** Small inline script payload (< 100 bytes). The static string is safe; it reads from localStorage and writes to `className` only.

### Decision 5: `ThemeContext` + `useTheme()` hook

- **Chosen:** A React context (`ThemeContext`) with provider wrapping the app in `__root.tsx`. `useTheme()` exposes `{ theme, setTheme }`.
- **Alternatives considered:** Zustand store; direct localStorage reads in each component; URL param.
- **Rationale:** Context is sufficient for a single global value read by one component (the theme selector). Zustand would be overkill. Direct localStorage reads in each component don't stay in sync. URL param is poor UX.
- **Trade-offs:** Context re-renders all consumers on theme change. Acceptable — only the theme selector subscribes; other components respond to CSS variable changes, not React state.

### Decision 6: N-theme selector widget

- **Chosen:** A named-option selector (not a binary toggle) placed in a bordered footer section at the bottom of the hamburger sidebar. Each theme is a button; the active theme is highlighted. Config-driven: a `THEMES` array drives both the selector and CSS class application.
- **Alternatives considered:** Binary dark/light toggle switch; dropdown `<select>`; radio group.
- **Rationale:** Button group generalises to N themes without layout change. Binary toggle doesn't scale. `<select>` is harder to style consistently. Radio group is equivalent but more verbose markup.
- **Trade-offs:** With only 2 themes the button group looks sparse. Acceptable — it fills out naturally as themes are added.

### Decision 7: `PrintLayout` refactor

- **Chosen:** Replace `useLayoutEffect` DOM manipulation with a `<div>` that locally overrides CSS variables via `style` prop. No class changes to `<html>`. No cleanup logic.
- **Alternatives considered:** Keep current approach; add a `print` theme class.
- **Rationale:** CSS variable overrides scope naturally to the subtree — no global side effects, no cleanup, no ref-counting, no SSR edge cases.
- **Trade-offs:** Print CSS variable values are hardcoded in the component rather than defined in a theme block. Acceptable — print isolation is by design absolute (no theme variation for print).

### Decision 8: Badge colours exempt from token migration

- **Chosen:** Classification badge colours (`amber`, `emerald`, `violet`, etc.) keep their hardcoded Tailwind values. `dark:` variants on badges are retained as-is.
- **Rationale:** Badge colours are categorical/semantic — they represent recipe classification types, not UI surface roles. They should look the same regardless of theme.
- **Trade-offs:** A small number of `dark:` variants remain in the codebase after migration; these are intentional and documented.

## Proposal to Design Mapping

- **Proposal element:** CSS custom property token system
  - **Design decision:** Decision 1 (CSS variables), Decision 3 (token namespace)
  - **Validation approach:** Visual inspection on both themes; E2E smoke test

- **Proposal element:** SSR flash prevention
  - **Design decision:** Decision 4 (inline script)
  - **Validation approach:** E2E test: navigate to app with `light` in localStorage, assert no dark flash before hydration

- **Proposal element:** Theme persistence in localStorage
  - **Design decision:** Decision 5 (`useTheme` writes to localStorage on change)
  - **Validation approach:** Unit test: `setTheme('light')` → `localStorage.getItem('cookbook-theme') === 'light'`

- **Proposal element:** N-theme selector in hamburger menu
  - **Design decision:** Decision 6 (button group, config-driven)
  - **Validation approach:** E2E: open menu, click Light, assert `html` class changes and selector shows Light active

- **Proposal element:** `PrintLayout` refactor
  - **Design decision:** Decision 7 (CSS variable scoped overrides)
  - **Validation approach:** Existing `PrintLayout` unit tests updated; E2E print smoke test

- **Proposal element:** Full site migration of `dark:` variants
  - **Design decision:** Decisions 1 + 2 (CSS variables + arbitrary values)
  - **Validation approach:** Post-migration grep for `dark:` — only badge `dark:` variants should remain

## Functional Requirements Mapping

- **Requirement:** Theme persists across page reloads and new tabs
  - **Design element:** localStorage write on `setTheme`; inline script reads on every load
  - **Acceptance criteria reference:** specs/theme-persistence.md
  - **Testability notes:** Unit test `useTheme`; E2E reload test

- **Requirement:** Default theme is `dark` for users with no stored preference
  - **Design element:** Inline script: `localStorage.getItem('cookbook-theme') || 'dark'`
  - **Acceptance criteria reference:** specs/theme-persistence.md
  - **Testability notes:** E2E: clear localStorage, load app, assert `html.dark`

- **Requirement:** Print output is unaffected by theme
  - **Design element:** `PrintLayout` CSS variable overrides (Decision 7)
  - **Acceptance criteria reference:** specs/print-isolation.md
  - **Testability notes:** E2E: switch to light, print cookbook, assert white background

- **Requirement:** All site surfaces respond to theme change
  - **Design element:** Migration of all 29 files (Decision 2)
  - **Acceptance criteria reference:** specs/component-migration.md
  - **Testability notes:** E2E smoke test on key surfaces (header, recipe card, form, cookbook) in both themes

- **Requirement:** Adding future theme requires no component changes
  - **Design element:** CSS variable indirection (Decision 1); `THEMES` config array (Decision 6)
  - **Acceptance criteria reference:** specs/theme-extensibility.md
  - **Testability notes:** Manual verification — add a stub theme, confirm selector and CSS are the only edits needed

## Non-Functional Requirements Mapping

- **Requirement category:** Performance
  - **Requirement:** No visible theme flash on load
  - **Design element:** Inline `<head>` script (Decision 4)
  - **Acceptance criteria reference:** specs/theme-persistence.md
  - **Testability notes:** E2E: load with `light` in localStorage; assert `html.light` before any React hydration

- **Requirement category:** Reliability
  - **Requirement:** Graceful degradation when localStorage is unavailable
  - **Design element:** `try/catch` in inline script; `useTheme` falls back to `'dark'`
  - **Acceptance criteria reference:** specs/theme-persistence.md
  - **Testability notes:** Unit test: mock localStorage to throw; assert theme defaults to dark

- **Requirement category:** Operability
  - **Requirement:** Future themes require only CSS + config
  - **Design element:** `html.<name>` block in `styles.css`; entry in `THEMES` array
  - **Acceptance criteria reference:** specs/theme-extensibility.md
  - **Testability notes:** Code review: confirm no component changes needed for stub theme addition

## Risks / Trade-offs

- **Risk/trade-off:** Verbose Tailwind arbitrary values (`bg-[var(--theme-surface)]`)
  - **Impact:** Slightly more verbose classnames; harder to read at a glance
  - **Mitigation:** Convention is consistent; future migration to `@theme` registration is low-effort if desired

- **Risk/trade-off:** Large migration diff (29 files)
  - **Impact:** High review noise; risk of missed variants
  - **Mitigation:** Post-migration grep for `dark:` verifies completeness; E2E smoke covers key surfaces

- **Risk/trade-off:** Draft light theme colour accuracy
  - **Impact:** Light theme may look rough
  - **Mitigation:** Explicitly documented as draft; polish deferred to follow-up issue

## Rollback / Mitigation

- **Rollback trigger:** Visual regression on dark theme; broken print output; hydration errors
- **Rollback steps:** Revert PR; `<html class="dark">` is restored; `PrintLayout` DOM-manipulation version is restored
- **Data migration considerations:** localStorage key `cookbook-theme` may exist for users who tested the PR. On rollback, the key is ignored (no `dark:` variant depends on it). Safe to leave in place.
- **Verification after rollback:** E2E suite passes; print output correct; no hydration warnings in console

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before requesting re-review.
- **If security checks fail:** Do not merge. Codacy/Snyk findings on new code must be resolved or explicitly acknowledged as false-positives with a comment.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours. After 72 hours, escalate to project owner.
- **Escalation path and timeout:** If blocked > 5 business days with no response, reassess scope and priority with project owner.

## Open Questions

No open questions. All design decisions confirmed during exploration session.

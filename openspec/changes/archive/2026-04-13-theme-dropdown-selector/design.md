## Context

- **Relevant architecture:** Theme system uses CSS custom properties scoped to `html.<theme-id>` (e.g. `html.dark { --theme-bg: ... }`). `ThemeContext` manages the committed theme in React state + localStorage. `Header.tsx` renders the sidebar with the current button-group theme selector in the sidebar footer.
- **Dependencies:** `src/contexts/ThemeContext.tsx` (THEMES registry, `useTheme` hook), `src/styles/themes/*.css` (per-theme CSS files), `src/components/Header.tsx` (sidebar owner).
- **Interfaces/contracts touched:**
  - `THEMES` array in `ThemeContext` — read-only from Header's perspective; no shape change needed
  - `useTheme()` — returns `{ theme, setTheme }`; unchanged
  - `document.documentElement.className` — directly mutated for preview (same pattern ThemeContext already uses)

## Goals / Non-Goals

### Goals

- Replace button group with a custom dropdown that scales to 4+ themes
- Live preview: theme applies to DOM on option select before committing
- OK / Cancel buttons when a pending change exists; committing saves; cancelling reverts
- Color swatches per option using existing `var(--theme-bg)` via `data-theme` scoping
- Full keyboard navigation and ARIA compliance
- Cleanup on unmount to prevent stale preview state

### Non-Goals

- Changing the ThemeContext API
- Theme selection outside the sidebar
- Adding new themes (orthogonal concern)

## Decisions

### Decision 1: Preview state lives in Header local state

- **Chosen:** `previewId: ThemeId | null` in `Header` component via `useState`
- **Alternatives considered:** Extending ThemeContext with a `previewTheme` concept
- **Rationale:** Preview is transient UI state tied to the sidebar's open/closed lifecycle. ThemeContext is a persistence boundary. Mixing the two would couple UI state to the context and complicate consumers.
- **Trade-offs:** Header must clean up on unmount (see Decision 4). Slightly more DOM manipulation in the component.

### Decision 2: Swatch color via `data-theme` attribute + `var(--theme-bg)`

- **Chosen:** Add `[data-theme="<id>"]` as a secondary selector to each theme CSS file. Render `<span data-theme={t.id} style={{ background: 'var(--theme-bg)' }} />` per option.
- **Alternatives considered:**
  - Hardcoded hex values in `THEMES` JS array — duplicates colors across CSS/JS
  - New `--theme-swatch` CSS token — adds a token with no other purpose
  - No swatches — simpler but `light-cool` vs `light-warm` are hard to distinguish by label alone
- **Rationale:** Reuses existing tokens; CSS files remain the single source of truth for color values; zero additions to `ThemeContext`.
- **Trade-offs:** Requires a one-line selector change per theme file. Swatch spans must be leaf nodes to avoid unintended cascade.

### Decision 3: Dropdown is a custom component (not native `<select>`)

- **Chosen:** Custom `<div role="listbox">` / `<div role="option">` pattern with keyboard handling
- **Alternatives considered:** Native `<select>` — accessible by default but difficult to style to match `var(--theme-*)` tokens cross-browser; cannot render color swatches
- **Rationale:** App already has custom dropdown components (`SourcePickerDropdown`, `MultiSelectDropdown`). Design coherence and swatch support require a custom implementation.
- **Trade-offs:** Must implement keyboard nav (ArrowUp/Down, Enter, Escape) and ARIA attributes explicitly.

### Decision 4: `useEffect` cleanup reverts preview on unmount

- **Chosen:** `useEffect(() => { return () => { document.documentElement.className = theme } }, [theme])` (or equivalent) in the Header component scoped to when `previewId !== null`
- **Alternatives considered:** No cleanup — risks leaving a previewed-but-unsaved theme class if the user navigates mid-preview
- **Rationale:** Defensive; the committed `theme` from ThemeContext is always the correct revert target.
- **Trade-offs:** Minimal. The effect only fires on cleanup.

### Decision 5: OK/Cancel visibility tied to `previewId !== null`

- **Chosen:** Buttons render conditionally; when `previewId` equals the committed `theme`, they are not shown (no pending change)
- **Alternatives considered:** Always show OK/Cancel — adds visual noise when nothing has changed
- **Rationale:** Reduces clutter; buttons signal actionable state only.
- **Trade-offs:** Slightly more conditional rendering logic.

### Decision 6: Escape key and outside-click treated as Cancel

- **Chosen:** Close the dropdown panel on Escape; if a preview is pending, revert before closing. Outside-click (blur of the container) similarly reverts.
- **Alternatives considered:** Outside-click commits — too surprising; preview-then-accidental-dismiss would save unwanted theme
- **Rationale:** Consistent with standard modal/dropdown dismiss semantics.
- **Trade-offs:** Requires `onKeyDown` and a `useRef` + click-outside listener.

## Proposal to Design Mapping

- **Proposal: Custom dropdown replaces button group**
  - Design decision: Decision 3 (custom `role="listbox"` component)
  - Validation: E2E — all themes visible as options; selecting changes the displayed value

- **Proposal: Live preview on option select**
  - Design decision: Decision 1 (local `previewId` state + direct DOM class mutation)
  - Validation: E2E — selecting an option changes `html` class before OK is pressed

- **Proposal: OK commits, Cancel reverts, both close sidebar**
  - Design decision: Decision 5 (conditional OK/Cancel) + Decision 1 (revert path)
  - Validation: Unit test — OK calls `setTheme`; Cancel reverts class; both call `setIsOpen(false)`

- **Proposal: `data-theme` swatches using `var(--theme-bg)`**
  - Design decision: Decision 2
  - Validation: Unit test — each option renders a `span[data-theme]`; visual regression via E2E screenshot

- **Proposal: Cleanup on unmount**
  - Design decision: Decision 4 (`useEffect` cleanup)
  - Validation: Unit test — unmounting Header while `previewId` is set restores committed class

- **Proposal: Escape / outside-click = Cancel**
  - Design decision: Decision 6
  - Validation: Unit test — Escape keydown while dropdown open with pending preview reverts class

## Functional Requirements Mapping

- **Requirement:** Dropdown lists all registered themes
  - Design element: Map over `THEMES` from ThemeContext; each entry renders as `role="option"`
  - Acceptance criteria: spec `dropdown-behavior.md`
  - Testability: Unit — render Header, open dropdown, assert one option per THEMES entry

- **Requirement:** Selecting an option previews the theme live
  - Design element: `onSelect` sets `previewId` + sets `document.documentElement.className`
  - Acceptance criteria: spec `dropdown-behavior.md`
  - Testability: E2E — assert `html` class changes on option click before OK

- **Requirement:** OK commits, closes sidebar
  - Design element: OK button calls `setTheme(previewId)` + `setPreviewId(null)` + `setIsOpen(false)`
  - Acceptance criteria: spec `dropdown-behavior.md`
  - Testability: Unit — mock `setTheme`; assert called with correct id; assert `isOpen` becomes false

- **Requirement:** Cancel reverts, closes sidebar
  - Design element: Cancel calls `document.documentElement.className = theme` + `setPreviewId(null)` + `setIsOpen(false)`
  - Acceptance criteria: spec `dropdown-behavior.md`
  - Testability: Unit — assert DOM class reverts; assert `isOpen` becomes false

- **Requirement:** Color swatch per option
  - Design element: `<span data-theme={t.id} style={{ background: 'var(--theme-bg)' }} />`
  - Acceptance criteria: spec `swatch-css-scoping.md`
  - Testability: Unit — each option contains a `span` with correct `data-theme`

- **Requirement:** Keyboard navigation (ArrowUp/Down, Enter, Escape)
  - Design element: `onKeyDown` handler on the listbox container; roving focus or `aria-activedescendant`
  - Acceptance criteria: spec `accessibility.md`
  - Testability: Unit — simulate key events; assert focused option changes; Escape closes

## Non-Functional Requirements Mapping

- **Requirement category:** Accessibility
  - Requirement: WCAG 2.1 AA keyboard operability and ARIA semantics
  - Design element: `role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded` on trigger
  - Acceptance criteria: spec `accessibility.md`
  - Testability: Unit — assert ARIA attributes; axe-core scan optional

- **Requirement category:** Performance
  - Requirement: No layout thrash on preview — class swap only
  - Design element: Single `document.documentElement.className = id` assignment per selection
  - Acceptance criteria: No jank visible in manual E2E test
  - Testability: Manual / Lighthouse

- **Requirement category:** Reliability
  - Requirement: No stale preview after navigation
  - Design element: Decision 4 (`useEffect` cleanup)
  - Acceptance criteria: spec `dropdown-behavior.md` (unmount cleanup)
  - Testability: Unit — unmount with active preview; assert class reverted

## Risks / Trade-offs

- **Risk:** `data-theme` selector scope leaks if swatch `<span>` ever gains children that use `var(--theme-*)` tokens
  - Impact: Child elements inherit the swatch theme's tokens instead of the active theme
  - Mitigation: Swatches are always empty `<span>` elements; document this constraint

- **Risk:** Custom keyboard nav implementation gaps (e.g. missing Home/End keys)
  - Impact: Partial keyboard accessibility
  - Mitigation: Cover ArrowUp/Down/Enter/Escape as minimum; document any gaps

## Rollback / Mitigation

- **Rollback trigger:** Preview interaction causes confusing UX or live class mutation causes rendering issues in production
- **Rollback steps:** Revert `Header.tsx` to button-group implementation; revert `data-theme` selector additions from theme CSS files (single-line change per file)
- **Data migration considerations:** None — localStorage theme key and ThemeContext API are unchanged
- **Verification after rollback:** `npm run test && npm run test:e2e` must pass; manual sidebar theme toggle check

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before requesting review.
- **If security checks fail:** Investigate and resolve before merge; no exceptions for UI-only changes.
- **If required reviews are blocked/stale:** Re-request review after 24 hours; escalate to repo owner after 48 hours.
- **Escalation path and timeout:** Tag `@dougis-org` if unblocked after 48 hours.

## Open Questions

No open questions. All design decisions were finalized during the exploration session.

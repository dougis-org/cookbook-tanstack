## Context

- **Relevant architecture:** Frontend-only rebranding. Touches layout components, global styles, and static assets.
- **Dependencies:** Google Fonts (Fraunces, Inter).
- **Interfaces/contracts touched:** `PageLayout` title prop, `Header` logo section, Root layout metadata.

## Goals / Non-Goals

### Goals

- Standardize on "My CookBooks" across the entire user interface.
- Implement brand typography (Fraunces for display, Inter for body).
- Sync production assets with the design system source of truth.

### Non-Goals

- Refactor `PageLayout` or `Header` internals beyond branding.
- Change the underlying theme color tokens.

## Decisions

### Decision 1: Use JSX/Text for Wordmark instead of SVG Lockup

- **Chosen:** Keep the `ChefHat` Lucide icon and update the `h1`/`h2` text to "My CookBooks", but apply the gradient via CSS classes.
- **Alternatives considered:** Importing `logo-lockup.svg`.
- **Rationale:** Keeping it as text is better for accessibility, SEO, and allows easier layout adjustments (flexbox/gap) than a fixed-width SVG. It also ensures the text remains crisp and matches the application's font rendering.
- **Trade-offs:** Requires manual CSS to match the gradient perfectly with the design system's SVG.

### Decision 2: Typography Implementation

- **Chosen:** Import Fraunces and Inter in `src/styles.css`. Apply Fraunces specifically to `h1`, `h2`, and headers with a `.font-display` utility. Set Inter as the primary `--font-sans`.
- **Alternatives considered:** Apply Fraunces globally or keep system fonts.
- **Rationale:** Fraunces is a high-personality serif that works best for display. Inter is a robust, legible sans-serif for body text.
- **Trade-offs:** Adds two external font dependencies.

### Decision 3: Asset Syncing Strategy

- **Chosen:** Manually copy `design-system/assets/*` to `public/`.
- **Alternatives considered:** Automated build script.
- **Rationale:** This is a one-time rebranding task. Manual copy is safer and more direct for this scale.
- **Trade-offs:** Risk of drifting if `design-system` updates in the future without a sync.

## Proposal to Design Mapping

- **Proposal element:** Update "CookBook" text to "My CookBooks"
  - **Design decision:** Decision 1 (Text-based update in components)
  - **Validation approach:** Visual inspection + E2E text assertions.
- **Proposal element:** Implement brand typography
  - **Design decision:** Decision 2 (Global CSS import + font-family tokens)
  - **Validation approach:** Computed style check in devtools.
- **Proposal element:** Sync `public/` assets
  - **Design decision:** Decision 3 (Direct file copy)
  - **Validation approach:** Verify favicon/logos change in the browser.

## Functional Requirements Mapping

- **Requirement:** User sees "My CookBooks" in the header.
  - **Design element:** `src/components/Header.tsx`
  - **Acceptance criteria reference:** `specs/branding.md` (to be created)
  - **Testability notes:** Easy to target with `screen.getByText`.
- **Requirement:** User sees "My CookBooks" in the browser tab.
  - **Design element:** `src/routes/__root.tsx`
  - **Acceptance criteria reference:** `specs/branding.md`
  - **Testability notes:** Verify via `document.title`.

## Non-Functional Requirements Mapping

- **Requirement category:** Operability/UI
  - **Requirement:** Title must not wrap or overflow on mobile.
  - **Design element:** `src/components/Header.tsx` flex properties.
  - **Acceptance criteria reference:** `specs/branding.md`
  - **Testability notes:** Test with Playwright at `iphone-14` viewport.

## Risks / Trade-offs

- **Layout Shift:**
  - Impact: Longer title might shift the search bar or user menu.
  - Mitigation: Use `flex-shrink: 0` on the logo container and ensure the search bar `flex-1` handles the remaining space.

## Rollback / Mitigation

- **Rollback trigger:** Unacceptable performance hit from fonts or broken layout on critical devices.
- **Rollback steps:**
  - `git revert` the changes.
  - Restore original assets from `git` history if overwritten.
- **Data migration considerations:** None.
- **Verification after rollback:** Confirm site title returns to "CookBook" and fonts revert to system stack.

## Operational Blocking Policy

- **If CI checks fail:** Investigation is mandatory. No merge until lint/test pass.
- **If security checks fail:** N/A for this branding change, but usual policies apply.
- **If required reviews are blocked/stale:** Escalate to lead developer after 24h.

## Open Questions

- None. The design system provides clear direction on assets and fonts.

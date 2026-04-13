## Context

- Relevant architecture: Per-file theme system introduced in #302. Each theme is a CSS file under `src/styles/themes/` that defines 14 CSS custom properties on an `html.<theme-id>` selector. Components reference tokens via `var(--theme-*)` utilities defined in `src/styles.css`. `ThemeContext.tsx` manages the active class on `document.documentElement` and persists the selection to localStorage.
- Dependencies: #302 (Light (cool) theme + token contract) must be merged. All components consume tokens correctly — validated by existing Light (cool) E2E tests.
- Interfaces/contracts touched: `THEMES` constant in `src/contexts/ThemeContext.tsx` (adds one entry); 14-token CSS contract (implemented, not modified).

## Goals / Non-Goals

### Goals

- Define the complete warm palette using Tailwind color scale values for all 14 tokens
- Register `light-warm` in ThemeContext so the UI surfaces it as a selectable option
- Cover the new theme with E2E tests equivalent in depth to the Light (cool) tests

### Non-Goals

- Modifying the token contract or adding new tokens
- Changing any React component or Tailwind utility class
- A dark-warm or sepia-dark variant

## Decisions

### Decision 1: Background scale — amber.50

- Chosen: `amber.50` (`#fffbeb`) for `--theme-bg`
- Alternatives considered: `stone.100` (more restrained, barely warm), `yellow.50` (too vivid/post-it)
- Rationale: `amber.50` reads clearly as "warm" without overwhelming the UI. Mirrors the expressiveness of Light (cool)'s `slate.100` (clearly cool) rather than being tonally ambiguous.
- Trade-offs: Slightly more color-opinionated than stone; on uncalibrated monitors the amber tint is perceptible. Accepted as intentional palette character.

### Decision 2: Surface hierarchy — white / stone.50 / amber.100

- Chosen: `white` for `--theme-surface`, `stone.50` for `--theme-surface-raised`, `amber.100` for `--theme-surface-hover`
- Alternatives considered: Using amber tints for all surfaces (too saturated, hurts readability)
- Rationale: White cards on an amber.50 page reads naturally — the same `bg → white card` pattern used by Light (cool). `stone.50` provides a subtle warm raised state. `amber.100` for hover is distinct from the page bg while staying in the warm family.
- Trade-offs: None significant.

### Decision 3: Foreground — stone scale

- Chosen: `stone.900` / `stone.600` / `stone.500` for fg / fg-muted / fg-subtle
- Alternatives considered: slate scale (too cool), amber scale (insufficient contrast)
- Rationale: Stone is Tailwind's warm neutral — functionally equivalent contrast to slate but with warm undertones that harmonize with the amber background.
- Trade-offs: None.

### Decision 4: Accent — amber.700 / amber.800 / amber.900

- Chosen: `amber.700` (#b45309) as `--theme-accent`
- Alternatives considered: `amber.600` (#d97706, ~3.5:1 on white — borderline AA)
- Rationale: `amber.700` on white yields ~4.7:1, comfortably meeting WCAG AA for normal text and UI controls. One step darker than the most vibrant amber but visually still reads as warm gold.
- Trade-offs: Slightly less saturated than amber.600; accepted for accessibility compliance.

### Decision 5: Shadows — amber.900 base at 10% opacity

- Chosen: `rgb(120 53 15 / 0.10)` (amber.900) for both shadow tokens
- Alternatives considered: slate shadow base (used by Light (cool), but reads cool/blue-gray)
- Rationale: Warm shadows harmonize with the amber palette. Opacity is 10% vs Light (cool)'s 8% because brown pigments appear lighter than blue-gray at the same opacity level.
- Trade-offs: Marginally more visible shadows than Light (cool); acceptable given the warmer base.

### Decision 6: Borders — stone.200 / stone.100

- Chosen: `stone.200` for `--theme-border`, `stone.100` for `--theme-border-muted`
- Rationale: Direct warm-equivalent of Light (cool)'s `slate.200` / `slate.100`. Same structural role, warm undertone.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: `amber.50` background
  - Design decision: Decision 1
  - Validation approach: E2E — compute `--theme-bg` token value in light-warm and assert it matches `amber.50` resolved color

- Proposal element: `amber.700` accent for WCAG AA
  - Design decision: Decision 4
  - Validation approach: E2E — assert active filter chip text color equals resolved `--theme-accent`; contrast ratio verified statically pre-implementation

- Proposal element: Warm-tinted shadows
  - Design decision: Decision 5
  - Validation approach: Covered by visual correctness test (header background changes on theme switch)

- Proposal element: Purely additive — no component changes
  - Design decision: All decisions — all changes confined to `light-warm.css` and `ThemeContext.THEMES`
  - Validation approach: Code review: verify no component files are modified; TypeScript build passes

- Proposal element: Print isolation unaffected
  - Design decision: PrintLayout inline override handles this generically; no action needed
  - Validation approach: Existing print isolation E2E test covers all themes including the new one

## Functional Requirements Mapping

- Requirement: Light (warm) theme is selectable from the theme menu
  - Design element: `THEMES` array entry `{ id: 'light-warm', label: 'Light (warm)' }`
  - Acceptance criteria reference: specs/theme-registration.md
  - Testability notes: E2E — open hamburger menu, assert `Light (warm)` button is visible

- Requirement: Selecting Light (warm) applies `html.light-warm` class and warm token values
  - Design element: `light-warm.css` + existing `setTheme()` logic in ThemeContext
  - Acceptance criteria reference: specs/theme-palette.md
  - Testability notes: E2E — click theme button, evaluate `document.documentElement.className` and computed CSS custom property values

- Requirement: Theme persists across reload
  - Design element: Existing localStorage persistence in ThemeContext (no changes needed)
  - Acceptance criteria reference: specs/theme-registration.md
  - Testability notes: E2E — set localStorage to `light-warm`, reload, assert class restored

- Requirement: Accent color passes WCAG AA on white surface
  - Design element: Decision 4 (amber.700 = ~4.7:1 on white)
  - Acceptance criteria reference: specs/theme-palette.md
  - Testability notes: Verified statically; E2E accent-color test confirms token is applied correctly

## Non-Functional Requirements Mapping

- Requirement category: Accessibility
  - Requirement: All foreground/background pairings meet WCAG AA (4.5:1 for normal text)
  - Design element: stone.900 on white = ~16:1; stone.600 on white = ~5.9:1; amber.700 on white = ~4.7:1
  - Acceptance criteria reference: specs/theme-palette.md
  - Testability notes: Static verification pre-implementation; not automated in E2E (no contrast scanner configured)

- Requirement category: Performance
  - Requirement: No runtime cost beyond existing theme switch mechanism
  - Design element: Pure CSS custom property override — zero JS added
  - Acceptance criteria reference: N/A (no regression expected)
  - Testability notes: Build size delta negligible (16-line CSS file)

- Requirement category: Operability
  - Requirement: Print output unaffected
  - Design element: PrintLayout inline `--theme-bg: white` override is theme-agnostic
  - Acceptance criteria reference: specs/print-isolation.md
  - Testability notes: Existing E2E print isolation test covers all themes generically

## Risks / Trade-offs

- Risk/trade-off: `ThemeId` union type widens when `light-warm` is added to `THEMES`
  - Impact: TypeScript error if any exhaustive type check exists on `ThemeId`
  - Mitigation: Search for exhaustive uses of `ThemeId` before implementation; none anticipated

- Risk/trade-off: amber.50 background is more color-opinionated than stone.100
  - Impact: Some users may find the warm tint stronger than expected
  - Mitigation: This is intentional palette character per #308 design direction; amber.50 chosen over stone explicitly

## Rollback / Mitigation

- Rollback trigger: Regression in existing theme tests, TypeScript error, or visual defect reported post-merge
- Rollback steps: Revert `light-warm.css` creation and the single `THEMES` line addition; no data migration needed
- Data migration considerations: If a user has `light-warm` stored in localStorage after rollback, `readStoredTheme()` will fall through to `dark` (unknown ID filtered out) — safe behavior
- Verification after rollback: Run `npm run test` and `npm run test:e2e`; confirm theme selector shows Dark and Light (cool) only

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Treat as blocking. This change has no auth/API surface, so security failures indicate an unrelated regression or misconfiguration — investigate before merging.
- If required reviews are blocked/stale: Wait up to 48 hours, then re-request. If still blocked, escalate to repo maintainer.
- Escalation path and timeout: After 48 hours with no review activity, ping maintainer in PR comments.

## Open Questions

- None. All design decisions were resolved during explore mode prior to proposal creation.

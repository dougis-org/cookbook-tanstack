## Context

- Relevant architecture: Frontend UI layer of the TanStack Start application.
- Dependencies: React 19, Tailwind CSS 4, and Lucide React (for layout icons).
- Interfaces/contracts touched: `src/components/ui/LogoMark.tsx` interface, `src/routes/index.tsx` landing page layout, `src/components/Header.tsx` main navigation layouts.

## Goals / Non-Goals

### Goals

- Rebrand the landing page hero and chrome headers to use the custom Open Book + Steam brand mark.
- Provide a highly reusable, type-safe React component for the brand mark that naturally supports dynamic styles and theming (dark/light themes).
- Ensure all existing unit and E2E tests pass without regressions.

### Non-Goals

- Replacing general functional Lucide icons in non-branding contexts (e.g. general "cookbooks" lists, edit recipe views, user account options).

## Decisions

### Decision 1: Custom Reusable `<LogoMark>` React Component

- Chosen: Create a React component (`src/components/ui/LogoMark.tsx`) wrapping the Open Book + Steam SVG inline, supporting custom Lucide-style props (`size` and `className`).
- Alternatives considered: Using `<img>` tags linking to `/logo-mark.svg`.
- Rationale: Inline SVGs allow dynamic SVG stroke and fill styling via Tailwind utility classes and CSS variables (e.g., `stroke="currentColor"`). Using an `<img>` tag would prevent dynamic color matching during theme transitions (light/dark/cool/warm).
- Trade-offs: Requires a new component, but adds standard Lucide-style integration.

### Decision 2: Landing Hero Rebrand

- Chosen: Replace `<ChefHat>` in `src/routes/index.tsx` with `<LogoMark size={128} className="text-[var(--theme-accent)]" />` or appropriate responsive sizes.
- Alternatives considered: Keep the generic ChefHat.
- Rationale: Directly satisfies the F11 UX Audit finding and aligns the landing page with canonical branding.
- Trade-offs: None.

### Decision 3: Chrome Header Icon Swap

- Chosen: Swap `<ChefHat>` for `<LogoMark>` inside `src/components/Header.tsx` (main desktop link and drawer sidebar headers) to establish consistent header branding.
- Alternatives considered: Leave the header as is.
- Rationale: Standardizes chrome identity across public and private pages.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Reusable `<LogoMark>` React component
  - Design decision: Decision 1 (Create `src/components/ui/LogoMark.tsx` component)
  - Validation approach: Vitest unit tests verifying that the SVG renders correctly with custom `size` and `className`.
- Proposal element: Landing Hero Rebrand
  - Design decision: Decision 2 (Modify `src/routes/index.tsx` to render `<LogoMark>`)
  - Validation approach: Playwright E2E verification of landing page components.
- Proposal element: Header Brand Icon Swap
  - Design decision: Decision 3 (Modify `src/components/Header.tsx` navigation elements)
  - Validation approach: Run unit tests (`Header.test.tsx`) to ensure no element rendering regressions occur.

## Functional Requirements Mapping

- Requirement: Render custom Open Book + Steam SVG brand mark in the landing page hero.
  - Design element: Decision 2 (Swap `<ChefHat>` for `<LogoMark>` in `src/routes/index.tsx`).
  - Acceptance criteria reference: `specs/logo-rebrand/spec.md` (to be created).
  - Testability notes: E2E test asserts that the brand mark renders in the hero section.
- Requirement: Render custom brand mark in main and mobile header links.
  - Design element: Decision 3 (Swap `<ChefHat>` for `<LogoMark>` in `src/components/Header.tsx`).
  - Acceptance criteria reference: `specs/logo-rebrand/spec.md` (to be created).
  - Testability notes: Run `Header.test.tsx` unit tests.

## Non-Functional Requirements Mapping

- Requirement category: Performance
  - Requirement: Rendering the logo must not increase bundle size significantly or cause layout shifts.
  - Design element: Vector inline SVG asset with explicit viewport sizing (`0 0 64 64`).
  - Acceptance criteria reference: `specs/logo-rebrand/spec.md` (to be created).
  - Testability notes: Verify that the element doesn't shift other layout blocks.
- Requirement category: Operability (Theming)
  - Requirement: The brand mark must inherit the active theme color dynamically (light-cool, light-warm, dark).
  - Design element: Use `stroke="currentColor"` inside `<LogoMark>`.
  - Acceptance criteria reference: `specs/logo-rebrand/spec.md` (to be created).
  - Testability notes: Verify visual contrast across all application themes in dev mode.

## Risks / Trade-offs

- Risk/trade-off: Visual layout scaling issues on small screen viewports.
  - Impact: Low.
  - Mitigation: Use responsive Tailwind classes on `<LogoMark>` sizing (e.g. `w-24 h-24 md:w-32 md:h-32`).

## Rollback / Mitigation

- Rollback trigger: Production build failure or critical UI rendering glitches on mobile viewports.
- Rollback steps: Revert modifications to `src/routes/index.tsx` and `src/components/Header.tsx` to restore original Lucide `<ChefHat>` imports and usage.
- Data migration considerations: None.
- Verification after rollback: Run E2E tests (`npm run test:e2e`) and unit tests (`npm run test`).

## Operational Blocking Policy

- If CI checks fail: Do not merge. The test suite must pass with 100% success rate.
- If security checks fail: Re-evaluate dependencies and resolve immediately before PR merge.
- If required reviews are blocked/stale: Follow standard repository PR guidelines to address feedback and request re-review.
- Escalation path and timeout: N/A (low impact).

## Open Questions

- None. No unresolved questions exist.

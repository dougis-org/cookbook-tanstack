## Context

- **Relevant architecture:** Frontend client application written in React 19, powered by TanStack Start and TanStack Router for type-safe routing, and Tailwind CSS v4 for utility-first styling. Better-Auth is integrated on the client side for account lifecycle management.
- **Dependencies:** `lucide-react` for scalable check icon rendering, `@tanstack/react-router` for safe route navigation links.
- **Interfaces/contracts touched:** `AuthPageLayout` component properties interface and `RegisterForm` layout structure.

## Goals / Non-Goals

### Goals

- support custom sizing inside `AuthPageLayout` so that the registration screen card can expand to hold a two-column grid.
- implement responsive CSS grid columns on desktop, placing the form on the left side and the benefits sidebar on the right side.
- implement clean stacking on mobile viewports so that the benefits are stacked vertically above the form inputs.
- display five short, high-fidelity lines detailing free-tier benefits, each accompanied by an accent-colored Lucide checkmark icon with premium hover scaling animations.
- include legal microcopy under the registration submit button with stub links mapping to Terms and Privacy Policy pages.
- guarantee that all existing 11 unit tests continue to pass and add robust test cases verifying the new UI items.

### Non-Goals

- Do not alter or break authentication logic, submission endpoints, or user model structures.
- Do not affect login, forgot password, or reset password layouts.

## Decisions

### Decision 1: Customizable container width on Auth Page Layout

- **Chosen:** Add an optional `maxWidth` string property to `AuthPageLayoutProps` structure that defaults to `"max-w-md"`. Wrap the card container with this variable class.
- **Alternatives considered:** Duplicate layout containers specifically for registration.
- **Rationale:** Keeps auth layout completely unified and modular. Other forms (sign-in, forgot-password, reset-password) are unaffected and maintain their narrow centered footprint, while registration can expand dynamically.
- **Trade-offs:** Adds an optional prop which has zero negative impact.

### Decision 2: Pure CSS Grid Column Reordering and Stacking

- **Chosen:** Nest form and benefits sidebar inside a grid container `<div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">`. We place the Benefits Sidebar first in JSX, and apply `order-first md:order-last` to the benefits sidebar, and `order-last md:order-first` to the Form container.
- **Alternatives considered:** Using client-side JavaScript viewport listeners (`useMediaQuery`) to swap JSX trees.
- **Rationale:** Pure CSS grid ordering renders instantly, eliminates hydration mismatches in SSR (Server-Side Rendering), and has zero run-time JS overhead.
- **Trade-offs:** None. Extremely performant.

### Decision 3: High-Fidelity Benefit List and Scaling Icons

- **Chosen:** We render the benefits inside a styled sidebar utilizing `var(--theme-surface-raised)` and `var(--theme-border-muted)`. We place each check icon inside a circular container styled with `bg-[var(--theme-accent-subtle-bg)]` and apply CSS group transitions so hovering over a benefit scales the icon badge (`group-hover:scale-110`) and highlights the text to `--theme-fg`.
- **Alternatives considered:** Minimal static lists with raw checkmarks.
- **Rationale:** Meets the premium aesthetic standard required to wow users and elevate brand perception.
- **Trade-offs:** Minimal styling class declarations.

## Proposal to Design Mapping

- **Proposal element:** Responsive multi-column layout
  - *Design decision:* Decision 1 (optional layout width) & Decision 2 (CSS grid column reordering)
  - *Validation approach:* Manual viewport scaling and E2E visual layout tests
- **Proposal element:** Lucide checkmark bullet benefits
  - *Design decision:* Decision 3 (Micro-animations and custom theme badges)
  - *Validation approach:* Unit testing asserting benefits list is present
- **Proposal element:** Legal microcopy under the button
  - *Design decision:* Stub links within the form
  - *Validation approach:* Unit test asserting stub link attributes

## Functional Requirements Mapping

- **Requirement:** Benefits sidebar stacks above the form on mobile viewports (< md breakpoint)
  - *Design element:* Sidebar listed first in JSX with `order-first md:order-last`
  - *Acceptance criteria reference:* GitHub Issue #454 Criteria 2
  - *Testability notes:* Verified in testing environment by checking visual layout or class configurations
- **Requirement:** Form is positioned on the left on desktop viewports (≥ md breakpoint)
  - *Design element:* Form listed second in JSX with `order-last md:order-first`
  - *Acceptance criteria reference:* GitHub Issue #454 Criteria 1
  - *Testability notes:* Verified visually or via Playwright viewport tests
- **Requirement:** Terms and Privacy links exist below the submit button as stubs
  - *Design element:* Link stubs inside paragraph underneath submit button
  - *Acceptance criteria reference:* GitHub Issue #454 Criteria 5
  - *Testability notes:* Asserted by RegisterForm unit tests checking for stub text and `#` attributes

## Non-Functional Requirements Mapping

- **Requirement category:** Performance
  - *Requirement:* Pure CSS transitions and zero Cumulative Layout Shift (CLS) on page loads.
  - *Design element:* Utility classes applied directly to SSR elements, avoiding JS layout computations.
  - *Acceptance criteria reference:* Core Performance standards
  - *Testability notes:* Lighthouse layout shifting checks.
- **Requirement category:** Security
  - *Requirement:* Prevent security vulnerabilities in link tags (e.g. secure target attributes).
  - *Design element:* Links using secure local routing (`Link` from TanStack Router) instead of raw open anchors.
  - *Acceptance criteria reference:* Analysis & Security standards
  - *Testability notes:* Snyk scan.

## Risks / Trade-offs

- **Risk/trade-off:** Tight spacing on narrow desktop screen widths (near 768px).
  - *Impact:* Low-to-medium.
  - *Mitigation:* The design specifies a compact column width of `280px` for the sidebar, preserving `1fr` for the form inputs and keeping layout readable.

## Rollback / Mitigation

- **Rollback trigger:** Failure in production builds, unexpected unit/E2E test breaks on main auth gates.
- **Rollback steps:** Revert modified files (`git checkout src/components/auth/AuthPageLayout.tsx src/components/auth/RegisterForm.tsx src/routes/auth/register.tsx src/components/auth/__tests__/RegisterForm.test.tsx`), run npm checks, and verify.
- **Data migration considerations:** None. This is a purely visual presentation level change.
- **Verification after rollback:** Confirm all original 11 tests pass successfully.

## Operational Blocking Policy

- **If CI checks fail:** Strictly block merge. Developer must analyze failures, fix layout class mistakes or mock differences, and get unit tests green.
- **If security checks fail:** Investigate new dependencies or vulnerabilities and remediate.
- **If required reviews are blocked/stale:** Directly ping review teams.
- **Escalation path and timeout:** 24 hour SLA for automated auto-merge workflows once comments are cleared.

## Open Questions

- *No open questions or unresolved ambiguities.* The issue acceptance criteria are fully specified.

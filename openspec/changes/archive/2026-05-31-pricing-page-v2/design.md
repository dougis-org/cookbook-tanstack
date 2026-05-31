## Context

- Relevant architecture: The application uses TanStack Router for type-safe routing, React 19 for rendering, Tailwind CSS 4 for styling, and Vitest / `@testing-library/react` for unit/integration testing.
- Dependencies: 
  - `src/routes/pricing.tsx`: The primary route file to implement the new pricing layout.
  - `src/lib/tier-entitlements.ts`: Source of truth for tier pricing (`TIER_PRICING`) and user entitlements.
  - `lucide-react`: Reusable icon package.
- Interfaces/contracts touched: `<PricingPage>` exported by `src/routes/pricing.tsx`. The search parameters focus remains unmodified.

## Goals / Non-Goals

### Goals

- Build a highly polished, interactive billing frequency toggle that modifies the displayed pricing dynamically.
- Implement the "Most Popular" high-fidelity visual layout for the Prep Cook tier card (cheapest paid tier).
- Create context-aware CTA actions on every tier card (disabled if user's current tier, routes to `/change-tier` if not).
- Implement a 3-column Reassurance trust row beneath the cards.
- Construct an interactive FAQ Accordion with 5 key pre-sales items, where the first item is open by default.
- Maintain full compatibility with all 4 color themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).

### Non-Goals

- Integrate actual Stripe payment logic or back-end checkout processors (Stripe wiring is F01 and out of scope).
- Modify the database schema or the user tiers themselves.

## Decisions

### Decision 1: Live Toggle State Management

- Chosen: Declare a local boolean React state `const [isAnnual, setIsAnnual] = useState(true)` inside the parent `PricingPage` component. Pass `isAnnual` as a prop to each child `<TierCard>` component.
- Alternatives considered: Query parameters (e.g., `?billing=annual`). However, search query parameter validation in TanStack Router would require updating the route definition and search schema. Local component state is much faster, lightweight, and perfectly suitable for this marketing page interaction.
- Rationale: Storing `isAnnual` in the parent React state allows a clean, synchronized, live repaint of all child cards instantly when the user clicks the toggle, without causing routing overhead.
- Trade-offs: Simple component state does not persist billing frequency on page refresh, but for a simple marketing page, a default-annual refresh is standard and expected.

### Decision 2: Contextual CTAs

- Chosen: Embed custom buttons/links inside each `<TierCard>` component.
  - If `tier === currentTier`, render a `disabled` button with `"Current plan"` text, styled in muted/border styling.
  - If `tier !== currentTier` and user is logged in or anonymous, render a `<Link to="/change-tier">` component styled as a button with `"Upgrade"` or `"Get Started"` copy.
  - For the Prep Cook tier, apply the filled accent-colored CTA button styles, while other cards use standard secondary/outline styling.
- Alternatives considered: Keeping the single global button below the grid.
- Rationale: Per-card CTAs are a standard SaaS pattern that removes frictional barrier to purchase, making it instantly clear how to action a specific tier choice.
- Trade-offs: Requires rewriting legacy unit tests that asserted there were "no links inside cards", but the value of a high-conversion design makes this mandatory.

### Decision 3: FAQ Accordion Structure

- Chosen: Create an interactive React FAQ section. Use `const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)` inside the `PricingPage` component.
  - Maintain a static array of 5 FAQ objects (questions and answers).
  - Map each item into a collapsible section. If `openFaqIndex === index`, render the answer paragraph; otherwise collapse it.
  - Trigger `setOpenFaqIndex(openFaqIndex === index ? null : index)` on header click.
- Alternatives considered: Using native HTML `<details>` and `<summary>` tags.
- Rationale: While `<details>` is native, custom React state allows precise control (e.g., ensuring only one accordion item is expanded at a time, implementing custom transitions, and easily setting the first item open by default in a controlled manner).
- Trade-offs: Slightly more React code than native `<details>` tags, but yields a significantly more premium, controlled UX.

## Proposal to Design Mapping

- Proposal element: Dynamic Annual/Monthly toggle (default Annual)
  - Design decision: Decision 1: Live Toggle State Management (Parent-level `isAnnual` state).
  - Validation approach: Vitest unit test simulating toggle click and asserting price labels update instantly.
- Proposal element: Prep Cook cheapest paid tier visual emphasis
  - Design decision: Custom CSS classes (`scale-105 shadow-xl border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]`) applied conditionally inside `<TierCard>` if `tier === 'prep-cook'`. Includes absolute-positioned top "Most popular" badge and filled primary CTA button.
  - Validation approach: Vitest assertion verifying "Most popular" text is visible on the Prep Cook card, and class names/styling match expectations.
- Proposal element: Reassurance trust row
  - Design decision: 3-column responsive grid styled with theme borders and featuring Lucide icons.
  - Validation approach: Unit test asserting "Cancel anytime", "30-day guarantee", and "Export anytime" headings render in the document.
- Proposal element: FAQ Accordion (first open by default)
  - Design decision: Decision 3: FAQ Accordion Structure (parent state `openFaqIndex` defaulting to `0`).
  - Validation approach: Vitest unit test confirming first item's answer is visible on mount while others are hidden, and clicking collapses/expands accordingly.

## Functional Requirements Mapping

- Requirement: Monthly/Annual billing frequency selection updates pricing calculations.
  - Design element: Toggle button state changes `isAnnual`. If `isAnnual`, calculate monthly equivalent via `(pricing.annual / 12).toFixed(2)` and display `"Billed annually · $YY/yr"` caption. If `isAnnual` is false, show monthly price directly.
  - Acceptance criteria reference: F09 - Acceptance Criteria 1 & 2
  - Testability notes: Mock the pricing hook/state and verify pricing numbers under both toggle positions.
- Requirement: Current Plan CTA isDisabled.
  - Design element: `isCurrentTier` check returns a disabled HTML button showing `"Current plan"`.
  - Acceptance criteria reference: F09 - Acceptance Criteria 5
  - Testability notes: Set mock active user session tier to `sous-chef` and assert that the Sous Chef CTA button has the `disabled` attribute and text `"Current plan"`.

## Non-Functional Requirements Mapping

- Requirement category: Performance & Operability
  - Requirement: Perfect visual appearance and high text contrast across all 4 themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).
  - Design element: Restrict all colors to the CSS variables in `design-system/tokens/colors-and-type.css`, specifically `--theme-border`, `--theme-surface`, `--theme-accent`, and `--theme-fg`.
  - Acceptance criteria reference: F09 - Constraints (Theme tokens only, no hardcoded hex)
  - Testability notes: Verify component is styled completely using variable classnames or variable styles.
- Requirement category: Operability / Code Quality
  - Requirement: No emojis allowed in copy. Feature lists must use `✓` (U+2713).
  - Design element: Standardize checkmark text rendering to `✓`. Use Lucide icons for reassure row and accordion arrows.
  - Acceptance criteria reference: F09 - Constraints (No emoji)
  - Testability notes: Scan JSX code contents for any forbidden characters or emoji symbols.

## Risks / Trade-offs

- Risk/trade-off: Visual layout scaling on extra-small mobile viewports due to 4 cards + toggle + reassurance + FAQ.
  - Impact: Content overflow or squished text on mobile screens.
  - Mitigation: Apply a mobile-first responsive grid. Tiers: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4`. Reassurance: `grid grid-cols-1 md:grid-cols-3`. All layout padding must adjust cleanly.
- Risk/trade-off: Upgrading users without a checkout flow wired yet.
  - Impact: Clicking CTA links to `/change-tier` which is currently a static placeholder page.
  - Mitigation: Ensure the `/change-tier` link is clear and serves as an elegant placeholder until Stripe checkout integration (F01) is complete.

## Rollback / Mitigation

- Rollback trigger: Production regression or severe UX bugs on non-standard browsers.
- Rollback steps: Run a standard Git revert to checkout the original version of `src/routes/pricing.tsx` and `src/routes/__tests__/-pricing.test.tsx` from the `main` branch.
- Data migration considerations: None. This is a purely presentation-layer change with no database migrations or persistence-level state changes.
- Verification after rollback: Execute the full Vitest suite (`npm run test`) to confirm tests return to passing green states.

## Operational Blocking Policy

- If CI checks fail: The pull request MUST remain in a blocked state. No code changes can be merged until all unit, integration, and E2E checks pass successfully.
- If security checks fail: Proactively audit the failing package or dependency using `npm audit`. If the vulnerability is in pricing code, immediately remedy or revert.
- If required reviews are blocked/stale: Coordinate directly with contributors on the PR comments. Never force-merge or bypass PR gates. Address and resolve all open comments to unlock auto-merge.
- Escalation path and timeout: If blocked by unresolved design questions, trigger `/grill-me` with the user to align and proceed.

## Open Questions

- None. The design perfectly satisfies the detailed context and codebase constraints.

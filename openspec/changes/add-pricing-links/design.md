## Context

- Relevant architecture: TanStack Router file-based routing with `src/components/Header.tsx` providing the universal sidebar nav (mobile-first, used at all screen sizes). Anonymous home page at `src/routes/index.tsx` redirects authenticated users to `/home`. The `/pricing` page exists at `src/routes/pricing.tsx` with full tier card rendering.
- Dependencies: `@tanstack/react-router` for `<Link>` and `activeProps`. Existing nav items in Header.tsx sidebar lines 366-446. Hero section in index.tsx lines 41-67.
- Interfaces/contracts touched: `src/components/Header.tsx` (sidebar nav items), `src/routes/index.tsx` (hero CTA section), `src/routes/__tests__/-index.test.tsx`, `src/routes/__tests__/-pricing.test.tsx`.

## Goals / Non-Goals

### Goals

- Pricing link appears in sidebar nav between Cookbooks and auth-only actions (New Recipe, Import Recipe)
- Sidebar Pricing link shows active state styling when on `/pricing`
- Anonymous home hero has secondary "View Plans and Pricing" button alongside "Browse Recipes"
- Secondary button uses outline/border styling to de-emphasize vs primary CTA
- Buttons stack vertically on mobile, side-by-side on sm+ breakpoints

### Non-Goals

- Desktop-only header nav (sidebar is universal)
- Authenticated home page changes
- Modifying the `/pricing` page itself
- Tier-wall or upsell UI (separate change)

## Decisions

### Decision 1: Sidebar Pricing link placement

- Chosen: Insert Pricing link after Cookbooks link (line ~416), before the auth-only section (New Recipe/Import Recipe, line ~418). Use same styling pattern as other nav items with `activeProps` for `/pricing` active state.
- Alternatives considered: (A) Place at bottom of sidebar near Theme section, (B) Group with auth actions.
- Rationale: Pricing is a destination page alongside Home/Recipes/Categories/Cookbooks. Placing it in the main nav group keeps it discoverable. Auth-only actions are a separate concern and should be visually grouped after public pages.
- Trade-offs: None significant. Follows existing pattern exactly.

### Decision 2: Sidebar Pricing link styling

- Chosen: Mirror exact pattern of existing nav items (Recipes, Categories, Cookbooks). Use `<Link>` with `activeProps` setting `bg-[var(--theme-accent)]` background and white text.
- Alternatives considered: Differentiate with icon or special styling.
- Rationale: Consistency with existing nav items. The active state should be immediately recognizable. No need to visually distinguish Pricing from other nav items.
- Trade-offs: Pricing link looks identical to other nav items. Acceptable since it IS a nav item.

### Decision 3: Home page hero secondary button style

- Chosen: Outline/border style with `border-2 border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white`. Stacked vertically on mobile (`flex-col`), side-by-side on `sm:flex-row`.
- Alternatives considered: (A) Ghost text-only link, (B) Filled accent button (same as primary), (C) Subtle link below CTAs.
- Rationale: Outline style creates clear visual hierarchy — primary CTA (filled) vs secondary action (outline). Stacked on mobile prevents wrapping issues with longer "View Plans and Pricing" text. Side-by-side on larger screens uses horizontal space efficiently.
- Trade-offs: Slightly more visual weight than a text link. Appropriate for a conversion-oriented CTA.

### Decision 4: Button copy

- Chosen: "View Plans and Pricing" as specified by the user.
- Alternatives considered: "Pricing", "View Pricing", "See Plans".
- Rationale: User explicitly requested this copy. "Plans and Pricing" is clear and commonly understood in SaaS.

## Proposal to Design Mapping

- Proposal element: Add Pricing link to sidebar between Cookbooks and auth actions
  - Design decision: Decision 1 (placement) + Decision 2 (styling)
  - Validation approach: Visual inspection. RTL test for link presence. Playwright test for active state on `/pricing`.

- Proposal element: Add "View Plans and Pricing" secondary CTA to anonymous home hero
  - Design decision: Decision 3 (button style) + Decision 4 (copy)
  - Validation approach: RTL test for button presence and correct `to="/pricing"`. Visual check for stacking on mobile.

- Proposal element: Apply activeProps styling to Pricing sidebar link
  - Design decision: Decision 2 (activeProps pattern)
  - Validation approach: Navigate to `/pricing` and verify active styling. Test in `-pricing.test.tsx`.

## Functional Requirements Mapping

- Requirement: Sidebar shows Pricing link for all users
  - Design element: Decision 1 — new `<Link to="/pricing">` in Header.tsx sidebar nav
  - Acceptance criteria reference: specs/sidebar-pricing-link.md
  - Testability notes: RTL render of Header with null session, assert Pricing link present. Playwright: open sidebar, verify link visible.

- Requirement: Pricing link shows active state on `/pricing`
  - Design element: Decision 2 — `activeProps` with accent background
  - Acceptance criteria reference: specs/sidebar-pricing-link.md
  - Testability notes: Navigate to `/pricing`, verify link has active styling class.

- Requirement: Anonymous home hero has "View Plans and Pricing" button
  - Design element: Decision 3 + 4 — outline button with specified copy
  - Acceptance criteria reference: specs/home-hero-pricing.md
  - Testability notes: RTL render of HomePage with null session, assert link with correct text and href.

- Requirement: Buttons stack on mobile, side-by-side on sm+
  - Design element: Decision 3 — `flex-col sm:flex-row` on CTA container
  - Acceptance criteria reference: specs/home-hero-pricing.md
  - Testability notes: Visual/Playwright test at mobile and desktop viewports.

## Non-Functional Requirements Mapping

- Requirement category: consistency
  - Requirement: Sidebar Pricing link follows existing nav item pattern exactly
  - Design element: Decision 2 — same className and activeProps as other nav items
  - Acceptance criteria reference: specs/sidebar-pricing-link.md
  - Testability notes: Code review. No functional test needed beyond presence.

- Requirement category: accessibility
  - Requirement: Links use proper `<Link>` component with semantic labels
  - Design element: All links use `@tanstack/react-router` Link with descriptive text
  - Acceptance criteria reference: specs/sidebar-pricing-link.md, specs/home-hero-pricing.md
  - Testability notes: RTL `getByRole('link', { name: /view plans and pricing/i })`.

## Risks / Trade-offs

- Risk/trade-off: "View Plans and Pricing" text length may cause layout issues at very small breakpoints.
  - Impact: Low — `flex-col` stacking prevents horizontal overflow. Button has `px-8` padding which is reasonable.
  - Mitigation: Use `sm:` breakpoint for side-by-side layout. Monitor in Playwright visual tests.

- Risk/trade-off: Adding Pricing to sidebar changes the order users see nav items.
  - Impact: Negligible — Pricing is placed logically after Cookbooks. Users scanning nav will see it in flow.
  - Mitigation: None needed. Follows logical information architecture.

## Rollback / Mitigation

- Rollback trigger: Pricing link causes navigation confusion or tests fail consistently.
- Rollback steps: `git revert` the commit adding the link. No data migration needed — pure UI change.
- Data migration considerations: None — no database or state changes.
- Verification after rollback: `npm run test` and `npm run test:e2e` pass. Sidebar and home page render without Pricing references.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests (RTL or Playwright) before proceeding.
- If security checks fail: Not applicable — no security implications for adding navigation links.
- If required reviews are blocked/stale: Ping reviewer after 24h. After 48h escalate to async self-merge if all checks pass.
- Escalation path and timeout: 48h review window; unblocked merge with passing CI after that for UI-only changes.

## Open Questions

None. All design decisions were resolved during the explore session.

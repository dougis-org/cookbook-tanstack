## Context

- Relevant architecture: File-based TanStack Router routing (`src/routes/`). Pricing page (`src/routes/pricing.tsx`) renders `TierCard` components from `TIER_ORDER` in `src/lib/tier-entitlements.ts`. Current user tier is read from `useAuth()` session.
- Dependencies: `@tanstack/react-router` `<Link>`, `TIER_ORDER`/`EntitlementTier` from `src/lib/tier-entitlements.ts`, `useAuth` hook.
- Interfaces/contracts touched: `TierCardProps` interface, `renderCTA()` internal function, route path `/upgrade` → `/change-tier`.

## Goals / Non-Goals

### Goals

- Show correct CTA label (Upgrade / Downgrade / none) based on tier position relative to the user's current tier
- Rename `/upgrade` route to `/change-tier`
- Hide the anonymous tier card on the pricing page
- No CTA on the current tier card

### Non-Goals

- Implementing billing or plan-change logic behind `/change-tier`
- Removing `anonymous` from the `EntitlementTier` type or `TIER_ORDER`

## Decisions

### Decision 1: Tier comparison strategy

- Chosen: Compare `TIER_ORDER.indexOf(tier)` vs `TIER_ORDER.indexOf(currentTier)` inside `TierCard`
- Alternatives considered: Pass `isUpgrade`/`isDowngrade` booleans from `PricingPage`
- Rationale: Keeping comparison local to `TierCard` avoids threading additional props and makes the component self-contained. `TIER_ORDER` is already imported in `pricing.tsx` for other uses.
- Trade-offs: `TierCard` takes a mild dependency on tier ordering knowledge; offset by the fact that `TierCardProps` already accepts `EntitlementTier` values.

### Decision 2: Replace `isCurrent` prop with `currentTier`

- Chosen: Remove `isCurrent: boolean` from `TierCardProps`; add `currentTier: EntitlementTier`. Derive `isCurrent` inside the component as `tier === currentTier`.
- Alternatives considered: Keep `isCurrent` and add a separate `isAbove`/`isBelow` boolean
- Rationale: Passing the full `currentTier` is strictly more information with no extra cost, eliminates two derived booleans, and makes `TierCard` independently testable with any current-tier value.
- Trade-offs: Slightly more data passed per card render — negligible.

### Decision 3: Anonymous tier hidden, not removed from data layer

- Chosen: Filter `anonymous` out of the `TIER_ORDER` array at render time in `PricingPage` (`TIER_ORDER.filter(t => t !== 'anonymous')`). Do not remove from `TIER_ORDER` or `EntitlementTier`.
- Alternatives considered: Add a separate `PRICING_TIERS` export to `tier-entitlements.ts`
- Rationale: The filter is one line and avoids a new export. `anonymous` must remain in `TIER_ORDER` for tier-comparison math (index 0) and for `showUserAds`, `canImport`, etc.
- Trade-offs: The filter is inline, not named — acceptable given simplicity.

### Decision 4: Single `/change-tier` route for both directions

- Chosen: Rename `src/routes/upgrade.tsx` → `src/routes/change-tier.tsx`, update `createFileRoute` path to `/change-tier`. Both Upgrade and Downgrade links point to this route.
- Alternatives considered: Separate `/upgrade` and `/downgrade` routes
- Rationale: The destination is a placeholder "coming soon" page. A single route is sufficient until billing is implemented.
- Trade-offs: Route won't distinguish intent; can add query param (`?direction=downgrade`) later if needed.

## Proposal to Design Mapping

- Proposal element: Upgrade vs Downgrade CTA based on tier position
  - Design decision: Decision 1 (index comparison inside TierCard)
  - Validation approach: Unit tests asserting correct link text per tier/currentTier combination

- Proposal element: No CTA on current tier card
  - Design decision: Decision 2 (currentTier prop, isCurrent derived inside component)
  - Validation approach: Test that current-tier card contains no `<a>` element

- Proposal element: Anonymous tier card removed from display
  - Design decision: Decision 3 (filter at render time)
  - Validation approach: Test that `tier-card-anonymous` is not present in the DOM

- Proposal element: Rename `/upgrade` → `/change-tier`
  - Design decision: Decision 4 (file rename + createFileRoute update)
  - Validation approach: Tests assert href="/change-tier"; no references to /upgrade remain in source

## Functional Requirements Mapping

- Requirement: Tiers above currentTier show "Upgrade" link to `/change-tier`
  - Design element: `TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(currentTier)` branch in `renderCTA()`
  - Acceptance criteria reference: specs/cta-logic.md
  - Testability notes: Render `TierCard` or `PricingPage` with a known `currentTier`; assert link text and href

- Requirement: Tiers below currentTier show "Downgrade" link to `/change-tier`
  - Design element: `TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(currentTier)` branch in `renderCTA()`
  - Acceptance criteria reference: specs/cta-logic.md
  - Testability notes: Same as above with a higher-tier session

- Requirement: Current tier card has no CTA
  - Design element: `isCurrent` (derived) → `return null` in `renderCTA()`
  - Acceptance criteria reference: specs/cta-logic.md
  - Testability notes: Assert no `<a>` element inside the current tier's card

- Requirement: Anonymous tier card is not rendered
  - Design element: `TIER_ORDER.filter(t => t !== 'anonymous')` in `PricingPage`
  - Acceptance criteria reference: specs/anonymous-card.md
  - Testability notes: Assert `screen.queryByTestId('tier-card-anonymous')` is null

- Requirement: Route `/upgrade` no longer exists; `/change-tier` serves the same page
  - Design element: File rename + `createFileRoute('/change-tier')`
  - Acceptance criteria reference: specs/route-rename.md
  - Testability notes: Grep for `/upgrade` in source (must be 0 hits outside test history); E2E or smoke test `/change-tier` route loads

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Existing pricing page tests must pass after changes
  - Design element: Test file updated in same PR as implementation
  - Acceptance criteria reference: specs/cta-logic.md
  - Testability notes: `npm run test` green in CI

- Requirement category: operability
  - Requirement: No broken links from existing nav or auth-guard redirects
  - Design element: `auth-guard.ts` message copy updated; no other internal links to `/upgrade`
  - Acceptance criteria reference: specs/route-rename.md
  - Testability notes: `grep -r '/upgrade'` returns 0 results in src/

## Risks / Trade-offs

- Risk/trade-off: Route tree not regenerated until dev server restart after file rename
  - Impact: Dev-time only; broken route in local dev if server not restarted
  - Mitigation: Task notes to restart dev server after rename

- Risk/trade-off: Test file still asserts `/upgrade` href until updated
  - Impact: CI failure if tests run before test update
  - Mitigation: File rename and test update are in the same task

## Rollback / Mitigation

- Rollback trigger: Pricing page broken in production or tests fail unexpectedly post-merge
- Rollback steps: Revert the PR; TanStack Router will regenerate route tree on next dev server start
- Data migration considerations: None — pure UI/routing change
- Verification after rollback: `npm run test` passes; `/pricing` renders correctly; `/upgrade` route accessible again

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix failing tests or type errors before proceeding
- If security checks fail: Treat as a blocker; this change touches routing, not auth, so security failures are likely unrelated — investigate before assuming safe to ignore
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours
- Escalation path and timeout: Repo owner (dougis) has final merge authority

## Open Questions

No open questions. All design decisions confirmed during explore session.

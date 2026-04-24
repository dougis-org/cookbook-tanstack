## Context

- Relevant architecture:
  - TanStack Start file-based routing (`src/routes/`) — new files auto-register
  - tRPC routers in `src/server/trpc/routers/`; root router at `src/server/trpc/root.ts`
  - Entitlement module: `src/lib/tier-entitlements.ts` (`TIER_LIMITS`, `canCreatePrivate`, `canImport`, `showUserAds`)
  - Ad policy: `src/lib/ad-policy.ts` — `isPageAdEligible(role, session)`; `PageLayout` renders `AdSlot` components
  - Auth: `useAuth()` hook exposes `session.user.tier` client-side; no extra fetch needed
  - Existing server-side count logic: `enforceContentLimit` in `src/server/trpc/routers/_helpers.ts` uses `countDocuments({ userId, hiddenByTier: { $ne: true } })`
- Dependencies:
  - `src/lib/tier-entitlements.ts` (data source — read-only)
  - `src/hooks/useAuth.ts` (session + tier)
  - `src/components/layout/PageLayout.tsx` (ad slots, layout)
  - `src/server/trpc/routers/_helpers.ts` (count logic to reuse)
- Interfaces/contracts touched:
  - tRPC root router gains `usage` namespace
  - `account.tsx` route component expanded (no route config change)
  - Two new public routes: `/pricing`, `/upgrade`

## Goals / Non-Goals

### Goals

- Public `/pricing` page rendering tier comparison table from `TIER_LIMITS` + helpers
- Ad slots shown above and below tier card group for anonymous/Home Cook visitors
- Current tier highlighted for logged-in users (from session, no extra fetch)
- Per-tier CTAs: anonymous → sign up, paid tiers → `/upgrade`, Executive Chef → no action
- `/upgrade` stub route acknowledging upgrade intent
- Account page tier section: current tier name/description, usage bars (recipe + cookbook), next-tier preview, link to `/pricing`
- `usage.getOwned` tRPC query returning `{ recipeCount, cookbookCount }` for current user
- Shared count logic between `enforceContentLimit` and `usage.getOwned`

### Non-Goals

- Payment processing or subscription API
- Tier-wall component (#391)
- Modifying `TIER_LIMITS` or entitlement helpers

## Decisions

### Decision 1: Pricing page data source — static from entitlements module

- Chosen: Derive all tier table data at render time from `TIER_LIMITS`, `canCreatePrivate`, `canImport`, `showUserAds`; no server call for table content
- Alternatives considered: tRPC query returning tier matrix; hardcoded JSX
- Rationale: Tier limits change rarely; session already carries current tier for highlighting; avoids loading state on a marketing page
- Trade-offs: If `TIER_LIMITS` changes, both enforcement and pricing update atomically — this is the desired behavior

### Decision 2: Usage counts — dedicated `usage.ts` tRPC router

- Chosen: New `src/server/trpc/routers/usage.ts` with `getOwned` protected procedure returning `{ recipeCount, cookbookCount }`
- Alternatives considered: Add to `users.ts` router; inline in account page loader
- Rationale: Clean separation; extensible (future: chapters, images, storage); avoids mixing profile queries with content counts
- Trade-offs: One extra router file; minor boilerplate in root.ts

### Decision 3: Shared count query logic via `_helpers.ts`

- Chosen: Extract `countUserContent(userId)` helper (or inline-share the query pattern) in `src/server/trpc/routers/_helpers.ts` used by both `enforceContentLimit` and `usage.getOwned`
- Alternatives considered: Duplicate `countDocuments` in `usage.ts`
- Rationale: Prevents drift between what is enforced and what is displayed; single source of truth for the count predicate `{ userId, hiddenByTier: { $ne: true } }`
- Trade-offs: Slightly more coupling in `_helpers.ts`; acceptable given helpers file already owns enforcement logic

### Decision 4: Ad placement — `PageLayout` role prop

- Chosen: `/pricing` uses `role="public-marketing"` — same as landing page; `AdSlot` components placed explicitly above and below the `<TierCardGroup>` in the route file rather than relying solely on `PageLayout` auto-placement
- Alternatives considered: New `PageRole` value for pricing; sidebar ads
- Rationale: `isPageAdEligible` already handles anonymous/Home Cook eligibility for `public-marketing`; explicit placement matches design spec (above + below cards)
- Trade-offs: Ad slots in route file rather than layout; acceptable — pricing page has unique layout needs

### Decision 5: Upgrade CTA routing — `/upgrade` stub

- Chosen: All non-anonymous, non-executive tier CTAs link to `/upgrade`; stub route renders "Upgrade plans coming soon" message with link back to `/pricing`
- Alternatives considered: Disabled button with tooltip; external link placeholder
- Rationale: Real route enables future implementation without changing link targets; cleaner than disabled buttons; consistent with TanStack Router `<Link>` convention
- Trade-offs: Extra route file; worth it for future-proofing

### Decision 6: Tier description copy location

- Chosen: Define `TIER_DESCRIPTIONS` constant in `src/lib/tier-entitlements.ts` alongside `TIER_LIMITS` — one-liner descriptions keyed by `EntitlementTier`
- Alternatives considered: Inline in pricing component; separate `tier-copy.ts` file
- Rationale: Co-locating copy with limits keeps all tier metadata in one import; descriptions are product facts, not view concerns
- Trade-offs: Slight mixed concern (copy + logic); acceptable at this scale

### Decision 7: Account page usage section layout

- Chosen: Render below any existing account content; show tier badge, two progress bars (recipes, cookbooks), next-tier unlock preview, and `/pricing` link; always visible for all tiers including Executive Chef
- Alternatives considered: Only show when near limit; separate `/account/tier` sub-route
- Rationale: Transparency builds trust; Executive Chef users still benefit from seeing usage; simpler than conditional rendering
- Trade-offs: Extra tRPC fetch on account page load for all users

## Proposal to Design Mapping

- Proposal element: `/pricing` data from `TIER_LIMITS` and capability helpers
  - Design decision: Decision 1
  - Validation approach: Test that rendered tier cards match `TIER_LIMITS` values for all 5 tiers

- Proposal element: Session-based current tier highlight (no extra fetch)
  - Design decision: Decision 1
  - Validation approach: Test with mocked session that matching tier card gets highlight class; test without session that no card is highlighted

- Proposal element: Ad slots above and below tier card group
  - Design decision: Decision 4
  - Validation approach: Test `AdSlot` present for anonymous session; absent for Sous Chef session

- Proposal element: `usage.ts` tRPC router
  - Design decision: Decision 2 + Decision 3
  - Validation approach: Unit tests for `getOwned` at various counts; verify same count predicate as `enforceContentLimit`

- Proposal element: `/upgrade` stub route
  - Design decision: Decision 5
  - Validation approach: Test CTAs link to `/upgrade`; test stub renders without error

- Proposal element: Tier description copy
  - Design decision: Decision 6
  - Validation approach: Test `TIER_DESCRIPTIONS` has entry for all `EntitlementTier` values

- Proposal element: Account page usage section for all tiers
  - Design decision: Decision 7
  - Validation approach: Test renders for home-cook, sous-chef, executive-chef sessions; verify progress bars show correct counts

## Functional Requirements Mapping

- Requirement: Tier table renders all 5 tiers with correct limits
  - Design element: `TIER_LIMITS` in `tier-entitlements.ts`; pricing route renders from it
  - Acceptance criteria reference: specs/pricing-page.md — tier table
  - Testability notes: Render with null session; assert all tier names, recipe limits, cookbook limits visible

- Requirement: Current tier highlighted for logged-in users
  - Design element: `session.user.tier` from `useAuth()`; conditional highlight class on tier card
  - Acceptance criteria reference: specs/pricing-page.md — tier highlight
  - Testability notes: Mock `useAuth` with specific tier; assert that card's highlight class is present

- Requirement: Ad slots conditional on session/tier
  - Design element: `role="public-marketing"` + `AdSlot` placement; `isPageAdEligible` logic
  - Acceptance criteria reference: specs/pricing-page.md — ad slots
  - Testability notes: Assert `AdSlot` renders for null session and home-cook; does not render for sous-chef

- Requirement: `usage.getOwned` returns accurate counts
  - Design element: `usage.ts` tRPC router using shared count helper
  - Acceptance criteria reference: specs/usage-router.md
  - Testability notes: Seed DB with known counts; assert returned values; test `hiddenByTier` exclusion

- Requirement: Account page shows usage vs. limit for current tier
  - Design element: `useAuth` for tier; `trpc.usage.getOwned` for counts; `TIER_LIMITS` for limits
  - Acceptance criteria reference: specs/account-tier-section.md
  - Testability notes: Mock tRPC response; assert progress bar values match counts/limits

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: `/pricing` loads without server round-trip for tier data
  - Design element: Decision 1 — static from entitlements
  - Acceptance criteria reference: N/A (architectural constraint)
  - Testability notes: No tRPC calls in pricing route except session (already cached)

- Requirement category: reliability
  - Requirement: Tier unknown/null degrades gracefully to home-cook defaults
  - Design element: Null guard on `session.user.tier`; default to `'home-cook'`
  - Acceptance criteria reference: specs/pricing-page.md — edge cases
  - Testability notes: Render with `tier: undefined`; assert no crash, home-cook card highlighted or no highlight

- Requirement category: security
  - Requirement: `usage.getOwned` only returns counts for authenticated user
  - Design element: Protected tRPC procedure (requires session); queries by `ctx.user.id`
  - Acceptance criteria reference: specs/usage-router.md — auth
  - Testability notes: Assert unauthenticated call throws `UNAUTHORIZED`

## Risks / Trade-offs

- Risk/trade-off: Count logic drift between `enforceContentLimit` and `usage.getOwned`
  - Impact: Account page shows incorrect counts vs. enforcement reality
  - Mitigation: Decision 3 — shared helper; test both callers use same predicate

- Risk/trade-off: 5-column grid breaks on narrow viewports
  - Impact: Visual regression on mobile
  - Mitigation: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`); test at mobile breakpoint

- Risk/trade-off: `TIER_DESCRIPTIONS` copy is not reviewed by product/marketing
  - Impact: Placeholder copy ships to production
  - Mitigation: PR review; copy lives in `tier-entitlements.ts` so trivial to update post-ship

## Rollback / Mitigation

- Rollback trigger: `/pricing` or account tier section causes runtime errors in production; or usage counts wildly incorrect
- Rollback steps: Revert PR; no DB migration was applied; no schema change
- Data migration considerations: None — no new fields; `hiddenByTier` already exists from prior change
- Verification after rollback: `/pricing` 404s (route file removed); account page returns to stub state

## Operational Blocking Policy

- If CI checks fail: Diagnose failure; fix root cause; push fix; do not merge with failing CI
- If security checks fail: Remediate finding before merge; no exceptions for OWASP-class issues
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to repo owner after 48h
- Escalation path and timeout: If blocked >48h, notify user (dougis) directly

## Open Questions

No unresolved questions — all design decisions confirmed during exploration session prior to proposal.

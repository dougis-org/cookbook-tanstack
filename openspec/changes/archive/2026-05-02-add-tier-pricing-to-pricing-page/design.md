## Context

- **Relevant architecture:** Pricing page (`src/routes/pricing.tsx`) uses `TierCard` component with feature display via `tier-entitlements.ts` constants. Page is unauthenticated-accessible (marketing page).
- **Dependencies:**
  - `src/lib/tier-entitlements.ts` — source of truth for tier limits, display names, descriptions, and entitlement checks
  - `src/routes/pricing.tsx` — pricing page route component
  - `docs/user-tier-feature-sets.md` — product decision record for tier feature matrix
  - `@/hooks/useAuth` — authentication state hook used by pricing page
- **Interfaces/contracts touched:**
  - `canImport(tier)` function signature unchanged, behavior changes for `sous-chef` tier
  - `TIER_DESCRIPTIONS` record updated for `sous-chef` key
  - No API contracts or database schemas affected

## Goals / Non-Goals

### Goals

- Display pricing (annual/monthly) for each paid tier on pricing page
- Display ad status ("Ad Supported" / "No Ads") on each tier card
- Remove per-tier CTA buttons from cards
- Add single "Get Started for Free" CTA below tier grid for anonymous users only
- Restrict import capability to Executive Chef tier (functional change)

### Non-Goals

- Payment/subscription infrastructure changes
- Modifying feature limits or visibility rules beyond import restriction
- Adding dynamic pricing or promotional overrides
- Backend changes (no migrations needed, confirmed no existing Sous Chef users with import)

## Decisions

### Decision 1: Pricing data structure

- **Chosen:** Add `TIER_PRICING` constant record to `src/lib/tier-entitlements.ts`
- **Alternatives considered:** Separate `src/lib/pricing.ts` file; hardcoding in component
- **Rationale:** Pricing is 1:1 with tier entitlements and belongs near other tier constants. Having it in `tier-entitlements.ts` keeps all tier-related data co-located and reduces import complexity. The file already has the comment "Source of truth for all tier limit values" — pricing fits the same philosophy.
- **Trade-offs:** Pricing is technically product data separate from technical entitlements, but keeping it with entitlements simplifies the data model. If pricing changes frequently, consider extraction later.

### Decision 2: Pricing display format

- **Chosen:** Annual price primary (bold), monthly price secondary (muted), static "Save 2 months" badge for paid tiers
- **Alternatives considered:** Calculate savings amount dynamically ("Save $7.89"); monthly primary with annual secondary
- **Rationale:** Annual is the better deal and the issue explicitly says "Emphasize the annual pricing." Static badge avoids precision issues if pricing changes. Monthly as secondary gives users the option to think in monthly terms.
- **Trade-offs:** Static badge doesn't reflect actual calculated savings (e.g., 10 months vs 12). Acceptable per issue scope.

### Decision 3: Ad status display

- **Chosen:** "No Ads" for Prep Cook and above; "Ad Supported" for Home Cook; "Anonymous" tier not shown on pricing page (filtered in `TIER_ORDER.filter(t => t !== "anonymous")`)
- **Alternatives considered:** Icon-based (shield/checkmark); color-coded badge; "Shows ads" / "No ads" full text
- **Rationale:** Binary, clear. "No Ads" is positive framing for paid tiers. "Ad Supported" acknowledges the free tier without negative connotation. Simple text avoids icon asset dependencies.
- **Trade-offs:** If future tiers have partial ad models, this binary approach may need revision.

### Decision 4: CTA removal and single CTA

- **Chosen:** Remove all per-tier CTA buttons from `TierCard`. Add single "Get Started for Free" link below tier grid, visible only to `currentTier === "anonymous"`.
- **Alternatives considered:** Keep upgrade buttons for paid tiers only; single CTA visible to all users
- **Rationale:** Issue explicitly requests removing "the call to action buttons from each tier and put a single 'Get Started for Free' button below the tier information." Authenticated users see "Current plan" highlighted and no CTA (already the behavior).
- **Trade-offs:** Anonymous users have one clear action; authenticated users have no explicit next step (but see their current tier highlighted).

### Decision 5: `canImport` logic change

- **Chosen:** `canImport()` checks for `hasAtLeastTier(tier, 'executive-chef')` instead of `'sous-chef'`
- **Alternatives considered:** Leave `canImport` at Sous Chef but don't display import benefit on Sous Chef card
- **Rationale:** Issue says "Sous Chef no longer gets import" as a functional change to drive Executive Chef value. If it's functional, the entitlement check should reflect it. Simpler mental model: entitlements match what's displayed.
- **Trade-offs:** If business later wants to give import back to Sous Chef, this is a one-line change in one place.

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation |
|------------------|-----------------|------------|
| Add pricing display (annual primary, monthly secondary, "Save 2 months" badge) | TIER_PRICING in tier-entitlements.ts; card layout with pricing row | Unit test: TIER_PRICING values match requirements; E2E: prices render on pricing page |
| Ad status indicator on each tier card | showUserAds() → "Ad Supported"; !showUserAds() → "No Ads" | Unit test: ad status text matches tier; E2E: ad indicator visible on all cards |
| Remove per-tier CTA buttons | renderCTA() removed; single CTA below grid for anonymous only | E2E: no upgrade/downgrade buttons on cards; CTA appears only for anonymous |
| Single "Get Started for Free" CTA | Below tier grid, to="/auth/register", shown for isAnon=true | Playwright test: CTA visible when unauthenticated, hidden when logged in |
| Sous Chef import restriction | canImport() now requires executive-chef; TIER_DESCRIPTIONS.sous-chef updated | Unit test: canImport('sous-chef') returns false; E2E: Sous Chef card shows no import |

## Functional Requirements Mapping

| Requirement | Design Element | Acceptance Criteria | Testability Notes |
|-------------|---------------|-------------------|------------------|
| Display pricing per tier | TIER_PRICING constant | All 3 paid tiers show annual + monthly; Home Cook shows FREE | Component test with mock TIER_PRICING |
| "Save 2 months" badge on paid tiers | Badge in card pricing section | Badge visible on Prep Cook, Sous Chef, Exec Chef; absent on Home Cook | E2E or component test |
| Ad status shown | "Ad Supported" for home-cook; "No Ads" for others | Correct text per tier based on showUserAds() | Unit test for text content |
| Remove CTAs from cards | No renderCTA() call in card | No button/link in any tier card | E2E: no buttons in card elements |
| Single CTA for anonymous | "Get Started for Free" below grid, shown for isAnon | CTA visible when session is null; hidden when authenticated | Playwright as anonymous vs authenticated |
| Import requires Executive Chef | canImport() checks executive-chef | canImport('sous-chef') = false; canImport('exec-chef') = true | Unit test |

## Non-Functional Requirements Mapping

| Category | Requirement | Design Element | Acceptance Criteria | Testability Notes |
|----------|-------------|---------------|-------------------|------------------|
| Performance | No new network requests | Pricing data is static constant, no fetch | Page load unchanged | Lighthouse timing |
| Maintainability | Pricing data co-located with tier data | TIER_PRICING in tier-entitlements.ts | Single file to update for pricing changes | Code review |
| Accessibility | Pricing readable by screen readers | Semantic text, not icon-only | a11y audit on pricing page | axe-core integration |

## Risks / Trade-offs

- **Risk:** Pricing data in code becomes stale if pricing changes
  - **Impact:** Users see outdated pricing
  - **Mitigation:** Document that pricing must be updated in `tier-entitlements.ts` and `docs/user-tier-feature-sets.md` together
  - **Trade-off:** Static pricing in code is simple but requires code change for every pricing update

- **Risk:** "Save 2 months" is static text, not calculated
  - **Impact:** Badge doesn't reflect actual savings if pricing is adjusted
  - **Mitigation:** If precise savings needed, calculate dynamically from TIER_PRICING values
  - **Trade-off:** Static text is simpler; actual savings for all tiers is approximately 2 months anyway

- **Risk:** Removing import from Sous Chef without migration but with future users
  - **Impact:** Users who signed up when Sous Chef had import would lose the feature
  - **Mitigation:** No existing users; document that future enrollment at Sous Chef won't include import
  - **Trade-off:** Functional restriction without grandfather clause

## Rollback / Mitigation

- **Rollback trigger:** Pricing displays incorrectly in production OR import functionality is needed for Sous Chef users
- **Rollback steps:
  1. Revert changes to `src/lib/tier-entitlements.ts` (TIER_PRICING removal, canImport revert, TIER_DESCRIPTIONS revert)
  2. Revert `src/routes/pricing.tsx` to previous state (renderCTA() restored, pricing rows removed)
  3. Revert `docs/user-tier-feature-sets.md` import policy section
- **Data migration considerations:** N/A — no database changes
- **Verification after rollback:** Pricing page shows no pricing info; canImport('sous-chef') returns true; Sous Chef card shows "Import ✓"

## Operational Blocking Policy

- **If CI checks fail:** Do not merge; fix test failures or configuration issues before re-running
- **If security checks fail (e.g., Codacy, Snyk):** Address all Critical/High findings before merge; Medium/Low may proceed with justification
- **If required reviews are blocked/stale:** Ping author for re-review; after 48 hours of no response, proceed with best judgment or close change
- **Escalation path:** For blocking issues, raise in project channel with `@doug` mention

## Open Questions

- **Q:** Should "Save 2 months" badge show calculated savings amount (e.g., "Save $7.89")?
  - **A:** No — static "Save 2 months" is sufficient and avoids precision issues. Badge is about communicating the benefit, not exact math.

- **Q:** Is annual price always primary (bold/larger) with monthly as secondary?
  - **A:** Yes — annual is the emphasized price per issue requirements. Monthly shown in muted style below.
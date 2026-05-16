## Context

- **Relevant architecture:** `PageLayout` is the outer shell for all routes. It renders `AdSlot` at `top` and `bottom` positions. `AdSlot` is gated by `isPageAdEligible(role, session)` and the `import.meta.env.PROD` flag. `showUserAds(tier)` in `tier-entitlements.ts` returns true only for `anonymous` and `home-cook`.

- **Dependencies:**
  - `src/lib/ad-policy.ts` — `AD_ENABLED_ROLES`, `isPageAdEligible`
  - `src/lib/google-adsense.ts` — `GoogleAdSenseSlotPosition`, slot ID env vars
  - `src/lib/tier-entitlements.ts` — `showUserAds`, `TIER_PRICING`
  - `src/components/layout/PageLayout.tsx` — grid layout restructure
  - `src/components/ads/SponsorSlot.tsx` — new component (created by this change)
  - `design-system/ad-placement-mocks.html` — visual spec for `.up-*` class family
  - `design-system/funnel-mocks.html` — funnel context

- **Interfaces/contracts touched:**
  - `PageRole` type in `ad-policy.ts` — no change to the type itself, only to `AD_ENABLED_ROLES` array
  - `GoogleAdSenseSlotPosition` type in `google-adsense.ts` — gains `right-rail` value
  - `AdSlot` component props — gains `right-rail` position handling
  - `PageLayout` renders a CSS grid — changes the outer container structure

## Goals / Non-Goals

### Goals

- Render sponsored content (static upgrade card or real AdSense) on all pages home-cook and anonymous users use
- Paywalled users see no ad DOM at all — `isPageAdEligible` gates before any rendering decision
- Ad container class names verified safe against uBlock, AdGuard, Brave cosmetic filters
- First production deploy renders only static upgrade card until `VITE_ADSENSE_ENABLED=true`
- Right rail is consistent across list and detail pages, responsive (hidden on mobile, sticky on desktop)

### Non-Goals

- Changing `showUserAds` or tier entitlement logic
- Implementing real AdSense before explicit opt-in via env flag
- Adding a `authenticated-list` role (listing pages stay `public-content`)
- Modifying print-focused pages (`/cookbooks/:id/toc`, `/cookbooks/:id/print`)

## Decisions

### Decision 1: CSS Grid layout in `PageLayout` with responsive right rail

- **Chosen:** `PageLayout` uses `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start`. Main content column + right rail column. Right rail always in DOM; `AdSlot` with `right-rail` position controls its own visibility.
- **Alternatives considered:**
  - Extending `AdSlot` with `position="right"` only on specific routes — fragments the consistent pattern and requires per-route conditional logic
  - Creating a separate `DetailLayout` for recipe/cookbook detail pages — duplicates PageLayout shell and adds routing complexity
- **Rationale:** Grid layout is applied universally via the shared `PageLayout` shell. The `lg:` breakpoint means mobile/tablet (below 1024px) get single-column treatment with no rail. On desktop, rail is always present in DOM but `AdSlot` returns null for paid/ineligible users — no layout shift for them.
- **Trade-offs:** Any page using `PageLayout` gets the rail column in DOM even when it renders nothing. DOM overhead is a single `<aside>` element with minimal children.

### Decision 2: Two-layer gating — `isPageAdEligible` first, env flag second

- **Chosen:**
  ```
  isPageAdEligible(role, session)  → outer gate (returns null if false)
      ↓ (eligible === true)
  useRealAd = PROD && VITE_ADSENSE_ENABLED === 'true' && slotId
      ↓
  true  → <ins> real AdSense
  false → <SponsorSlot> static upgrade card
  ```
- **Alternatives considered:**
  - Env flag only — would render nothing (null) for dev/pre-launch instead of showing the static upgrade card, making the upgrade affordance untestable
  - `SponsorSlot` as a separate component called alongside `AdSlot` — two components in the same DOM position requires conditional composition that is harder to test
- **Rationale:** The two-layer approach means the upgrade card is always testable in dev and staging. `SponsorSlot` only renders when a user is definitely ad-eligible — no wasted upgrade text for paid users or wrong pages.
- **Trade-offs:** The `AdSlot` component must be aware of both gates and make two rendering decisions. This is testable but increases cyclomatic complexity of the component.

### Decision 3: `SponsorSlot` replaces `AdSlot` output entirely when flag is off

- **Chosen:** `SponsorSlot` is the fallback output of `AdSlot`, not a separate component in the tree. When `VITE_ADSENSE_ENABLED` is false or unset, `AdSlot` returns `<SponsorSlot tier={...} />` directly.
- **Alternatives considered:**
  - `AdSlot` returns null, `PageLayout` independently renders `SponsorSlot` in the same DOM position — duplication of position logic
  - `SponsorSlot` always renders as a sibling below `AdSlot` — wasted DOM when ad is real
- **Rationale:** Single source of truth for position in `PageLayout`. `AdSlot` encapsulates all rendering logic for the slot.
- **Trade-offs:** Requires `AdSlot` to import `TIER_PRICING` for price computation.

### Decision 4: `.up-*` class family with CSS `::before` "SPONSORED" eyebrow

- **Chosen:** Container uses `.up-card` with `::before` pseudo-element for the eyebrow label. Inner regions use `.up-media`, `.up-body`, `.up-cta`.
- **Alternatives considered:**
  - Real `<span class="eyebrow">SPONSORED</span>` inside `.up-card` — cleaner for a11y screen readers but adds a DOM element that could interact with page structure
  - `data-label="sponsored"` attribute — still requires a visible DOM element to display it
- **Rationale:** The `::before` approach is in the verified mock (`design-system/ad-placement-mocks.html`). It overlays the top border of the card (background matches `--theme-bg`), creating a clean label without additional DOM. The `position: absolute; top: -8px; left: 16px` technique ensures it sits on the border line.
- **Trade-offs:** Pseudo-element content is not accessible to screen readers — but the eyebrow is a visual label, not functional content. The `<ins>` element from AdSense is already decorated with `data-ad` attributes which are cosmetic-blocked anyway; the static card has no functional need for a screen-reader-accessible label.

### Decision 5: `right-rail` slot ID via dedicated env var `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`

- **Chosen:** Separate env var for the right rail slot ID, independent from `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` and `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`.
- **Alternatives considered:**
  - Reuse `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` for right rail — slot IDs are per-placement from Google; mixing them breaks reporting/optimization
  - Single `VITE_GOOGLE_ADSENSE_SLOTS` JSON object — more complex to parse and validate
- **Rationale:** Each Google AdSense slot has a distinct ID per ad unit. Separate env vars keep validation simple (`getValidatedGoogleAdSenseSlotId`) and match the existing pattern for top/bottom slots.
- **Trade-offs:** More env vars — but each is optional and validated to null if absent.

## Proposal to Design Mapping

| Proposal element | Design decision | Validation approach |
|---|---|---|
| Extend `AD_ENABLED_ROLES` with `authenticated-home`, `authenticated-task` | Decision 1 (grid layout) + `isPageAdEligible` gating | Unit test: `isPageAdEligible` returns true for these roles with home-cook user |
| Right rail on list and detail pages | Decision 1 (CSS grid) | Visual test: rail appears on `/home`, `/recipes`, `/recipes/:id` at `lg`+ breakpoints |
| SponsorSlot static card for pre-launch | Decision 2 + Decision 3 | Feature test: with `VITE_ADSENSE_ENABLED=false`, `SponsorSlot` renders |
| Real AdSense for production with flag | Decision 2 | E2E test: with `VITE_ADSENSE_ENABLED=true`, `<ins data-ad-slot=...>` renders |
| Adblock-safe `.up-*` class family | Decision 4 | Manual: verify card visible with uBlock Origin enabled |
| "Remove sponsors → Prep Cook · $X.XX/mo" CTA | Decision 4 (SponsorSlot) | Unit test: text matches `TIER_PRICING['prep-cook'].monthly` |
| Env-gated first deploy | Decision 2 | Dev test: local dev renders `SponsorSlot`, not `<ins>` |

## Functional Requirements Mapping

- **Requirement:** `AD_ENABLED_ROLES` extended to include `authenticated-home` and `authenticated-task`
  - Design element: `src/lib/ad-policy.ts` — array literal
  - Acceptance criteria reference: `isPageAdEligible('authenticated-home', session) === true` for home-cook
  - Testability notes: Direct unit test on `isPageAdEligible` with mock session

- **Requirement:** Ad slot hidden for any user where `showUserAds(tier) === false`
  - Design element: `isPageAdEligible` early return + `AdSlot` conditional render
  - Acceptance criteria reference: Prep Cook user on `/home` sees no ad slot DOM
  - Testability notes: Integration test with authenticated Prep Cook user on `/home`

- **Requirement:** Static upgrade card with "Remove sponsors → Prep Cook · $X.XX/mo" link
  - Design element: `SponsorSlot` component with `TIER_PRICING['prep-cook'].monthly`
  - Acceptance criteria reference: Card text matches pricing tier data
  - Testability notes: Snapshot test of `SponsorSlot` output, unit test on price derivation

- **Requirement:** FTC-label: "SPONSORED" eyebrow
  - Design element: CSS `::before` on `.up-card` per mock
  - Acceptance criteria reference: Eyebrow text visible in all four themes
  - Testability notes: Visual regression test or manual review across themes

- **Requirement:** Adblock-safe class names — `.up-*` family only
  - Design element: CSS class definitions in `SponsorSlot` component
  - Acceptance criteria reference: No `.ad-*`, `.sponsor-*`, `.promo-*`, `.banner-*` anywhere
  - Testability notes: Lint rule or grep check for blocked patterns; manual with uBlock

- **Requirement:** Right rail sticky on desktop, hidden on mobile
  - Design element: `PageLayout` grid with `sticky top-8` on rail aside
  - Acceptance criteria reference: Rail visible and sticky at `lg`+, gone below
  - Testability notes: Responsive visual test at 1024px and 768px breakpoints

## Non-Functional Requirements Mapping

- **Requirement category: performance**
  - Requirement: Right rail aside in DOM does not block page paint
  - Design element: Rail is `display: none` until `AdSlot` provides content; minimal DOM weight
  - Acceptance criteria reference: Lighthouse LCP unchanged after change
  - Testability notes: Before/after Lighthouse comparison

- **Requirement category: security**
  - Requirement: No blocked class families (`.ad-*`, etc.) in production HTML
  - Design element: `.up-*` only in `SponsorSlot`; no dynamic class construction
  - Acceptance criteria reference: Grep scan of production HTML output
  - Testability notes: Test that renders the correct classes; lint check in CI

- **Requirement category: operability**
  - Requirement: `VITE_ADSENSE_ENABLED` default false — safe first deploy
  - Design element: Env var check in `AdSlot`; no default `true`
  - Acceptance criteria reference: Fresh prod deploy with no flag set → `SponsorSlot` renders
  - Testability notes: Manual prod-like test

## Risks / Trade-offs

- **Risk:** `PageLayout` grid restructure breaks pages that rely on single-column max-width centering (e.g., recipe detail `max-w-4xl mx-auto` is inside `PageLayout` container — the grid is on the outer wrapper, not the content itself, so this is safe)
  - **Impact:** Medium — all authenticated pages use `PageLayout`
  - **Mitigation:** The grid is on the immediate container inside `<div class="min-h-screen bg-[var(--theme-bg)]">`, so max-width children remain centered within the content column. Test all authenticated routes.

- **Risk:** Real AdSense `<ins>` element carries `data-ad-slot`, `data-ad-client` attributes that may be filtered by aggressive adblock lists beyond cosmetic filters
  - **Impact:** High — real ads would be hidden while upgrade card might still show for some users
  - **Mitigation:** The upgrade card is the primary render in pre-launch state. Monitor post-enablement with real browser + common adblockers. If `adsbygoogle` class gets blocked (not currently in blocked list per mock), fallback to `SponsorSlot` via error boundary.

- **Risk:** `SponsorSlot` price hardcoded from `TIER_PRICING['prep-cook'].monthly` — if tier pricing changes, the card in prod showing old price while pricing page shows new price
  - **Impact:** Low — price is read at render time, not stored statically
  - **Mitigation:** No additional mitigation needed; this is how `TIER_PRICING` is designed.

## Rollback / Mitigation

- **Rollback trigger:** Ad slots render incorrectly (wrong classes, wrong position, visible on paid users) or `SponsorSlot` produces broken HTML
- **Rollback steps:**
  1. Set `VITE_ADSENSE_ENABLED=false` in production env — reverts to `SponsorSlot` (safe fallback)
  2. Revert `AD_ENABLED_ROLES` change in `src/lib/ad-policy.ts` to remove `authenticated-home` and `authenticated-task`
  3. Revert `PageLayout` grid restructure — restore single-column container
- **Data migration considerations:** None — this change is presentation-only, no data model changes
- **Verification after rollback:** Confirm `isPageAdEligible` returns false for authenticated pages; `SponsorSlot` does not render on any authenticated page for home-cook users

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Blocked until all checks pass. PR cannot be auto-merged with failing checks.
- **If security checks fail:** Critical/high severity issues must be fixed before merge. Medium/low may be noted and tracked separately.
- **If required reviews are blocked/stale:** PR cannot auto-merge until all comments resolved and reviews re-approved. Never bypass PR gates.
- **Escalation path and timeout:** If checks remain blocked for more than 48 hours, reassign to another team member. If security issues are found post-merge, file a hotfix immediately.

## Open Questions

- No open questions remain from the proposal stage. All decisions have been made and documented above.

---

*Design artifact created from proposal at `openspec/changes/render-sponsored-content-on-authed-pages/proposal.md`.*
*Next: create specs at `specs/ad-slot/spec.md` and `specs/sponsor-slot/spec.md` per the `sdd-with-feedback-loop` schema.*
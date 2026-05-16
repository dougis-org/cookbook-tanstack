# Ad Slot System — `ad-policy.ts` extension and `PageLayout` grid

## ADDED Requirements

### Requirement: ADDED `AD_ENABLED_ROLES` coverage for authenticated pages

The system SHALL render ad slots on authenticated pages for users eligible under `showUserAds(tier)`.

#### Scenario: Home Cook user on `/home` sees ad slot

- **Given** a user is authenticated with `home-cook` tier
- **When** the user navigates to `/home`
- **Then** `isPageAdEligible('authenticated-home', session)` returns `true`

#### Scenario: Home Cook user on recipe detail sees ad slot

- **Given** a user is authenticated with `home-cook` tier
- **When** the user navigates to `/recipes/{id}`
- **Then** `isPageAdEligible('authenticated-task', session)` returns `true`

#### Scenario: Prep Cook user on `/home` sees no ad slot

- **Given** a user is authenticated with `prep-cook` tier
- **When** the user navigates to `/home`
- **Then** `isPageAdEligible('authenticated-home', session)` returns `false`

#### Scenario: Admin user on any authenticated page sees no ad slot

- **Given** a user is authenticated with `isAdmin: true`
- **When** the user navigates to any authenticated page
- **Then** `isPageAdEligible` returns `false` for that user

#### Scenario: Anonymous user on `/recipes` sees ad slot

- **Given** no session exists (`session === null`)
- **When** `isPageAdEligible('public-content', null)` is called
- **Then** it returns `true` (anonymous users see ads)

### Requirement: ADDED `right-rail` slot position

The system SHALL support a `right-rail` `GoogleAdSenseSlotPosition` for sticky sidebar ad placement.

#### Scenario: Right rail slot ID validation

- **Given** `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is set to a non-numeric string
- **When** `getGoogleAdSenseSlotId('right-rail')` is called
- **Then** it returns `null` (rejected as invalid)

#### Scenario: Right rail slot ID valid

- **Given** `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is set to `"1234567890"`
- **When** `getGoogleAdSenseSlotId('right-rail')` is called
- **Then** it returns `"1234567890"`

### Requirement: ADDED `PageLayout` CSS grid layout with right rail

The system SHALL render a grid layout in `PageLayout` with a persistent right rail column at `lg` breakpoints and above.

#### Scenario: PageLayout renders two-column grid on desktop

- **Given** `PageLayout` is rendered with `role="authenticated-home"`
- **When** the viewport width is `lg` (1024px) or greater
- **Then** the container uses `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8`

#### Scenario: PageLayout renders single column on mobile

- **Given** `PageLayout` is rendered
- **When** the viewport width is below `lg`
- **Then** the container uses single-column layout with no right rail DOM element visible

#### Scenario: Right rail aside is always in DOM

- **Given** `PageLayout` is rendered
- **When** the page loads at any viewport width
- **Then** the `<aside>` element with right rail content is present in the DOM

## MODIFIED Requirements

### Requirement: MODIFIED `isPageAdEligible` coverage

The system SHALL return `false` for `authenticated-home` and `authenticated-task` roles when `AD_ENABLED_ROLES` did not previously include them.

#### Scenario: Existing behavior preserved for `public-marketing`

- **Given** a home-cook user on `/pricing`
- **When** `isPageAdEligible('public-marketing', session)` is called
- **Then** it returns `true` (unchanged behavior)

## Traceability

- Proposal: Extend `AD_ENABLED_ROLES` to include `authenticated-home` and `authenticated-task` → Requirement: ADDED `AD_ENABLED_ROLES` coverage for authenticated pages
- Design Decision 1: CSS Grid layout with responsive right rail → Requirement: ADDED `PageLayout` CSS grid layout with right rail
- Design Decision 5: `right-rail` slot ID via dedicated env var → Requirement: ADDED `right-rail` slot position
- Task: Extend `src/lib/ad-policy.ts` → Requirement: ADDED `AD_ENABLED_ROLES` coverage for authenticated pages
- Task: Add `right-rail` to `GoogleAdSenseSlotPosition` → Requirement: ADDED `right-rail` slot position
- Task: Restructure `PageLayout` grid → Requirement: ADDED `PageLayout` CSS grid layout with right rail

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No LCP regression from grid layout

- **Given** `PageLayout` is rendered with right rail at `lg`+ breakpoint
- **When** the page loads and Largest Contentful Paint is measured
- **Then** LCP is within 5% of the pre-change baseline

#### Scenario: Right rail aside does not block main content paint

- **Given** `PageLayout` renders on a mobile viewport
- **When** the viewport is below `lg` breakpoint
- **Then** the grid collapses to single column and main content paints without waiting for rail

### Requirement: Security

#### Scenario: No blocked class families in ad slot markup

- **Given** `SponsorSlot` renders on a home-cook user's page
- **When** the page HTML is inspected for class names
- **Then** no class matches patterns: `.ad-*`, `.sponsor-*`, `.sponsored-*`, `.promo-*`, `.banner-*`, `.adv-*`, `.adsbygoogle`
- **And** all ad container classes use only the `.up-*` prefix family

### Requirement: Operability

#### Scenario: `VITE_ADSENSE_ENABLED` defaults to off

- **Given** `VITE_ADSENSE_ENABLED` is unset in the deployment environment
- **When** `AdSlot` renders for an eligible user on an authenticated page
- **Then** `SponsorSlot` (static upgrade card) renders, not a real AdSense `<ins>`

#### Scenario: `VITE_ADSENSE_ENABLED=true` enables real ads

- **Given** `VITE_ADSENSE_ENABLED` is set to `"true"` in the deployment environment
- **When** `AdSlot` renders for an eligible user
- **Then** a real Google AdSense `<ins>` element renders with `data-ad-slot` pointing to the validated slot ID
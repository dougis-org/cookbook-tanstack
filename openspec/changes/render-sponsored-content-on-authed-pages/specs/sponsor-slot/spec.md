# SponsorSlot — Static Upgrade Affordance Card

## ADDED Requirements

### Requirement: ADDED `SponsorSlot` component with `.up-*` class family

The system SHALL render a static upgrade card component using only `.up-*` class names to remain invisible to adblock cosmetic filters.

#### Scenario: SponsorSlot renders with correct class structure

- **Given** `SponsorSlot` is rendered for a `home-cook` user
- **When** the component mounts
- **Then** it produces a container with class `.up-card`
- **And** inner regions have classes `.up-media`, `.up-body`, `.up-cta`

#### Scenario: SponsorSlot hides for paid users

- **Given** `SponsorSlot` is called with `tier="prep-cook"`
- **When** the component renders
- **Then** it returns `null` (paid users are gated before reaching `SponsorSlot`)

#### Scenario: SponsorSlot hides for admins

- **Given** `SponsorSlot` is called with `tier="admin"` or `isAdmin: true` session
- **When** the component renders
- **Then** it returns `null`

### Requirement: ADDED "SPONSORED" eyebrow via CSS `::before`

The system SHALL display a "SPONSORED" eyebrow label via CSS `::before` pseudo-element on `.up-card`, overlaid on the top border of the card.

#### Scenario: Eyebrow renders via CSS `::before`

- **Given** `SponsorSlot` renders
- **When** the component is mounted and the CSS is applied
- **Then** a "SPONSORED" label appears at `top: -8px; left: 16px` on the `.up-card` container, with `background: var(--theme-bg)` matching the page background

### Requirement: ADDED upgrade CTA with dynamic pricing

The system SHALL display an inline upgrade affordance linking to `/pricing` with price derived from `TIER_PRICING['prep-cook'].monthly`.

#### Scenario: Upgrade text shows correct monthly price

- **Given** `SponsorSlot` renders for a `home-cook` user
- **When** the component mounts
- **Then** the CTA text reads "Remove sponsors → Prep Cook · $2.99/mo" (or current `TIER_PRICING['prep-cook'].monthly` value)

#### Scenario: Upgrade link navigates to pricing

- **Given** `SponsorSlot` is rendered
- **When** the user clicks the upgrade CTA
- **Then** the router navigates to `/pricing`

### Requirement: ADDED responsive behavior

The system SHALL display the upgrade card correctly across all four themes and maintain the card layout at all viewport widths.

#### Scenario: SponsorSlot renders correctly in `dark` theme

- **Given** `SponsorSlot` is rendered with `html` element having class `dark`
- **When** the component mounts
- **Then** the card uses `var(--theme-surface)` background, `var(--theme-border)` border, `var(--theme-fg)` text

#### Scenario: SponsorSlot renders correctly in `light-cool` theme

- **Given** `SponsorSlot` is rendered with `html` element having class `light-cool`
- **When** the component mounts
- **Then** the card uses `light-cool` theme tokens for all colors

#### Scenario: SponsorSlot renders correctly in `light-warm` theme

- **Given** `SponsorSlot` is rendered with `html` element having class `light-warm`
- **When** the component mounts
- **Then** the card uses `light-warm` theme tokens for all colors

#### Scenario: SponsorSlot renders correctly in `dark-greens` theme

- **Given** `SponsorSlot` is rendered with `html` element having class `dark-greens`
- **When** the component mounts
- **Then** the card uses `dark-greens` theme tokens for all colors

### Requirement: ADDED `.up-media` placeholder visual

The system SHALL display a warm-gradient placeholder in the `.up-media` region representing a sponsored brand image.

#### Scenario: Media region uses warm gradient

- **Given** `SponsorSlot` renders
- **When** the component mounts
- **Then** the `.up-media` element has a `linear-gradient(135deg, #f59e0b, #b45309)` background (warm amber to amber-700), matching the mock from `design-system/ad-placement-mocks.html`)

## Traceability

- Proposal: Static upgrade card with `.up-*` class family, "Remove sponsors → Prep Cook · $X.XX/mo" CTA → Requirement: ADDED `SponsorSlot` component with `.up-*` class family, Requirement: ADDED upgrade CTA with dynamic pricing
- Design Decision 4: `.up-*` class family with CSS `::before` eyebrow → Requirement: ADDED "SPONSORED" eyebrow via CSS `::before`
- Design Decision 3: `SponsorSlot` replaces `AdSlot` output when flag is off → Requirement: ADDED `SponsorSlot` component with `.up-*` class family (hides for paid users)
- Task: Create `src/components/ads/SponsorSlot.tsx` → All requirements above
- Task: Apply theme token validation across all four themes → Requirement: ADDED responsive behavior (four themes)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: SponsorSlot contains no blocked class families

- **Given** `SponsorSlot` renders on any page
- **When** the output HTML is inspected
- **Then** no class attribute contains `ad-`, `sponsor-`, `promo-`, `banner-`, or `adv-`
- **And** all classes use only the `.up-*` prefix

#### Scenario: SponsorSlot renders in real browser with uBlock Origin enabled

- **Given** Chrome browser with uBlock Origin active
- **When** `SponsorSlot` renders on a home-cook user's `/home` page
- **Then** the `.up-card` element is visible and not hidden by any cosmetic filter rule

### Requirement: Performance

#### Scenario: SponsorSlot does not block page hydration

- **Given** `SponsorSlot` is rendered by `AdSlot` for an eligible user
- **When** the page hydrates on the client
- **Then** `SponsorSlot` adds no more than 1 additional network request and does not defer any critical path resource
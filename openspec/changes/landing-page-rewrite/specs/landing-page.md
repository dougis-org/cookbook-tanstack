## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Product Value Feature Links

The system SHALL render four distinct, verb-led cards representing key product workflows (Save, Organise, Import, Print) as active clickable links driving users to registration to maximize sign-up conversion.

#### Scenario: Verify features list structure and interactivity

- **Given** an anonymous visitor lands on the public homepage `/`
- **When** they scroll down to the "Features" section
- **Then** they SHALL see exactly four cards with verb titles: Save, Organise, Import, Print
- **And** each card SHALL use its custom brand-approved Lucide icon (Save, BookOpen, ArrowUpRight, Printer)
- **And** clicking any of the four cards SHALL navigate the user to `/auth/register`

---

### Requirement: ADDED Application Screenshot Slot

The system SHALL display an application preview container below the hero section featuring a custom `<image-slot id="landing-screenshot" placeholder="Add a screenshot of /recipes">` element.

#### Scenario: Verify presence of screenshot placeholder slot

- **Given** an anonymous visitor is on the public homepage `/`
- **When** they view the region directly below the hero section CTAs
- **Then** they SHALL see a premium card using a BookOpen icon with "Explore the Cooking Experience" title
- **And** it SHALL render an `<image-slot>` custom HTML tag with ID `landing-screenshot` and placeholder attribute `Add a screenshot of /recipes`

---

### Requirement: ADDED Pricing Teaser Indicator

The system SHALL render a pricing teaser line beneath the CTAs pointing to the subscription plans.

#### Scenario: Verify presence of plans teaser and link

- **Given** an anonymous visitor is on the public homepage `/`
- **When** they look below the main CTA buttons
- **Then** they SHALL see the text "Plans start at $2.99/mo."
- **And** a "View Plans" link next to it SHALL navigate to `/pricing`

---

## MODIFIED Requirements

### Requirement: MODIFIED Hero Copy and Brand Casing

The system SHALL render the brand name as "My CookBooks" using correct case-sensitive branding and appropriate typography settings (Fraunces 600, Soft 80, Wonk 1) and present an action-led sub-tagline.

#### Scenario: Verify hero brand casing and sub-tagline copy

- **Given** an anonymous visitor lands on the public homepage `/`
- **When** they view the hero banner
- **Then** they SHALL see the title "My CookBooks" utilizing the `brand-wordmark` styling
- **And** the sub-tagline SHALL read "Save every recipe. Build cookbooks. Cook from any device."

---

### Requirement: MODIFIED Landing Page CTA Target Paths

The system SHALL update the landing page primary and secondary call-to-actions (CTAs) to direct to registration and recipe browsing with Title Case styling.

#### Scenario: Verify CTA text and redirection links

- **Given** an anonymous visitor is on the public homepage `/`
- **When** they click the primary CTA "Start Free — No Credit Card"
- **Then** they SHALL be navigated to `/auth/register`
- **When** they return to `/` and click the secondary CTA "Browse Public Recipes"
- **Then** they SHALL be navigated to `/recipes`

---

## REMOVED Requirements

### Requirement: REMOVED Duplicate Browsing Feature Cards

Reason for removal: The original feature cards ("Recipe Collection", "Categories", "Search & Filter") were repetitive, described only browsing capabilities, and did not sell any premium features or paid value propositions.

---

## Traceability

- **Proposal element: Correct branding to "My CookBooks"**
  - **Design decision**: Decision 1 (incorporate `brand-wordmark` styling and weight 600)
  - **Requirement**: MODIFIED Hero Copy and Brand Casing
- **Proposal element: Conversion-driven CTAs and Pricing line**
  - **Design decision**: Decision 1 (Primary to `/auth/register`, Secondary to `/recipes`, pricing line to `/pricing`)
  - **Requirement**: MODIFIED Landing Page CTA Target Paths & ADDED Pricing Teaser Indicator
- **Proposal element: App screenshot preview element below hero**
  - **Design decision**: Decision 2 (ImageSlot card layout using BookOpen icon)
  - **Requirement**: ADDED Application Screenshot Slot
- **Proposal element: 4 verb-led features with live links**
  - **Design decision**: Decision 3 (Four-card features grid linking to `/auth/register`)
  - **Requirement**: ADDED Product Value Feature Links

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget on page load

- **Given** standard client network speed (3G/4G network throttling)
- **When** loading the public landing page `/`
- **Then** the page SHALL compile and render above-the-fold content within 300ms without blocking on heavy JavaScript computation.

### Requirement: Security / Adblocker Suppression

#### Scenario: No classnames matching adblock lists

- **Given** a visitor with an active adblocker (e.g. uBlock Origin) loaded with standard filter rules
- **When** the page renders the screenshot slot or CTAs
- **Then** no element SHALL have the class, ID, or custom attribute matching `.ad-*`, `.promo-*`, or `.sponsor-*` so that the entire layout renders completely without hidden regions.

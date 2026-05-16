---
name: tests
description: Test cases for F02 — Render sponsored content on free-tier authed pages
---

# Tests — F02: Render sponsored content on free-tier authed pages

## Overview

This document outlines the test cases for the F02 change. All work follows a strict TDD (Test-Driven Development) process: write failing tests first, then implement against them, then refactor. Each test case maps to a task in `tasks.md` and to an acceptance scenario in the relevant spec.

---

## Test Cases

### Task 1: Extend `AD_ENABLED_ROLES`

- [ ] **Test 1.1 — `authenticated-home` is in `AD_ENABLED_ROLES`**
  - **Given** `AD_ENABLED_ROLES` is evaluated
  - **When** the array is inspected
  - **Then** `'authenticated-home'` is present in the array

- [ ] **Test 1.2 — `authenticated-task` is in `AD_ENABLED_ROLES`**
  - **Given** `AD_ENABLED_ROLES` is evaluated
  - **When** the array is inspected
  - **Then** `'authenticated-task'` is present in the array

- [ ] **Test 1.3 — Home-cook on `/home` is ad eligible**
  - **Given** a session with `tier: 'home-cook'` and `isAdmin: false`
  - **When** `isPageAdEligible('authenticated-home', session)` is called
  - **Then** it returns `true`

- [ ] **Test 1.4 — Prep-cook on `/home` is not ad eligible**
  - **Given** a session with `tier: 'prep-cook'` and `isAdmin: false`
  - **When** `isPageAdEligible('authenticated-home', session)` is called
  - **Then** it returns `false`

- [ ] **Test 1.5 — Admin on any authenticated page is not ad eligible**
  - **Given** a session with `isAdmin: true`
  - **When** `isPageAdEligible('authenticated-task', session)` is called
  - **Then** it returns `false`

- [ ] **Test 1.6 — Anonymous on `/recipes` (public-content) is ad eligible**
  - **Given** `session === null`
  - **When** `isPageAdEligible('public-content', null)` is called
  - **Then** it returns `true` (anonymous sees ads on public-content)

---

### Task 2: Add `right-rail` to `GoogleAdSenseSlotPosition`

- [ ] **Test 2.1 — `right-rail` is a valid `GoogleAdSenseSlotPosition`**
  - **Given** `GoogleAdSenseSlotPosition` type is used
  - **When** a value of `'right-rail'` is assigned
  - **Then** TypeScript accepts it without error

- [ ] **Test 2.2 — `right-rail` slot ID returns null when env var absent**
  - **Given** `import.meta.env.VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is undefined
  - **When** `getGoogleAdSenseSlotId('right-rail')` is called
  - **Then** it returns `null`

- [ ] **Test 2.3 — `right-rail` slot ID returns validated ID when env var set**
  - **Given** `import.meta.env.VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is `"1234567890"`
  - **When** `getGoogleAdSenseSlotId('right-rail')` is called
  - **Then** it returns `"1234567890"`

- [ ] **Test 2.4 — `right-rail` slot ID rejects non-numeric env var**
  - **Given** `import.meta.env.VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is `"not-a-slot-id"`
  - **When** `getGoogleAdSenseSlotId('right-rail')` is called
  - **Then** it returns `null`

---

### Task 3: Restructure `PageLayout` CSS grid with right rail

- [ ] **Test 3.1 — PageLayout renders two-column grid at `lg`+ breakpoint**
  - **Given** `PageLayout` is rendered at viewport width 1024px
  - **When** the component mounts
  - **Then** the inner container has class `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start`

- [ ] **Test 3.2 — PageLayout renders single column below `lg` breakpoint**
  - **Given** `PageLayout` is rendered at viewport width 768px
  - **When** the component mounts
  - **Then** the inner container has class `grid grid-cols-1` (no `lg:grid-cols-[1fr_300px]`)

- [ ] **Test 3.3 — Right rail aside is present in DOM**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts
  - **Then** an `<aside>` element exists in the grid container

- [ ] **Test 3.4 — Right rail aside has `hidden lg:block` classes**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts
  - **Then** the aside element has class `hidden lg:block`

- [ ] **Test 3.5 — Right rail aside has `sticky top-8` classes**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts at `lg`+ viewport
  - **Then** the aside element has class `sticky top-8`

- [ ] **Test 3.6 — Main content column contains title block, top AdSlot, children, bottom AdSlot**
  - **Given** `PageLayout` is rendered with `title="Test Title"`
  - **When** the component mounts
  - **Then** the first grid column contains the title `h1`, top `AdSlot`, children, and bottom `AdSlot` in that order

---

### Task 4: Create `SponsorSlot` component

- [ ] **Test 4.1 — SponsorSlot renders with `.up-card` class on container**
  - **Given** `SponsorSlot` is rendered with a home-cook tier
  - **When** the component mounts
  - **Then** the outer container element has class `up-card`

- [ ] **Test 4.2 — SponsorSlot renders with `.up-media`, `.up-body`, `.up-cta` inner regions**
  - **Given** `SponsorSlot` is rendered
  - **When** the component mounts
  - **Then** the output contains elements with classes `up-media`, `up-body`, and `up-cta`

- [ ] **Test 4.3 — SponsorSlot renders "SPONSORED" via CSS `::before` on `.up-card`**
  - **Given** `SponsorSlot` renders a `.up-card` element
  - **When** the component mounts
  - **Then** the CSS `content` property of the `::before` pseudo-element on `.up-card` is `"Sponsored"`

- [ ] **Test 4.4 — SponsorSlot upgrade text contains "Remove sponsors"**
  - **Given** `SponsorSlot` is rendered
  - **When** the component mounts
  - **Then** the `.up-body` text contains "Remove sponsors"

- [ ] **Test 4.5 — SponsorSlot upgrade text contains "Prep Cook"**
  - **Given** `SponsorSlot` is rendered
  - **When** the component mounts
  - **Then** the `.up-body` text contains "Prep Cook"

- [ ] **Test 4.6 — SponsorSlot price matches `TIER_PRICING['prep-cook'].monthly`**
  - **Given** `TIER_PRICING['prep-cook'].monthly` is `$2.99`
  - **When** `SponsorSlot` is rendered
  - **Then** the upgrade CTA text contains "$2.99/mo"

- [ ] **Test 4.7 — SponsorSlot upgrade link navigates to `/pricing`**
  - **Given** `SponsorSlot` is rendered
  - **When** the upgrade link is clicked
  - **Then** the router navigates to `/pricing`

- [ ] **Test 4.8 — SponsorSlot renders `.up-media` with warm gradient background**
  - **Given** `SponsorSlot` is rendered
  - **When** the component mounts
  - **Then** the `.up-media` element has `background: linear-gradient(135deg, #f59e0b, #b45309)` (or equivalent CSS gradient from the mock)

- [ ] **Test 4.9 — SponsorSlot returns null for `prep-cook` tier**
  - **Given** `SponsorSlot` is called with `tier="prep-cook"`
  - **When** the component renders
  - **Then** it returns `null`

- [ ] **Test 4.10 — SponsorSlot returns null for `sous-chef` tier**
  - **Given** `SponsorSlot` is called with `tier="sous-chef"`
  - **When** the component renders
  - **Then** it returns `null`

- [ ] **Test 4.11 — SponsorSlot renders for `home-cook` tier**
  - **Given** `SponsorSlot` is called with `tier="home-cook"`
  - **When** the component renders
  - **Then** it returns a non-null React element with `.up-card`

- [ ] **Test 4.12 — SponsorSlot renders for `anonymous` tier**
  - **Given** `SponsorSlot` is called with `tier="anonymous"`
  - **When** the component renders
  - **Then** it returns a non-null React element with `.up-card`

- [ ] **Test 4.13 — SponsorSlot uses theme tokens for all colors**
  - **Given** `SponsorSlot` renders in `dark` theme
  - **When** the component mounts
  - **Then** the card background uses `var(--theme-surface)`, border uses `var(--theme-border)`, text uses `var(--theme-fg)`

- [ ] **Test 4.14 — SponsorSlot contains no blocked class patterns**
  - **Given** `SponsorSlot` renders
  - **When** the output HTML is inspected for class attributes
  - **Then** no class contains `ad-`, `sponsor-`, `sponsored-`, `promo-`, `banner-`, `adv-`, or `adsbygoogle`
  - **And** all classes use the `.up-*` prefix family

---

### Task 5: Wire `VITE_ADSENSE_ENABLED` into `AdSlot`

- [ ] **Test 5.1 — In dev mode, `SponsorSlot` renders for eligible user**
  - **Given** `import.meta.env.PROD` is `false` and user is home-cook on `/home`
  - **When** `AdSlot` renders with `role="authenticated-home"` and `position="right-rail"`
  - **Then** `SponsorSlot` output is present in the DOM

- [ ] **Test 5.2 — In PROD with flag off, `SponsorSlot` renders for eligible user**
  - **Given** `import.meta.env.PROD` is `true` and `VITE_ADSENSE_ENABLED` is not `"true"` and user is home-cook
  - **When** `AdSlot` renders
  - **Then** `SponsorSlot` output is present in the DOM (not `<ins>`)

- [ ] **Test 5.3 — In PROD with flag on and valid slot ID, real `<ins>` renders**
  - **Given** `import.meta.env.PROD` is `true`, `VITE_ADSENSE_ENABLED` is `"true"`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` is `"1234567890"`, and user is home-cook
  - **When** `AdSlot` renders with `position="right-rail"`
  - **Then** an `<ins class="adsbygoogle">` element with `data-ad-slot="1234567890"` is present

- [ ] **Test 5.4 — Prep-cook user sees no ad slot output regardless of flag**
  - **Given** user has `prep-cook` tier
  - **When** `AdSlot` renders with any position
  - **Then** neither `SponsorSlot` nor `<ins>` renders (null return)

- [ ] **Test 5.5 — Admin sees no ad slot output regardless of flag**
  - **Given** user has `isAdmin: true`
  - **When** `AdSlot` renders with any position
  - **Then** neither `SponsorSlot` nor `<ins>` renders (null return)

- [ ] **Test 5.6 — Ineligible role returns null even with flag on**
  - **Given** `import.meta.env.PROD` is `true`, `VITE_ADSENSE_ENABLED` is `"true"`, but role is `account` (not in `AD_ENABLED_ROLES`)
  - **When** `AdSlot` renders with `role="account"`
  - **Then** `AdSlot` returns null

---

### Task 6: Update `PageLayout` tests

- [ ] **Test 6.1 — PageLayout exports `AdSlot` for testing**
  - **Given** `PageLayout` is imported
  - **When** the module is evaluated
  - **Then** `AdSlot` is available as a named export alongside the default export

- [ ] **Test 6.2 — PageLayout renders `AdSlot` at `top` position**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts
  - **Then** `AdSlot` is rendered with `position="top"` in the main column

- [ ] **Test 6.3 — PageLayout renders `AdSlot` at `bottom` position**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts
  - **Then** `AdSlot` is rendered with `position="bottom"` in the main column

- [ ] **Test 6.4 — PageLayout renders `AdSlot` at `right-rail` position in aside**
  - **Given** `PageLayout` is rendered
  - **When** the component mounts
  - **Then** `AdSlot` is rendered with `position="right-rail"` inside the `<aside>` element

- [ ] **Test 6.5 — PageLayout passes correct `role` prop to all AdSlot instances**
  - **Given** `PageLayout` is rendered with `role="authenticated-home"`
  - **When** the component mounts
  - **Then** all three `AdSlot` instances receive `role="authenticated-home"`

---

## TDD Workflow

1. **Write failing test** — For each test case above, write the test file and confirm it fails before writing any implementation code.
2. **Write code to pass** — Implement the minimum code required to make the test pass.
3. **Refactor** — Improve code quality while ensuring tests continue to pass.

All tests must pass before the PR can be merged. Running the full test suite: `npm run test`

---

## Traceability

| Test | Task | Spec scenario |
|------|------|---------------|
| 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | Task 1 | `specs/ad-slot/spec.md` — ADDED `AD_ENABLED_ROLES` coverage |
| 2.1, 2.2, 2.3, 2.4 | Task 2 | `specs/ad-slot/spec.md` — ADDED `right-rail` slot position |
| 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | Task 3 | `specs/ad-slot/spec.md` — ADDED `PageLayout` CSS grid layout |
| 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14 | Task 4 | `specs/sponsor-slot/spec.md` — all ADDED requirements |
| 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 | Task 5 | `specs/ad-slot/spec.md` — Non-Functional Operability scenarios |
| 6.1, 6.2, 6.3, 6.4, 6.5 | Task 6 | `specs/ad-slot/spec.md` — PageLayout grid + right rail |
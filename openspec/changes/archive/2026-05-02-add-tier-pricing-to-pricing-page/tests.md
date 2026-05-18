---
name: tests
description: Tests for the add-tier-pricing-to-pricing-page change
---

# Tests

## Overview

This document outlines the tests for the `add-tier-pricing-to-pricing-page` change. All work follows a strict TDD (Test-Driven Development) process.

The change requires updating tests in two places:
1. `src/routes/__tests__/-pricing.test.tsx` — update existing tests and add new ones
2. Unit tests for `canImport()` in the entitlements test suite (to be discovered/created)

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test** — Write the simplest possible code to make the test pass.
3. **Refactor** — Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Update `src/lib/tier-entitlements.ts`

- [ ] **Test: TIER_PRICING structure exists and has correct values**
  - `TIER_PRICING['home-cook']` has `{ annual: null, monthly: null }`
  - `TIER_PRICING['prep-cook']` has `{ annual: 27.99, monthly: 2.99 }`
  - `TIER_PRICING['sous-chef']` has `{ annual: 59.99, monthly: 5.99 }`
  - `TIER_PRICING['executive-chef']` has `{ annual: 99.99, monthly: 9.99 }`

- [ ] **Test: canImport('sous-chef') returns false**
  - Create test file `src/lib/__tests__/tier-entitlements.test.ts` if not exists
  - Test that `canImport('sous-chef')` returns `false`
  - Test that `canImport('executive-chef')` returns `true`

- [ ] **Test: TIER_DESCRIPTIONS.sous-chef does not mention import**
  - `TIER_DESCRIPTIONS['sous-chef']` does not contain the word "import"

### Task 2: Update `docs/user-tier-feature-sets.md`

- [ ] **Document-level validation** — No test needed; manually verify Import Policy section states Executive Chef only

### Task 3: Update `src/routes/pricing.tsx`

- [ ] **Test: Home Cook card shows "FREE" pricing**
  - Render pricing page as anonymous
  - Home Cook card displays "FREE" (not a dollar amount)

- [ ] **Test: Paid tier cards show annual price**
  - Render pricing page as anonymous
  - Prep Cook card contains "$27.99/year"
  - Sous Chef card contains "$59.99/year"
  - Executive Chef card contains "$99.99/year"

- [ ] **Test: Paid tier cards show monthly price**
  - Render pricing page as anonymous
  - Prep Cook card contains "$2.99/month"
  - Sous Chef card contains "$5.99/month"
  - Executive Chef card contains "$9.99/month"

- [ ] **Test: Paid tier cards show "Save 2 months" badge**
  - Render pricing page as anonymous
  - Prep Cook card contains "Save 2 months"
  - Sous Chef card contains "Save 2 months"
  - Executive Chef card contains "Save 2 months"
  - Home Cook card does NOT contain "Save 2 months"

- [ ] **Test: Home Cook card shows "Ad Supported"**
  - Render pricing page as anonymous
  - Home Cook card contains "Ad Supported"

- [ ] **Test: Paid tier cards show "No Ads"**
  - Render pricing page as anonymous
  - Prep Cook card contains "No Ads"
  - Sous Chef card contains "No Ads"
  - Executive Chef card contains "No Ads"

- [ ] **Test: No CTA buttons on any tier card**
  - Render pricing page as anonymous
  - No tier card contains an `<a>` element
  - No tier card contains a `<button>` element

- [ ] **Test: No "Get started free" link on any tier card**
  - Render pricing page as anonymous
  - No tier card contains text "Get started free"

- [ ] **Test: Single "Get Started for Free" CTA below grid for anonymous**
  - Render pricing page as anonymous
  - Page contains exactly one link with text "Get Started for Free"
  - That link points to "/auth/register"
  - It is located below the tier grid (after all 4 tier cards)

- [ ] **Test: No "Get Started for Free" CTA when authenticated**
  - Render pricing page as authenticated home-cook user
  - No link with text "Get Started for Free" exists on the page

- [ ] **Test: Sous Chef card does not show import capability**
  - Render pricing page as anonymous
  - Sous Chef card does not contain "Import"
  - Sous Chef card does not contain "import"

- [ ] **Test: Executive Chef card shows import capability**
  - Render pricing page as anonymous
  - Executive Chef card contains "Import ✓" or "Import" text

## Traceability

| Task | Test Case(s) | Acceptance Scenario |
|------|--------------|---------------------|
| TIER_PRICING constant | TIER_PRICING structure exists | Tier Pricing Display scenario |
| canImport() update | canImport('sous-chef') returns false | Import Entitlement Boundary scenario |
| TIER_DESCRIPTIONS.sous-chef | No "import" in description | Import Entitlement Boundary scenario |
| Pricing display | Annual/monthly prices, "Save 2 months" | Tier Pricing Display scenarios |
| Ad status display | "Ad Supported" / "No Ads" | Ad Status Display scenarios |
| Remove per-tier CTAs | No CTA on any card | Per-Tier CTA Removal scenario |
| Single CTA for anonymous | "Get Started for Free" below grid | Per-Tier CTA Removal scenario |
| Import display on cards | Sous Chef no import, Exec Chef has import | Import Entitlement Boundary scenario |

## Notes on Existing Tests

The existing file `src/routes/__tests__/-pricing.test.tsx` has extensive tests for CTA behavior (Upgrade/Downgrade/Downgrade links per tier). These tests will need to be **removed or updated** to reflect the new behavior:

**Tests to REMOVE (CTA behavior being removed):**
- All tests in `describe('CTAs')` → `describe('no CTA on current tier card')`
- All tests in `describe('CTAs')` → `describe('upgrade CTA (tiers above current)')`
- All tests in `describe('CTAs')` → `describe('downgrade CTA (tiers below current)')`
- All tests in `describe('CTAs')` → `describe('anonymous visitor')` except tests about links to /auth/register

**Tests to MODIFY:**
- Anonymous visitor tests will change since per-tier "Get started free" links are removed

**New tests to ADD:**
- Pricing display tests (annual, monthly, "Save 2 months")
- Ad status tests ("Ad Supported" / "No Ads")
- Single CTA below grid tests
- No import on Sous Chef card tests
---
name: tests
description: Tests for the fix-pricing-tier-cta change
---

# Tests

## Overview

Test cases for the `fix-pricing-tier-cta` change. All work follows strict TDD: write a failing test first, implement the simplest code to make it pass, then refactor.

All tests live in `src/routes/__tests__/-pricing.test.tsx`. The test file already exists and must be updated (not replaced) to reflect the new behavior.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — add the test case to `-pricing.test.tsx`, run `npx vitest run src/routes/__tests__/-pricing.test.tsx`, and confirm it fails.
2. **Write code to pass the test** — implement the change in `src/routes/pricing.tsx` or `src/routes/change-tier.tsx`.
3. **Refactor** — clean up without breaking the test.

## Test Cases

### rename-route

- [ ] No `<a href="/upgrade">` links appear anywhere on the rendered pricing page for any session state
- [ ] All Upgrade CTA links have `href="/change-tier"`
- [ ] All Downgrade CTA links have `href="/change-tier"`

Spec reference: `specs/route-rename.md`

---

### remove-anonymous-card

- [ ] `screen.queryByTestId('tier-card-anonymous')` returns null when unauthenticated
- [ ] `screen.queryByTestId('tier-card-anonymous')` returns null when authenticated with any tier
- [ ] Exactly 4 tier cards are present in the DOM for any session state (`home-cook`, `prep-cook`, `sous-chef`, `executive-chef`)
- [ ] Update "renders all 5 tier names" → assert 4 names; `Anonymous` is not in the document
- [ ] Update "renders non-empty tier descriptions" → expects 4 description elements, not 5

Spec reference: `specs/anonymous-card.md`

---

### fix-cta-logic

**Current tier — no CTA:**

- [ ] When session tier is `home-cook`, the `tier-card-home-cook` element contains no `<a>` element
- [ ] When session tier is `prep-cook`, the `tier-card-prep-cook` element contains no `<a>` element
- [ ] When session tier is `sous-chef`, the `tier-card-sous-chef` element contains no `<a>` element
- [ ] When session tier is `executive-chef`, `tier-card-executive-chef` shows "Maximum plan" text and contains no `<a>` element

**Upgrade CTA (tiers above current):**

- [ ] When session tier is `home-cook`, `tier-card-prep-cook` contains a link with text "Upgrade" and `href="/change-tier"`
- [ ] When session tier is `home-cook`, `tier-card-sous-chef` contains a link with text "Upgrade" and `href="/change-tier"`
- [ ] When session tier is `home-cook`, `tier-card-executive-chef` shows "Maximum plan" (not "Upgrade" link)
- [ ] When session tier is `prep-cook`, `tier-card-sous-chef` and `tier-card-executive-chef` show "Upgrade" (exec → "Maximum plan")

**Downgrade CTA (tiers below current):**

- [ ] When session tier is `sous-chef`, `tier-card-home-cook` contains a link with text "Downgrade" and `href="/change-tier"`
- [ ] When session tier is `sous-chef`, `tier-card-prep-cook` contains a link with text "Downgrade" and `href="/change-tier"`
- [ ] When session tier is `executive-chef`, `tier-card-home-cook`, `tier-card-prep-cook`, and `tier-card-sous-chef` each contain a "Downgrade" link to `/change-tier`
- [ ] When session tier is `home-cook`, no "Downgrade" link appears anywhere on the page

**Anonymous visitor (no session):**

- [ ] All 4 visible tier cards contain a "Get started free" link to `/auth/register`
- [ ] `tier-card-executive-chef` shows "Maximum plan" text with no `<a>` element (executive-chef is top tier; "Get started free" does not apply)

Spec reference: `specs/cta-logic.md`

---

### update-tests (test cleanup)

- [ ] Remove the "highlights anonymous card for anonymous session" test
- [ ] Remove the anonymous-related assertion from "highlights home-cook card for authenticated user with missing tier"
- [ ] Confirm `npm run test` passes with zero failures after all changes

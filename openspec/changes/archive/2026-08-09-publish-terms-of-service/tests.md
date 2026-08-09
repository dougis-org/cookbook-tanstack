---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `publish-terms-of-service` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `src/routes/__tests__/-terms.test.tsx` (new file, mirrors `-privacy-policy.test.tsx`)

Maps to task: "Add `src/routes/terms.tsx`" (tasks.md, Execution)
Maps to spec scenarios in `specs/terms-of-service-page/spec.md`:

- [ ] Test: renders without an authenticated session
      → Scenario: "Unauthenticated visitor loads the page" (Requirement: Terms of Service route resolves)
      → `mockUseAuth.mockReturnValue({ session: null })`; render `TermsPage`; assert `screen.getByText('Your Account')` is present
- [ ] Test: renders all eight expected section headings
      → Scenario: "Sections render collapsed or expanded independently" (Requirement: Content is organized into collapsible sections)
      → Assert `screen.getByText(...)` for each of: "Your Account", "Your Content", "Acceptable Use", "Billing & Subscriptions", "Third-Party Connections", "Termination", "Disclaimers", "Changes to These Terms"
- [ ] Test: states that paid tiers are billed through Stripe and renew automatically
      → Scenario: "Billing section names the payment processor and renewal behavior" (Requirement: Terms content covers required topics)
      → Assert `screen.getByText(/Stripe/)` and `screen.getByText(/renew/i)` are present within the Billing & Subscriptions section content
- [ ] Test: states user retains content ownership and grants a limited license
      → Scenario: "Content section states ownership and license scope" (Requirement: Terms content covers required topics)
      → Assert `screen.getByText(/yours/i)` (or equivalent ownership phrasing) and `screen.getByText(/license/i)` are present within the Your Content section content
- [ ] Test: Third-Party Connections section links to `/privacy-policy` and does not restate the OAuth scope name
      → Scenario: "Third-party section cross-references the privacy policy instead of duplicating it" (Requirement: Terms content covers required topics)
      → Assert `screen.getByRole('link', { name: /Privacy Policy/i })` exists with `href`/route `to="/privacy-policy"`; assert the literal string `read:own-content` does NOT appear anywhere in the rendered Terms page output (`expect(screen.queryByText(/read:own-content/)).not.toBeInTheDocument()`)
- [ ] Test: does not name a governing law, jurisdiction, or arbitration process
      → Scenario: "Third-party section cross-references..." (same requirement, Non-Goals boundary check)
      → Assert `screen.queryByText(/governing law|jurisdiction|arbitration/i)` is not in the document

### `src/components/auth/__tests__/RegisterForm.test.tsx` (existing file, update)

Maps to task: "Update `src/components/auth/RegisterForm.tsx`" (tasks.md, Execution)
Maps to spec scenario: "Registration link resolves" (Requirement: Terms of Service route resolves)

- [ ] Update existing test `"renders legal consent links pointing to /terms and /privacy-policy"` (line ~179) — assertion `expect(termsLink).toHaveAttribute("href", "/terms")` continues to pass unchanged (TanStack Router's `<Link>` still renders an `href`), no test logic change required here
- [ ] Rename/replace existing test `"renders the Privacy Policy link as a router Link, not a raw anchor"` (line ~192) with a combined test `"renders both legal consent links as router Links, not raw anchors"`:
      - Assert `privacyLink.tagName === "A"` and `privacyLink` has `data-router-link="true"` (unchanged from current test)
      - Assert `termsLink.tagName === "A"` and `termsLink` has `data-router-link="true"` (new assertion — this is the test that will fail before the `RegisterForm.tsx` change and pass after)

### Manual / non-automated verification

Maps to task: "Manual visual QA" and "Manual click-through" (tasks.md, Validation)

- [ ] Manual: toggle all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) on `/terms` in a running dev server; confirm legibility (Requirement: Terms page follows the design system — no automated test, per project convention that theme-legibility QA is manual)
- [ ] Manual: from `/register` in a running dev server, click "Terms" and confirm the URL changes to `/terms` without a full page reload (browser network tab shows no full document request)

## Traceability Summary

| Test | Task | Spec Scenario |
|---|---|---|
| `-terms.test.tsx`: renders without session | Add `src/routes/terms.tsx` | Unauthenticated visitor loads the page |
| `-terms.test.tsx`: eight section headings | Add `src/routes/terms.tsx` | Sections render collapsed or expanded independently |
| `-terms.test.tsx`: Stripe/renewal | Add `src/routes/terms.tsx` | Billing section names payment processor and renewal behavior |
| `-terms.test.tsx`: ownership/license | Add `src/routes/terms.tsx` | Content section states ownership and license scope |
| `-terms.test.tsx`: cross-link, no scope restated | Add `src/routes/terms.tsx` | Third-party section cross-references privacy policy |
| `-terms.test.tsx`: no governing-law language | Add `src/routes/terms.tsx` | Third-party section cross-references privacy policy (Non-Goals boundary) |
| `RegisterForm.test.tsx`: both links are router Links | Update `RegisterForm.tsx` | Registration link resolves |
| Manual: theme QA | (Validation) | Terms page follows the design system |
| Manual: client-side nav | (Validation) | Registration link resolves |

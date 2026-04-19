---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `revamp-home-page-experience` change. All implementation work should
follow a strict TDD process: write the failing test, make it pass with the smallest implementation, then refactor
while keeping the test green.

The tests should prioritize stable behavior over exact visual copy or layout so `/` and `/home` can be redesigned
as capabilities grow.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the relevant
   requirement. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Public root route keeps anonymous visitors on `/`.
  - Task mapping: `/` route behavior tests.
  - Spec mapping: `home-page-experience` -> ADDED Public Landing Route Redirect -> Anonymous root navigation.
  - Suggested level: route/component test, with E2E smoke if route redirect behavior is not easily unit-testable.

- [ ] Public root route redirects authenticated users to `/home`.
  - Task mapping: `/` route behavior tests and implementation.
  - Spec mapping: `home-page-experience` -> ADDED Public Landing Route Redirect -> Authenticated root navigation.
  - Suggested level: route test with authenticated router context.

- [ ] Anonymous public landing page does not render protected creation/import CTAs.
  - Task mapping: public landing tests and implementation.
  - Spec mapping: `home-page-experience` -> MODIFIED Public Landing Content -> Anonymous landing page avoids
    protected actions.
  - Suggested level: component test checking absence of `Create Recipe`, `New Recipe`, and `Import Recipe`.

- [ ] Anonymous public landing page includes a public browsing path.
  - Task mapping: public landing tests and implementation.
  - Spec mapping: `home-page-experience` -> MODIFIED Public Landing Content -> Anonymous landing page avoids
    protected actions.
  - Suggested level: component test checking at least one browse link to public recipes, cookbooks, or categories.

- [ ] Public landing page does not market implementation technology.
  - Task mapping: public landing tests and implementation.
  - Spec mapping: `home-page-experience` -> MODIFIED Public Landing Content -> Landing page avoids
    technology-stack positioning.
  - Suggested level: component test asserting user-facing page copy excludes known technology-stack phrasing
    from the previous page.

- [ ] `/home` redirects anonymous visitors through the auth guard.
  - Task mapping: `/home` tests and route implementation.
  - Spec mapping: `home-page-experience` -> ADDED Authenticated Home Route -> Anonymous user is redirected
    away from home workspace.
  - Suggested level: route guard test or E2E auth redirect test.

- [ ] `/home` renders authenticated workflow shortcuts.
  - Task mapping: `/home` tests and implementation.
  - Spec mapping: `home-page-experience` -> ADDED Authenticated Home Route -> Authenticated user views home
    workspace.
  - Suggested level: component/route test with authenticated session.

- [ ] `/home` renders global discovery entry points.
  - Task mapping: `/home` tests and implementation.
  - Spec mapping: `home-page-experience` -> ADDED Authenticated Home Route -> Authenticated user views home
    workspace.
  - Suggested level: component/route test checking links or sections for recipes, cookbooks, or categories.

- [ ] Anonymous public browsing continues to work without login.
  - Task mapping: public browsing regression tests.
  - Spec mapping: `home-page-experience` -> MODIFIED Public Browsing Access -> Anonymous visitor can browse
    public content.
  - Suggested level: existing route/component coverage or E2E smoke for `/recipes` and `/cookbooks`.

- [ ] Anonymous public browsing surfaces hide protected creation/import/edit affordances.
  - Task mapping: public browsing regression tests.
  - Spec mapping: `home-page-experience` -> MODIFIED Public Browsing Access -> Anonymous visitor cannot start
    protected creation workflow.
  - Suggested level: component tests for header/sidebar and affected browse pages.

- [ ] Ad eligibility returns true for anonymous viewers on ad-enabled page roles.
  - Task mapping: ad eligibility tests and implementation.
  - Spec mapping: `ad-display-policy` -> ADDED Central Ad Eligibility Policy -> Anonymous visitor sees ads on
    ad-enabled public page.
  - Suggested level: pure unit test.

- [ ] Ad eligibility returns true for non-admin `home-cook` users on ad-enabled page roles.
  - Task mapping: ad eligibility tests and implementation.
  - Spec mapping: `ad-display-policy` -> ADDED Central Ad Eligibility Policy -> Free logged-in user sees ads
    on ad-enabled page.
  - Suggested level: pure unit test.

- [ ] Ad eligibility returns false for paid tiers.
  - Task mapping: ad eligibility tests and implementation.
  - Spec mapping: `ad-display-policy` -> ADDED Central Ad Eligibility Policy -> Paid logged-in user does not
    see ads.
  - Suggested level: table-driven unit test for `prep-cook`, `sous-chef`, and `executive-chef`.

- [ ] Ad eligibility returns false for admin users.
  - Task mapping: ad eligibility tests and implementation.
  - Spec mapping: `ad-display-policy` -> ADDED Central Ad Eligibility Policy -> Admin user does not see ads.
  - Suggested level: pure unit test.

- [ ] Ad eligibility returns false for non-ad page roles.
  - Task mapping: page role/ad policy tests and implementation.
  - Spec mapping: `ad-display-policy` -> MODIFIED Page Layout Policy -> Protected task page suppresses ads.
  - Suggested level: table-driven unit test for auth, task, admin/account/profile, and print roles.

- [ ] Ad slot rendering uses shared policy rather than route-local business rules.
  - Task mapping: provider-neutral ad slot groundwork.
  - Spec mapping: `ad-display-policy` -> ADDED Provider-Neutral Ad Slots and REMOVED Route-Local Ad
    Conditionals.
  - Suggested level: layout/component test using policy output to show/hide a named slot or placeholder.

- [ ] Missing or unknown non-admin tier is treated as `home-cook` for ad eligibility.
  - Task mapping: ad eligibility tests and implementation.
  - Spec mapping: `ad-display-policy` -> Reliability -> Missing or unknown tier is handled predictably.
  - Suggested level: pure unit test.

## Validation Commands

- [ ] Run focused tests first, such as `npx vitest run <changed-test-files>`.
- [ ] Run full unit/integration suite with `npm run test`.
- [ ] Run type checks with `npx tsc --noEmit`.
- [ ] Run build with `npm run build`.
- [ ] Run E2E suite with `npm run test:e2e` when route behavior or public navigation changes are implemented.

## Regression Guardrails

- [ ] Tests avoid exact layout snapshots for `/` and `/home`.
- [ ] Tests assert route behavior, allowed/forbidden CTAs, ad policy outputs, and key navigation paths.
- [ ] Tests preserve anonymous public browsing while protecting add/import/edit workflows.

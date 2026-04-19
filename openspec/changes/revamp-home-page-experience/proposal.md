## GitHub Issues

- #346
- #359

## Why

- Problem statement: The current `/` page presents CookBook partly as a technical demo, shows a
  `Create Recipe` call to action to visitors who cannot create content, and does not separate anonymous
  discovery/conversion from authenticated user workflows.
- Why now: CookBook needs a more persuasive public entry point, a useful authenticated home experience,
  and explicit layout groundwork for upcoming ad support.
- Business/user impact: Anonymous visitors should understand why CookBook is useful and be able to browse
  public recipes and cookbooks. Logged-in users should land somewhere useful for continuing work. Free and
  anonymous viewers can support ad-backed browsing, while paid-tier users need an ad-free experience.

## Problem Space

- Current behavior:
  - `/` is a generic feature page that includes technology-stack copy.
  - `/` always shows `Create Recipe`, even for anonymous users.
  - Authenticated users who navigate to `/` see the same public-oriented page as anonymous visitors.
  - App pages use `PageLayout`, but there is no explicit page-role or ad-slot policy.
  - Header/sidebar controls already hide create/import actions from unauthenticated users.
- Desired behavior:
  - `/` is an anonymous-first public landing page focused on browsing, trust, and sign-up conversion.
  - Authenticated users who visit `/` are redirected to `/home`.
  - `/home` is an authenticated workspace that includes global discovery plus user workflow shortcuts.
  - Anonymous users can view and navigate public recipes and public cookbooks, but cannot add content.
  - Ad display is controlled by page role, auth state, user tier, and admin status.
  - The design leaves room to redesign both `/` and `/home` as CookBook grows without rewriting the access
    and ad-policy model.
- Constraints:
  - Use TanStack Router file-based routing under `src/routes/`.
  - Use existing session context and `useAuth()` patterns.
  - Use `<Link>` from `@tanstack/react-router` for navigation.
  - Preserve existing public browsing for recipes, cookbooks, and categories.
  - Paid tiers are `prep-cook`, `sous-chef`, and `executive-chef`; `home-cook` is the free ad-supported tier.
  - Admin users should not see ads.
- Assumptions:
  - `home-cook` is the free logged-in tier and may see ads where page policy allows.
  - Future ad provider integration is not part of this change.
  - Initial ad slots may be policy-backed placeholders or layout hooks rather than live ads.
  - Public recipe and cookbook visibility rules remain governed by existing data/API behavior.
- Edge cases considered:
  - Logged-in paid users viewing public pages should not see ads.
  - Admin users should not see ads even if their tier is absent or free.
  - Anonymous users attempting protected creation/import/edit actions should continue to be redirected through auth guards.
  - Print views must remain ad-free.
  - Auth flows should stay focused on conversion and recovery, without ads.

## Scope

### In Scope

- Revamp `/` into an anonymous-focused public landing page.
- Redirect authenticated users from `/` to `/home`.
- Add `/home` as an authenticated home/workspace route.
- Include global discovery content on `/home` alongside authenticated workflow shortcuts.
- Remove user-facing technology-stack copy from the public landing page.
- Remove anonymous-facing create/import calls to action from the public landing page.
- Define and implement a centralized ad eligibility policy that accounts for page role, auth state, user tier,
  and admin status.
- Add layout-level ad slot groundwork that can support future ad provider integration.
- Add tests for redirect behavior, CTA visibility, `/home` access, and ad eligibility policy.

### Out of Scope

- Integrating a real third-party ad network.
- Building billing, subscriptions, or tier upgrade flows.
- Changing recipe/cookbook privacy or publication semantics beyond preserving existing public browsing.
- Redesigning every application page.
- Implementing personalized recommendations beyond available global discovery and existing user-linked
  shortcuts.
- Finalizing long-term visual design for `/` or `/home`; this change should establish roles and flexible
  structure, not freeze the pages permanently.

## What Changes

- `/` becomes a public landing page for anonymous visitors and redirects authenticated users to `/home`.
- `/home` becomes the authenticated landing page with:
  - personal workflow shortcuts, such as creating, importing, managing recipes, and managing cookbooks;
  - global discovery links or sections for recipes, cookbooks, and categories;
  - flexible section boundaries so future capabilities can be added without changing the route contract.
- Ad eligibility is expressed as a reusable policy:
  - show ads only where the page role permits ads;
  - show ads to anonymous visitors and logged-in `home-cook` users;
  - suppress ads for `prep-cook`, `sous-chef`, `executive-chef`, and admin users;
  - suppress ads on auth, task, admin/account/profile, and print surfaces.
- Page layout gains named ad-slot groundwork or an equivalent policy-aware structure for future ad integration.
- Tests document the expected behavior so later page redesigns can change presentation without breaking access,
  CTA, or ad rules.

## Risks

- Risk: Redirecting authenticated users from `/` could make the public landing page harder to preview.
  - Impact: Product/design review may need an alternate way to inspect the public page.
  - Mitigation: Keep the landing page implementation isolated enough to allow a future preview route if needed.
- Risk: Ad rules could become scattered across route components.
  - Impact: Future ad provider integration becomes brittle and hard to audit.
  - Mitigation: Centralize eligibility in a helper or policy module and test it directly.
- Risk: `/home` could become a fixed dashboard that is hard to redesign.
  - Impact: Future capabilities require disruptive rewrites.
  - Mitigation: Model `/home` around flexible sections and route role, not a permanent widget set.
- Risk: Anonymous access to public recipes/cookbooks could accidentally regress while protecting create/import flows.
  - Impact: Discovery and SEO/user acquisition suffer.
  - Mitigation: Add regression tests around public navigation and unauthenticated CTA/action visibility.

## Open Questions

- Question: Should a future explicit public landing preview route, such as `/welcome`, be added for logged-in
  users/design review?
  - Needed from: product/design when that need arises
  - Blocker for apply: no
- Question: What exact ad slot names and positions will the ad provider need?
  - Needed from: future ad integration work
  - Blocker for apply: no
- Question: Which global discovery data should `/home` show first if query performance or content density becomes a concern?
  - Needed from: implementation and product iteration
  - Blocker for apply: no

## Non-Goals

- Do not add live advertisements or third-party scripts.
- Do not build monetization management or paid-tier upgrade UX.
- Do not prevent anonymous users from browsing public recipes, public cookbooks, or public discovery routes.
- Do not hard-code a final marketing or dashboard design that blocks future page redesigns.
- Do not change generated route tree files manually.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

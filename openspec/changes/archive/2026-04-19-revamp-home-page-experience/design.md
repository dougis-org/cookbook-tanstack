## Context

- Relevant architecture:
  - Routes live under `src/routes/` and use TanStack Router file-based routing.
  - `src/routes/__root.tsx` loads the session into router context.
  - `src/hooks/useAuth.ts` exposes effective session state on the client.
  - `src/lib/auth-guard.ts` provides `requireAuth()` for protected routes.
  - `src/components/layout/PageLayout.tsx` is the current generic app layout.
  - `src/types/user.ts` defines user tiers and helper ranking.
- Dependencies:
  - Existing Better-Auth session shape, including `session.user.tier` and `session.user.isAdmin`.
  - Existing public list/detail routes for recipes, cookbooks, and categories.
  - GitHub issue #346 for the home-page experience.
  - GitHub issue #359 for ad display acceptance criteria.
- Interfaces/contracts touched:
  - `/` route behavior.
  - New `/home` route behavior.
  - Page layout/ad-slot policy helper contract.
  - Tests around auth-based rendering, redirects, and ad eligibility.

## Goals / Non-Goals

### Goals

- Make `/` an anonymous-first landing page.
- Redirect authenticated users from `/` to `/home`.
- Create `/home` as the authenticated landing route.
- Include both global discovery and personal workflow shortcuts on `/home`.
- Preserve anonymous access to public recipes and cookbooks.
- Centralize ad eligibility based on page role, auth state, user tier, and admin status.
- Keep `/` and `/home` page compositions flexible for future redesigns.

### Non-Goals

- Do not integrate an ad provider.
- Do not build subscription or billing flows.
- Do not alter generated route tree files manually.
- Do not lock the public landing page or authenticated home page into a final long-term visual design.
- Do not change public recipe/cookbook visibility semantics.

## Decisions

### Decision 1: Treat `/` as Anonymous Landing and `/home` as Authenticated Home

- Chosen: `/` will redirect authenticated users to `/home`; anonymous users will see the public landing page.
- Alternatives considered:
  - Keep `/` visible to logged-in users.
  - Use query parameters or tabs to switch between public and authenticated home content.
- Rationale: The issue explicitly calls for separate new-user and existing-user experiences, and authenticated
  users should land in a work-oriented surface.
- Trade-offs: Logged-in users may need a later preview route to inspect the public landing page.

### Decision 2: Use Page Roles for Layout and Ad Policy

- Chosen: Introduce a page-role concept or equivalent centralized policy input for surfaces such as public
  marketing, public content, authenticated home, authenticated task, auth, admin/account, and print.
- Alternatives considered:
  - Add ad conditionals directly to each route.
  - Use only URL pattern matching to decide ad behavior.
- Rationale: Page role is more stable than a specific visual layout and leaves room for future page redesigns.
- Trade-offs: Requires a small abstraction before live ads exist.

### Decision 3: Centralize Ad Eligibility

- Chosen: Add a reusable ad eligibility helper that evaluates:
  - page role permits ads;
  - viewer is anonymous or `home-cook`;
  - viewer is not paid tier;
  - viewer is not admin.
- Alternatives considered:
  - Check ad rules inline in layouts.
  - Infer ad suppression from access-tier helpers only.
- Rationale: Ad display and feature access are related but separate business rules.
- Trade-offs: Adds one more policy helper to maintain, but makes future ad provider integration safer.

### Decision 4: Design `/home` as Flexible Sections

- Chosen: Build `/home` around replaceable sections, such as workflow shortcuts, global recipe discovery,
  cookbook discovery, and personal collections.
- Alternatives considered:
  - Build a fixed dashboard widget grid.
  - Make `/home` only personal content.
- Rationale: The user confirmed `/home` should include global discovery and leave room for future capability growth.
- Trade-offs: Initial `/home` may be less personalized than a fully developed dashboard.

### Decision 5: Keep Initial Ad Slots Provider-Neutral

- Chosen: Implement named slot groundwork or testable placeholders without third-party scripts.
- Alternatives considered:
  - Integrate an ad provider now.
  - Defer all ad-related work.
- Rationale: Ads are coming, but this change is specifically about laying groundwork and protecting eligibility rules.
- Trade-offs: Future ad integration will still need provider-specific work.

## Proposal to Design Mapping

- Proposal element: Public landing page removes tech-stack positioning.
  - Design decision: Decision 1.
  - Validation approach: route/component test asserts public copy does not include technology-stack messaging.
- Proposal element: Authenticated users visiting `/` redirect to `/home`.
  - Design decision: Decision 1.
  - Validation approach: route before-load/unit test or integration test with authenticated context.
- Proposal element: `/home` includes global discovery and user workflow shortcuts.
  - Design decision: Decision 4.
  - Validation approach: component/route tests assert discovery links and authenticated action links render.
- Proposal element: Anonymous users can browse public recipes and cookbooks but cannot add content.
  - Design decision: Decision 1 and existing auth guards/header visibility.
  - Validation approach: regression tests for anonymous public links and hidden create/import affordances.
- Proposal element: Ads depend on page role, auth state, tier, and admin status.
  - Design decision: Decisions 2 and 3.
  - Validation approach: direct unit tests for every eligibility case.
- Proposal element: Future ad provider integration should not require scattered conditionals.
  - Design decision: Decisions 2, 3, and 5.
  - Validation approach: policy helper tests and route/layout tests use shared contract.
- Proposal element: Leave room for future redesign of `/` and `/home`.
  - Design decision: Decisions 2 and 4.
  - Validation approach: specs focus on route behavior, content roles, and policy rather than exact final layout.

## Functional Requirements Mapping

- Requirement: Authenticated users visiting `/` are redirected to `/home`.
  - Design element: `/` route before-load redirect using existing root session context.
  - Acceptance criteria reference: `public-home` spec.
  - Testability notes: Test authenticated and anonymous route behavior separately.
- Requirement: Anonymous users see a public landing page with browse/sign-up intent and no create/import CTA.
  - Design element: landing page component or section structure.
  - Acceptance criteria reference: `public-home` spec.
  - Testability notes: Assert CTA labels and absence of protected action links.
- Requirement: `/home` is protected and combines global discovery with authenticated workflow shortcuts.
  - Design element: `src/routes/home.tsx` guarded by `requireAuth()`.
  - Acceptance criteria reference: `authenticated-home` spec.
  - Testability notes: Assert unauthenticated redirect and authenticated content sections.
- Requirement: Public recipes and cookbooks remain browsable by anonymous users.
  - Design element: Preserve public route access and hide only write actions.
  - Acceptance criteria reference: `public-content-access` spec.
  - Testability notes: Regression tests around public route rendering/link visibility.
- Requirement: Ads are suppressed for paid tiers and admins.
  - Design element: centralized ad eligibility helper.
  - Acceptance criteria reference: `ad-display-policy` spec.
  - Testability notes: Exhaustive unit table for anonymous, `home-cook`, paid tiers, and admin.
- Requirement: Ads are suppressed on task/auth/admin/account/profile/print surfaces.
  - Design element: page-role policy.
  - Acceptance criteria reference: `ad-display-policy` spec.
  - Testability notes: Unit tests for page-role matrix and targeted route/layout tests.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Protected write actions must remain unavailable to anonymous users.
  - Design element: keep route guards and conditional action rendering.
  - Acceptance criteria reference: `public-content-access` and `authenticated-home` specs.
  - Testability notes: Ensure create/import/edit affordances do not render anonymously and guarded routes redirect.
- Requirement category: reliability
  - Requirement: Ad eligibility must be deterministic and auditable.
  - Design element: pure helper with typed inputs.
  - Acceptance criteria reference: `ad-display-policy` spec.
  - Testability notes: Unit tests cover all tier/page-role branches.
- Requirement category: operability
  - Requirement: Future ad provider integration should not require rewriting individual routes.
  - Design element: named slots and centralized policy.
  - Acceptance criteria reference: `ad-display-policy` spec.
  - Testability notes: Tests assert slot rendering depends on policy output.
- Requirement category: maintainability
  - Requirement: `/` and `/home` can be redesigned later without changing route contracts.
  - Design element: section-oriented page composition and behavior-focused specs.
  - Acceptance criteria reference: `public-home` and `authenticated-home` specs.
  - Testability notes: Tests avoid brittle exact visual layout assertions.
- Requirement category: performance
  - Requirement: New home surfaces should not add heavy data dependencies before they are needed.
  - Design element: use existing links and lightweight discovery data, with room for later query-backed sections.
  - Acceptance criteria reference: `authenticated-home` spec.
  - Testability notes: Build/type checks and focused route tests; add query tests only if new data fetching is introduced.

## Risks / Trade-offs

- Risk/trade-off: Page-role abstraction may feel premature before live ads.
  - Impact: Slightly more code in this change.
  - Mitigation: Keep the policy small, typed, and directly tested.
- Risk/trade-off: `/home` global discovery could duplicate existing `/recipes` and `/cookbooks` pages.
  - Impact: The route may feel redundant.
  - Mitigation: Treat `/home` as a starting surface with links/summaries rather than a replacement for browse pages.
- Risk/trade-off: Redirecting `/` for authenticated users may complicate public-page QA.
  - Impact: Designers/testers may need to clear session to view `/`.
  - Mitigation: Isolate landing content so a future preview route can reuse it if needed.
- Risk/trade-off: Tests that assert copy too tightly can block future redesign.
  - Impact: Cosmetic changes become expensive.
  - Mitigation: Assert roles, links, and forbidden content rather than exact layout or paragraph copy.

## Rollback / Mitigation

- Rollback trigger: Authenticated navigation, public browsing, or ad suppression rules regress.
- Rollback steps:
  - Revert `/` redirect behavior.
  - Remove `/home` route registration via normal source rollback.
  - Disable ad slot rendering by making policy return false for all roles.
- Data migration considerations: None. This change does not require data migration.
- Verification after rollback:
  - Anonymous users can access `/`, `/recipes`, and `/cookbooks`.
  - Protected write routes still redirect unauthenticated users.
  - Paid-tier/admin users do not see ad slots.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Reproduce locally with the relevant `npm run test`, `npm run test:e2e`,
  or `npx tsc --noEmit` command and fix before requesting merge.
- If security checks fail: Do not merge critical or high severity findings. Document any false positive with
  justification and approval.
- If required reviews are blocked/stale: Keep the PR open and request review refresh after addressing comments;
  do not bypass required review.
- Escalation path and timeout: If CI, security, or review remains blocked after one working day, add a GitHub
  comment summarizing the blocker, owner, and proposed next action.

## Open Questions

- No open questions block implementation. Future public landing preview route and provider-specific ad slot
  names can be handled in later changes.

## Context

`PageLayout` (`src/components/layout/PageLayout.tsx`) accepts a `role: PageRole` prop with a default of `'authenticated-task'`. `role` is consumed solely by `isPageAdEligible` (`src/lib/ad-policy.ts`) to decide whether the top, bottom, and right-rail `<AdSlot>` instances render. `src/routes/recipes/$recipeId.tsx` calls `<PageLayout>` at three return points (loading, not-found, success) without a `role`, so all three inherit the `authenticated-task` default. `isPageAdEligible` treats `authenticated-task` as requiring an active session — with no session, it short-circuits to `false` before ever checking tier. `src/routes/recipes/index.tsx` (the recipe list page) already passes `role="public-content"`, which does not have that anonymous short-circuit and instead falls through to `showUserAds('anonymous')`.

This is a one-property, three-call-site fix; no architectural change, new dependency, or data-model impact is involved.

## Goals / Non-Goals

**Goals:**
- Make anonymous visitors to `/recipes/$recipeId` ad-eligible, matching `/recipes`'s existing behavior.
- Leave every other `role`-gated code path (there are none beyond `isPageAdEligible` today) and all tier-based suppression logic untouched.

**Non-Goals:**
- Changing `PageLayout`'s default `role` value for other routes.
- Adding owner-based or recipe-visibility-based ad logic — confirmed out of scope; ad eligibility depends only on viewer session/tier, never on recipe ownership.
- Implementing the header banner / floating footer ad units (#658, #659).

## Decisions

- **Decision: pass `role="public-content"` explicitly at each `<PageLayout>` call site in `$recipeId.tsx`, rather than changing `PageLayout`'s default `role`.**
  - Rationale: `PageLayout`'s default (`authenticated-task`) is correct for the many authenticated-only routes that rely on it implicitly (e.g. account, cookbook management pages). Changing the default would silently flip ad eligibility for anonymous visitors on every route that omits `role` and is not actually public, which is a much larger blast radius than this fix needs.
  - Alternative considered: introduce a new `PageRole` value specifically for recipe pages. Rejected — `public-content` already exists and is semantically identical (public, ad-eligible, no session required); adding a duplicate role increases the enum surface for no behavioral benefit.

- **Decision: apply the fix uniformly to all three return branches (loading, not-found, success), not just the success branch.**
  - Rationale: All three are independent `<PageLayout>` invocations and each currently defaults to `authenticated-task`. An anonymous visitor can land on the not-found branch (bad/stale link) and the loading branch (before data resolves) just as easily as the success branch; leaving those two unfixed would reintroduce the same bug on a subset of page states.

## Risks / Trade-offs

- [Risk] `role` might gate behavior elsewhere in `PageLayout` beyond `isPageAdEligible`, causing an unintended side effect. → Mitigation: confirmed by reading `PageLayout.tsx` that `role` is only ever read by `isPageAdEligible` (both directly in `PageLayout` and passed through to `AdSlot`); no other prop, layout, or conditional in the component depends on it.
- [Risk] Existing tests may assert the current (broken) no-ads-when-anonymous behavior on the recipe detail page, and would need updating rather than newly written. → Mitigation: tasks/tests artifacts will include locating and updating any such assertions alongside adding the new anonymous-ads-render assertion.

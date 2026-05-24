## GitHub Issues

- #450

## Why

- **Problem statement**: The authenticated home screen (`/home`) is currently a static menu of links ("Quick Actions" and "Discovery"). It contains no user statistics, progress indicator, recent user-owned recipes, or contextual prompts for tier upgrades.
- **Why now**: Converts `/home` into a personalized dashboard (F06) to surface user activity and contextual upgrade nudges. This serves as a vital conversion/upgrade surface that links seamlessly with the Stripe Checkout funnel.
- **Business/user impact**: Improves UX by showing recent activity and providing quick shortcuts based on tier capabilities. Drives revenue by dynamically nudging users who are approaching or have reached their plan limits.

## Problem Space

- **Current behavior**: `/home` is split into static column sections for Quick Actions (+ New Recipe, Import Recipe) and Discovery (All Recipes, Cookbooks, Categories). Both buttons are always active, regardless of user tier, and there's no data query for user context.
- **Desired behavior**:
  - Greeting line: `"Welcome back, {firstName}"` plus today's date (activity event tracking is not stored in the DB, so we display the current date formatted nicely).
  - Usage Card at the top: Displays recipes usage progress bar (`X of Y`), cookbooks usage progress bar (`A of B`), and a monthly creation block showing `"Z saved"` this month (with no progress bar as there is no monthly creation limit). Displays current tier name (`displayName`) as a caption under each. Reuses the `<ProgressBar>` pattern from `/account`.
  - Quick Actions row: Render `+ New Recipe` as primary, and `Import Recipe` as secondary. The `Import Recipe` button is disabled and displays an "Executive Chef" tier badge if the user tier is below `executive-chef`.
  - Recently Saved section: Fetches the 3–4 most recently saved recipes owned by the logged-in user sorted by `createdAt` desc using `trpc.recipes.list`. Provides a "View all →" link routing to `/recipes`. Displays an elegant empty state if the user has no recipes.
  - Contextual Upgrade Nudge at the bottom: An elegant upgrade banner rendered only if at least one of these is true:
    - Cookbook limit is reached.
    - Recipe limit is at 80% capacity or above.
    - User attempted a paid-only action (private-content creation or import) in the last 7 days.
    Nudge copy is data-driven: cookbook limit hit -> *"Ready to build a second cookbook?"*, recipe limit hit/approaching -> *"Running out of room?"*, attempted paid action -> *"Unlock premium capabilities"*.
- **Constraints**:
  - Theme tokens only (e.g. `var(--theme-*)`).
  - No emoji (use Lucide icons: `ChefHat`, `BookOpen`, `Plus`, `Download`, `ArrowRight`, `Lock`).
  - Brand name: **My CookBooks**.
  - Keep page role as `authenticated-home` (coordinate with F02 ad placement so they do not conflict).
- **Assumptions**:
  - Today's date will be shown for the activity stat line as there are no database events for "cooked recipes".
  - We can track recent paid-only action attempts in the last 7 days by reading a timestamp from `localStorage` under `last_paid_action_attempt`.
- **Edge cases considered**:
  - Zero recipes state: Render an elegant card prompting the user to create or import their first recipe.
  - Session hydration delay: Ensure fallback loading skeletons/states are shown while `useAuth()` or `trpc` queries resolve to prevent layout thrashing.
  - Verification banner overlaps: Standardize layouts so verification or ad banners stack nicely without breaking the grid.

## Scope

### In Scope

- Rewriting `src/routes/home.tsx` to render the authed home dashboard.
- Displaying user usage card (recipes, cookbooks, creations this month) with progress bars.
- Conditionally enabling/disabling the "Import Recipe" quick action with a lock/badge based on the user's tier.
- Displaying a "Recently Saved" section with 3-4 recipe card links.
- Implementing the data-driven contextual upgrade nudge banner at the bottom of `/home`.
- Writing comprehensive unit tests for the conditional nudge logic (covering all three trigger conditions and the empty state).

### Out of Scope

- Ad placement slot (F02) — coordinate but do not duplicate placement logic.
- Paywall nudge banner component styling (F05) — F06 consumes the data, but the visual banner here is native to the dashboard.
- Modifying backend schemas or database models.

## What Changes

- `src/routes/home.tsx` will be completely refactored to implement the dashboard layout and queries.
- `src/components/recipes/RecipeCard.tsx` may be imported on `/home` to display recipe previews.
- LocalStorage key `last_paid_action_attempt` will be referenced to determine recent attempts.

## Risks

- **Risk**: Hydration mismatch or page shift when queries load.
  - **Impact**: Layout shifts or brief flashes of default state on page load.
  - **Mitigation**: Use proper loading skeleton states matching the dimensions of the usage card and recently saved grid.
- **Risk**: Conflicting with other banners/ads (like F02 ad slot).
  - **Impact**: Layout becomes cluttered if both the F02 ad slot and the F06 upgrade nudge are rendered simultaneously.
  - **Mitigation**: Maintain the `authenticated-home` layout role, keeping spacing flexible.

## Open Questions

- **Question**: Should clicking "Upgrade" in the nudge banner call the same checkout/pricing routing used elsewhere?
  - **Needed from**: Product Team/Stripe specs.
  - **Blocker for apply**: No. (We will link to `/pricing` as specified in F06/F01 comments.)
- **Question**: Is there a monthly limit on recipe creation we need to display?
  - **Needed from**: Entitlements Spec.
  - **Blocker for apply**: No. (There is no monthly creation limit, so we show the count as static text without a progress bar.)

## Non-Goals

- Building new backend endpoints specifically for cooking event tracking.
- Redesigning the entire account `/account` page or `/pricing` page.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.

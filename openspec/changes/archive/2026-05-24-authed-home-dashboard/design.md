## Context

- Relevant architecture: TanStack Start with React 19, `@tanstack/react-query` for queries, and tRPC client.
- Dependencies: `src/hooks/useAuth.ts`, `src/hooks/useTierEntitlements.ts`, `src/components/recipes/RecipeCard.tsx`, and `src/lib/trpc.ts`.
- Interfaces/contracts touched: `trpc.usage.getOwned` query, `trpc.recipes.list` query, and the `localStorage` key `last_paid_action_attempt`.

## Goals / Non-Goals

### Goals

- Refactor `src/routes/home.tsx` to convert it from a static menu into a personalized dashboard (F06).
- Display usage stats (Recipes and Cookbooks with progress bars, and a "This month" counter) matching the user's tier.
- Disable the "Import Recipe" button with a lock indicator/tier badge for users below Executive Chef.
- Render the 3–4 most recently saved recipes owned by the current user sorted by `createdAt` desc, with an elegant empty state.
- Render a smart contextual upgrade nudge at the bottom under specific trigger conditions.
- Test the conditional nudge rendering logic using Vitest unit tests.

### Non-Goals

- Creating new DB models, collections, or server-side schema properties.
- Modifying or extending the `/recipes/new` or `/cookbooks/new` layout itself.

## Decisions

### Decision 1: Rewrite src/routes/home.tsx as a Dashboard Page

- Chosen: Refactor `src/routes/home.tsx` to fetch usage statistics via `trpc.usage.getOwned.useQuery()`, fetch the 3-4 recently saved recipes using `trpc.recipes.list.useQuery()`, and compute entitlements via `useTierEntitlements()`.
- Alternatives considered: Keep the static route and create a separate `/dashboard` path.
- Rationale: The UX audit specifically identified `/home` (Authed Home) as the links menu that needs refactoring. A separate path is unnecessary and breaks route expectations.
- Trade-offs: Increases the page complexity and hydration size of the homepage, which is addressed by using lightweight loading skeletons while data fetches.

### Decision 2: Reuse ProgressBar and RecipeCard Components

- Chosen: Define an inline `ProgressBar` component (matching `/account`) and import the `RecipeCard` component from `src/components/recipes/RecipeCard.tsx` to display recently saved recipes.
- Alternatives considered: Hand-rolling new visual markup or writing a global shared progress component.
- Rationale: Reusing the exact `ProgressBar` style ensures visual parity with `/account` and satisfies the design-system guidelines. Reusing `RecipeCard` maintains layout consistency.
- Trade-offs: Minor code duplication for `ProgressBar` inline, but keeps route files modular.

### Decision 3: LocalStorage for Recent Paid-Only Action attempts

- Chosen: Retrieve and check `localStorage.getItem('last_paid_action_attempt')` in `src/routes/home.tsx` to determine if a paid action was attempted in the last 7 days.
- Alternatives considered: Storing attempt counts in Mongoose database user session.
- Rationale: Database modifications are out of scope. LocalStorage is immediate, simple to query client-side, and persists across browser tab sessions.
- Trade-offs: Clears if user wipes browser storage, but highly resilient for typical customer flows.

### Decision 4: Responsive CSS-Grid Layout for Dashboard Components

- Chosen: Use a responsive `grid grid-cols-1 lg:grid-cols-3` layout. Place the usage card spans full-width or side-column depending on viewpoint, keeping sections clean. Use `--theme-*` tokens for all colors and border rules.
- Alternatives considered: Single column flexbox.
- Rationale: Allows usage statistics, quick actions, and recent recipes to look cohesive on both desktop and mobile screens.

## Proposal to Design Mapping

- Proposal element: Greeting line and activity stats
  - Design decision: Decision 1
  - Validation approach: Verify via unit tests that greeting outputs firstName and formats today's date cleanly.
- Proposal element: Usage progress bars (Recipes & Cookbooks)
  - Design decision: Decision 2
  - Validation approach: Manual verification that progress percentage aligns with actual usage count vs plan limits.
- Proposal element: Quick actions with tier-based lock
  - Design decision: Decision 1 & Decision 4
  - Validation approach: Test that "Import Recipe" is disabled and exhibits a tier badge when user tier rank is < Executive Chef.
- Proposal element: Recently saved recipes grid
  - Design decision: Decision 2
  - Validation approach: Test rendering of 3–4 recipe previews when database contains items, and an empty-state illustration when 0.
- Proposal element: Contextual Upgrade Nudge at bottom
  - Design decision: Decision 3 & Decision 1
  - Validation approach: Write unit tests verifying that nudge banner renders/hides dynamically under all target states.

## Functional Requirements Mapping

- Requirement: Greeting and stats greeting
  - Design element: `Welcome back, {firstName}` greeting and today's date indicator in `src/routes/home.tsx`.
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-GREETING)
  - Testability notes: Verify that correct text renders and is accessible.
- Requirement: Usage progress cards
  - Design element: Progress cards with `ProgressBar` element showing recipes, cookbooks, and creations this month.
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-USAGE)
  - Testability notes: Ensure limits and counts are fetched dynamically and render correctly.
- Requirement: Quick Actions tier restrictions
  - Design element: Check `canImport` from `useTierEntitlements()` and render disable status + Executive Chef tier badge.
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-ACTIONS)
  - Testability notes: Test that click is disabled and badge renders for non-executive chef accounts.
- Requirement: Contextual upgrade nudge banner
  - Design element: Dynamic banner checking cookbook limits, recipes >= 80%, or localStorage.getItem('last_paid_action_attempt').
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-NUDGE)
  - Testability notes: Verify conditional rendering of copy ("Ready to build a second cookbook?", "Running out of room?", "Unlock premium capabilities") via mocks.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Inline loader latency under 50ms of fetch completion.
  - Design element: Render skeletons synchronously while query `isLoading` is true to prevent layout shift.
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-PERF)
  - Testability notes: Ensure no major shift happens when swapping from loading to resolved cards.
- Requirement category: security
  - Requirement: Access control restrictions on imports.
  - Design element: Gated import routes and server procedures.
  - Acceptance criteria reference: specs/dashboard-functionality.md (F06-SEC)
  - Testability notes: Checked via tRPC procedures; home UI must only act as affordance indicator.

## Risks / Trade-offs

- Risk/trade-off: Storing paid-action timestamps in LocalStorage.
  - Impact: Can be manipulated or cleared by the user.
  - Mitigation: The server enforces limits, so client manipulation only alters UI nudge visibility, which is low risk.

## Rollback / Mitigation

- Rollback trigger: Production app breaks on `/home` route load due to hydration or tRPC call failure.
- Rollback steps: Revert `src/routes/home.tsx` to its previous static links version.
- Data migration considerations: None. We are only writing read queries and reading from client storage.
- Verification after rollback: Verify that `/home` loads instantly and contains the original columns of links.

## Operational Blocking Policy

- If CI checks fail: The PR cannot be merged. Revert or patch the specific test failure before retrying.
- If security checks fail: Remediate any vulnerable dependencies before merge.
- If required reviews are blocked/stale: Ping the appropriate reviewer directly to address comments.
- Escalation path and timeout: Timeout of 48 hours for code reviews, after which review comments must be formally addressed.

## Open Questions

- None. (We resolved all queries during our initial codebase exploration phase.)

## Context

- Relevant architecture: `PrivateRecipeNotes` is a client component in `src/components/recipes/` that owns all private-notes UI for the recipe detail view. It uses `useTierEntitlements` (thin adapter over `src/lib/tier-entitlements.ts`) and `@tanstack/react-query` for data fetching. `RecipeNotesUpgradeNudge` is a sibling presentational component with three states. The tRPC `privateRecipeNotes.get` procedure is `protectedProcedure` (requires auth) and returns `{ hasNote, note }` — withholding `note.body` for below-tier callers.
- Dependencies: `useAuth` hook (`src/hooks/useAuth.ts`), `useTierEntitlements` hook (`src/hooks/useTierEntitlements.ts`), `RecipeNotesUpgradeNudge` component (`src/components/recipes/RecipeNotesUpgradeNudge.tsx`), tRPC router `privateRecipeNotes.get`.
- Interfaces/contracts touched: Only `src/components/recipes/PrivateRecipeNotes.tsx` and its test file. No changes to tRPC router, route file, or nudge component.

## Goals / Non-Goals

### Goals

- Implement the four render branches inside `PrivateRecipeNotes` so all caller types see the correct UI.
- Enable the `hasNote` query for authenticated below-tier users without changing the entitled path.
- Add branch tests for all four cases.

### Non-Goals

- Changing `RecipeNotesUpgradeNudge` props or copy.
- Modifying the tRPC router or route file.
- Adding delete-note UI (edit route scope).

## Decisions

### Decision 1: Centralize branching inside PrivateRecipeNotes, not the route

- Chosen: All four branches live inside `PrivateRecipeNotes`. The route continues to render `<PrivateRecipeNotes recipeId={recipeId} />` unchanged.
- Alternatives considered: Inline branching in the route (render different components based on auth/tier state at the route level).
- Rationale: The route should not need to know about tier state or nudge variants — that is presentation/data logic that belongs in the component. Keeping the route call-site unchanged minimises diff surface and respects the existing public interface.
- Trade-offs: `PrivateRecipeNotes` becomes slightly more complex, but all complexity is isolated and testable at the component level.

### Decision 2: Widen query enabled-guard from canUsePrivateRecipeNotes to isLoggedIn

- Chosen: `enabled: isLoggedIn` — authenticated users of any tier can fetch `{ hasNote, note }`.
- Alternatives considered: Keep `enabled: canUsePrivateRecipeNotes` and add a separate second query for the `hasNote` check on the below-tier path.
- Rationale: The existing `privateRecipeNotes.get` endpoint already handles both tiers correctly — entitled callers get body, below-tier callers get `note: null` and `hasNote: boolean`. A single query with widened guard is simpler and avoids duplicating query-key management.
- Trade-offs: Below-tier authenticated users now make one additional API call per recipe view. The cost is negligible (indexed single-document lookup).

### Decision 3: Render nothing (not skeleton) for below-tier users while hasNote is loading

- Chosen: When `isLoading && !canUsePrivateRecipeNotes`, render `null` — no skeleton.
- Alternatives considered: Show the same pulse-skeleton for below-tier users while loading.
- Rationale: The skeleton was designed for the entitled path where the note body is expected. Showing it for below-tier users is misleading — it implies editable content is incoming. A blank space is preferable and simpler.
- Trade-offs: Brief layout shift when nudge appears after load. Accepted by the user explicitly.

### Decision 4: Error path keeps returning null for all callers

- Chosen: `if (isError) return null` — unchanged, applies to all tiers.
- Alternatives considered: Show a generic error message.
- Rationale: The existing behavior is safe and consistent. Network errors on the `hasNote` check are transient; silently hiding the section is preferable to a confusing error in the notes area.
- Trade-offs: Error state is invisible to the user, but this matches the current entitled-path behavior.

## Proposal to Design Mapping

- Proposal element: Four render branches based on auth state and tier
  - Design decision: Decision 1 (branching inside component), Decision 2 (widened query guard)
  - Validation approach: Four branch tests in `PrivateRecipeNotes.test.tsx`
- Proposal element: Skip skeleton for below-tier while loading
  - Design decision: Decision 3 (render null while loading)
  - Validation approach: Test asserts skeleton is absent when `isLoading` and below-tier
- Proposal element: Note body never exposed to below-tier
  - Design decision: Server contract (already enforced by tRPC router); client never reads `note.body` on below-tier path
  - Validation approach: `hasNote: true` branch test uses response with `note: null`
- Proposal element: No changes to route or nudge component
  - Design decision: Decision 1 (single component owns branching)
  - Validation approach: Route file diff shows no change

## Functional Requirements Mapping

- Requirement: Anonymous visitor sees `RecipeNotesUpgradeNudge` state `"anonymous"` with no API call
  - Design element: Early return before query when `!isLoggedIn`
  - Acceptance criteria reference: specs/private-notes-nudge-branches.md — Branch: anonymous
  - Testability notes: Mock `useAuth` returning `isLoggedIn: false`; assert nudge renders and query mock is not called
- Requirement: Entitled user sees inline editor
  - Design element: Existing editor path, gated by `canUsePrivateRecipeNotes`
  - Acceptance criteria reference: specs/private-notes-nudge-branches.md — Branch: entitled
  - Testability notes: Mock `canUsePrivateRecipeNotes: true`; assert textarea present
- Requirement: Below-tier, no note → nudge `"below-tier"`
  - Design element: Query result `{ hasNote: false }` → `RecipeNotesUpgradeNudge state="below-tier"`
  - Acceptance criteria reference: specs/private-notes-nudge-branches.md — Branch: below-tier-no-note
  - Testability notes: Mock `canUsePrivateRecipeNotes: false`, `isLoggedIn: true`, query returns `{ hasNote: false, note: null }`
- Requirement: Below-tier, note exists → nudge `"hidden-by-downgrade"`
  - Design element: Query result `{ hasNote: true }` → `RecipeNotesUpgradeNudge state="hidden-by-downgrade"`
  - Acceptance criteria reference: specs/private-notes-nudge-branches.md — Branch: below-tier-has-note
  - Testability notes: Mock same as above but `hasNote: true`

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Below-tier query adds at most one additional network call per recipe view
  - Design element: Decision 2 — single widened query, no polling
  - Acceptance criteria reference: No regression in Vitest (mocked query, no real network)
  - Testability notes: Query enabled flag asserted in tests
- Requirement category: security
  - Requirement: Note body never surfaces in below-tier UI
  - Design element: Client renders nudge (no body display) when `!canUsePrivateRecipeNotes`; server withholds body
  - Acceptance criteria reference: specs/private-notes-nudge-branches.md — Branch: below-tier-has-note asserts no textarea
  - Testability notes: Response mock passes `note: null`; assert no note body text in DOM
- Requirement category: reliability
  - Requirement: Network error on `hasNote` check does not surface broken UI
  - Design element: Decision 4 — `isError` returns `null` for all tiers
  - Acceptance criteria reference: Existing behavior preserved
  - Testability notes: No new test required; existing error path covers this

## Risks / Trade-offs

- Risk/trade-off: Brief blank space for below-tier users during `hasNote` fetch
  - Impact: Minor visual jank (layout shift when nudge appears)
  - Mitigation: Accepted by design; page load is fast on a local Mongo connection

## Rollback / Mitigation

- Rollback trigger: Nudge appears for entitled users, or entitled editor disappears after deploy.
- Rollback steps: Revert `PrivateRecipeNotes.tsx` to the version before this change (single commit, clean revert).
- Data migration considerations: None — no schema changes.
- Verification after rollback: Run `npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx`; confirm entitled-path test passes and entitled users see editor in manual smoke.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or lint errors before requesting review.
- If security checks fail: Investigate whether note body is leaking in any test assertion or DOM snapshot; fix before merge.
- If required reviews are blocked/stale: Re-request review after 24 hours. If blocked beyond 48 hours, escalate to project maintainer.
- Escalation path and timeout: 48-hour stale-review window; maintainer (@dougis) unblocks.

## Open Questions

No open questions. All design decisions are resolved and approved in explore mode.

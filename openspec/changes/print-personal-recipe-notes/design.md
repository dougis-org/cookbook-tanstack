## Context

- Relevant architecture: `src/routes/recipes/$recipeId.tsx` (route, owns page composition) renders `<RecipeDetail recipe={...} />` (pure/presentational, `src/components/recipes/RecipeDetail.tsx`) followed by a sibling `<PrivateRecipeNotes recipeId={recipeId} />` (`src/components/recipes/PrivateRecipeNotes.tsx`, owns its own tRPC query and on-screen editing state machine). `RecipeDetail` already has an established print pattern for its public `Notes` section (lines ~364–376): conditional on `trimmedNotes`, an `h2` with `PRINT_HEADING_DENSITY_SECTION` (from `src/components/printHeadingDensity.ts`) followed by a `whitespace-pre-wrap` paragraph.
- Dependencies: `trpc.privateRecipeNotes.get` query (existing, tRPC), `useAuth()` (`src/hooks/useAuth.ts`), `useTierEntitlements()` (`src/hooks/useTierEntitlements.ts`), `canUsePrivateRecipeNotes()` (`src/lib/tier-entitlements.ts:65`).
- Interfaces/contracts touched: `RecipeDetail` component props (new optional field); no tRPC contract changes; no database/schema changes.

## Goals / Non-Goals

### Goals

- Make the current user's own saved private note appear in print output when present and tier-entitled, positioned as its own section immediately after the existing `Notes` section.
- Preserve `RecipeDetail.tsx` as a pure/presentational component — no new hooks, no new data fetching added to it.
- Avoid any duplicate network request: the route-level query and `PrivateRecipeNotes`'s internal query must share the same React Query cache entry.
- Leave `PrivateRecipeNotes.tsx` (on-screen widget, all five `print:hidden` branches, editing state machine) completely unchanged.

### Non-Goals

- Building the suppress/show toggle for personal notes in print (#597).
- Changing on-screen private-notes UX.
- Printing personal notes in the cookbook-print flow.
- Introducing any new authorization surface or server endpoint.

## Decisions

### Decision 1: Route owns the print-note data fetch; `RecipeDetail` stays pure

- Chosen: `src/routes/recipes/$recipeId.tsx` calls `useQuery(trpc.privateRecipeNotes.get.queryOptions({ recipeId }), { enabled: isLoggedIn })` — the identical `queryOptions` factory call already used inside `PrivateRecipeNotes.tsx` — and derives `personalNoteBody: string | null`. This value is passed to `RecipeDetail` as a new prop; `RecipeDetail` renders it with zero knowledge of auth, tiers, or tRPC.
- Alternatives considered:
  1. Add the query + `useAuth`/`useTierEntitlements` directly inside `RecipeDetail.tsx`. Rejected: turns a pure presentational component into a data-fetching one, breaking the contract every other section of that component relies on (recipe data arrives entirely via props).
  2. Extend `PrivateRecipeNotes.tsx` to render a print-only branch in place (the pattern the GitHub issue originally suggested as "simplest"). Rejected during exploration: the desired print layout requires "Personal Notes" to sit as its own section within the same section flow as `Notes`/`Nutrition` inside `RecipeDetail`, not floating below the whole recipe body where `PrivateRecipeNotes` currently renders as a DOM sibling.
- Rationale: Keeps each component's responsibility singular — `RecipeDetail` renders recipe content from props, `PrivateRecipeNotes` owns the interactive on-screen note lifecycle, and the route composes page-level concerns (auth, tier, query orchestration) as it already implicitly does by choosing which components to render.
- Trade-offs: Two `useQuery` call sites for the same data instead of one. Mitigated by Decision 2.

### Decision 2: Reuse the exact same `queryOptions` factory call to guarantee cache dedup

- Chosen: Both call sites (route and `PrivateRecipeNotes.tsx`) call `trpc.privateRecipeNotes.get.queryOptions({ recipeId })` directly — no hand-rolled query key, no wrapper. React Query's default cache behavior dedupes concurrent/overlapping requests for an identical query key within the same `QueryClient`.
- Alternatives considered: Lift the query into a shared custom hook (e.g. `usePrivateRecipeNote(recipeId)`) used by both call sites. Rejected as unnecessary abstraction for two call sites already calling the same underlying factory function — introducing a hook here is a premature indirection for a one-line `useQuery` call; can be revisited if a third consumer appears.
- Rationale: Correctness relies on the query key being byte-identical, which is guaranteed by calling the same factory function with the same arguments, not by convention or copy-pasted key arrays.
- Trade-offs: If the two call sites' `queryOptions({ recipeId })` arguments ever diverge (e.g., one adds a `select`), dedup silently breaks and a second network request fires. Mitigated by both call sites depending on the same generated `trpc.privateRecipeNotes.get` router client — any signature change to the procedure is a compile-time TypeScript change visible in both places.

### Decision 3: "Personal Notes" is a standalone print-only section, not nested under "Notes"

- Chosen: In `RecipeDetail.tsx`, add a new section immediately after the existing `Notes` `<section>`, gated on `personalNote` (the prop) being truthy — independent of whether `Notes` itself rendered. Heading text: exactly "Personal Notes". Structure mirrors `Notes`: `h2` with `PRINT_HEADING_DENSITY_SECTION`, then a `whitespace-pre-wrap` paragraph. Visibility: `hidden print:block` (screen-hidden, print-visible) — the literal inverse of the `print:hidden` convention used throughout `RecipeDetail.tsx` and `PrivateRecipeNotes.tsx`.
- Alternatives considered: Nest "Personal Notes" as an `h3` sub-heading inside the `Notes` section. Rejected during exploration — this would make Personal Notes disappear whenever the public `notes` field is empty, which contradicts the requirement that a Personal Note prints "when present," independent of the public notes field.
- Rationale: A standalone sibling section is simplest to reason about (`personalNote ? <section>… : null`, no dependency on `trimmedNotes`), matches the existing conditional-section pattern already used for `Notes`/`Nutrition`, and satisfies the ordering requirement (immediately after `Notes`) without coupling render conditions.
- Trade-offs: None significant — this is the same structural pattern already proven by the `Notes` section, just relocated one prop upstream of `trimmedNotes`.

## Proposal to Design Mapping

- Proposal element: `RecipeDetail.tsx` gains a `personalNote` prop and a new print-only section.
  - Design decision: Decision 1, Decision 3
  - Validation approach: Component test asserting the section renders with correct content/position when `personalNote` is a non-empty string, and does not render when `null`/empty.
- Proposal element: Route computes `personalNoteBody` via a `useQuery` on the shared query key, gated by auth/tier.
  - Design decision: Decision 1, Decision 2
  - Validation approach: Route-level test covering all gating branches (anonymous, below-tier, no note, whitespace-only note, happy path); manual/automated check (e.g. network assertion in an e2e or integration test) that only one request fires for `trpc.privateRecipeNotes.get` per page load.
- Proposal element: "Personal Notes" section positioned immediately after `Notes`, independent of whether `Notes` rendered.
  - Design decision: Decision 3
  - Validation approach: Component test rendering with `trimmedNotes` empty/present in all four combinations with `personalNote` present/absent, asserting section presence and DOM order.
- Proposal element: No duplicate network request.
  - Design decision: Decision 2
  - Validation approach: Same as above (single-request assertion).
- Proposal element: `PrivateRecipeNotes.tsx` remains fully unchanged.
  - Design decision: Decision 1
  - Validation approach: No new test needed; existing `PrivateRecipeNotes.test.tsx` suite continues to pass unmodified, confirming no behavioral drift.

## Functional Requirements Mapping

- Requirement: A logged-in, tier-entitled user's non-empty saved private note appears in print output under a "Personal Notes" heading.
  - Design element: Decision 1 (route-level fetch), Decision 3 (section rendering)
  - Acceptance criteria reference: specs/print-personal-recipe-notes (personal note visible in print when present + entitled)
  - Testability notes: Component test on `RecipeDetail` with `personalNote` set; assert `h2` text "Personal Notes" and paragraph content present, and that the section has `print:block` (or equivalent) and `hidden` classes rather than being always-visible.
- Requirement: The "Personal Notes" section does not render at all when there is no saved note, the user is anonymous, or the user's tier does not include private notes.
  - Design element: Decision 1 (route computes `null` in all these cases before the prop reaches `RecipeDetail`)
  - Acceptance criteria reference: specs/print-personal-recipe-notes (personal note absent in print when not entitled/absent)
  - Testability notes: Route-level unit/integration test enumerating each gating branch and asserting `personalNoteBody === null`; `RecipeDetail` test confirming `personalNote={null}` renders no section.
- Requirement: "Personal Notes" section appears immediately after "Notes," independent of whether "Notes" rendered.
  - Design element: Decision 3
  - Acceptance criteria reference: specs/print-personal-recipe-notes (section ordering)
  - Testability notes: Component test asserting DOM order via `querySelectorAll`/testing-library `within` + sibling assertions across the four `trimmedNotes` × `personalNote` presence combinations.
- Requirement: No new network request is introduced.
  - Design element: Decision 2
  - Acceptance criteria reference: specs/print-personal-recipe-notes (single query dedup)
  - Testability notes: Assert on a shared `QueryClient` test harness that `trpc.privateRecipeNotes.get` fetcher is invoked exactly once per page render, even though two components call `useQuery` against it.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: No new data-exposure surface — the print section only ever shows the current session's own note, never another user's.
  - Design element: Decision 1 (query is scoped server-side to the caller's own user/recipe pair, same as today; `RecipeDetail` has no fallback/default fetch of its own)
  - Acceptance criteria reference: specs/print-personal-recipe-notes (no new authorization surface)
  - Testability notes: No new server code path is introduced, so existing server-side authorization tests for `privateRecipeNotes.get` remain the enforcement point; this change is purely presentational composition of already-authorized data.
- Requirement category: performance
  - Requirement: At most one network request for the private note per recipe-detail page view.
  - Design element: Decision 2
  - Acceptance criteria reference: specs/print-personal-recipe-notes (single query dedup)
  - Testability notes: Covered under Functional Requirements Mapping above.
- Requirement category: reliability
  - Requirement: `RecipeDetail.tsx`'s existing rendering behavior (all other sections) is unaffected by this change.
  - Design element: Decision 1 (additive prop, no changes to existing props/sections)
  - Acceptance criteria reference: N/A — regression coverage via existing `RecipeDetail` test suite
  - Testability notes: Existing `RecipeDetail` tests must continue to pass unmodified.

## Risks / Trade-offs

- Risk/trade-off: Two `useQuery` call sites for one logical query (route + `PrivateRecipeNotes`) is slightly more surface area than one.
  - Impact: Minor — if the two calls ever pass different arguments to `queryOptions`, dedup breaks silently (no error, just an extra request).
  - Mitigation: Both call the same generated `trpc.privateRecipeNotes.get.queryOptions({ recipeId })` factory with identical arguments; covered by the single-request test in Decision 2's validation approach.
- Risk/trade-off: `RecipeDetail` now carries a prop whose value has privacy implications (must never be populated for a non-owner).
  - Impact: If some future caller of `RecipeDetail` passes a note body sourced from anywhere other than the current session's own query, private note content could leak.
  - Mitigation: `personalNote` defaults to `undefined`/`null` when omitted (section simply doesn't render); the only production caller (`$recipeId.tsx`) computes it from the session-scoped query. This is a documentation/code-review concern, not a runtime enforcement gap, since the underlying tRPC procedure remains the actual authorization boundary.

## Rollback / Mitigation

- Rollback trigger: Print output regression discovered post-merge (e.g., personal notes appearing for the wrong user, duplicate network requests observed in production monitoring, or `RecipeDetail`/`PrivateRecipeNotes` on-screen regressions reported).
- Rollback steps: Revert the two changed files (`src/components/recipes/RecipeDetail.tsx`, `src/routes/recipes/$recipeId.tsx`) to their pre-change state via a single revert commit/PR. No database or server state to unwind — this change is purely client-side composition and rendering.
- Data migration considerations: None — no schema, storage, or server-side changes are made by this proposal.
- Verification after rollback: Confirm `npm run test` passes for `RecipeDetail` and route-level suites, and manually confirm print preview once again omits the personal note section (returning to pre-change behavior), and that `PrivateRecipeNotes.tsx` on-screen behavior is unaffected (it was never touched).

## Operational Blocking Policy

- If CI checks fail: Fix forward within this change before requesting review; do not merge with failing unit/integration tests for `RecipeDetail` or the route.
- If security checks fail: Given no server/auth code paths are touched, an unexpected security finding likely indicates a misunderstanding of scope (e.g., an accidental new query/endpoint) — halt and re-review the diff against this design before proceeding; do not suppress or bypass the finding.
- If required reviews are blocked/stale: Follow standard repo PR process (see `docs/standards/ci-cd.md`); auto-merge remains gated on review approval per project convention.
- Escalation path and timeout: No special escalation beyond normal PR review cadence — this is a small, low-risk, client-only change with no operational/runtime rollout concerns (no feature flag, no migration, no phased rollout needed).

## Open Questions

- None blocking. All design decisions were confirmed during exploration (see linked GitHub issue #608 discussion): route-level data fetch with a pure `RecipeDetail`, shared-query-key dedup, and "Personal Notes" as a standalone section immediately after "Notes."

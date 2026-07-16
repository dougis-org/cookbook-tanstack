## GitHub Issues

- #608

## Why

- Problem statement: `src/components/recipes/PrivateRecipeNotes.tsx` is unconditionally `print:hidden` on every return path (anonymous nudge, below-tier nudge, hidden-by-downgrade nudge, loading skeleton, and the main edit/display container). Regardless of tier or whether a saved note exists, `window.print()` on a recipe detail page never shows the private note body.
- Why now: This is an explicit prerequisite for #597 (Print preferences), which adds a per-section print-suppress toggle including "Personal notes." That toggle has nothing to suppress until private notes are printable at all.
- Business/user impact: Users on tiers that support Private Recipe Notes (`canUsePrivateRecipeNotes`) expect their saved note to appear when they print a recipe (e.g., for physical recipe cards/binders), the same way the recipe's public `notes` field already does. Today that expectation silently fails with no error — the note is just absent from the printed page.

## Problem Space

- Current behavior: `PrivateRecipeNotes` renders as a sibling below `RecipeDetail` in `src/routes/recipes/$recipeId.tsx`. Every branch of its render logic carries `print:hidden`, so nothing it renders — including the read-only saved note body — ever appears in print output.
- Desired behavior: When the current user is logged in, owns the recipe context being viewed (private notes are always fetched for "self" only — no new authorization surface), `canUsePrivateRecipeNotes(tier)` is true, and a saved note body exists (non-empty after trim), the note body appears in print output under a "Personal Notes" heading, styled consistently with the existing public `Notes` section pattern in `RecipeDetail.tsx` (h2 + `whitespace-pre-wrap` paragraph, `PRINT_HEADING_DENSITY_SECTION`). It appears as its own section, positioned immediately after the existing `Notes` section, regardless of whether `Notes` itself rendered.
- Constraints:
  - No server-side changes; no new tRPC endpoint. Must reuse the same `trpc.privateRecipeNotes.get` query already used by `PrivateRecipeNotes.tsx`, on the same query key, so React Query dedupes and no second network request fires.
  - `RecipeDetail.tsx` is currently a pure/presentational component (props in, JSX out; no hooks, no queries). This change must not turn it into a data-fetching component — it receives the resolved note body as a prop instead.
  - `PrivateRecipeNotes.tsx`'s on-screen edit widget, its five `print:hidden` branches, and its ownership of the on-screen state machine (loading/error/tier nudges/editing) must remain untouched.
  - Tier gating must go through the existing `canUsePrivateRecipeNotes` helper in `src/lib/tier-entitlements.ts` — no reimplementation of that policy check elsewhere.
- Assumptions:
  - The route (`src/routes/recipes/$recipeId.tsx`) is the right place to own the second `useQuery` call (using the shared query key) and compute the resolved, tier-gated, trimmed note body before passing it down as a prop.
  - By the time a user triggers `window.print()`, the note query has generally already resolved (it's fetched on mount alongside the rest of the page); no special print-triggered loading state is in scope.
- Edge cases considered:
  - Anonymous/logged-out user → no personal note in print (same as today).
  - Logged-in user below the tier required for private notes → no personal note in print, regardless of whether a note exists in storage (existence must not leak into print output for non-entitled tiers, consistent with the "Do not reveal note text to unauthorized tiers" repo decision).
  - Logged-in, entitled user, but no note ever saved → no "Personal Notes" section renders (mirrors how the public `Notes` section only renders when `trimmedNotes` is truthy).
  - Note body exists but is empty/whitespace-only after trim → treated as "no note" (section does not render).
  - Public `Notes` field is empty but a Personal Note exists → "Personal Notes" section renders on its own; it is not nested inside or conditioned on the `Notes` section existing.

## Scope

### In Scope

- Adding a `personalNote: string | null` prop to `RecipeDetail.tsx` and a new print-only "Personal Notes" section that renders when the prop is present, positioned immediately after the existing `Notes` section.
- Updating `src/routes/recipes/$recipeId.tsx` to fetch the current user's private note (reusing `PrivateRecipeNotes`'s existing query key), compute the tier-gated/trimmed note body, and pass it into `RecipeDetail`.
- Test coverage: `RecipeDetail`'s existing test file (section renders/doesn't render, position after Notes, independent of Notes), and route-level test coverage for the `personalNoteBody` computation (all gating branches: anonymous, below-tier, no note, whitespace-only note, happy path).
- Optionally, an e2e print assertion alongside existing print specs (`src/e2e/recipe-print-card-chrome.spec.ts`, `src/e2e/recipe-print-list-item-marker.spec.ts`).

### Out of Scope

- The print-suppress/show toggle itself (#597) — this change only makes personal notes printable by default when present; it does not add a way to hide them.
- Any change to the on-screen (non-print) private-notes UI, editing flow, or `PrivateRecipeNotes.tsx`'s internal state machine.
- Printing private notes in the cookbook-print flow (`PrintLayout.tsx` / `cookbooks.$cookbookId_.print.tsx`).
- Any new server endpoint, authorization surface, or change to who can read note content.

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: new optional `personalNote` prop; new standalone print-only section ("Personal Notes") rendered immediately after the `Notes` section, following the same structural pattern (h2 + `PRINT_HEADING_DENSITY_SECTION` + `whitespace-pre-wrap` paragraph) but visible only in print (`hidden print:block`, the inverse of the `print:hidden` convention used elsewhere in this file and in `PrivateRecipeNotes.tsx`).
- `src/routes/recipes/$recipeId.tsx`: new `useQuery` call against the same `trpc.privateRecipeNotes.get` query key already used internally by `PrivateRecipeNotes`, gated by `useAuth()` / `useTierEntitlements()`; computes `personalNoteBody` and passes it to `<RecipeDetail personalNote={personalNoteBody} />`. `<PrivateRecipeNotes recipeId={recipeId} />` continues to be rendered unchanged.
- No changes to `src/components/recipes/PrivateRecipeNotes.tsx`, no server/tRPC changes, no schema changes.

## Risks

- Risk: A second `useQuery` call against the same query key, at a different call site, silently stops deduping (e.g. if the two call sites' `queryOptions` construction ever drifts — different `select`/`staleTime`/params).
  - Impact: An extra, redundant network request per recipe-detail page view for logged-in users.
  - Mitigation: Both call sites must call the shared `trpc.privateRecipeNotes.get.queryOptions({ recipeId })` factory directly (not hand-rolled query keys), so any future change to the query shape stays in sync automatically. Verify via test/manual check that only one network call fires.
- Risk: Tier or auth state computed at the route level drifts from the tier/auth state `PrivateRecipeNotes.tsx` computes internally (e.g., if entitlement logic changes in one place but not the other).
  - Impact: Print output could show/hide the note inconsistently with what the on-screen widget shows/allows.
  - Mitigation: Both sites call the same `canUsePrivateRecipeNotes()` helper from `src/lib/tier-entitlements.ts` and the same `useAuth()` hook — no duplicated policy logic.
- Risk: Placing "Personal Notes" as a section within `RecipeDetail.tsx` (a shared, reused component) could inadvertently print personal notes in a context where the viewer is not the note's owner, if `RecipeDetail` is ever rendered for a non-owner without the caller passing `personalNote={null}`.
  - Impact: Privacy leak of note content to unauthorized viewers.
  - Mitigation: `personalNote` is computed exclusively at the route level from the current session's own query result and passed explicitly; there is no default/fallback fetch inside `RecipeDetail` itself, so a caller that doesn't pass the prop simply renders nothing for that section. Existing repo decisions ("Do not reveal note text to unauthorized tiers," "Verify recipe access before creating or updating notes") are unaffected since no new data-fetching surface is introduced — the query already scopes notes to the caller's own user/recipe pair server-side.

## Open Questions

- None blocking. Section heading text ("Personal Notes") and section ordering (immediately after `Notes`) were explicitly decided during exploration and are treated as settled for this proposal.

## Non-Goals

- Implementing the print-suppress/show toggle from #597.
- Changing the on-screen private-notes editing experience.
- Extending this print behavior to the cookbook-print flow.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

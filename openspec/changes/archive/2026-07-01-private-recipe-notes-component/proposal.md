## GitHub Issues

- #495

## Why

- Problem statement: Sous Chef+ users can store private notes on recipes via the backend API (#492), but there is no UI surface for reading or writing them. The feature is invisible to users.
- Why now: The tRPC router is complete and merged. This is the direct follow-on ticket unblocking the notes entitlement value proposition.
- Business/user impact: Private notes are a key Sous Chef+ differentiator. Without this component the tier upgrade has no demonstrable benefit for recipe annotation.

## Problem Space

- Current behavior: The `privateRecipeNotes.get/upsert/delete` tRPC procedures exist and work, but no component renders or edits them. The recipe detail page (`$recipeId.tsx`) has no notes panel for authenticated sous-chef+ users.
- Desired behavior: Sous Chef+ users see a "Private Notes" card below the recipe body on the detail page. Empty state offers an "Add a note" affordance. Click-to-edit opens a textarea with a character counter and Save / Cancel controls. Read mode shows the saved note as plain pre-wrapped text.
- Constraints:
  - No new npm dependencies (no markdown library, no toast library — user decision).
  - Must use `var(--theme-*)` tokens exclusively; no hard-coded colors.
  - No emoji; Lucide icons only (`Pencil`, `Save`, `X`).
  - Design system card pattern: `bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)]`.
  - Tier entitlement check must go through `useTierEntitlements()` (centralized policy per project convention).
- Assumptions:
  - The recipe detail route already has `recipeId` available via `Route.useParams()`.
  - Non-entitled users (below Sous Chef) simply don't see the component (upgrade nudge is out of scope).
  - "Route wiring" in the issue's out-of-scope means adding a new route, not the 3-line addition to the existing `$recipeId.tsx`.
- Edge cases considered:
  - Save with unchanged body — Save button disabled.
  - Save while mutation pending — Save button disabled.
  - Save failure — inline error message via `useState`, rolled back optimistic update.
  - Cancel after edits — reverts textarea to original body.
  - Note body at exactly 10000 chars — allowed; 10001 rejected by server.
  - `hasNote: true, note: null` response (lower tier) — component returns null (user never sees this).

## Scope

### In Scope

- New `src/components/recipes/PrivateRecipeNotes.tsx` (default export, props: `recipeId: string`)
- Loading skeleton state
- Read mode: empty state ("Add a note") and note body rendered with `whitespace-pre-wrap`
- Edit mode: textarea, `x / 10000` character counter, Save / Cancel controls
- Optimistic update on upsert with rollback on error
- Inline save-error message
- Wire component into `src/routes/recipes/$recipeId.tsx` between `RecipeDetail` and the action buttons section
- RTL component tests covering all acceptance criteria scenarios

### Out of Scope

- Upgrade nudge / upsell for sub-Sous Chef users
- New route creation
- Markdown rendering library
- Toast notification library
- `privateRecipeNotes.delete` UI (no delete affordance required by the issue)

## What Changes

- New file: `src/components/recipes/PrivateRecipeNotes.tsx`
- New file: `src/components/recipes/PrivateRecipeNotes.test.tsx`
- Modified: `src/routes/recipes/$recipeId.tsx` — add `<PrivateRecipeNotes recipeId={recipeId} />` between `RecipeDetail` and the `mt-8` action buttons div

## Risks

- Risk: Optimistic update cache invalidation could conflict with concurrent recipe query refreshes.
  - Impact: Low — notes are a separate query key from recipes.
  - Mitigation: Use `trpc.privateRecipeNotes.get.queryOptions({ recipeId }).queryKey` for targeted invalidation; don't touch the recipes query cache.

- Risk: Inline error message is less discoverable than a toast if the save button scrolls off screen.
  - Impact: Low — the edit panel always renders the error near the Save button.
  - Mitigation: Keep error message visually adjacent to the Save/Cancel controls within the card.

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- Markdown rendering: `whitespace-pre-wrap` (no library) — confirmed by user.
- Error display: inline `useState` message — confirmed by user.
- Tier gating: `useTierEntitlements().canUsePrivateRecipeNotes`, returns null if false — confirmed by convention.

## Non-Goals

- Full markdown rendering pipeline
- Toast notification system
- Delete note UI affordance
- Tier upgrade nudge
- E2E / Playwright tests (RTL only per issue acceptance criteria)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

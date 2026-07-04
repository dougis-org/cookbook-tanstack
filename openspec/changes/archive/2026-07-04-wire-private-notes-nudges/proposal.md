## GitHub Issues

- #497

## Why

- Problem statement: Non-entitled users (anonymous visitors and below-Sous-Chef members) see nothing where the Private Recipe Notes section should appear. The `PrivateRecipeNotes` component returns `null` for these users instead of surfacing appropriate upgrade nudges.
- Why now: All four blocking issues (#492, #494, #495, #496) are closed. The tRPC router, editor component, and nudge component are all complete. Issue #497 is the final wiring step before E2E (#499).
- Business/user impact: Below-tier users who previously had notes (downgrade path) receive no indication their notes exist, missing a conversion opportunity. Anonymous users see no prompt to register. Correct nudge rendering drives upgrade conversions.

## Problem Space

- Current behavior: `PrivateRecipeNotes` enables its query only when `canUsePrivateRecipeNotes === true` and unconditionally returns `null` for any non-entitled caller. The route renders `<PrivateRecipeNotes recipeId={recipeId} />` at line 132 of `src/routes/recipes/$recipeId.tsx` but the component is invisible for ~two-thirds of possible callers.
- Desired behavior: Four distinct render branches based on auth state and tier:
  1. Entitled (Sous Chef+) → full inline editor (`PrivateRecipeNotes` current behavior)
  2. Anonymous → `RecipeNotesUpgradeNudge` state `"anonymous"` (no API call)
  3. Authenticated, below tier, no existing note → `RecipeNotesUpgradeNudge` state `"below-tier"`
  4. Authenticated, below tier, note exists (downgraded user) → `RecipeNotesUpgradeNudge` state `"hidden-by-downgrade"`
- Constraints:
  - Tier check must remain in `canUsePrivateRecipeNotes` from `src/lib/tier-entitlements.ts` (centralized policy — do not duplicate).
  - Note body must never be exposed to below-tier callers (server already enforces this; client must not assume otherwise).
  - Loading skeleton should not render while a below-tier user's `hasNote` check is in flight — render nothing until resolved.
- Assumptions:
  - `RecipeNotesUpgradeNudge` states `"anonymous"`, `"below-tier"`, and `"hidden-by-downgrade"` are final and cover all non-entitled cases.
  - The tRPC `privateRecipeNotes.get` endpoint already returns `{ hasNote: boolean, note: null }` for below-tier authenticated callers without body content.
  - The route at `src/routes/recipes/$recipeId.tsx` line 132 does not need changes — only the component internals change.
- Edge cases considered:
  - User downgraded after creating notes: `hasNote: true` but no body in response → `"hidden-by-downgrade"` nudge.
  - User deletes account session mid-view: covered by existing `useAuth` / tRPC auth guard on the router.
  - Network error on `hasNote` check: component currently returns `null` on `isError` — preserve this behavior for below-tier too.

## Scope

### In Scope

- Update `src/components/recipes/PrivateRecipeNotes.tsx` to implement all four render branches.
- Change query `enabled` from `canUsePrivateRecipeNotes` to `isLoggedIn` so authenticated below-tier users can fetch `hasNote`.
- Add branch tests covering all four cases to `src/components/recipes/PrivateRecipeNotes.test.tsx`.

### Out of Scope

- Edit route wiring (tracked in #498).
- E2E tests (tracked in #499).
- Changes to `RecipeNotesUpgradeNudge`, the tRPC router, or `src/routes/recipes/$recipeId.tsx`.
- Any change to tier definitions or entitlement logic.

## What Changes

- `src/components/recipes/PrivateRecipeNotes.tsx`: replace `enabled: canUsePrivateRecipeNotes` with `enabled: isLoggedIn`; replace the `return null` guard with branched rendering using `RecipeNotesUpgradeNudge`.
- `src/components/recipes/PrivateRecipeNotes.test.tsx`: add four branch tests.

## Risks

- Risk: Widening the query to all authenticated users increases API calls.
  - Impact: Low — the `get` endpoint is a single indexed Mongo lookup; below-tier calls were always possible manually.
  - Mitigation: Query still disabled for anonymous users; no polling.
- Risk: Skeleton flash for below-tier users during `hasNote` fetch.
  - Impact: Minor visual — a brief blank space before nudge renders.
  - Mitigation: Accepted by design (skip skeleton for below-tier as specified).

## Open Questions

No unresolved ambiguity. All states, component props, and query shapes are confirmed from the closed blocking issues and existing code. The skeleton decision (render nothing for below-tier while loading) was confirmed by the user in explore mode.

## Non-Goals

- Modifying the nudge copy or CTA destinations.
- Adding delete-note support to the view route (that belongs to #498).
- Changing the optimistic-cache write behavior on the editor path.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

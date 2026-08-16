## GitHub Issues

- #597
- #608 (merged prerequisite — PR #611)
- #609 (merged prerequisite — PR #622)

## Why

- Problem statement: Recipe print output (single-recipe print and cookbook print) always renders every section — prep/cook/servings meta, ingredients, instructions, notes, and (as of #608) personal notes. Users who print recipes regularly (e.g. building a physical cookbook, or printing for someone who doesn't need timing/nutrition info) have no way to suppress sections they don't want on paper.
- Why now: Both prerequisites this issue was blocked on are merged — #608 made personal notes printable at all (PR #611), and #609 proved the user-preference storage + settings-page pattern using a `theme` field (PR #622). The path is now unblocked and the pattern to extend is concrete.
- Business/user impact: Users get control over what a printed recipe/cookbook contains, matching the granularity they already have on-screen (e.g. optional personal notes). No impact on users who never touch the new settings — defaults preserve today's print-everything behavior.

## Problem Space

- Current behavior: `RecipeDetail.tsx` renders five conditional-on-content-only print sections unconditionally: the collapsed prep/cook/servings/difficulty summary line (`printMetaLine`, not the on-screen `print:hidden` grid), Ingredients, Instructions, the recipe's own `notes` field, and (print-only) `personalNote`. Both the single-recipe print route (`src/routes/recipes/$recipeId.tsx`) and the cookbook print route (`src/routes/cookbooks.$cookbookId_.print.tsx`) render through this same `RecipeDetail` component for these sections, so both flows already share the same suppression surface once wired.
- Desired behavior: A logged-in user can, from a settings page, toggle five boolean preferences (meta line, ingredients, instructions, notes, personal notes), each defaulting to "shown". Any print of a recipe by that user — whether the single-recipe print view or a cookbook print — honors those preferences uniformly. Content-presence checks that already exist (e.g. notes section only renders if `trimmedNotes` is truthy) remain in addition to, not replaced by, the new preference gate.
- Constraints:
  - Better-Auth `additionalFields` are flat, individually-typed fields, not a nested object — five new top-level fields, following `theme`'s shape, not a `printPreferences: {...}` blob.
  - `RecipeDetail` is intentionally a presentational component — per existing project decision, personal-note resolution (auth/tier checks) happens in the calling route, not inside `RecipeDetail` itself. The same pattern applies here: preferences must be resolved by the caller and passed down as props, not fetched inside `RecipeDetail`.
  - The settings page (`src/routes/account_.settings.tsx`) already exists and already saves via `authClient.updateUser(...)`, not the tRPC `updateProfile` mutation — the five new fields follow that established save path, not the one #609's issue text speculated about.
- Assumptions:
  - Print preferences apply uniformly to all printing surfaces (single-recipe and cookbook print) with no per-flow exemption — confirmed by the requester: "print preferences should impact all printing, if users want a different cookbook result they can change preferences."
  - Preferences are per-user, not per-recipe or per-cookbook.
- Edge cases considered:
  - Anonymous/logged-out viewers have no preferences to fetch — printing must default to showing everything (today's behavior), same as an authenticated user who has never touched the toggles.
  - The "Personal notes" toggle only has an effect when a personal note is actually resolved and passed in (requires ownership + tier gate, per #608) — for cookbook print, `personalNote` is never fetched/passed today (a cookbook may render other users' recipes), so this toggle is a no-op there regardless of value. This proposal does not add personal-note fetching to cookbook print — that remains out of scope (see Non-Goals).
  - A user with all five toggles off should still see the recipe title/image/chrome print (no interpretation of "print nothing at all").

## Scope

### In Scope

- Five new Better-Auth `additionalFields` on `auth.ts`, following the `theme` field's shape (string/boolean, `defaultValue`, `required: false`): `printShowMeta`, `printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes` — all boolean, all default `true`.
- New "Print Preferences" section on `account_.settings.tsx`, using toggle controls (mirroring the existing Theme section's structural pattern: local state seeded from `session.user`, edited state, save via `authClient.updateUser(...)`, save/success/error affordances).
- `RecipeDetail.tsx`: extend `RecipeDetailProps` with a `printPreferences` prop (all five booleans, or a typed shape with sane defaults) and gate the five existing print sections (`printMetaLine`, Ingredients, Instructions, Notes, Personal Notes) on the corresponding preference, in addition to their existing content-presence checks.
- `src/routes/recipes/$recipeId.tsx`: resolve the current user's print preferences (from `session.user`, defaulting to `true` for logged-out/unset) and pass them into `RecipeDetail`.
- `src/routes/cookbooks.$cookbookId_.print.tsx`: same preference resolution and prop-passing, so cookbook print honors the same toggles (per confirmed scope).
- Component tests on `RecipeDetail` covering each preference toggled off individually and all-off/all-on combinations.
- E2E print coverage extending the existing pattern (`recipe-print-card-chrome.spec.ts`, `recipe-print-list-item-marker.spec.ts`) asserting a suppressed section is absent from the print DOM (not just visually hidden), for both single-recipe and cookbook print.

### Out of Scope

- Building the settings-page/storage pattern itself — already delivered by #609.
- Making personal notes printable at all — already delivered by #608.
- Fetching/passing `personalNote` into the cookbook print flow — cookbook print continues to never render personal notes, independent of the new toggle's value (unchanged from today).
- Nutrition panel suppression — explicitly out of scope per the original issue.

## What Changes

- `src/lib/auth.ts` — five new `additionalFields` entries.
- `src/routes/account_.settings.tsx` — new "Print Preferences" section with five toggles, wired to `authClient.updateUser`.
- `src/components/recipes/RecipeDetail.tsx` — new `printPreferences` prop; five existing print sections gated on it.
- `src/routes/recipes/$recipeId.tsx` — resolves and passes `printPreferences`.
- `src/routes/cookbooks.$cookbookId_.print.tsx` — resolves and passes `printPreferences`.
- New/extended tests: `RecipeDetail` component tests, settings-page component tests, e2e print specs.

## Risks

- Risk: Gating sections inside a shared, presentational `RecipeDetail` component could couple print-only preference logic into a component also used for on-screen display.
  - Impact: Bugs here could affect on-screen rendering, not just print, if the gating leaks outside `print:` media-conditional CSS/branches.
  - Mitigation: Follow the existing `personalNote` precedent exactly — preference-gated branches only ever suppress *print-only* JSX (`hidden print:block` sections) or *print-only* content (`printMetaLine`); on-screen rendering paths (the `print:hidden` meta grid, the on-screen ingredients/instructions lists) are untouched by the new preference and continue to always show on screen.
- Risk: Preference defaults regress the "print everything" behavior for existing users who never open settings.
  - Impact: Silent, unexpected suppression of print content for the majority of users who never touch the new toggle.
  - Mitigation: All five `additionalFields` default to `true`; the route-layer resolution treats `undefined`/missing the same as `true`, not `false`.
- Risk: Applying preferences to cookbook print could surprise a cookbook owner who expects their own print settings to apply to a cookbook containing other users' shared recipes, even for content unrelated to those recipes' authorship.
  - Impact: Low — requester explicitly confirmed uniform behavior is intended; flagging here only so the decision is traceable if revisited later.
  - Mitigation: None needed; this is an accepted, confirmed design choice, not an open risk.

## Open Questions

None — the exploration session (see #597 discussion) surfaced open questions about the tRPC-vs-Better-Auth save path, the cookbook-print scope-check, and the "top segment" print-meta ambiguity; all were resolved during that session before this proposal was authored, and the requester explicitly confirmed the uniform-across-all-printing behavior and instructed the agent to proceed to proposal. Per change-control, this proposal is treated as approved and design/specs/tasks proceed without an additional pause.

## Non-Goals

- Re-litigating or re-scoping #608 or #609 — both are complete, merged, and treated as fixed foundations here.
- A generic "settings sprawl" — this proposal adds exactly the five print-related fields; it does not restructure `account_.settings.tsx` beyond adding one new section.
- Per-recipe or per-cookbook print-preference overrides — preferences are strictly per-user/global.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

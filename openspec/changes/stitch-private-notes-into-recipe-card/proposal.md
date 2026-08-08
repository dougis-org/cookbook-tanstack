## GitHub Issues

- #639

## Why

- Problem statement: On the recipe detail page, the "Private Notes" section
  renders as a visually separate card below the recipe, instead of reading
  as part of the recipe.
- Why now: Reported directly by a user via GitHub issue #639, with a
  screenshot showing the disconnect.
- Business/user impact: Small but real UX papercut on a feature (private
  notes) gated to paying tiers — a disjointed presentation undercuts the
  perceived value of a feature users are paying for.

## Problem Space

- Current behavior: `RecipeDetail` (`src/components/recipes/RecipeDetail.tsx`)
  renders the recipe as a single card — `max-w-4xl mx-auto` wrapping a
  `rounded-lg shadow-lg` panel containing header image, title/meta,
  Ingredients, Instructions, the recipe author's public `Notes` section, and
  Nutrition. `PrivateRecipeNotes`
  (`src/components/recipes/PrivateRecipeNotes.tsx`) is rendered by the route
  (`src/routes/recipes/$recipeId.tsx:149`) as a sibling *after* `RecipeDetail`
  closes, with its own `bg-[var(--theme-surface)] border
  border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6
  mt-8` — a visually distinct box: different corner radius, different shadow
  token, a border the main card doesn't have, and a gap above it. It also
  isn't wrapped in `max-w-4xl`, so on wide viewports it inherits
  `PageLayout`'s wider `container mx-auto px-4` and doesn't line up
  edge-to-edge with the recipe card above it.
- Desired behavior: The private notes block should read as a continuation of
  the recipe card — same width, no gap, no independent border/shadow/radius
  — for every render state of `PrivateRecipeNotes` (loading skeleton, the
  three `RecipeNotesUpgradeNudge` states, and the loaded/editing note itself).
- Constraints: `PrivateRecipeNotes` is a self-contained, data-fetching
  component (its own tRPC query, tier-gating, edit/save mutation) and must
  stay that way — this change only touches its outer wrapper markup/classes,
  not its data flow, tier logic, or interaction behavior. `RecipeDetail`
  stays a pure presentational component; it is not being given a slot prop
  or made to own the notes fetch.
- Assumptions: The desired fix is a same-branch (non-relocated) visual stitch
  — i.e. keep `PrivateRecipeNotes` as a sibling of `RecipeDetail` in the
  route, restyle it to look attached, rather than moving its rendering
  inside `RecipeDetail`'s own card. Confirmed with the requester during
  exploration (see `/opsx:explore` session): this is deliberately the
  cheaper of two options considered, matching the issue's own phrasing
  ("or at least look like it is").
- Edge cases considered:
  - Logged-out users see the `anonymous` nudge state — must also line up
    with the card above.
  - Users below the required tier see `below-tier`, and users who had notes
    but downgraded see `hidden-by-downgrade` — both nudge states, same
    treatment.
  - Loading state renders a skeleton (`data-testid="private-notes-skeleton"`)
    before data resolves — must also match width/seam styling.
  - Print output: `PrivateRecipeNotes` is already `print:hidden` in every
    branch (the private note reaches print via `RecipeDetail`'s separate
    `personalNote` prop / "Personal Notes" print section) — this must not
    change.
  - All four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) must
    keep the seam looking intentional, not just correct in one theme.

## Scope

### In Scope

- Restyle `PrivateRecipeNotes.tsx`'s outer wrapper markup across all of its
  render branches (skeleton, three nudge states via
  `RecipeNotesUpgradeNudge`, loaded/editing content) so each is wrapped in
  `max-w-4xl mx-auto` and visually seamed to the bottom of `RecipeDetail`'s
  card (no top margin/gap, no independent top border, shared corner radius
  and shadow language with the card above).
- Verify the fix across all four themes and all `PrivateRecipeNotes` render
  states.

### Out of Scope

- Any change to `PrivateRecipeNotes`'s data fetching, tier-gating logic, or
  edit/save behavior.
- Any change to `RecipeDetail`'s props/contract (no new slot prop, no data
  fetching added to it).
- Relocating the private notes markup to live physically inside
  `RecipeDetail`'s JSX tree.
- Changes to the print rendering path for private notes
  (`personalNote` prop / "Personal Notes" print section).
- Any change to `RecipeNotesUpgradeNudge`'s internal content or copy.

## What Changes

- `src/components/recipes/PrivateRecipeNotes.tsx`: wrapper classes only,
  across the skeleton branch, both `RecipeNotesUpgradeNudge` wrapper divs
  (`anonymous`, `hidden-by-downgrade`, `below-tier`), and the main loaded
  content wrapper.
- Existing tests for `PrivateRecipeNotes` and the `$recipeId` route may need
  their DOM class/structure assertions (if any) updated to match; no test
  behavior around data/interaction should need to change.

## Risks

- Risk: The visual seam only looks correct on one theme's border/shadow
  contrast and breaks on another.
  - Impact: Regresses the exact "looks disconnected" complaint on a subset
    of users (e.g. `light-warm` users) instead of fixing it for everyone.
  - Mitigation: Manually check all four themes as part of implementation;
    reuse the same `--theme-*` tokens `RecipeDetail`'s card already uses
    rather than introducing new ones.
- Risk: `max-w-4xl mx-auto` wrapper added around `PrivateRecipeNotes`'s
  render branches conflicts with an existing outer wrapper in a way that
  double-applies margin or breaks the `print:hidden` behavior.
  - Impact: Layout regression or a private note leaking into print output.
  - Mitigation: Keep `print:hidden` on the same element it's on today;
    manually verify print preview after the change.
- Risk: Existing tests assert on `PrivateRecipeNotes`'s current class names
  (e.g. `rounded-xl`, `shadow-[var(--theme-shadow-sm)]`) and fail after the
  restyle even though behavior is unchanged.
  - Impact: CI red for a cosmetic change.
  - Mitigation: Audit `PrivateRecipeNotes.test.tsx` and the `$recipeId`
    route tests for such assertions before implementing; update them
    alongside the component change.

## Open Questions

None. This proposal follows directly from an `/opsx:explore` session in
which the requester reviewed the visual-disconnect diagnosis (including the
width-mismatch finding) and explicitly chose the "cheap visual stitch"
option (option 3) over relocating the component into `RecipeDetail`'s own
render tree. That choice, plus the instruction to proceed to proposal mode,
constitutes approval to continue through design/specs/tasks without a
further pause.

## Non-Goals

- Redesigning the private notes editing UI/UX.
- Changing which tiers can access private notes.
- Consolidating `RecipeDetail` and `PrivateRecipeNotes` into one component.
- Addressing any other "disconnected section" issues elsewhere in the app
  not called out in issue #639.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

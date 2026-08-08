## Context

`RecipeDetail` (`src/components/recipes/RecipeDetail.tsx`) renders the
recipe as one card:

```
<div className="max-w-4xl mx-auto">
  <div className="bg-[var(--theme-surface)] rounded-lg shadow-lg overflow-hidden print:bg-transparent print:rounded-none print:shadow-none">
    ...header image, title/meta, Ingredients, Instructions, Notes, Nutrition...
  </div>
</div>
```

`PrivateRecipeNotes` (`src/components/recipes/PrivateRecipeNotes.tsx`) is a
self-contained, data-fetching component (tRPC query, tier-gating via
`useTierEntitlements`, inline edit/save via a mutation). The route
(`src/routes/recipes/$recipeId.tsx:129-149`) renders it as a sibling
directly below `<RecipeDetail>`:

```
<RecipeDetail recipe={recipe} personalNote={personalNoteBody} actions={...} />
<PrivateRecipeNotes recipeId={recipeId} />
```

Every one of `PrivateRecipeNotes`'s four render branches wraps its content
in its own box, independent of `RecipeDetail`'s card:

| Branch | Wrapper today |
|---|---|
| logged out (`anonymous` nudge) | `<div className="mt-8 print:hidden">` |
| below tier (`below-tier` nudge) | `<div className="mt-8 print:hidden">` |
| downgraded with existing note (`hidden-by-downgrade` nudge) | `<div className="mt-8 print:hidden">` |
| loading | `<div data-testid="private-notes-skeleton" className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden animate-pulse h-28" />` |
| loaded/editing | `<div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden">` |

None of these are wrapped in `max-w-4xl`, so on viewports where
`PageLayout`'s `container` class is wider than `56rem` (4xl), the box is
also visibly wider than the recipe card above it — a second, independent
cause of the "disconnected" look reported in issue #639, beyond the
gap/border/radius/shadow mismatch.

## Goals / Non-Goals

**Goals:**
- Every `PrivateRecipeNotes` render branch shares `RecipeDetail`'s card
  width (`max-w-4xl mx-auto`).
- The box sits flush against the bottom of `RecipeDetail`'s card — no
  vertical gap, no doubled border at the seam, and a corner radius/shadow
  that reads as "the bottom of the same card" rather than a second card.
- No change to what data is fetched, when, or how tier-gating/edit/save
  behave.

**Non-Goals:**
- Moving `PrivateRecipeNotes`'s JSX to live inside `RecipeDetail`'s render
  tree (rejected during exploration as unnecessary risk for this issue;
  see proposal's Problem Space).
- Adding a slot prop to `RecipeDetail`.
- Any change to `RecipeNotesUpgradeNudge`'s internal markup, only its
  outer wrapper as rendered by `PrivateRecipeNotes`.
- Changing the print rendering path (private notes reach print today via
  `RecipeDetail`'s `personalNote` prop / "Personal Notes" print section,
  untouched by this change).

## Decisions

**Decision: Stitch via wrapper-class changes only, keep the two components
as siblings.**
Two structural options were considered during exploration:
1. Give `RecipeDetail` a slot prop (e.g. `privateNotesSlot`) and render
   `PrivateRecipeNotes` inside `RecipeDetail`'s card as another `<section>`.
2. Leave `PrivateRecipeNotes` as a sibling, restyle its wrapper to visually
   continue the card above.

Option 2 was chosen. It's a strictly smaller diff confined to one file's
class names, carries no risk of changing `RecipeDetail`'s prop contract
(which other callers may depend on for print/cookbook contexts), and
matches the issue's own framing — "should show as part of the recipe body
(or at least look like it is)". The requester confirmed this trade-off
explicitly during the explore session.

**Decision: Match width by wrapping each branch in the identical
`max-w-4xl mx-auto` used by `RecipeDetail`, rather than reading a shared
constant.**
`RecipeDetail` doesn't currently export or centralize this width value —
it's an inline Tailwind utility. Introducing a shared constant/wrapper
component for a two-usage-site value would be a premature abstraction.
Repeating the literal `max-w-4xl mx-auto` string keeps the diff minimal and
consistent with how the rest of the codebase handles this width (also
inlined in other detail-page-style layouts). If a third consumer of this
width pattern appears later, it's a better trigger to extract it.

**Decision: Use `rounded-b-lg shadow-lg` and drop `rounded-xl
shadow-[var(--theme-shadow-sm)]`, rather than inventing a new "attached
panel" token.**
`RecipeDetail`'s card uses `rounded-lg` (not `rounded-xl`) and `shadow-lg`
(not the standard `shadow-[var(--theme-shadow-sm)]` card pattern documented
in `design-system/CLAUDE.md`). To read as a continuation of that specific
card, `PrivateRecipeNotes` must match `RecipeDetail`'s actual values, not
the generic design-system card pattern — matching the design-system's
canonical card recipe here would reintroduce the mismatch this change is
fixing. The seam itself is closed by removing the top margin/border rather
than by adding a new visual technique.

**Decision: Keep `print:hidden` on the outermost wrapper of each branch,
unchanged in placement.**
This change only touches non-print classes; print behavior is explicitly
out of scope and must not regress (private notes must continue to be
absent from the on-screen `RecipeDetail` print stylesheet path and only
reach print via the existing `personalNote` prop mechanism).

## Risks / Trade-offs

- [Risk] The `rounded-b-lg` / border-removal treatment looks correct in
  `dark` (the default theme engineers check first) but the seam reads as a
  hard, ugly line in a lighter theme where the accent/border contrast
  differs. → Mitigation: manually check all four themes
  (`dark`, `dark-greens`, `light-cool`, `light-warm`) before calling the
  change done, per `design-system/CLAUDE.md`'s existing checklist.
- [Risk] Existing unit tests assert on now-removed classes (`rounded-xl`,
  `mt-8`, `shadow-[var(--theme-shadow-sm)]`) in
  `PrivateRecipeNotes.test.tsx` or route-level tests, causing avoidable CI
  failures on an otherwise-correct change. → Mitigation: tasks.md includes
  an explicit step to grep existing tests for these class strings before
  changing the component, and to update assertions in the same commit.
- [Trade-off] Because the width/seam values are duplicated (not extracted
  into a shared constant), a future change to `RecipeDetail`'s card width
  or radius could silently desync the two components again. Accepted as
  reasonable for a two-call-site value; flagged in the Decisions section
  above as the trigger for revisiting.

## Migration Plan

Not applicable — this is a stateless UI styling change with no data
migration, no feature flag, and no rollout sequencing. Deploy as a normal
merge to `main`; rollback is a plain revert if a visual regression is
spotted.

## Open Questions

None — this is a small, single-file, purely cosmetic change with no
outstanding technical unknowns.

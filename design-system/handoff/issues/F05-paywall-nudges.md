# F05 — Progressive paywall nudges (70% / 90% / 100%)

## Context

Today the first time a user learns about the recipe limit is the moment they hit it. `src/routes/recipes/index.tsx` shows the existing `<TierWall>` only when `myRecipeCount >= recipeLimit`. That makes the limit a wall, not a planning signal.

The mock at `funnel-mocks.html` shows three states on the same /recipes page.

## Acceptance criteria

Three states drive off `myRecipeCount / recipeLimit`. The component should be shared so the same pattern can be used on the cookbook count too.

- [ ] **70%–89%** (soft): an inline notice between the page title and the recipe grid, reading e.g. *"You've saved 7 of 10 recipes. Plenty of room to keep going."* + a "View plan" text link. Uses the accent color at low opacity. Dismissable for the session (`sessionStorage`).
- [ ] **90%–99%** (loud): a persistent banner with warning-tone background, including: title ("1 recipe left on the Home Cook plan"), body sentence naming the next tier, a progress bar at 90%, and a primary "Upgrade — $2.99/mo" button linking to `/pricing` (or `/change-tier` when F01 ships).
- [ ] **100%** (wall): keep the existing `<TierWall>` behavior. Update the modal copy + add a "Today vs Prep Cook" comparison row inside it (see mock). The "+ New Recipe" button stays disabled.
- [ ] All three states render on `/recipes`, the recipe form (`/recipes/new` — at least the 100% wall), and `/home` (usage card already covers this — see F06).
- [ ] Strings live in a `nudgeCopy.ts` helper so they can be A/B tested or localised later.

## Where to start

- `src/routes/recipes/index.tsx` — already computes `atRecipeLimit`. Extend with `nudgeLevel: 'none' | 'soft' | 'loud' | 'wall'`.
- New component: `src/components/ui/UsageNudge.tsx` — accepts `count, limit, resourceName, nextTier` props and picks the right state.
- `src/components/ui/TierWall.tsx` — extend with the comparison row.
- Reference mock: `funnel-mocks/Nudges.jsx` in the design-system project.

## Constraints

- Theme tokens only (use `--theme-warning-*` for the 90% state, `--theme-error-*` for the 100% state).
- No emoji.
- Don't break the existing `<TierWall>` modal behaviour or tests.

## Out of scope

- Cookbook limit nudges (same component, follow-up issue)
- Dashboard home (F06 — uses the same data but a different surface)

@claude please open a PR. Include a Vitest test for each of the three threshold states and an updated test for the existing wall.

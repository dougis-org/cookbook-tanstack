## GitHub Issues

- #564

## Why

- Problem statement: On the cookbook Table of Contents (`/cookbooks/$id/toc`) and Print (`/cookbooks/$id/print`) routes, recipe names, the cookbook title, and other text are effectively invisible when viewed on screen (before or without triggering an actual print). This happens on every theme, most severely on the default "Dark (blues)" theme where the text is nearly unreadable against the page background.
- Why now: Reported by the product owner as GitHub issue #564; it affects a user-facing, frequently used flow (previewing a cookbook before printing) and makes the feature effectively unusable in the default theme.
- Business/user impact: Users cannot read the Table of Contents preview or confirm recipe names/order before printing a cookbook, undermining trust in the print feature and forcing users to print blind or reload with `?displayonly=1` and squint/select-all to read hidden text.

## Problem Space

- Current behavior: `CookbookStandalonePage`'s outer container (in `src/components/cookbooks/CookbookStandaloneLayout.tsx`) had no explicit background class since commit `a4ee150c` — it was left as `<div className="min-h-screen">`, so the browser/OS painted whatever background it chose (transparent by default, but some browser dark-mode heuristics or forced-dark rendering paint that as dark). Every piece of descendant text and border in the TOC/print page (`CookbookPageHeader`, `CookbookTocList`, `CookbookAlphaIndex`, footers) intentionally uses the separate `--theme-print-*` token family, which is hardcoded to always-light values (`--theme-print-fg: #111827` etc.) regardless of the active theme, per the existing convention documented in `src/styles/base.css` ("Print tokens — always explicit light values ... so dark-theme values never bleed into print"). The result: an unpaired (often dark-rendered) background against a fixed-light (near-black) foreground, causing very low or inverted contrast on screen. The actual `@media print` output is unaffected because `src/styles/print.css` forces `body { background: #fff !important }` during real printing, so the bug is confined to on-screen rendering of these two routes.
- Desired behavior: The on-screen background of `CookbookStandalonePage` matches the same always-light token family already used by its text/border content, so the preview always renders as light text-on-dark-border-on-white regardless of the active theme — consistent with what will actually be printed.
- Constraints: No change to the actual `@media print` output (already correct). No change to any other route or component that uses `--theme-bg` normally. Must not regress the four supported themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) elsewhere in the app.
- Assumptions: `--theme-print-bg` (`#ffffff`, defined in both `src/styles/base.css` and `design-system/tokens/colors-and-type.css`) is the correct paired background token for `--theme-print-fg`/`--theme-print-border`/etc., since both are already defined as an always-light set intended to travel together.
- Edge cases considered: `CookbookStandalonePage` is used by both `/cookbooks/$id/toc` and `/cookbooks/$id/print` (including the `?displayonly=1` preview variant of `/print`), so the fix must apply to both without route-specific branching. PDF export (`html[data-pdf-export]`) already only overrides `--theme-print-accent`, not background, and is unaffected by this change since it already renders on a white background.

## Scope

### In Scope

- Pairing the on-screen background of `CookbookStandalonePage` with the same always-light `--theme-print-*` token family already used by its descendant text/borders.
- Verifying the fix across all four themes on both affected routes (`/toc` and `/print`, including `?displayonly=1`).

### Out of Scope

- Any change to `src/styles/print.css` or actual `@media print` rendering (already correct).
- Any change to `RecipeDetail` or the individual recipe body sections rendered further down the print page.
- Any change to the `--theme-print-*` token values themselves.
- Any change to theme definitions (`--theme-bg` etc.) for the rest of the app.

## What Changes

- `src/components/cookbooks/CookbookStandaloneLayout.tsx`: `CookbookStandalonePage`'s outer container `<div>` gains an explicit `bg-[var(--theme-print-bg)]` class (previously had no background class). The `pageBaseClass` constant used by the loading/not-found stub states is also updated from `'min-h-screen bg-[var(--theme-bg)]'` to `'min-h-screen bg-[var(--theme-print-bg)]'` for consistency, so those states don't flash from a theme-driven background to the print background once content hydrates.

## Risks

- Risk: Some other consumer of `CookbookStandalonePage` (now or in the future) expects a theme-driven background.
  - Impact: Low — grep confirms only `/toc` and `/print` routes and the component's own test file currently use `CookbookStandalonePage`, both of which are the routes this fix targets.
  - Mitigation: Existing component/E2E tests for both routes will be updated to assert the light background across all four themes; any future consumer wanting a theme-driven background would need a separate prop/variant, which is explicitly out of scope here.
- Risk: Visual regression to spacing or shadow now that background is always white instead of matching `--theme-shadow-sm`/`-md` derived from the active theme.
  - Impact: Low — `CookbookStandalonePage` does not itself apply a shadow; card-level shadows inside are unaffected by this change.
  - Mitigation: Manual visual check across all four themes before merge.

## Open Questions

None. All decisions were resolved during the exploration phase (see linked explore-mode conversation): the background token pairs with the existing `--theme-print-fg` family. Implementation note: the fix is applied directly to `CookbookStandalonePage`'s container (not `pageBaseClass`, which is only used by the loading/not-found stub states and was updated separately for consistency) — see `tasks.md` for the plan-deviation note.

## Non-Goals

- Redesigning the TOC/print page layout or typography.
- Adding a user-facing theme toggle specific to the print/TOC preview.
- Changing PDF export behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## GitHub Issues

- dougis-org/cookbook-tanstack#211

## Why

- **Problem statement:** Components in the cookbook print surfaces (`CookbookStandaloneLayout.tsx`) mix dark-mode display styling with print overrides, producing paired declarations like `text-white print:text-black` and `border-slate-700/50 print:border-gray-200` on every element. Any missed `print:` variant causes invisible text on white paper when printing.
- **Why now:** The print surface has expanded (TOC route + print route + alphabetical index), so the styling debt now affects three routes. The issue was introduced in #203 and widened by #245.
- **Business/user impact:** Print output quality is currently fragile — one missing variant produces a broken print. A structural fix eliminates the class of mistake entirely.

## Problem Space

- **Current behavior:** `CookbookStandalonePage`, `CookbookPageHeader`, `CookbookTocList`, `TocRecipeItem`, `CookbookAlphaIndex`, and related components carry two style declarations per colored element: one for the dark screen context and one `print:` override to force light output.
- **Desired behavior:** Components used exclusively in the print surface use plain light-mode Tailwind classes (e.g. `text-gray-900`, `border-gray-200`). No `print:` variants and no `dark:` variants are needed because the rendering context is always light.
- **Constraints:**
  - `RecipeDetail` is rendered both inside the print route and on normal recipe pages — it must remain theme-aware and must not be modified to assume a light context.
  - The fix must have no impact on print output when the theming system (issue #281) lands later; `PrintLayout` should be straightforward to migrate to CSS variable overrides at that time.
  - Dark mode is class-based (`@custom-variant dark` applied statically to `<html>`) — the solution must not rely on `prefers-color-scheme`.
- **Assumptions:**
  - The print-preview aesthetic (light background on screen) is acceptable for the TOC and print routes; they are print-oriented pages.
  - `RecipeDetail` will become theme-aware when #281 lands; at that point `PrintLayout` will override CSS variables locally to keep print output fixed.
- **Edge cases considered:**
  - `RecipeDetail` carries its own dark styling inside the print page — `PrintLayout` must create a scoping boundary that neutralises the dark context inherited from `<html class="dark">`.
  - The `print:hidden` utility on `CookbookPageChrome` remains valid and must continue to work regardless of the context change.

## Scope

### In Scope

- New `PrintLayout` component in `src/components/cookbooks/` that forces `bg-white text-gray-900` (hardcoded light values, no theme awareness yet)
- Removal of all `print:text-*`, `print:border-*`, `print:bg-*` color overrides from components that live exclusively inside the print surface
- Updating `cookbooks.$cookbookId_.toc.tsx` and `cookbooks.$cookbookId_.print.tsx` to wrap content in `<PrintLayout>`
- `CookbookStandalonePage` — remove `print:bg-white print:text-black`; it now renders inside `PrintLayout` and inherits the light context
- `CookbookAlphaIndex`, `CookbookTocList`, `TocRecipeItem`, `RecipePageRow`, `CookbookPageHeader`, `RecipeTimeSpan` — strip `print:` color variants

### Out of Scope

- CSS variable / theming integration (that is #281's work)
- Any changes to `RecipeDetail` or other components used outside the print surface
- Changes to non-color `print:` utilities (e.g. `print:hidden`, `print:break-inside-avoid`, `print:columns-2`) — these remain as-is
- `src/styles/print.css` — no changes needed

## What Changes

- New file: `src/components/cookbooks/PrintLayout.tsx` — wraps children in a `div` with `className="bg-white text-gray-900"` to enforce a fixed light context
- `CookbookStandaloneLayout.tsx` — remove `print:` color overrides from all affected components; plain light-mode Tailwind classes replace the paired declarations
- `cookbooks.$cookbookId_.toc.tsx` — wrap route output in `<PrintLayout>`
- `cookbooks.$cookbookId_.print.tsx` — wrap route output in `<PrintLayout>`
- Tests updated to reflect the new class structure

## Risks

- Risk: `RecipeDetail` dark styles bleed through `PrintLayout` if the light-context boundary is not strong enough.
  - Impact: Print output renders with dark backgrounds/text inside recipe sections.
  - Mitigation: Test print output visually and via snapshot. If class-based boundary is insufficient, escalate to CSS variable scoping before merging.

- Risk: `print:hidden` utilities stop working if the print media query interacts unexpectedly with the new wrapper.
  - Impact: Navigation chrome appears in print output.
  - Mitigation: Covered by existing E2E/print tests; verify during implementation.

## Open Questions

No unresolved ambiguity. The approach was confirmed during exploration in this session:
- Option 2 (`PrintLayout` wrapper with hardcoded light values) was selected over separate print stylesheet and CSS layers.
- CSS variable migration path for #281 is documented in a comment on issue #281.
- Visual direction (print pages look light on screen) was accepted as part of the print-preview aesthetic.

## Non-Goals

- Supporting multiple print themes
- Making `PrintLayout` aware of the future theming system (that is #281)
- Changing the visual design of recipe pages or cookbook index pages outside the print surface

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## GitHub Issues

- #446
- #455

## Why

- Problem statement: The application's landing page and chrome headers currently render the generic Lucide `ChefHat` icon instead of the custom Open Book + Steam SVG brand mark. This creates a brand identity gap and inconsistency with the design system's Web UI kit and branding guidelines.
- Why now: The May 2026 UX & Conversion Audit flagged this as a low-severity finding (F11) that is a "5-minute fix, ship it now" and key to professional first-impressions.
- Business/user impact: Enhances brand consistency, premium aesthetic, and overall user engagement by using the canonical brand iconography.

## Problem Space

- Current behavior: The home marketing page (`src/routes/index.tsx`) and header layouts (`src/components/Header.tsx`) render `<ChefHat>` from `lucide-react`.
- Desired behavior: Render the canonical Open Book + Steam SVG icon (known as the brand mark `logo-mark.svg` or `BookSteam`) at the landing hero and all header brand marks.
- Constraints: The brand mark must be scaleable, accept custom classes, and support current color/theme variables via `stroke="currentColor"`.
- Assumptions: The SVG asset `public/logo-mark.svg` is ready and can be rendered inline or as a dedicated React component.
- Edge cases considered: Theme switches (dark vs. light mode) and high-contrast/forced-colors mode should style the brand mark accurately.

## Scope

## In Scope

- Create a reusable, type-safe `<LogoMark>` React component in `src/components/ui/LogoMark.tsx` wrapping the brand mark SVG.
- Replace the `<ChefHat>` icon with `<LogoMark>` in the `src/routes/index.tsx` hero.
- Replace the `<ChefHat>` icon with `<LogoMark>` in `src/components/Header.tsx` (the main desktop header link and the mobile drawer sidebar header).
- Ensure all related tests (unit and E2E) continue to pass.

## Out Of Scope

- Modifying domain-level references to standard "cookbooks" (e.g. recipe cards, user cookbooks list, cookbook creation forms). These remain standard book/folder icons or standard text.
- Changing domain URLs or routing structure.

## What Changes

- `[NEW] src/components/ui/LogoMark.tsx`: Custom React component for the logo mark.
- `[MODIFY] src/routes/index.tsx`: Hero icon swap.
- `[MODIFY] src/components/Header.tsx`: Header brand icons swap.

## Risks

- Risk: Hardcoded colors or sizes might break responsive layouts or dark/light themes.
  - Impact: Low (visual bug).
  - Mitigation: Design the React component to default to `currentColor` strokes and forward standard props like `className` and `size`.

## Open Questions

- Question: No unresolved ambiguity exists. The design context, UX audit F11 finding, and previous E2E test alignments provide clear, specific details for the implementation.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Replacing standard folder/recipe icons that are meant for general system actions rather than the app's primary branding.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

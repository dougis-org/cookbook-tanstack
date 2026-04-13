## GitHub Issues

- #283

## Why

- Problem statement: When printing a cookbook, the browser's default `@page` margins (1cm all around) waste vertical print real estate and the browser chrome shows the page URL rather than the cookbook name, making printed output less useful.
- Why now: The print pipeline is mature (PrintLayout, `#N` numbering, TOC, chapter support). This is a polish spike (#283) to maximise usable page area.
- Business/user impact: More content per printed page; the browser header shows the cookbook name instead of a URL.

## Problem Space

- Current behavior: `print.css` uses a single `@page { margin: 1cm; }` rule applied to all printed pages. The browser header shows the document title (usually the page route). Recipe pages use the same margin as cookbook pages.
- Desired behavior: Cookbook print pages (TOC + recipe sections) use tighter top/bottom margins (`0.5cm`) while preserving left/right margins (`1cm`) for readability binding allowance. Before `window.print()` the document title is swapped to the cookbook name so the browser header shows it; it is restored afterward.
- Constraints: Must not affect straight recipe print (`/recipes/:id`). Named `@page` rules are used to scope changes to cookbook print only. Left/right margin values are defined explicitly (even if unchanged) so they are easy to adjust later.
- Assumptions: `0.5cm` top/bottom is the starting point; values are named/commented so they are trivially adjustable. CSS `page` property (Chrome 85+, Firefox 110+) is acceptable as the minimum browser target.
- Edge cases considered: `displayonly=1` mode — title swap should NOT happen (no `window.print()` call). Restoring title if the component unmounts before print completes (cleanup in effect).

## Scope

### In Scope

- `document.title` swap to cookbook name before `window.print()`, restored after
- Named `@page cookbook-page` rule with `margin: 0.5cm 1cm` applied to `.cookbook-recipe-section` and the TOC/header area
- Explicit left/right margin definitions on all named `@page` rules for future adjustability
- Cookbook print route only (`/cookbooks/:id/print`)

### Out of Scope

- Single recipe print (`/recipes/:id`) — issue explicitly says "default headers are fine"
- Fully suppressing browser URL/date chrome (requires `@page { margin: 0 }` which also removes page numbers — judged too aggressive for now)
- Custom CSS running headers (`position: fixed` approach) — punted; `document.title` swap is the cost-free first step
- Dynamic per-page chapter name in margin box (CSS Paged Media Level 3 not supported in browsers)

## What Changes

- `src/styles/print.css` — add `@page cookbook-page { margin: 0.5cm 1cm; }` named rule; assign `page: cookbook-page` to `.cookbook-recipe-section` and a new `.cookbook-toc-page` wrapper
- `src/routes/cookbooks.$cookbookId_.print.tsx` — swap `document.title` to cookbook name before `window.print()`, restore in cleanup
- `src/components/cookbooks/CookbookStandaloneLayout.tsx` — add `cookbook-toc-page` class to the TOC section wrapper so the named `@page` rule applies

## Risks

- Risk: Named `@page` rules + `page` property browser support is Firefox 110+ / Chrome 85+. Safari support is partial/buggy.
  - Impact: Safari users may still get the old 1cm margins.
  - Mitigation: The existing `@page { margin: 1cm }` rule remains as fallback — Safari silently ignores the named rule and keeps working.
- Risk: `document.title` swap may leave stale title if user navigates away mid-print.
  - Impact: Minor cosmetic — wrong tab title until next navigation.
  - Mitigation: Restore title in `useEffect` cleanup function.

## Open Questions

No unresolved ambiguity remains. All decisions were made during explore:
- Top/bottom: `0.5cm`; left/right: `1cm` (explicitly defined)
- TOC included in tighter margins
- Recipe straight print untouched
- No full chrome suppression for now

## Non-Goals

- Full browser header/footer suppression
- Custom running header with chapter name
- Any changes to recipe detail page print styles

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

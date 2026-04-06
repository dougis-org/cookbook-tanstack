## Context

`CookbookTocList` and `CookbookAlphaIndex` live in `src/components/cookbooks/CookbookStandaloneLayout.tsx`. Both currently use Tailwind's `print:` modifier to activate 2-column layout exclusively during browser printing. The screen/display view renders both as single columns, creating a visual mismatch between the browser experience and the printed output.

The TOC is rendered on two routes: `/cookbooks/:id/toc` (standalone display) and `/cookbooks/:id/print` (full print view, including the `?displayonly=1` preview mode). The Alpha Index only appears on the print route.

## Goals / Non-Goals

**Goals:**
- Render `CookbookTocList` and `CookbookAlphaIndex` in 2 columns on screens at the `sm` breakpoint (≥ 640px) and above.
- Preserve single-column layout on mobile (< `sm`).
- Retain all existing `print:` modifier classes so printed output is unaffected.

**Non-Goals:**
- Changing page-number logic, chapter grouping, recipe ordering, or any other functional behaviour.
- Adding the Alpha Index to the `/toc` route.
- Responsive behaviour at breakpoints other than `sm`.

## Decisions

### D1 — Use `sm:` breakpoint for 2-column activation

**Decision**: Add `sm:columns-2 sm:gap-8 sm:space-y-0` to the affected `<ol>` elements.

**Rationale**: `sm` (640px) is the established mobile cutoff in this codebase. Below `sm`, a single-column list remains readable on phone-sized screens. The existing `space-y-2` stays active at mobile widths and is cancelled by `sm:space-y-0` at `sm`+, because `space-y-*` and CSS columns are incompatible (space-y applies margins that interfere with column flow).

**Alternative considered**: `md:columns-2` — rejected; the user confirmed `sm` is the correct threshold.

### D2 — Keep `print:` variants alongside `sm:` variants

**Decision**: Both `sm:` and `print:` class sets are retained in parallel.

**Rationale**: CSS `print:` media queries are independent of viewport-width breakpoints. The `sm:` classes activate during screen rendering at ≥640px; the `print:` classes activate unconditionally during printing regardless of screen width. Keeping both ensures correct output in all contexts (narrow-screen print, wide-screen display, narrow-screen display).

### D3 — Single-file change: `CookbookStandaloneLayout.tsx`

**Decision**: All 4 `<ol>` elements are in one file — no route-level changes needed.

**Rationale**: The components are already shared correctly. The fix is purely presentational (class strings only).

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| 2-column on screen at `sm`+ | D1 — `sm:columns-2 sm:gap-8 sm:space-y-0` |
| Mobile stays single-column | D1 — no change at `< sm` |
| Print unaffected | D2 — retain `print:` variants |
| 4 `<ol>` elements in one file | D3 — single-file change |

## Risks / Trade-offs

- **CSS columns + space-y conflict** → Mitigated by D1: `sm:space-y-0` cancels the conflicting margin at the same breakpoint columns activate.
- **Test class-string assertions** → Existing tests checking `<ol>` className strings will need updating. No logic changes, so test updates are mechanical.
- **Print width edge case** → If a user prints from a very narrow browser window, `sm:` may not be active but `print:` still is. D2 ensures print output is always 2-column regardless.

## Open Questions

None — all decisions confirmed with the user during exploration.

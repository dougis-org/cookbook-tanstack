## Context

The `CookbookAlphaIndex` component in `src/components/cookbooks/CookbookStandaloneLayout.tsx` renders an alphabetical index at the end of the print view. It currently has two layout defects:

1. **No page break** — the index starts immediately after the last recipe with only `mt-12` spacing, so it can bleed onto the last recipe's page.
2. **Per-letter column groups** — each letter is wrapped in its own `<div>` containing an independent `<ol className="print:columns-2">`. Each group resets the 2-column flow, leaving wasted whitespace when a letter has an odd number of recipes.

The fix is entirely within the `CookbookAlphaIndex` function. No routing, API, or DB changes are needed.

## Goals / Non-Goals

**Goals:**
- Index always begins on a fresh print page
- All index items (letter labels + recipe rows) share a single two-column column flow
- Letter labels within the flat list avoid being orphaned at a column bottom

**Non-Goals:**
- No changes to screen rendering
- No changes to sort order, `#` group, or page-number computation
- No changes to any other component

## Decisions

### D1 — Page break via Tailwind print utility on the index container

**Decision:** Add `print:break-before-page` to the root `<div>` of `CookbookAlphaIndex`.

**Alternatives considered:**
- Add a CSS class in `print.css` — works but adds indirection for a one-off fix; Tailwind utility is collocated and visible.
- Add `break-before: page` in the parent route file — couples the route to an internal layout detail.

**Rationale:** Tailwind print utilities are already used throughout the component. Keeping the logic inside `CookbookAlphaIndex` keeps the component self-contained.

---

### D2 — Flatten items into a single array, render in one `columns-2` container

**Decision:** Replace the per-letter `<div> + <ol>` structure with a flat `IndexItem[]` array (discriminated union of `letter` | `recipe` items), rendered in a single `<ol className="print:columns-2 print:gap-8">`.

```
type IndexItem =
  | { type: 'letter'; letter: string }
  | { type: 'recipe'; recipe: TocRecipe; pageNumber: number }
```

Letter items render as a styled `<li>` with `print:break-after-avoid` to prevent orphaning. Recipe items reuse the existing `RecipePageRow` component.

**Alternatives considered:**
- CSS `display: grid` with manual spanning — more complex, poor browser print support.
- Keep per-letter structure but use a single outer `columns-2` wrapper — column breaks mid-letter group still look unbalanced; headers would still reset visual flow.

**Rationale:** A flat list in `columns-2` is the standard CSS multi-column pattern for print indexes. The browser distributes items naturally without wasted gaps.

---

### D3 — Letter label styled as inline list item, not a heading element

**Decision:** Render letter labels as `<li>` elements (not `<h3>`) with bold styling. Remove the separate `<h3>` letter heading.

**Rationale:** `<h3>` with `break-after-avoid` inside a multi-column context can cause browser-specific rendering quirks. A `<li>` styled to look like a heading is simpler and behaves consistently in `columns-2`.

## Proposal → Design Mapping

| Proposal element | Design decision |
|---|---|
| Add page break before index | D1 — `print:break-before-page` on root div |
| Flatten letter groups into single column flow | D2 — flat `IndexItem[]` array in one `<ol columns-2>` |
| Letter labels as inline items | D3 — `<li>` instead of `<h3>` |
| `break-after: avoid` on letter labels | D3 — `print:break-after-avoid` on letter `<li>` |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Column split lands between a letter label and its first recipe despite `break-after-avoid` | Verify in Chrome and Firefox print preview with a real cookbook dataset |
| `#` group (non-letter recipes) sorts before `A` — may look odd as first item in a flat list | Existing sort order is intentional; visually acceptable |
| Existing `CookbookAlphaIndex` tests check for `<h3>` letter headings and per-letter `<ol>` structure | Update tests to assert flat list structure and `<li>` letter items |

## Rollback / Mitigation

- All changes are in one component function; revert is a single file change.
- No data model, API, or route changes — no migration needed.
- CI gates (unit tests, E2E print spec) will catch regressions before merge.

## Open Questions

No outstanding decisions. Design is complete and implementation-ready.

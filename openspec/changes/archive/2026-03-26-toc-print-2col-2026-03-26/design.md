## Context

The Cookbook TOC page (`/cookbooks/$cookbookId/toc`) renders recipe lists in a single column for both screen and print. The page uses `CookbookStandalonePage` (defaulting to `max-w-2xl`) and has two rendering paths: a flat ordered list and a chapter-grouped layout.

The fix is CSS-only using Tailwind's print utilities (`print:*`). No data, routing, or component logic changes.

## Goals / Non-Goals

**Goals:**
- TOC prints in 2 columns for both flat and chapter-grouped layouts
- Container widens to `max-w-4xl` at print time
- Recipe entries do not split across column or page breaks
- Chapter headings do not orphan at the bottom of a column
- Screen layout unchanged

**Non-Goals:**
- Changing the standalone print route (`/cookbooks/$cookbookId/print`)
- Controlling exact column balancing (browser handles this)
- Supporting 3+ columns or configurable column count
- Any change to how data is fetched or structured

## Decisions

### CSS Columns over JS array splitting

**Decision:** Use CSS `columns: 2` (`print:columns-2`) on the `<ol>` elements rather than splitting arrays in JS.

**Rationale:** This is a pure presentation concern scoped to `@media print`. CSS Columns lets the browser balance items naturally and requires zero logic changes. JS splitting would require component restructuring for the same visual result.

**Alternatives considered:** CSS Grid with manual half-splits — rejected because it requires computing midpoints and re-rendering two separate lists.

---

### Columns per chapter `<ol>`, not across the whole TOC

**Decision:** Apply `print:columns-2` to each chapter's recipe `<ol>`, not to the outer chapter container.

**Rationale:** Keeps chapter headings visually anchored to their recipes within a column block. Chapters can still flow from col 1 to col 2 at natural page boundaries — this is acceptable since it only occurs for the last chapter on a page.

**Alternatives considered:** Applying columns to the outer `<div class="space-y-6">` (Option B) — rejected because chapter headings can appear mid-column with no visual separation from the preceding chapter.

---

### `print:max-w-4xl` on `CookbookStandalonePage`

**Decision:** Add `print:max-w-4xl` to the inner container `div` in `CookbookStandalonePage` rather than at the route level.

**Rationale:** The TOC route does not pass a `maxWidth` prop (uses the `2xl` default). Changing the prop at the route level would also widen the screen layout. Adding the print-specific class to the shared layout component keeps screen and print widths independently controlled without new props or variants.

**Impact:** All pages using `CookbookStandalonePage` with the default `maxWidth` will widen at print. Currently that includes the TOC page; the print route already uses `maxWidth="4xl"` and is unaffected.

---

### `break-inside-avoid` on `<li>`, `break-after-avoid` on `<h2>`

**Decision:** Add `print:break-inside-avoid` to every `<li>` and `print:break-after-avoid` to chapter `<h2>` elements.

**Rationale:** `break-inside-avoid` prevents a recipe row (number + name + time) from splitting across a column. `break-after-avoid` on the heading prevents an orphaned chapter title with no recipes below it in the same column.

## Risks / Trade-offs

- **Browser column balancing** → Browsers may produce uneven columns for small lists (e.g., 3 recipes = 2 + 1). This is expected CSS Columns behavior and acceptable.
- **`print:max-w-4xl` widens all `CookbookStandalonePage` instances at print** → Currently only the TOC uses this default; the risk is low but should be noted for future pages using this component.
- **CI / review block** → If checks are blocked, do not merge until all gates pass. Fix the underlying issue; do not skip hooks.

## Open Questions

_(none — all decisions resolved during exploration)_

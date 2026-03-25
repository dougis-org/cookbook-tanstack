## Why

When a user wants a physical copy of their cookbook, printing the cookbook detail page produces a useless compact list of recipe rows rather than the full recipe content. There is no supported path to generate a printable hard-copy version of a cookbook with all recipes laid out page-by-page.

## What Changes

- **New tRPC procedure** `cookbooks.printById` — fetches cookbook metadata and full recipe documents (ingredients, instructions, notes, nutrition, taxonomy, source) in a single MongoDB query.
- **New route** `/cookbooks/$cookbookId/print` — a dedicated print-optimised page rendered as: TOC → page break → Recipe 1 (full content) → page break → Recipe 2 → … → Recipe N (no trailing break).
- **Update cookbook detail** — the existing "Print" button (currently `window.print()` on the compact list) is replaced with a `<Link>` to the new print route.
- **Update `print.css`** — add `page-break-before: always` / `break-before: page` rules for `.cookbook-recipe-section`.
- **Update `RecipeDetail`** — suppress `ServingSizeAdjuster` on the print route (rendered inside a `print:hidden` wrapper or via a prop).
- **No images** — the recipe hero image is not rendered on the print route (reduces ink/paper waste, deferred to a later milestone).

## Capabilities

### New Capabilities

- `cookbook-print-view`: Full-page, paginated print layout for a cookbook — TOC followed by one full recipe per page, accessible to all users on public cookbooks.

### Modified Capabilities

_(none — no existing spec-level behaviour changes)_

## Impact

- `src/server/trpc/routers/cookbooks.ts` — new `printById` procedure
- `src/routes/cookbooks.$cookbookId_.print.tsx` — new route file
- `src/routes/cookbooks.$cookbookId.tsx` — Print button updated to a Link
- `src/styles/print.css` — new page-break rules
- `src/components/recipes/RecipeDetail.tsx` — ServingSizeAdjuster suppression
- Auth boundary: follows `cookbook-auth-gating` — public cookbooks are readable by unauthenticated users; private cookbooks return 404/not-found on print route

## Non-Goals

- Recipe images in print output (deferred)
- Serving-size scaling before print (deferred — adjuster hidden)
- Custom page headers/footers per recipe
- PDF export (separate capability)

## Risks

- `RecipeDetail` dark-mode CSS may not fully convert to white-on-black print output. The existing `print.css` overrides cover body/background globally but inner Tailwind utility classes (`bg-slate-800`, etc.) may need additional `@media print` overrides.
- Large cookbooks (20+ recipes) with no images will still be long documents — no pagination concern, but load time before printing should be validated.

## Open Questions

_(none — all decisions resolved in explore session)_

---

_Scope change note: if scope changes after approval, proposal.md, design.md, specs/, and tasks.md must all be updated before /opsx:apply proceeds._

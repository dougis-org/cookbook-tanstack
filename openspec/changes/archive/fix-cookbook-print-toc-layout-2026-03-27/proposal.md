## Why

When printing an entire cookbook (`/cookbooks/$id/print`), the Table of Contents section renders in a single column and ignores chapter groupings, even though the standalone TOC page (`/cookbooks/$id/toc`) correctly uses a 2-column print layout with chapter support. The two views share the same data but diverged in implementation, violating the principle stated in the original design: each recipe's individual print should be consistent across views. Reported as [GitHub issue #218](https://github.com/dougis/cookbook-tanstack/issues/218).

## What Changes

- A shared `CookbookTocList` component is extracted into `CookbookStandaloneLayout.tsx`, encapsulating the 2-column, chapter-aware TOC rendering logic
- The standalone TOC route (`cookbooks.$cookbookId_.toc.tsx`) replaces its inline TOC JSX with `<CookbookTocList>`
- The full-print route (`cookbooks.$cookbookId_.print.tsx`) replaces its flat, single-column `<ol>` with `<CookbookTocList>`, and destructures `chapters` from `printData` (already returned by `printById`)
- Recipe entries in the print TOC render as `<Link>` elements (consistent with the standalone TOC, and useful for PDF export and print-preview navigation)

No server changes. `printById` already returns `chapters`; the data was simply never used.

## Capabilities

### New Capabilities

_(none — this change introduces no new user-facing capabilities)_

### Modified Capabilities

- `cookbook-print-view`: The TOC section in the full-print view must match the `cookbook-toc-print-layout` spec — 2-column when printed, chapter-grouped when chapters exist, with `break-inside-avoid` on each entry.
- `cookbook-toc-print-layout`: The spec currently describes behavior for `/toc` only. It should be extended to cover the shared `CookbookTocList` component used by both routes.

## Impact

- **Modified files**: `src/components/cookbooks/CookbookStandaloneLayout.tsx`, `src/routes/cookbooks.$cookbookId_.toc.tsx`, `src/routes/cookbooks.$cookbookId_.print.tsx`
- **Tests**: Existing E2E spec `src/e2e/cookbooks-print.spec.ts` and component tests in `src/components/cookbooks/__tests__/` may need updates or additions to cover the shared component and the corrected print behavior
- **No API changes**, no dependency changes, no breaking changes

## Problem Space

**In scope:**
- Extracting `CookbookTocList` from the inline JSX in `toc.tsx`
- Using `CookbookTocList` in `print.tsx` with correct chapter support and 2-column print layout
- Updating or adding tests for the shared component and corrected print TOC behavior

**Out of scope:**
- Changes to the `printById` or `byId` tRPC procedures
- Any changes to the screen layout of either route
- Changes to how recipes are rendered after the TOC in the print view

## Risks

- Low. The change is purely additive (new shared component) plus substitution of equivalent JSX. No server, routing, or data changes.
- Minor visual regression risk if the shared component's CSS classes differ from the current `toc.tsx` implementation — mitigated by reviewing both side-by-side during implementation.

## Open Questions

No unresolved ambiguity. The approach (Option A: always use `<Link>`) was explicitly chosen during exploration. All data required by the fix is already present in the API response.

## Non-Goals

- Redesigning the print layout beyond the TOC section
- Adding page-number support or other print enhancements
- Changing the screen appearance of either route

---

_If scope changes after this proposal is approved, proposal.md, design.md, specs/, and tasks.md must all be updated before implementation proceeds._

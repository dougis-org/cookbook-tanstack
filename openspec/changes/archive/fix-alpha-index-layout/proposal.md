## Why

The print view's alphabetical index has two layout defects: it begins on the same page as the last recipe (no page break), and each letter group spawns its own independent two-column layout, leaving excessive whitespace between letter sections. Both issues reduce the usability and quality of printed cookbooks.

## What Changes

- Add a page break before the alphabetical index so it always starts on its own page
- Flatten the letter-group structure from multiple independent `columns-2` containers into a single flat list, where letter labels are just items in the flow
- Letter headings retain `break-after: avoid` so they don't orphan at a column bottom

## Capabilities

### New Capabilities

None — this is a layout fix to an existing capability.

### Modified Capabilities

- `cookbook-alpha-index`: Requirement changes — the index must begin on a new page, and letter groups must not create independent column containers; letter labels must be inline items within a single shared two-column flow.
- `cookbook-print-view`: Minor requirement update — the print page must ensure a page break before the alphabetical index section.

## Impact

- `src/components/cookbooks/CookbookStandaloneLayout.tsx` — `CookbookAlphaIndex` component only
- `src/routes/cookbooks.$cookbookId_.print.tsx` — no structural change expected; page break handled inside the component
- `src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx` — tests will need updating to reflect flat list structure

## Problem Space

### In Scope
- `CookbookAlphaIndex` component rendering logic
- Print CSS / Tailwind print classes for page break and column flow

### Out of Scope
- Table of Contents layout
- Recipe detail page layout
- Any screen (non-print) rendering changes

## Scope

Small, isolated refactor. All changes are within `CookbookAlphaIndex` in a single file. No API, routing, or database changes.

## Risks

- Browser column-balancing behavior for flat lists can vary; letter headers near a column split may look odd without careful `break-after: avoid` placement. Mitigation: verify with real print preview.
- Existing snapshot or structural tests for `CookbookAlphaIndex` will need updating.

## Non-Goals

- Changing the alphabetical sort or `#` group behavior
- Adding interactivity or links to the index
- Modifying the index for screen (non-print) display

## Open Questions

No unresolved ambiguity. The two defects and their fixes are clearly defined from the issue and the existing code.

---

> **Change-control note:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before `/opsx:apply` proceeds.

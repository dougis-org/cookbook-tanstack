## Why

The Cookbook Table of Contents page prints in a single column, wasting paper when a cookbook has many recipes. A 2-column print layout makes better use of the page and reduces the number of printed pages.

## What Changes

- The TOC list renders in 2 columns when printed, for both flat and chapter-grouped layouts
- Recipe entries do not split across column breaks
- Chapter headings are protected from orphaning at the bottom of a column
- The page container widens to `max-w-4xl` in print media so columns have adequate space
- Screen layout is unchanged (single column, `max-w-2xl`)

## Capabilities

### New Capabilities

- `cookbook-toc-print-layout`: 2-column print layout for the Cookbook Table of Contents page (`/cookbooks/$cookbookId/toc`), including container widening and column break protection

### Modified Capabilities

_(none — no existing spec governs TOC print formatting)_

## Impact

- `src/routes/cookbooks.$cookbookId_.toc.tsx` — Tailwind print utility classes added to list and item elements
- `src/components/cookbooks/CookbookStandaloneLayout.tsx` — `print:max-w-4xl` added to `CookbookStandalonePage` inner container
- No API, routing, or data changes
- No effect on the `/cookbooks/$cookbookId/print` route (covered by `cookbook-print-view` spec)

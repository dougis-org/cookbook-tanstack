# Preserve blank lines in ingredients and instructions

**GitHub Issue:** #188
**Status:** Proposed
**Labels:** bug, frontend

## Why

`splitLines()` in `RecipeDetail.tsx` strips all blank lines from ingredients and instructions text. Users use blank lines to visually group sections (e.g. "For the sauce:" / blank line / "For the dough:"). Filtering them out collapses everything into a flat, ungrouped list.

Milestone 02 explicitly requires: *"Preserve empty lines for ingredient sections"* and *"Preserve empty lines for instruction sections".*

A query of all 130 recipes in the current database found zero using `\n\n` — the fix is forward-looking, enabling grouped recipes to be authored and displayed correctly.

## What Changes

- **`splitLines()` logic** — preserve internal blank lines as empty strings; trim leading/trailing blank lines; collapse consecutive internal blanks to a single `''`
- **Ingredients render** — blank-string entries render as a spacer `<li>` with no bullet marker or content
- **Instructions render** — blank-string entries render as a spacer `<li>` with no step number; step counter only increments for non-blank lines
- **No changes** to data storage, database, tRPC API, or `ServingSizeAdjuster` logic (`scaleQuantity('')` already returns `''` safely)

## Capabilities

### Modified Capabilities

- `recipe-detail-blank-line-sections`: `splitLines()` becomes the single centralized point for blank-line semantics; callers check `line === ''` to distinguish spacers from content lines

### New Capabilities

*(none)*

## Impact

- **Modified files:** `src/components/recipes/RecipeDetail.tsx` only
- **New tests:** unit tests for `splitLines`, component tests for `RecipeDetail` with grouped content
- **No API, routing, or schema changes**

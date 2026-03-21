## Why

Editing a recipe requires scrolling past the entire recipe detail to reach the Edit button at the bottom of the page — a frustrating experience when a user spots a quick correction while reading. The taxonomy selection UI in the edit form also uses an ad-hoc tag-button layout that is inconsistent with the filter page's polished dropdown design.

## What Changes

- **Edit button in title row**: The Edit button moves to the top-right of the recipe detail card, inline with the recipe title, so owners can jump to editing without scrolling.
- **Source field → filterable dropdown**: `SourceSelector` (a bare text input with inline results) is replaced with a new `SourcePickerDropdown` component — a styled dropdown trigger with an in-panel search input and filtered list of existing sources.
- **Taxonomy fields → `MultiSelectDropdown`**: The meals, courses, and preparations tag-button blocks in `RecipeForm` are replaced with `MultiSelectDropdown` instances in a responsive `flex-wrap` row, matching the filter page layout.
- **Selected items float to top**: `MultiSelectDropdown` always renders selected items first (alphabetically), then unselected items (alphabetically) — applied globally to both the edit form and recipe filter dropdowns.

## Capabilities

### New Capabilities

- `recipe-edit-quick-access`: Edit button surfaced in the recipe detail title row for owners, enabling one-click access to editing from the top of the page.
- `source-picker-dropdown`: Filterable single-select dropdown for picking an existing source on a recipe, replacing the current freeform text-based `SourceSelector` in the edit form.
- `taxonomy-multiselect-edit`: Meals, courses, and preparations in the recipe edit form use `MultiSelectDropdown`, consistent with the filter page.
- `multiselect-selected-first`: `MultiSelectDropdown` renders selected options first (alphabetically) and unselected options below (alphabetically), globally.

### Modified Capabilities

- `multi-select-filter-dropdown`: The selected-first sort order is a behavioral change to `MultiSelectDropdown`, which is also used by the recipe filter dropdowns. The filter UX improves as a side effect.

## Impact

**Files modified:**
- `src/components/recipes/RecipeDetail.tsx` — add optional `actions?: React.ReactNode` prop rendered top-right of title row
- `src/routes/recipes/$recipeId.tsx` — pass Edit `<Link>` as action when `isOwner`
- `src/components/ui/MultiSelectDropdown.tsx` — selected-first sort behavior
- `src/components/recipes/RecipeForm.tsx` — replace `SourceSelector` + tag buttons

**Files created:**
- `src/components/ui/SourcePickerDropdown.tsx` — new filterable single-select dropdown

**Tests updated:**
- `src/components/ui/__tests__/MultiSelectDropdown.test.tsx` — new sort behavior
- `src/components/recipes/__tests__/RecipeDetail.test.tsx` — actions prop
- `src/components/recipes/__tests__/RecipeForm.test.tsx` — new source + taxonomy UI
- `src/components/ui/__tests__/SourcePickerDropdown.test.tsx` — new component

**No API or database changes required.** All changes are UI-layer only.

## Non-Goals

- Creating new sources from within the edit form (deferred; managed elsewhere)
- Moving Delete or Export buttons — those remain at the bottom of the detail page
- Changing the filter page's source/category dropdowns directly (they benefit indirectly from the MultiSelectDropdown sort change)

## Risks

- **MultiSelectDropdown sort change is global**: Items reordering when checked could feel jarring in the filter context if a user is rapidly toggling. Low risk given the short list lengths involved.
- **SourcePickerDropdown data loading**: If source list is large, the in-panel search must filter client-side or debounce a server query. Initial implementation should use the existing `trpc.sources.search` with debounce.

## Open Questions

None — all scope decisions resolved in discovery.

---

*Scope change note: If scope changes after approval, proposal.md, design.md, specs, and tasks.md must be updated before implementation proceeds.*

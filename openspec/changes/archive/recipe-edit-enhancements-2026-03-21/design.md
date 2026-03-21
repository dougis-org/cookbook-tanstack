## Context

The recipe edit flow currently has two friction points: the Edit button is at the bottom of a long detail page (requiring the user to scroll past ingredients, instructions, and nutrition to reach it), and the edit form uses inconsistent UI patterns — tag buttons for taxonomy and a bare text input for source — that differ from the polished filter page dropdowns already in the codebase.

This change is UI-layer only. No API, schema, or database changes are required.

**Current state:**
- Edit button lives in `$recipeId.tsx` at bottom, after `<RecipeDetail>`
- `RecipeForm` tag buttons (meals/courses/preparations) at lines 280–370
- `SourceSelector` uses a freeform text input with debounced server search
- `MultiSelectDropdown` renders options in the order supplied by the caller

## Goals / Non-Goals

**Goals:**
- Surface Edit button in the recipe title row so owners can edit without scrolling
- Replace `SourceSelector` with a styled filterable single-select dropdown
- Align taxonomy editing UX with the filter page (MultiSelectDropdown)
- Make MultiSelectDropdown globally sort selected items first, then alpha

**Non-Goals:**
- Creating new sources from within the edit form
- Moving or changing Delete / Export buttons
- Changes to the filter page layout itself (it benefits as a side effect)
- Any server-side, API, or data model changes

## Decisions

### D1: `actions` prop on `RecipeDetail` (not portal/slot)

**Decision:** Add `actions?: React.ReactNode` prop to `RecipeDetail`, rendered in a `flex items-center justify-between` wrapper around the `<h1>`.

**Rationale:** `RecipeDetail` renders in multiple potential contexts. Passing actions as a prop keeps the component self-contained and avoids coupling it to router or auth concerns. The route (`$recipeId.tsx`) already knows `isOwner` and can pass the Link directly.

**Alternative considered:** Move the edit button into `RecipeDetail` with an `editHref` string prop. Rejected — ReactNode is more composable (allows future icons, tooltips, etc.).

### D2: New `SourcePickerDropdown` component (not extending `SourceSelector`)

**Decision:** Create `src/components/ui/SourcePickerDropdown.tsx` as a new component rather than modifying `SourceSelector`.

**Rationale:** `SourceSelector` has create-new semantics baked into its design (debounced input → create option). A picker-only component is simpler to build, test, and reason about. `SourceSelector` is preserved for future use cases (e.g., a dedicated source management page).

**Interface:**
```ts
interface SourcePickerDropdownProps {
  value: string          // currently selected source ID
  selectedName?: string  // display name for selected source
  onChange: (id: string, name: string) => void
  placeholder?: string
}
```

**Data fetching:** Uses `trpc.sources.search` with a controlled input and debounce (300ms), matching the existing SourceSelector pattern. When the input is empty, it fetches all sources (empty query = list all, per existing tRPC endpoint behavior). A "Clear" option is rendered when a source is selected.

**Visual style:** Matches `MultiSelectDropdown` — styled trigger button + absolute dropdown panel with scrollable list. Single-select: clicking an option selects it and closes the panel.

### D3: Replace tag buttons with `MultiSelectDropdown` in `RecipeForm`

**Decision:** Remove the three tag-button sections and render `MultiSelectDropdown` for meals, courses, and preparations in a `flex flex-wrap gap-2` container placed immediately after the Difficulty field.

**Rationale:** Re-uses the battle-tested component. Reduces `RecipeForm` by ~90 lines of repetitive code. Aligns the edit form visually with the filter page.

**No prop additions needed** to `MultiSelectDropdown` for this — the `selectedFirst` behavior (D4) is sufficient.

### D4: `selectedFirst` sort as always-on in `MultiSelectDropdown`

**Decision:** Sort options inside `MultiSelectDropdown` by: selected items first (alpha), then unselected (alpha). No prop — always on.

**Rationale:** The issue requests this for the edit form, and it's unambiguously better UX for filter dropdowns too (selected filters are immediately visible at the top). Making it always-on avoids a prop proliferation and keeps the component simple. The only downside is items reordering when toggled, which is minor given short list lengths.

**Implementation:**
```ts
const sortedOptions = useMemo(() => {
  const selectedSet = new Set(selectedIds)
  return [...options].sort((a, b) => {
    const aSelected = selectedSet.has(a.id)
    const bSelected = selectedSet.has(b.id)
    if (aSelected !== bSelected) return aSelected ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}, [options, selectedIds])
```
Single O(n log n) pass using a `Set` for O(1) lookup; `useMemo` avoids re-sorting on unrelated renders (e.g. `open` toggle).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| MultiSelectDropdown sort change is global — existing tests may assert option order | Update `MultiSelectDropdown` tests to reflect sorted order |
| SourcePickerDropdown requires sources to exist — empty state needs handling | Show "No sources found" empty state in panel |
| `trpc.sources.search` behavior with empty query needs verification | Check endpoint — if it returns nothing on empty query, fetch all sources with a separate `trpc.sources.list` call |

## Rollback / Mitigation

All changes are UI-only with no data migrations. Rollback = revert the PR. No feature flags needed.

## Open Questions

None.

---

### Proposal → Design Mapping

| Proposal Element | Design Decision |
|-----------------|----------------|
| Edit button in title row | D1: `actions` prop on `RecipeDetail` |
| Source → filterable dropdown | D2: New `SourcePickerDropdown` component |
| Taxonomy → `MultiSelectDropdown` | D3: Replace tag buttons in `RecipeForm` |
| Selected items float to top | D4: Always-on sort in `MultiSelectDropdown` |

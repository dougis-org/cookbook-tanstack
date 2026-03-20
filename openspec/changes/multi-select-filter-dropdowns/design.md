## Context

The recipe list page has a two-row filter system. Row 2 currently renders native `<select>` elements for Category (classificationId) and Source (sourceId), which only support a single selection. The backend and URL schema mirror this with scalar string fields. The issue (#165) requires multi-select for these two filters and a reusable component that will also replace parts of the More Filters panel in a future change.

The existing filter system uses a config-driven approach (`filterConfig.ts`, `filterConfigs.ts`) to control which filters appear in which row. This design extends that pattern rather than bypassing it.

## Goals / Non-Goals

**Goals:**
- Replace `<select>` elements in Row 2 with a custom `MultiSelectDropdown` component
- Support selecting multiple categories and multiple sources simultaneously
- Rename URL params and tRPC input from scalar to array form
- Keep the `MultiSelectDropdown` component fully generic (no domain knowledge baked in)
- Maintain the active-badges display (one badge per selected value)
- Update all tests

**Non-Goals:**
- Converting the More Filters panel (taxonomy chips) to use `MultiSelectDropdown` — that is a future change
- Changing Row 1 quick filter toggles
- Adding search/filter within the dropdown itself (future enhancement)
- Persisting filter selections beyond the URL (no localStorage)

## Decisions

### Decision 1: Custom button+popover over native `<select multiple>`

**Choice:** Custom `MultiSelectDropdown` with a button label and a positioned dropdown panel containing checkboxes.

**Why:** Native `<select multiple>` requires ctrl+click for multi-selection, which is unfamiliar to most users and visually inconsistent with the rest of the design system. The custom approach gives us: a summary label ("2 Categories"), per-option counts, consistent Tailwind dark styling, and click-outside-to-close behavior.

**Alternatives considered:**
- Native `<select multiple>` — poor UX, no counts, no custom styling
- Extending `TaxonomyChips` (chip buttons) — takes too much horizontal space in Row 2; also the issue explicitly asked for dropdown pattern

### Decision 2: Rename params to plural — `classificationIds` / `sourceIds`

**Choice:** Rename both the URL params and tRPC input fields from singular to plural.

**Why:** A scalar field cannot be transparently evolved into an array in the Zod URL schema without a wrapper — renaming is cleaner. The app is not yet released so no migration concerns for existing users.

**Alternatives considered:**
- Keep singular name but change type — Zod's URL schema would need a special coerce helper since query strings are always strings; error-prone
- Use a delimiter like `classificationId=foo,bar` — non-standard, harder to parse, breaks with IDs that contain commas

### Decision 3: MongoDB `$in` query for multi-value filter

**Choice:** `filter.classificationId = { $in: input.classificationIds }` (note: Mongoose field is still `classificationId` on the document — only the *input parameter* is renamed to plural).

**Why:** `$in` is the standard MongoDB operator for "field value is one of these". The Mongoose document model field name stays as `classificationId` (singular) since that's how the document is stored; only the API input naming changes.

### Decision 4: `MultiSelectDropdown` component API

```tsx
interface MultiSelectDropdownProps {
  options: { id: string; name: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder: string      // e.g. "All Categories"
  label: string            // e.g. "category" — used in summary: "2 categories"
  counts?: Record<string, number>
  dataTestId?: string
  ariaLabel?: string
}
```

Button label logic:
- 0 selected → show `placeholder`
- 1 selected → show the option name
- 2+ selected → show `"{n} {label}s"`

Dropdown panel: opens below button, `position: absolute`, `z-index` above other content. Closes on click-outside (via `useEffect` with `mousedown` listener) and on Escape key.

### Decision 5: Active badges — one per selected ID

The existing active badges section already handles arrays for `mealIds`/`courseIds`/`preparationIds` by mapping one badge per ID. Category and Source badges will follow the identical pattern.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Dropdown panel clipping at page edges | Use `min-w` on panel; on mobile the panel can be full-width via `w-full` |
| Click-outside listener memory leak | Clean up in `useEffect` return |
| Many categories/sources makes dropdown tall | Add `max-h` + `overflow-y-auto` to the panel |
| Zod URL schema change breaks old links | Acceptable — app unreleased; no migration needed |
| `classificationId` naming collision (document field vs input param) | Document clearly in tRPC router comments |

## Open Questions

None — all decisions resolved during exploration phase.

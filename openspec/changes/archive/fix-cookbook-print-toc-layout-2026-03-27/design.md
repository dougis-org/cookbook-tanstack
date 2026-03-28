## Context

The cookbook print view (`/cookbooks/$id/print`) and the standalone TOC page (`/cookbooks/$id/toc`) render the same logical structure — a Table of Contents listing recipes with position numbers and time metadata — but use divergent implementations. The TOC page has correct 2-column print layout and chapter grouping; the print page has neither.

Both routes already import from `src/components/cookbooks/CookbookStandaloneLayout.tsx`, which is the natural home for shared cookbook-page primitives (`RecipeIndexNumber`, `RecipeTimeSpan`, `CookbookEmptyState`, etc.).

The `printById` tRPC procedure already returns `chapters` alongside `recipes` (each recipe stub carries `chapterId`). The print route never destructured or used `chapters`.

**Proposal mapping:**

| Proposal element | Design decision |
|---|---|
| Shared TOC format across both routes | Extract `CookbookTocList` into `CookbookStandaloneLayout.tsx` |
| 2-column print layout in print view | `CookbookTocList` applies `print:columns-2 print:gap-8` |
| Chapter grouping in print view | `CookbookTocList` reads `chapters` prop, groups recipes by `chapterId` |
| Always use `<Link>` (Option A) | `CookbookTocList` renders `<Link to="/recipes/$recipeId">` for every entry |
| No server changes | `printById` already returns `chapters`; print route destructures it |

## Goals / Non-Goals

**Goals:**
- Single canonical TOC rendering component used by both routes
- Print view TOC matches standalone TOC: 2-column, chapter-aware, `break-inside-avoid` per entry
- No regression to screen layout of either route
- Tests cover the shared component and the corrected print behaviour

**Non-Goals:**
- Changing the tRPC API
- Altering the recipe-body sections in the print view
- Changing the screen appearance of either route
- Any new user-visible feature

## Decisions

### D1: Where to put `CookbookTocList`

**Decision:** Add to `src/components/cookbooks/CookbookStandaloneLayout.tsx`.

**Rationale:** Both routes already import from this file. Extracting here requires zero new file imports, follows the existing pattern of shared cookbook primitives, and keeps the component co-located with `RecipeIndexNumber` and `RecipeTimeSpan` which it composes.

**Alternative considered:** New file `src/components/cookbooks/CookbookTocList.tsx`. Rejected — adds a file for a component with a single consumer pair; the existing pattern is to group related small components in the layout file.

---

### D2: Component props shape

**Decision:**

```ts
interface TocRecipe {
  id: string
  name: string
  prepTime?: number | null
  cookTime?: number | null
  chapterId?: string | null
  orderIndex: number
}

interface TocChapter {
  id: string
  name: string
  orderIndex: number
}

function CookbookTocList({
  recipes,
  chapters,
}: {
  recipes: TocRecipe[]
  chapters: TocChapter[]
})
```

**Rationale:** Both `byId` and `printById` return this shape. The component does not need the full recipe type — using the minimal interface avoids coupling to either route's specific response type.

---

### D3: Always use `<Link>` (Option A)

**Decision:** `CookbookTocList` always renders recipe entries as `<Link to="/recipes/$recipeId">`.

**Rationale:** The TOC page already links. The print view TOC linking is harmless on screen (users can click through to a recipe) and actively useful in PDF export and browser print-preview. No conditional rendering needed, keeping the component simple.

**Alternative considered:** Accept an `asLinks` boolean prop. Rejected — adds complexity for no real benefit; links in a print context are benign.

---

### D4: CSS classes for 2-column layout

**Decision:** Carry forward exactly the classes already used in `toc.tsx`:

- `<ol>`: `space-y-2 print:space-y-0 print:columns-2 print:gap-8`
- `<li>`: `print:break-inside-avoid`
- Chapter `<ol>` (within chapter group): same as flat `<ol>`
- Chapter heading: `print:break-after-avoid` (already present in `toc.tsx`)

**Rationale:** These classes are tested and working in the standalone TOC. Reusing them exactly prevents divergence.

---

### D5: Global index numbering across chapters

**Decision:** Maintain a single incrementing counter across all chapter groups (same as `toc.tsx`).

**Rationale:** Recipe positions in the print view should match the TOC — a recipe numbered "7" in the TOC should be numbered "7" in the TOC section of the full print view.

---

### D6: `print.tsx` — no change to recipe body sections

**Decision:** Only the TOC `<ol>` block is replaced. The `{recipes.map((recipe) => <RecipeDetail ...>)}` section below is untouched.

**Rationale:** Out of scope per proposal. Keeps the diff minimal and reduces regression risk.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Visual regression if TOC classes are transcribed incorrectly | Side-by-side review of `toc.tsx` and the extracted component before PR merge |
| `CookbookStandaloneLayout.tsx` grows larger | File already holds ~130 lines of small exports; adding ~60 lines for `CookbookTocList` is acceptable |
| Existing E2E tests for the print view may not cover the TOC section | Add or update assertions in `src/e2e/cookbooks-print.spec.ts` as part of this change |

## Rollback / Mitigation

This change is fully reversible: revert the three modified files. No database migrations, no API changes, no deployment steps required.

**CI blocking policy:** If linting, type-checking, or tests fail in CI, do not merge. Fix forward — the change is small enough that patching is faster than reverting.

## Open Questions

None. All decisions were resolved during the exploration phase.

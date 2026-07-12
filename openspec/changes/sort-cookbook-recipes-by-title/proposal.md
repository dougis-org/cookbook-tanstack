## GitHub Issues

- #563

## Why

- Problem statement: Cookbook owners currently must drag-and-drop recipes one
  at a time to alphabetize a chapter or an entire cookbook. For cookbooks
  with many chapters/recipes this is slow and error-prone, and there is no
  way to quickly restore a "clean" alphabetical baseline after ad-hoc
  reordering.
- Why now: Directly requested in #563; the underlying reorder plumbing
  (`trpc.cookbooks.reorderRecipes`) already supports the exact update shape
  needed, so the feature is low-risk to add.
- Business/user impact: Faster cookbook organization for users with large
  collections; reduces manual drag-and-drop drudgery, particularly right
  after using "Build Chapters by Category" or bulk-adding recipes.

## Problem Space

- Current behavior: Recipe order within a chapter (and within the
  unchaptered bucket of a chapter-free cookbook) is set only via manual
  drag-and-drop, persisted through `reorderRecipes`. There is no
  programmatic way to alphabetize.
- Desired behavior:
  - A cookbook-level "Resort All" action title-sorts every recipe in the
    cookbook: each chapter's recipes are sorted independently, and any
    unchaptered recipes are sorted independently within their own bucket
    (chapter membership is never changed, only order within a bucket).
  - A per-chapter sort action (icon in `ChapterHeader`, alongside the
    existing Rename/Delete icons) title-sorts only that one chapter's
    recipes.
  - Both compare titles case-insensitively and ignore a single leading
    article ("a ", "an ", or "the ", case-insensitive) when computing sort
    order.
  - Both are destructive to manual ordering and require an explicit confirm
    step before executing.
- Constraints:
  - No backend schema or endpoint changes: both actions must be implemented
    as client-side sort + a call to the existing
    `trpc.cookbooks.reorderRecipes` mutation, flat `recipeIds` form (see
    design.md for why the flat form — not the chapter-aware form — is the
    right fit).
  - Must not alter chapter membership (`chapterId`) of any recipe — only
    relative order within its current bucket changes.
  - Sort must be stable and deterministic for titles that are equal after
    normalization (e.g. two recipes both named "The Best Chili" and
    "Best Chili").
- Assumptions:
  - "Ignore leading articles" means a literal leading `"a "`, `"an "`, or
    `"the "` (case-insensitive, with trailing space) — the issue names only
    "a" and "the", but "an" was confirmed in scope during proposal review
    to match conventional library-sort behavior.
  - Recipe `name` is already present on the client for every recipe shown
    on the cookbook edit page (`CookbookRecipe.name`), so no additional
    fetch is required to compute the sort.
- Edge cases considered:
  - Titles that are just an article with no following word (e.g. a recipe
    literally titled "A" or "The") must not be stripped to an empty string
    for comparison — the whole title is used as the sort key in that case.
  - Titles where the article is not followed by a space before other text
    (e.g. "Apple Pie") must not have any characters stripped.
  - Cookbooks with zero chapters (flat/unchaptered cookbook): "Resort All"
    still applies, sorting the single flat list.
  - Chapters with 0 or 1 recipes: sort action is a no-op but should still
    be available (or safely disabled) without erroring.
  - Concurrent edits: if another collaborator changes the cookbook between
    load and confirm, the sort submits based on the client's last-known
    recipe set; standard `reorderRecipes` behavior (unknown IDs currently
    keep their existing `orderIndex`) already tolerates this without new
    handling.

## Scope

### In Scope

- New shared, pure title-normalization/sort-comparator utility used by both
  entry points.
- Cookbook-level "Resort All" button on the cookbook edit page.
- Per-chapter sort icon (ArrowDown, Lucide) in `ChapterHeader`, next to
  Rename/Delete.
- Confirm-before-execute UX for both actions (reusing the existing
  `ConfirmModal` pattern already used for chapter delete).
- Unit tests for the sort/normalization utility (article stripping, case
  insensitivity, edge cases from "Edge cases considered" above).
- Component/integration tests for both buttons calling
  `reorderRecipes` with the expected `recipeIds` payload.
- A one-line doc-comment correction on `reorderRecipes`'s flat-format
  handling in `src/server/trpc/routers/cookbooks.ts`, which currently
  states the format is "kept for chapter-free cookbooks" — inaccurate,
  since this change relies on it working for chaptered cookbooks too.

### Out of Scope

- Any change to the `reorderRecipes` tRPC input schema or its validation
  logic.
- Sorting by any field other than recipe title (e.g. prep time, date
  added).
- Persisting a "last sort" preference or auto-sorting on recipe add.
- Reordering chapters themselves (separate existing feature via
  `reorderChapters`).
- Changing which chapter a recipe belongs to.
- Undo/redo beyond the pre-execute confirm step.

## What Changes

- Add `src/lib/recipeTitleSort.ts` (or similar) exporting a pure
  `titleSortKey(name: string): string` (or equivalent comparator) that
  strips a single leading "a "/"the " (case-insensitive) and normalizes
  case for comparison, plus a `sortByTitle<T>(items, getTitle)` helper.
- Add a "Resort All" button to `src/routes/cookbooks.$cookbookId.tsx`,
  gated by `canEdit`, that opens a confirm modal and, on confirm, computes
  a title-sorted `recipeIds` array across all cookbook recipes (chaptered
  and unchaptered) and calls the existing `reorderMutation` with the flat
  `recipeIds` payload.
- Add an ArrowDown sort icon button to `ChapterHeader` (same file), gated
  by `canEdit`, with `aria-label`/tooltip communicating it will sort that
  chapter's recipes by title. On confirm, computes a title-sorted
  `recipeIds` array scoped to that chapter's recipes only and calls the
  same mutation.
- Correct the stale comment in `reorderRecipes`'s flat-format branch in
  `src/server/trpc/routers/cookbooks.ts`.

## Risks

- Risk: Reusing the flat `recipeIds` form for a large cookbook submits
  every recipe ID in the cookbook on every "Resort All" call, which is
  more payload than a chapter-scoped call.
  - Impact: Marginally larger request size on Resort All; no correctness
    issue given current cookbook sizes.
  - Mitigation: Accept as-is — this mirrors the size of a full
    `chapters`-form payload already sent by existing drag-and-drop
    reordering, so it is not a new order of magnitude.
- Risk: Confirm-modal fatigue — adding a second confirm-gated destructive
  action type (beyond chapter delete) could feel heavy for a "just sort
  it" action.
  - Impact: Minor UX friction.
  - Mitigation: Explicitly requested by the requester in exploration; copy
    should be short and single-click-to-confirm.
- Risk: Article-stripping regex edge cases (unicode whitespace, multiple
  leading articles, non-English titles) could produce surprising sort
  order.
  - Impact: Low — cosmetic sort-order surprises only, no data loss.
  - Mitigation: Cover enumerated edge cases in unit tests; keep the rule
    literally scoped to "a " and "the " as specified in the issue, not a
    broader linguistic implementation.

## Open Questions

Resolved during proposal review (2026-07-11):

- Article scope: "a ", "an ", and "the " (case-insensitive) are all
  ignorable leading articles.
- Button placement: "Resort All" is placed next to the existing "Build
  Chapters by Category" button in the cookbook edit toolbar, grouping it
  with the other bulk-organization action.

No unresolved blocking questions remain. Exact confirm-modal copy is left
as an implementation detail in design.md.

## Non-Goals

- Multi-key sort (e.g. sort by title then by prep time as tiebreaker
  beyond stable-sort default behavior).
- Locale/language-specific collation beyond standard `localeCompare`.
- A settings toggle to change which articles are ignored.

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.

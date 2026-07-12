## Context

- Relevant architecture: `src/routes/cookbooks.$cookbookId.tsx` (cookbook
  edit page, client state + DnD reorder handlers), `ChapterHeader`
  component (same file), `src/server/trpc/routers/cookbooks.ts`
  (`reorderRecipes` mutation), `src/db/models/cookbook.ts` (flat
  `recipes: [{ recipeId, orderIndex, chapterId? }]` array; `orderIndex` is
  only meaningful relative to other recipes sharing the same `chapterId`
  bucket, since all reads filter-by-`chapterId`-then-sort-by-`orderIndex`).
- Dependencies: existing `trpc.cookbooks.reorderRecipes` mutation (no
  changes to its Zod input schema); existing `ConfirmModal` component used
  today for chapter delete; `lucide-react` for the new icon (`ArrowDownAZ`,
  per requester direction — placed alongside the existing `Pencil`
  (rename) and `Trash2` (delete) icons in `ChapterHeader`).
- Interfaces/contracts touched: none at the tRPC/schema level. Only new
  client-side code (a small utility module + two new UI affordances) and a
  one-line comment fix in `cookbooks.ts`.

## Goals / Non-Goals

### Goals

- Provide a cookbook-level action that title-sorts every recipe bucket
  (each chapter, plus the unchaptered bucket if present) independently.
- Provide a chapter-level action that title-sorts only one chapter's
  recipes.
- Centralize article-stripping/case-insensitive comparison in one tested,
  pure utility used by both entry points.
- Require explicit user confirmation before either action mutates data.
- Ship with zero backend/schema changes.

### Non-Goals

- Changing chapter membership of any recipe.
- Introducing a new tRPC procedure or altering `reorderRecipes`'s
  validation.
- Configurable sort keys, locales, or article lists.

## Decisions

### Decision 1: Reuse `reorderRecipes`'s flat `recipeIds` form for both entry points

- Chosen: Both "Resort All" and the per-chapter sort icon call the
  existing `trpc.cookbooks.reorderRecipes` mutation using its flat
  `{ cookbookId, recipeIds: string[] }` input — the same form already used
  for flat (chapter-free) drag-and-drop reordering — rather than its
  chapter-aware `{ cookbookId, chapters: [...] }` form.
- Alternatives considered:
  1. Chapter-aware `chapters` form for "Resort All": rejected because its
     server-side validation requires the submitted `chapters[].recipeIds`
     to cover **every** recipe stub in the cookbook with no leftovers
     (`cookbooks.ts` around the `uniqueIncoming.size !== stubByRecipeId.size`
     check). Unchaptered recipes have no `chapterId` to assign them to in
     that payload shape, so a cookbook with any unchaptered recipes
     alongside real chapters cannot be represented — this exact gap is
     already latent in today's chapter-drag-and-drop path, which silently
     omits unchaptered recipes from its `chaptersPayload`.
  2. New dedicated `sortCookbookByTitle` / `sortChapterByTitle` tRPC
     procedures: rejected — unnecessary backend surface when the flat form
     already does what's needed (see Rationale).
- Rationale: The flat-form handler
  (`existingStubs.map(stub => { newIndex = recipeIds.indexOf(stub.recipeId); orderIndex: newIndex >= 0 ? newIndex : stub.orderIndex })`)
  is forgiving: any recipe not present in the submitted array simply keeps
  its current `orderIndex`, and `chapterId` is never touched by this
  branch. Because every read path filters by `chapterId` before sorting by
  `orderIndex`, only the *relative* order within a shared `chapterId` (or
  the unchaptered/`undefined` bucket) matters — absolute index collisions
  across different buckets are harmless. This lets:
  - "Resort All" submit **all** recipe IDs in the cookbook (chaptered and
    unchaptered), globally sorted by title — each bucket comes out
    alphabetized as a side effect, with zero risk of the "must cover every
    recipe" validation failure the chapter-aware form has.
  - The per-chapter sort submit **only that chapter's** recipe IDs, sorted
    — every other recipe (other chapters, unchaptered) keeps its existing
    `orderIndex` untouched, exactly as desired.
- Trade-offs: "Resort All" sends a larger payload (every recipe ID in the
  cookbook) than a chapter-scoped call would need in isolation. Accepted:
  this is the same order of magnitude as the payload already sent by
  today's `chapters`-form drag-and-drop reorder, so it introduces no new
  scaling concern.

### Decision 2: Single shared title-sort utility module

- Chosen: Add `src/lib/recipeTitleSort.ts` exporting:
  - `titleSortKey(title: string): string` — lowercases the title, then
    strips one leading `a `, `an `, or `the ` (case-insensitive, matched
    via `/^(a|an|the)\s+/i` against the *original* title before
    lowercasing is irrelevant since the regex is case-insensitive; applied
    once, not recursively).
  - `compareByTitle(a: string, b: string): number` — compares
    `titleSortKey(a)` vs `titleSortKey(b)` using `String.prototype
    .localeCompare` (consistent with existing `localeCompare` usage
    elsewhere in the codebase, e.g. `CookbookStandaloneLayout.tsx`,
    `SingleSelectDropdown.tsx`).
  - `sortIdsByTitle<T>(items: T[], getId: (item: T) => string, getTitle: (item: T) => string): string[]`
    — convenience wrapper returning a stably-sorted array of IDs, used
    directly by both call sites to build the `recipeIds` payload.
- Alternatives considered: inlining the regex/comparator separately at
  each of the two call sites — rejected to avoid drift between the
  cookbook-level and chapter-level behavior (the issue explicitly requires
  identical normalization rules at both levels).
- Rationale: One normalization rule, one place to test it, both UI entry
  points import it.
- Trade-offs: none material; this is a small, pure, dependency-free
  module.

### Decision 3: Article regex behavior for edge cases

- Chosen: `/^(a|an|the)\s+/i` — requires the article to be followed by
  whitespace and at least one more character to strip. A title that is
  exactly `"A"`, `"An"`, or `"The"` (no trailing content) does not match
  (no trailing whitespace present) and is sorted on its full original
  text. A title like `"Apple Pie"` does not match because `"Apple"` is not
  `"a"` followed by a word boundary/space — the regex requires the article
  token itself, not a prefix of a longer word.
- Alternatives considered: word-boundary regex without requiring a
  trailing space (`/^(a|an|the)\b/i`) — rejected because `\b` alone would
  still work correctly for spacing but is less explicit than requiring
  literal `\s+`; requiring `\s+` also naturally handles multiple spaces
  after the article (e.g. `"The  Best Chili"`) by stripping all of them
  via the `+` quantifier, leaving a clean remainder for comparison.
- Rationale: Matches the issue's literal examples ("a " / "the ", i.e.
  article-plus-space) while safely handling the "Apple"-vs-"A pple"
  ambiguity and empty-after-strip edge cases identified in exploration.
- Trade-offs: Only strips a single leading article occurrence — a title
  like `"The A Team"` strips only `"The "`, leaving `"A Team"` as the
  comparison key (not further stripped to `"Team"`). This matches
  conventional single-pass title-sort behavior (e.g. library card
  catalogs) and avoids over-stripping.

### Decision 4: Confirm-before-execute UX reuses existing `ConfirmModal`

- Chosen: Both "Resort All" and the per-chapter sort icon open the
  existing generic `ConfirmModal` component (already used for chapter
  delete) with action-specific title/body copy, rather than introducing a
  new modal component.
- Alternatives considered: a dedicated `SortConfirmModal` — rejected as
  unnecessary; `ConfirmModal` already supports custom `title`/`body`/
  `confirmLabel` and a `danger` flag is unnecessary here since this is
  reorder-only, not deletion (no `danger` styling needed, but the copy
  should still make clear it overwrites manual order).
- Rationale: Keeps parity with existing patterns in the file; minimizes
  new component surface.
- Trade-offs: none material.

### Decision 5: Placement

- Chosen: "Resort All" button placed next to the existing "Build Chapters
  by Category" button in the cookbook edit page's toolbar (per requester
  direction during proposal review). The per-chapter sort icon is placed
  in `ChapterHeader`'s existing hover-revealed icon row, after `Pencil`
  (rename) and before/after `Trash2` (delete) — using Lucide's
  `ArrowDownAZ` icon (per requester direction), with
  `aria-label="Sort {chapter.name} recipes by title"` and a
  `title`/tooltip of "Will sort the chapter by recipe title", following
  the exact style conventions (`text-[var(--theme-fg-subtle)]
  hover:text-[var(--theme-accent)] transition-colors`, `w-3.5 h-3.5`) of
  the adjacent icons.
- Alternatives considered: placing "Resort All" next to "Add Recipe" —
  rejected per requester direction (grouping with bulk-organization
  actions reads more clearly than grouping with the primary add action).
- Rationale: Direct requester decision; consistent with existing icon
  patterns.
- Trade-offs: none material.

## Proposal to Design Mapping

- Proposal element: Cookbook-level "Resort All" sorts every chapter plus
  the unchaptered bucket, independently, without changing chapter
  membership.
  - Design decision: Decision 1 (flat `recipeIds` form, globally sorted
    across all recipes) + Decision 5 (placement).
  - Validation approach: Integration test asserting `reorderRecipes` is
    called with a `recipeIds` array, and that recomputing per-chapter /
    per-unchaptered-bucket order from the resulting server state is
    alphabetical within each bucket.
- Proposal element: Per-chapter sort icon sorts only that chapter's
  recipes.
  - Design decision: Decision 1 (flat `recipeIds` form, scoped to one
    chapter) + Decision 5 (icon placement/labeling).
  - Validation approach: Integration test asserting other chapters'
    recipe order/`orderIndex` is unaffected after a single-chapter sort.
- Proposal element: Case-insensitive, article-ignoring comparison (a/an/the).
  - Design decision: Decision 2 (shared utility) + Decision 3 (regex
    behavior).
  - Validation approach: Unit tests directly against `titleSortKey` /
    `compareByTitle` covering: mixed case, leading "A ", "An ", "The ",
    titles that are only an article, titles where an article-like prefix
    is part of a longer word ("Apple"), multiple internal spaces.
- Proposal element: Confirm step required before either destructive sort.
  - Design decision: Decision 4.
  - Validation approach: Component test asserting the mutation is NOT
    called until the confirm modal's confirm action is triggered, and IS
    called after confirmation.
- Proposal element: No backend schema changes; correct stale comment in
  `reorderRecipes`.
  - Design decision: Decision 1 (rationale section explains why no schema
    change is needed).
  - Validation approach: Diff review — `cookbooks.ts` schema/Zod shape is
    unchanged; only the flat-format branch's comment text changes.

## Functional Requirements Mapping

- Requirement: "Resort All" title-sorts every recipe in the cookbook,
  chapter memberships unchanged.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: `specs/cookbook-chapters/spec.md`
    (new "Sort recipes by title" requirement, to be added in the specs
    artifact).
  - Testability notes: Deterministic given a fixed recipe title set;
    covered by integration test building expected `recipeIds` order and
    asserting mutation payload / resulting read-back order.
- Requirement: Per-chapter sort icon title-sorts only its chapter.
  - Design element: Decision 1, Decision 5.
  - Testability notes: Assert unaffected chapters' `orderIndex`/order is
    byte-for-byte unchanged pre/post.
- Requirement: Sort ignores case and a single leading "a "/"an "/"the ".
  - Design element: Decision 2, Decision 3.
  - Testability notes: Pure-function unit tests, no mocking required.
- Requirement: Both actions require confirmation before executing.
  - Design element: Decision 4.
  - Testability notes: Component test on modal open/confirm/cancel flow.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Sort must not corrupt or drop any recipe from the
    cookbook (all IDs preserved, only order changes).
  - Design element: Decision 1 (flat form's forgiving fallback to
    existing `orderIndex` for anything not submitted; "Resort All"
    submits the full ID set precisely to avoid any drop).
  - Acceptance criteria reference: `specs/cookbook-chapters/spec.md`.
  - Testability notes: Integration test asserting recipe count and ID set
    before/after sort are identical (set equality), only order differs.
- Requirement category: usability
  - Requirement: No accidental data loss from a stray click — sort is
    confirm-gated.
  - Design element: Decision 4.
  - Acceptance criteria reference: `specs/cookbook-chapters/spec.md`.
  - Testability notes: Component test (see Functional Requirements
    Mapping above).
- Requirement category: performance
  - Requirement: "Resort All" payload size stays within the same order of
    magnitude as existing chapter-aware drag-and-drop reorder calls.
  - Design element: Decision 1 (Trade-offs).
  - Testability notes: Not independently tested — accepted qualitatively
    given existing reorder calls already send comparable payloads;
    revisit only if cookbook sizes grow to a scale where this becomes a
    measured concern (out of scope here).

## Risks / Trade-offs

- Risk/trade-off: "Resort All" always submits every recipe ID in the
  cookbook, even for cookbooks with many chapters/recipes.
  - Impact: Marginally larger request than a chapter-scoped call; no
    functional issue.
  - Mitigation: Accepted (see Decision 1 Trade-offs); revisit only if
    real-world payload sizes become a measured problem.
- Risk/trade-off: Article-stripping is intentionally simple (single-pass,
  fixed article list) and won't handle non-English articles or unusual
  punctuation.
  - Impact: Cosmetic sort-order surprises for edge-case titles only.
  - Mitigation: Explicitly scoped as a Non-Goal in the proposal; covered
    by unit tests for the defined edge cases only.
- Risk/trade-off: Reusing `ConfirmModal` generically for two different
  sort actions (cookbook-wide vs. single-chapter) means the copy must
  clearly disambiguate scope so users don't confuse "sort everything" with
  "sort this chapter."
  - Impact: Potential user confusion if copy is unclear.
  - Mitigation: Distinct, explicit body text per call site (e.g. "Sort
    every chapter's recipes alphabetically by title?" vs. "Sort this
    chapter's recipes alphabetically by title?").

## Rollback / Mitigation

- Rollback trigger: Bug found in sort logic post-release (e.g. incorrect
  article stripping, chapter membership accidentally altered, or data
  loss).
- Rollback steps: Revert the PR introducing this change (client-only diff
  plus a comment-only backend change — no schema/migration to reverse).
  Because no chapter membership or `chapterId` values are ever written by
  this feature, reverting the UI/utility code fully restores prior
  behavior with no residual data cleanup needed.
- Data migration considerations: None — this feature only reorders
  existing `orderIndex` values via the pre-existing `reorderRecipes`
  mutation; it introduces no new fields, migrations, or irreversible
  writes.
- Verification after rollback: Confirm the "Resort All" button and
  per-chapter sort icon no longer render, and that existing manual
  drag-and-drop reordering still functions (regression check on the
  unchanged `reorderRecipes` code paths).

## Operational Blocking Policy

- If CI checks fail: Fix the failing check (lint/type/test) before
  merging; this change has no infrastructure or deploy-pipeline
  dependency, so CI failures are expected to be directly attributable to
  the change's own code.
- If security checks fail: Not expected — no new endpoints, no new input
  surface beyond IDs already accepted by `reorderRecipes` today. If a
  scanner flags something, treat as a real finding and address before
  merge; do not suppress.
- If required reviews are blocked/stale: Follow standard project PR
  process (see `docs/standards/ci-cd.md`); ping reviewer, do not bypass
  required review.
- Escalation path and timeout: If blocked >2 business days with no
  reviewer response, escalate to the requester (dougis) directly, since
  this is a single-owner project.

## Open Questions

None outstanding — all proposal-stage open questions were resolved during
proposal review (article scope includes "an "; button placement is next
to "Build Chapters by Category"). Exact confirm-modal copy strings will be
finalized during implementation (tasks.md) without requiring further
design sign-off.

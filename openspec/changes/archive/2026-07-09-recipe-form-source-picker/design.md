## Context

- Relevant architecture:
  - `src/components/recipes/RecipeForm.tsx` — recipe edit/create form; renders `CategoryPickerDropdown` for classification and (today) `SourceSelector` for source.
  - `src/components/ui/CategoryPickerDropdown.tsx` / `src/components/ui/SourcePickerDropdown.tsx` — thin wrappers over `src/components/ui/SingleSelectDropdown.tsx`, a client-side-filtered, fully-loaded sorted dropdown used for small, fixed lists (classifications) and, today, unbounded lists (all sources, in the recipes filter bar only).
  - `src/components/ui/SourceSelector.tsx` — bespoke server-search-as-you-type input with inline create and personal-name reveal, used only in `RecipeForm.tsx`.
  - `src/server/trpc/routers/sources.ts` — `list` (unbounded, used by filter bar with `recipeCount`), `search` (regex, hard-capped at 10), `byId`, `create` (`protectedProcedure`).
  - `src/routes/recipes/index.tsx` — recipes filter bar, consumes `sources.list` directly; must remain unaffected.
  - `src/db/seeds/sources.ts` / `src/db/models/source.test.ts` — single seeded source with `slug: "personal"`, `name: "Personal"`.
- Dependencies: `@tanstack/react-query` (query caching/invalidation), existing `trpc` client, `zod` for input validation, Mongoose `Source`/`Recipe` models.
- Interfaces/contracts touched:
  - New tRPC query `sources.listPage`.
  - Modified tRPC query `sources.search` (input schema bounds, higher limit).
  - New/changed React components in `src/components/recipes/` and `src/components/ui/`.
  - `RecipeForm.tsx`'s Source field JSX and related local state.

## Goals / Non-Goals

### Goals

- Give the recipe edit form's Source field the same sorted, click-to-open dropdown interaction as Category.
- Keep source browsing/searching server-side and bounded (initial page of 100, paginated further via infinite scroll), since sources are user-generated and unbounded in count.
- Preserve personal-source-name behavior without weakening its existing network-layer privacy guarantee.
- Move "create a new source" out of the picker into a standalone, source-specific affordance (button + modal).
- Leave the recipes filter bar's existing `sources.list` usage completely unaffected.

### Non-Goals

- Changing Category/classification behavior or adding `classifications.create`.
- Building a resource-agnostic "create new entity" component usable by both Source and Category.
- Repaginating or otherwise changing `sources.list`.
- Supporting source rename/delete/merge from the recipe form.

## Decisions

### Decision 1: Add a new paginated endpoint (`sources.listPage`) instead of modifying `sources.list`

- Chosen: New `publicProcedure` `sources.listPage` with input `{ cursor: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(100).default(100) }`, querying `Source.find().sort({ name: 1 }).skip(cursor).limit(limit)`, returning `{ items: Array<{ id, name, url, slug }>, nextCursor: number | null }` (`nextCursor` is `cursor + items.length` when a full page was returned, else `null`).
- Alternatives considered:
  - Modify `sources.list` to accept optional pagination params. Rejected: the filter bar calls `sources.list` unparameterized expecting the full set with `recipeCount`; adding optional params risks accidental behavior drift and complicates that call site's typing for no benefit.
  - Cursor based on last document's `name`/`_id` (keyset pagination) instead of numeric offset. Rejected for this change: offset/skip is simpler to reason about at the expected data scale (hundreds to low thousands of sources) and matches the "3 increasing is fine" guidance to keep this straightforward; keyset pagination can be a follow-up if `Source` collections grow large enough for `skip()` cost to matter.
- Rationale: Keeps the filter bar's contract untouched (per proposal constraint) while giving the new picker a purpose-built, bounded, sorted contract.
- Trade-offs: Slight duplication of query-shaping logic between `list` and `listPage` (both map the same `Source` fields); acceptable given the small size of that mapping and the explicit goal of not coupling the two call sites.

### Decision 2: Extend `sources.search` bounds rather than adding a separate paginated search endpoint

- Chosen: Update `sources.search` input to `{ query: z.string().trim().min(1).max(255), limit: z.number().int().min(1).max(100).default(100) }`, sort results by `name` ascending, and raise the effective cap from 10 to the validated `limit` (default 100). Search remains single-shot (no cursor) — approved as sufficient for this change.
- Alternatives considered: Cursor-paginated search matching `listPage`. Rejected for now: bumping the bound was explicitly approved as sufficient during exploration; revisit only if a real need for deeper search pagination emerges.
- Rationale: Matches the approved scope exactly and keeps the change minimal.
- Trade-offs: If a source collection grows very large and a search term is broad (e.g. a single common letter), the top 100 alphabetical matches are returned rather than the "best" matches — acceptable since sources are typically searched by more specific fragments (title/author words).

### Decision 3: New recipe-form-specific picker component, not a modification of `SourcePickerDropdown`

- Chosen: Introduce `src/components/recipes/RecipeSourcePicker.tsx`, a composite component used only by `RecipeForm.tsx`. It composes:
  - A new lower-level primitive, `src/components/ui/PaginatedSingleSelectDropdown.tsx`, which owns: initial page fetch on open (`sources.listPage`), infinite-scroll fetch-and-append on scroll-to-bottom (no client-side re-sort of already-loaded items — new pages are appended in the server-returned order), and debounced server-side search (`sources.search`) that replaces the displayed list while a query is active; when the query is cleared, browsing-mode pagination resumes from the last-loaded page state.
  - Personal-name reveal logic ported from `SourceSelector` (`personalSourceName` / `onPersonalSourceNameChange` props), keyed off the selected option's `slug === "personal"`.
  - A "+ Add New Source" button rendered alongside the dropdown trigger (not inside its popover), which opens `AddSourceModal`.
  - `SourcePickerDropdown` (used by the recipes filter bar) is left untouched, still backed by `sources.list` and `SingleSelectDropdown`.
- Alternatives considered:
  - Modify `SourcePickerDropdown`/`SingleSelectDropdown` in place to support a "paginated mode" flag. Rejected: `SingleSelectDropdown` is deliberately simple (fully-loaded, client-filtered) and shared by Category; overloading it with server-pagination branching increases complexity and risk for a component also used elsewhere, for no shared benefit today.
  - Generalize immediately into a shared paginated-dropdown-with-create component spanning Source and Category. Rejected per proposal's explicit non-goal (Category has no create capability; premature abstraction).
- Rationale: Isolates new complexity (pagination, search-mode switching, personal-name, create-button slot) to the one call site that needs it, without risking the simpler, already-working `SingleSelectDropdown`/`SourcePickerDropdown`/`CategoryPickerDropdown` trio.
- Trade-offs: Two dropdown primitives now exist (`SingleSelectDropdown` and `PaginatedSingleSelectDropdown`) with some structural similarity (trigger button, popover, listbox markup). Accepted for now; a future consolidation could extract shared presentational pieces if a third consumer emerges.

### Decision 4: Standalone create flow via a dedicated modal component

- Chosen: `src/components/recipes/AddSourceModal.tsx` — a modal with `name` (required) and `url` (optional) fields, calling `sources.create` (already `protectedProcedure`, no auth change needed). On success: invalidate `sources.listPage` and `sources.search` query caches, call back to `RecipeSourcePicker` with the new `{ id, name }` so it's selected immediately, and close the modal. The modal pre-fills `name` from whatever text the user had typed into the picker's search box, if any (per proposal's UX mitigation).
- Alternatives considered: Inline "Create `<name>`" row inside the dropdown popover (today's `SourceSelector` behavior). Rejected per proposal scope: creation is explicitly being pulled out of the picker into its own tool.
- Rationale: Matches the approved design; keeps the picker's responsibility limited to browse/search/select.
- Trade-offs: One extra click/step to create a source compared to today's inline flow; mitigated by prominent placement and name pre-fill.

## Proposal to Design Mapping

- Proposal element: Recipe edit form Source field should use the same sorted-dropdown pattern as Category.
  - Design decision: Decision 3 (`RecipeSourcePicker` + `PaginatedSingleSelectDropdown`).
  - Validation approach: Component test asserting click-to-open trigger, sorted listbox rendering, and visual/interaction parity checklist against `CategoryPickerDropdown`.
- Proposal element: Keep filtering server-side; load first 100, paginate via infinite scroll when unsorted... i.e. bounded initial load with further pagination.
  - Design decision: Decision 1 (`sources.listPage`) and Decision 3's infinite-scroll behavior in `PaginatedSingleSelectDropdown`.
  - Validation approach: Server unit test asserting `listPage` returns ≤100 items, sorted by name, with correct `nextCursor`; component test simulating scroll-to-bottom triggering a second page fetch and appending without re-sorting.
- Proposal element: Bump `sources.search`'s limit with explicit validation.
  - Design decision: Decision 2.
  - Validation approach: Server unit test asserting rejection of out-of-bounds `limit`/empty `query`, and that up to the validated max is returned.
- Proposal element: Preserve personal-source-name reveal and its privacy guarantee.
  - Design decision: Decision 3 (ported logic), reusing existing wiring rather than reimplementing.
  - Validation approach: Re-run/extend `src/e2e/personal-source-privacy.spec.ts` against the new picker; component test asserting the "Personal Name" field only appears when `slug === "personal"` is selected.
- Proposal element: Move "create new source" out of the picker into a standalone button + modal, source-only.
  - Design decision: Decision 4 (`AddSourceModal`).
  - Validation approach: Component test asserting the modal is reachable via a button outside the dropdown popover, calls `sources.create`, and selects the created source on success; assert no equivalent affordance exists on `CategoryPickerDropdown`.
- Proposal element: Do not change `sources.list` or the recipes filter bar.
  - Design decision: Decision 1 (explicitly leaves `sources.list` untouched).
  - Validation approach: Existing filter bar tests (`src/routes/__tests__/-recipes.test.tsx` or equivalent) continue to pass unmodified.

## Functional Requirements Mapping

- Requirement: The Source field renders as a sorted, click-to-open dropdown consistent with Category.
  - Design element: `RecipeSourcePicker` / `PaginatedSingleSelectDropdown` (Decision 3).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Source dropdown opens sorted alphabetically".
  - Testability notes: Component test mounts `RecipeForm`/`RecipeSourcePicker`, opens the picker, asserts initial items are alphabetically ordered.
- Requirement: Opening the picker loads the first page (≤100) of sources from the server.
  - Design element: `sources.listPage` (Decision 1).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Opening the picker loads the first page of sources".
  - Testability notes: Server test on `listPage`; component test mocking tRPC to assert the call and item count.
- Requirement: Scrolling to the bottom of the browsing list fetches and appends the next page without re-sorting already-loaded items.
  - Design element: `PaginatedSingleSelectDropdown` infinite-scroll handler (Decision 3).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Scrolling to the bottom loads the next page".
  - Testability notes: Component test simulating a scroll event at the listbox's scroll bounds, asserting a second `listPage` call with the correct cursor and that item order is preserved (append, not resort).
- Requirement: Typing in the picker performs a server-side search that replaces the displayed list.
  - Design element: `sources.search` (Decision 2) wired into `PaginatedSingleSelectDropdown`.
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Typing a query performs a server-side search".
  - Testability notes: Component test typing into the search input, asserting a debounced `sources.search` call and that displayed results reflect the mocked response, not the previously-loaded page.
- Requirement: Selecting the seeded "Personal" source reveals a "Personal Name" input; deselecting hides it.
  - Design element: Ported personal-name logic in `RecipeSourcePicker` (Decision 3).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Selecting Personal reveals the personal name field".
  - Testability notes: Component test selecting the option with `slug: "personal"`, asserting the input appears; selecting another source, asserting it disappears.
- Requirement: A "+ Add New Source" action, separate from the picker's popover, opens a modal to create a new source.
  - Design element: `AddSourceModal` (Decision 4).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Add New Source opens a standalone creation modal".
  - Testability notes: Component test asserting the button exists outside the dropdown's `role="listbox"`/popover DOM subtree and that activating it opens the modal.
- Requirement: Creating a source via the modal selects it in the picker and closes the modal.
  - Design element: `AddSourceModal` success callback (Decision 4).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Creating a source selects it and closes the modal".
  - Testability notes: Component test mocking `sources.create` success, asserting picker value updates and modal unmounts.
- Requirement: The Category field's dropdown and lack of create capability are unchanged.
  - Design element: `CategoryPickerDropdown` untouched (explicit non-goal).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Category field behavior is unchanged".
  - Testability notes: Existing `CategoryPickerDropdown`/`RecipeForm` tests continue to pass without modification.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: The picker never loads more than one bounded page (≤100 sources) into memory at a time without an explicit further scroll action, regardless of total source count.
  - Design element: `sources.listPage` limit bound (Decision 1) plus append-only pagination in `PaginatedSingleSelectDropdown` (Decision 3).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Initial load is bounded to one page".
  - Testability notes: Server test asserting `listPage` rejects/clamps `limit` above 100; component test asserting only one `listPage` call occurs before any scroll interaction.
- Requirement category: security
  - Requirement: `sources.listPage` and `sources.search` reject malformed/out-of-bounds pagination and query inputs at the server boundary before hitting MongoDB.
  - Design element: zod schemas on both procedures (Decisions 1 and 2).
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Invalid pagination or search input is rejected".
  - Testability notes: Server unit tests asserting negative/oversized `cursor`/`limit` and empty/overlong `query` are rejected with a validation error, not passed through to Mongoose.
- Requirement category: security/privacy
  - Requirement: `personalSourceName` is never exposed to unauthorized viewers over the wire, regardless of which component renders the picker.
  - Design element: Reuse of existing personal-source wiring (Decision 3); no change to server-side recipe read authorization.
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Personal source name is not exposed to unauthorized viewers" (carried over from existing project convention).
  - Testability notes: Extend/re-run `src/e2e/personal-source-privacy.spec.ts` against the new form; assert via direct tRPC response inspection, not just DOM.
- Requirement category: reliability
  - Requirement: A search query in progress does not race with a pending browsing-mode page fetch (no stale-list flicker).
  - Design element: `PaginatedSingleSelectDropdown` mode-switch logic (Decision 3) — active mode (`browse` vs `search`) gates which in-flight request's response is applied.
  - Acceptance criteria reference: spec `recipe-source-picker` — scenario "Switching between browsing and searching does not show stale results".
  - Testability notes: Component test that triggers a page-2 fetch then immediately types a query, asserting the final rendered list reflects only the search response.

## Risks / Trade-offs

- Risk/trade-off: Two dropdown primitives (`SingleSelectDropdown`, `PaginatedSingleSelectDropdown`) increase surface area to maintain.
  - Impact: Slightly more code to keep visually/behaviorally consistent over time.
  - Mitigation: Keep shared presentational classNames/structure aligned by eye at implementation time; document the split rationale in code comments only if non-obvious; revisit consolidation if a third paginated consumer appears.
- Risk/trade-off: Offset-based (`skip`) pagination degrades in cost as the underlying collection grows very large.
  - Impact: Slower later pages at high source counts.
  - Mitigation: Acceptable at current and near-term expected scale; flagged as a follow-up (keyset pagination) rather than solved now.
- Risk/trade-off: Removing inline create-on-type changes the existing interaction users may be accustomed to.
  - Impact: Minor workflow change, one extra click.
  - Mitigation: Prominent "+ Add New Source" placement and search-text pre-fill into the modal.

## Rollback / Mitigation

- Rollback trigger: New picker or endpoints cause regressions in recipe create/edit flows (e.g. source selection failing to save, personal-name privacy regression, or filter bar breakage) discovered in review or post-merge.
- Rollback steps: Revert the `RecipeForm.tsx` change to re-render `SourceSelector` for the Source field; the new `sources.listPage` procedure and new components can remain dormant/unused without harm since nothing else depends on them; no data migration is involved.
- Data migration considerations: None — no schema or persisted-data changes; this is purely a query/API-shape and UI change.
- Verification after rollback: Confirm `RecipeForm.tsx` recipe create/edit E2E tests and `personal-source-privacy.spec.ts` pass against the reverted state.

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix the failing check (test, type-check, or lint) before proceeding. Do not bypass with `--no-verify` or skip flags.
- If security checks fail: Treat as blocking, in particular any failure related to input validation bounds (Decisions 1/2) or personal-source-name exposure; fix before merge.
- If required reviews are blocked/stale: Follow existing project convention of bounded polling with a timeout for review-wait automation; do not force-merge past unresolved review comments.
- Escalation path and timeout: If blocked beyond a normal review cycle, flag to the repo maintainer (dougis) directly rather than silently waiting indefinitely.

## Open Questions

- Naming of the new endpoint (`sources.listPage` chosen as the default per Decision 1) — open to renaming if the maintainer has a different convention preference; not a blocker for apply.
- Whether offset-based pagination (`skip`) is acceptable long-term, or whether keyset pagination should be adopted now instead — not a blocker for apply at current expected scale.

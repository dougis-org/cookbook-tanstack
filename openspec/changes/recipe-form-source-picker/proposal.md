## GitHub Issues

- #559

## Why

- Problem statement: The recipe edit/create form's Source field (`SourceSelector`) uses a bespoke free-text, server-search-as-you-type widget that looks and behaves differently from the Category field (`CategoryPickerDropdown`), which uses the shared sorted-dropdown pattern (`SingleSelectDropdown`). This inconsistency is the subject of GitHub issue #559: "the recipe edit screen is not using the drop down sorted select for its base."
- Why now: A sibling component (`SourcePickerDropdown`) already exists and is already used in the recipes filter bar, so the visual/interaction pattern is proven elsewhere in the app — the recipe edit form is the one place still lagging behind.
- Business/user impact: Users editing/creating recipes get an inconsistent, less discoverable Source picker (must know to type to search) compared to Category (click, browse a sorted list). Fixing this improves consistency and discoverability without removing any existing capability (source creation, personal source naming).

## Problem Space

- Current behavior:
  - Category field: `CategoryPickerDropdown` → `SingleSelectDropdown` loads the full classification list client-side (small, fixed taxonomy) and filters/sorts it in the browser.
  - Source field: `SourceSelector` is a standalone free-text input that debounces a server-side search (`sources.search`, hard-capped at 10 results), offers inline "Create `<name>`" when no match is found, and reveals a "Personal Name" input when the resolved source has `slug: "personal"`.
  - `SourcePickerDropdown` already exists (used only in the recipes filter bar) and wraps `SingleSelectDropdown` over the currently-unbounded `sources.list`, with no create affordance and no personal-source handling.
- Desired behavior: The recipe edit form's Source field uses the same sorted-dropdown interaction pattern as Category, while preserving today's source-specific behaviors (create-new, personal source naming) and scaling correctly as the number of sources grows (sources are user-generated and unbounded, unlike the fixed classification taxonomy).
- Constraints:
  - `sources.list` is also consumed by the recipes filter bar (`src/routes/recipes/index.tsx`) with a `recipeCount` aggregation; it must not be changed in a way that breaks that usage.
  - Sources are open-ended (user-created), so loading the entire list client-side (as Category does) does not scale the same way.
  - Personal-source privacy is an existing project convention: the personal source name must not leak to unauthorized viewers over the wire, not just be hidden in the DOM.
- Assumptions:
  - Alphabetical-by-name is an acceptable default and only order for the Source picker's browsing mode.
  - A single, source-specific "+ Add New Source" modal is sufficient for now; a generalized create-tool spanning Source and Category is not needed because Category has no create capability today.
- Edge cases considered:
  - Editing an existing recipe whose selected source is far outside the first page (100 items) or no longer matches any loaded page — resolved via the existing `sources.byId` lookup so the selected item always displays correctly regardless of pagination position.
  - Selecting the seeded "Personal" source and typing a personal name, including recipes that already have a personal source name set when the edit form loads.
  - Typing a search query that matches zero sources — the picker should show an empty state and defer to the separate "Add New Source" action rather than an inline create row.
  - Rapid typing while a page-load request is in flight — search must supersede/cancel the browsing-mode pagination fetch rather than racing it.

## Scope

### In Scope

- Replacing `SourceSelector` with a picker in `RecipeForm.tsx` that follows the `SingleSelectDropdown` interaction pattern (click-to-open, sorted list), for the Source field only.
- A new paginated, server-sorted source-listing endpoint used only by this picker's browsing mode.
- Extending `sources.search` with explicit validated bounds and a higher result limit so typed queries can also work well against the new picker.
- Preserving personal-source-name behavior (reveal a "Personal Name" input when the selected source resolves to `slug: "personal"`).
- A standalone "+ Add New Source" button and modal that calls the existing `sources.create` mutation, decoupled from the picker/dropdown component itself.

### Out of Scope

- Any change to the Category field, `CategoryPickerDropdown`, or the classification data model/taxonomy.
- Adding a "create new category" capability (`classifications.create` does not exist and is not being added).
- Changing `sources.list` or any behavior of the recipes filter bar that consumes it.
- Generalizing the "create new" modal into a shared, resource-agnostic component usable by both Source and Category.

## What Changes

- Add a new server procedure (e.g. `sources.listPage`) returning sources sorted alphabetically by name, paginated via cursor/offset with a validated, bounded `limit` (default and max 100).
- Extend `sources.search` with explicit zod-validated bounds on its inputs and a higher, bounded result limit (replacing the current hard-coded limit of 10).
- Update (or replace) `SourcePickerDropdown` so the recipe edit form's usage supports: initial paginated browse load, infinite-scroll pagination on scroll-to-bottom (append without client-side re-sort), server-side search-as-you-type, and personal-source-name reveal.
- Update `RecipeForm.tsx` to render the updated Source picker in place of `SourceSelector`, alongside a new standalone "+ Add New Source" button that opens a creation modal.
- Add a source-creation modal component that calls `sources.create`, and on success selects the new source in the picker and invalidates the relevant source queries/caches.

## Risks

- Risk: A new/duplicated listing endpoint could drift in behavior from `sources.list` (e.g. differing shape, differing handling of the `recipeCount` field) and create maintenance burden.
  - Impact: Confusing inconsistencies between the filter bar's source list and the edit form's source list.
  - Mitigation: Share the underlying query-building logic where practical; keep the new endpoint's response shape a strict subset of `sources.list`'s shape (id, name, url, slug) and document why `recipeCount` is intentionally omitted.
- Risk: Infinite-scroll pagination combined with concurrent search requests could race and show stale/incorrect results.
  - Impact: User sees flickering or wrong list contents while typing.
  - Mitigation: Cancel/ignore in-flight browsing-mode page fetches when a search query becomes active, and vice versa.
- Risk: Moving personal-source-name handling into the new picker could regress the existing network-layer privacy guarantee (personal source name must not leak to unauthorized viewers).
  - Impact: Privacy regression for a previously-covered scenario.
  - Mitigation: Reuse the existing `personalSourceName`/`onPersonalSourceNameChange` wiring as-is from `SourceSelector` rather than re-implementing it, and re-run the existing E2E privacy assertions (`src/e2e/personal-source-privacy.spec.ts`) against the new component.
- Risk: Removing inline "Create `<name>`" in favor of a separate modal changes the number of clicks/steps to add a new source, which could be perceived as a regression by users used to the old flow.
  - Impact: Minor UX friction during the transition.
  - Mitigation: Keep the "+ Add New Source" action immediately visible next to the picker (not buried), and pre-fill the modal's name field with whatever the user had typed into the picker's search box, if anything.

## Open Questions

- Question: Should the new paginated endpoint be named `sources.listPage`, or is there a preferred naming convention for cursor-paginated tRPC procedures elsewhere in this codebase?
  - Needed from: repo maintainer (dougis)
  - Blocker for apply: no (a reasonable default name will be chosen in design.md if unanswered)
- Question: When "+ Add New Source" is used and the newly created source happens to be `slug: "personal"` (it never will be, since "Personal" is a single seeded record, but confirming) — is there any other case where the create modal could produce a source needing the personal-name reveal?
  - Needed from: repo maintainer (dougis)
  - Blocker for apply: no (assumption: created sources never resolve to `slug: "personal"`; only the seeded record does)

## Non-Goals

- Redesigning the Category field or its data model.
- Building a generalized, resource-agnostic "create new entity" tool.
- Changing how `sources.list` or the recipes filter bar behaves.
- Supporting bulk source management (rename/delete/merge sources) from the recipe edit form.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

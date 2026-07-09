# recipe-source-picker Specification

## Purpose
The recipe edit/create form's Source field is a click-to-open, alphabetically-sorted dropdown (`RecipeSourcePicker`), consistent with the Category field's interaction pattern, backed by server-side pagination (`sources.listPage`) and search (`sources.search`) rather than a fully client-loaded list. It preserves the personal-source-name reveal behavior and provides a standalone "Add New Source" creation flow, replacing the retired `SourceSelector` component.

## Requirements

### Requirement: Sorted, paginated Source dropdown in the recipe edit form

The system SHALL render the recipe edit/create form's Source field as a click-to-open, alphabetically-sorted dropdown (`RecipeSourcePicker`), backed by server-side pagination rather than a fully client-loaded list.

#### Scenario: Source dropdown opens sorted alphabetically

- **Given** the recipe edit form is rendered
- **When** the user clicks the Source field's dropdown trigger
- **Then** the dropdown opens and displays sources sorted alphabetically by name

#### Scenario: Opening the picker loads the first page of sources

- **Given** the recipe edit form is rendered and the Source dropdown has not yet been opened
- **When** the user clicks the Source field's dropdown trigger for the first time
- **Then** the client calls `sources.listPage` with `cursor: 0` and receives at most 100 sources
- **And** no other source-listing query is made

#### Scenario: Scrolling to the bottom loads the next page

- **Given** the Source dropdown is open in browsing mode (no active search query) and exactly 100 sources were loaded on the first page
- **When** the user scrolls the listbox to its bottom
- **Then** the client calls `sources.listPage` with the next `cursor` value
- **And** the newly returned sources are appended after the currently displayed sources without re-sorting the already-displayed items

#### Scenario: Typing a query performs a server-side search

- **Given** the Source dropdown is open
- **When** the user types a search query into the dropdown's search input
- **Then** after the debounce interval the client calls `sources.search` with the typed query
- **And** the displayed list is replaced with the server's search results, not filtered from any previously-loaded page

#### Scenario: Switching between browsing and searching does not show stale results

- **Given** the Source dropdown is open in browsing mode and a `sources.listPage` request for a subsequent page is in flight
- **When** the user types a search query before that request resolves
- **Then** the in-flight browsing-mode page response is not applied to the displayed list
- **And** the displayed list reflects only the search results once the search request resolves

#### Scenario: Clearing the search query resumes browsing mode

- **Given** the Source dropdown is displaying search results for a typed query
- **When** the user clears the search input
- **Then** the dropdown returns to displaying the previously-loaded browsing-mode pages without re-fetching page 1

### Requirement: Personal Source Name field in the recipe source picker

The system SHALL render a labelled "Personal Name" text input beneath the Source picker when the currently-selected source resolves to the seeded source with slug `"personal"`, and SHALL invoke the provided callback when that field is edited.

#### Scenario: Selecting Personal reveals the personal name field

- **Given** the recipe edit form's Source picker is rendered with no source selected
- **When** the user selects the option corresponding to the seeded `"personal"` source
- **Then** a text input labelled "Personal Name" appears below the picker, with placeholder "e.g. Aunt Mary", a max length of 80, and a helper text "Only you can see this."

#### Scenario: Selecting a non-personal source hides the personal name field

- **Given** the recipe edit form's Source picker has the `"personal"` source selected and the "Personal Name" field is visible
- **When** the user selects a different source
- **Then** the "Personal Name" input and its helper text are removed from the rendered DOM

#### Scenario: Typing a personal source name invokes the callback

- **Given** the `"personal"` source is selected and the "Personal Name" input is visible
- **When** the user types "Grandma's recipe book" into the input
- **Then** the `onPersonalSourceNameChange` callback is invoked with the value "Grandma's recipe book"

### Requirement: Standalone Add New Source action

The system SHALL provide an "Add New Source" action, rendered outside the Source dropdown's popover, that opens a dedicated creation modal; the Source picker itself SHALL NOT offer an inline create-on-type affordance.

#### Scenario: Add New Source opens a standalone creation modal

- **Given** the recipe edit form is rendered
- **When** the user activates the "Add New Source" button
- **Then** a modal opens containing fields to enter a new source's name (required) and URL (optional)
- **And** this button is not located inside the Source dropdown's open popover/listbox

#### Scenario: Typed search text pre-fills the creation modal

- **Given** the user has typed "Bon Appetit Magazine" into the Source picker's search input without a matching result
- **When** the user activates the "Add New Source" button
- **Then** the creation modal's name field is pre-filled with "Bon Appetit Magazine"

#### Scenario: Creating a source selects it and closes the modal

- **Given** the "Add New Source" modal is open with a valid name entered
- **When** the user submits the modal and the `sources.create` mutation succeeds
- **Then** the modal closes
- **And** the newly created source becomes the Source picker's selected value
- **And** the source-listing and search query caches are invalidated so the new source appears in subsequent browsing/search results

#### Scenario: No inline create-on-type affordance remains

- **Given** the user has typed a search query into the Source picker that matches zero results
- **When** the empty-results state is displayed
- **Then** no inline "Create `<name>`" option is rendered inside the dropdown popover

### Requirement: sourcesRouter supports bounded, sorted pagination

The system SHALL provide a `sources.listPage` query that returns sources sorted alphabetically by name, bounded to a validated page size, with a cursor for retrieving subsequent pages; and SHALL bound `sources.search`'s result size with explicit validation instead of an unconditional hard-coded limit.

#### Scenario: listPage returns a bounded, sorted page

- **Given** more than 100 `Source` documents exist in MongoDB
- **When** the client calls `sources.listPage` with `{ cursor: 0 }` (default `limit`)
- **Then** the response contains at most 100 items, sorted by `name` ascending
- **And** the response includes a `nextCursor` value usable to request the next page

#### Scenario: listPage rejects invalid pagination input

- **Given** the `sources.listPage` procedure
- **When** it is called with a negative `cursor` or a `limit` greater than 100
- **Then** the call is rejected by input validation before any MongoDB query is executed

#### Scenario: search returns up to the validated limit, sorted by name

- **Given** more than 10 `Source` documents match a given search query
- **When** the client calls `sources.search` with that query and no explicit `limit`
- **Then** up to 100 matching sources are returned, sorted by `name` ascending

#### Scenario: search rejects invalid query or limit input

- **Given** the `sources.search` procedure
- **When** it is called with an empty query, a query longer than 255 characters, or a `limit` outside 1–100
- **Then** the call is rejected by input validation before any MongoDB query is executed

#### Scenario: sources.list and the recipes filter bar are unaffected

- **Given** the recipes filter bar (`src/routes/recipes/index.tsx`) calls `sources.list`
- **When** this capability is in effect
- **Then** `sources.list`'s input/output contract and behavior (including the `recipeCount` aggregation) remain unchanged

### Requirement: Performance bound on initial load

The Source dropdown's initial load SHALL be bounded to a single page (≤100 sources), regardless of total source count. Additional pages are loaded only in response to an explicit scroll-to-bottom action (see "Scrolling to the bottom loads the next page"), and previously-loaded pages are retained rather than discarded.

#### Scenario: Initial load is bounded to one page

- **Given** the Source dropdown has just been opened for the first time
- **When** no scroll or search interaction has occurred
- **Then** exactly one `sources.listPage` request has been made and at most 100 sources are held in client state

### Requirement: Personal source name is not exposed to unauthorized viewers

`personalSourceName` SHALL never be exposed to unauthorized viewers over the wire, regardless of which component renders the picker.

#### Scenario: Personal source name is not exposed to unauthorized viewers

- **Given** a recipe has a `personalSourceName` set and the viewer is not authorized to see it
- **When** the viewer's client requests the recipe's data over tRPC
- **Then** the response does not include the `personalSourceName` value, verified at the network/response level and not merely hidden in the rendered DOM

## Traceability

- Component implementation: [RecipeSourcePicker.tsx](../../../src/components/recipes/RecipeSourcePicker.tsx), [PaginatedSingleSelectDropdown.tsx](../../../src/components/ui/PaginatedSingleSelectDropdown.tsx), [AddSourceModal.tsx](../../../src/components/recipes/AddSourceModal.tsx)
- Server implementation: [sources.ts](../../../src/server/trpc/routers/sources.ts)
- Unit and behavioral tests: [RecipeSourcePicker.test.tsx](../../../src/components/recipes/__tests__/RecipeSourcePicker.test.tsx), [PaginatedSingleSelectDropdown.test.tsx](../../../src/components/ui/__tests__/PaginatedSingleSelectDropdown.test.tsx), [AddSourceModal.test.tsx](../../../src/components/recipes/__tests__/AddSourceModal.test.tsx), [sources.test.ts](../../../src/server/trpc/routers/__tests__/sources.test.ts)
- E2E coverage: [recipe-source-picker.spec.ts](../../../src/e2e/recipe-source-picker.spec.ts), [personal-source-privacy.spec.ts](../../../src/e2e/personal-source-privacy.spec.ts)
- Originating change: [2026-07-09-recipe-form-source-picker](../../changes/archive/2026-07-09-recipe-form-source-picker/)
- Design: [design.md](../../changes/archive/2026-07-09-recipe-form-source-picker/design.md)
- Tasks: [tasks.md](../../changes/archive/2026-07-09-recipe-form-source-picker/tasks.md)

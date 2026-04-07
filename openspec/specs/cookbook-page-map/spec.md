### Requirement: buildPageMap computes recipeId-to-pageNumber mapping from ordered recipe list

The system SHALL provide a `buildPageMap(recipes: { id: string }[])`
function exported from `src/lib/cookbookPages.ts` that returns a
`Map<string, number>` mapping each recipe's `id` to its estimated print page
number. The mapping SHALL use a flat heuristic where the recipe at array index
`i` maps to page number `i + 1`. The input array is assumed to be in print
order (sorted by `orderIndex`).

#### Scenario: First recipe maps to page 1

- **WHEN** `buildPageMap` is called with a non-empty array
- **THEN** the recipe at index 0 maps to page number `1`

#### Scenario: Each subsequent recipe increments by one

- **WHEN** `buildPageMap` is called with N recipes
- **THEN** recipe at index `i` maps to page number `i + 1` for all `i` in `0..N-1`

#### Scenario: Empty input returns empty map

- **WHEN** `buildPageMap` is called with an empty array
- **THEN** the returned `Map` is empty

#### Scenario: Duplicate ids are not introduced

- **WHEN** `buildPageMap` is called with a list containing unique ids
- **THEN** the returned `Map` has exactly as many entries as the input array

### Requirement: buildPageMap is reusable across TOC, index, and print consumers

The system SHALL export `buildPageMap` from `src/lib/cookbookPages.ts` as a
named export, with no dependency on React, routing, or component internals, so
it can be imported by the TOC component, the future alphabetical index page,
and the future print view without circular dependencies.

#### Scenario: Import does not pull in React or component code

- **WHEN** `src/lib/cookbookPages.ts` is imported in a Node test environment
- **THEN** the module resolves without requiring a React or DOM environment

### Requirement: Display ordering is shared across TOC, print, and index consumers

The system SHALL provide a shared utility in `src/lib/cookbookPages.ts` that
derives display order for cookbook recipes before `buildPageMap()` is called.
When chapters exist, the utility SHALL order recipes by chapter order first and
append uncategorized recipes after all chapters. When no chapters exist, the
utility SHALL return recipes sorted by `orderIndex`.

#### Scenario: Chaptered cookbook uses chapter-first display order

- **WHEN** the shared ordering utility is called with recipes and chapters
- **THEN** recipes assigned to chapters are returned in chapter order
- **AND** recipes within each chapter preserve `orderIndex` order
- **AND** uncategorized recipes appear after all chaptered recipes

#### Scenario: Unchaptered cookbook uses orderIndex sorting

- **WHEN** the shared ordering utility is called with recipes and no chapters
- **THEN** the returned recipe list is sorted by `orderIndex`

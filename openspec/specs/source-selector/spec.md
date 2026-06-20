## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-15-reveal-private-source-name-input/design.md) document, not a replacement.

### Requirement: ADDED Personal Source Name field rendering

The system SHALL render a labelled text input for "Personal Name" directly below the source selector when the currently-selected source has the slug `"personal"`.

#### Scenario: Selected source has personal slug

- **Given** the `SourceSelector` component is rendered with a selected source ID
- **When** the selected source's slug is resolved to be `"personal"`
- **Then** a text input field is rendered below the source selector with the label "Personal Name", the placeholder "e.g. Aunt Mary", and a max character limit of 80.
- **And** a helper paragraph with text "Only you can see this." is displayed beneath the input.

#### Scenario: Selected source has non-personal slug

- **Given** the `SourceSelector` component is rendered with a selected source ID
- **When** the selected source's slug is resolved to be anything other than `"personal"` (or if no source is selected)
- **Then** the "Personal Name" input field and its helper text are completely omitted from the rendered DOM.

### Requirement: ADDED personalSourceName callbacks

The system SHALL invoke the `onPersonalSourceNameChange` callback when the user edits the personal name input field.

#### Scenario: Typing personal source name

- **Given** the `SourceSelector` component has the `"personal"` source selected and the text input is displayed
- **When** the user types "Grandma's recipe book" into the input
- **Then** the `onPersonalSourceNameChange` callback prop is called with the value "Grandma's recipe book".

## MODIFIED Requirements

### Requirement: MODIFIED sourcesRouter output schema

The system SHALL return the `slug` field for all queried source records to enable the client UI to match system-seeded sources.

#### Scenario: Fetching source metadata

- **Given** a source document exists in MongoDB with slug `"personal"`
- **When** the client calls `sources.list`, `sources.search`, or `sources.byId`
- **Then** each returned source object includes the `slug` property as a string.

### Requirement: MODIFIED Client-side personalSourceName persistence

The system SHALL preserve the `personalSourceName` state value in the UI client-side on source transitions, preventing data loss if a user toggles away and back.

#### Scenario: Selected source changed to non-personal

- **Given** the `SourceSelector` component has `"personal"` source selected and a personal name of `"Aunt Mary"` is entered
- **When** the user selects a different source (e.g. `"Serious Eats"`)
- **Then** the `onPersonalSourceNameChange` callback is NOT invoked with an empty string, retaining `"Aunt Mary"` in the parent state.

#### Scenario: Selected source cleared

- **Given** the `SourceSelector` component has `"personal"` source selected and a personal name of `"Aunt Mary"` is entered
- **When** the user clicks the clear source button
- **Then** the `onPersonalSourceNameChange` callback is NOT invoked with an empty string, retaining `"Aunt Mary"` in the parent state.

## REMOVED Requirements

None.

## Traceability

- **Proposal element -> Requirement**:
  - Expose `slug` in `sourcesRouter` queries -> MODIFIED sourcesRouter output schema
  - Render "Personal Name" input when slug is `"personal"` -> ADDED Personal Source Name field rendering
  - Prop callbacks and input binding -> ADDED personalSourceName callbacks
  - Adjust `SourceSelector` client-side behavior to NOT clear name -> MODIFIED Client-side personalSourceName persistence
- **Design decision -> Requirement**:
  - Decision 1 (Expose `slug` in tRPC responses) -> MODIFIED sourcesRouter output schema
  - Decision 2 (Query selected source details to check the slug) -> ADDED Personal Source Name field rendering
  - Decision 3 (Use `aria-describedby` for helper text) -> ADDED Personal Source Name field rendering
  - Decision 4 (Retain `personalSourceName` client-side on source change) [recipe-form-personal-source-name] -> MODIFIED Client-side personalSourceName persistence
- **Requirement -> Task(s)**:
  - MODIFIED sourcesRouter output schema -> Task 1 (Update sources tRPC router and tests)
  - ADDED Personal Source Name field rendering -> Task 2 (Implement SourceSelector UI input and styling)
  - ADDED personalSourceName callbacks -> Task 2 (Implement SourceSelector UI input and styling)
  - MODIFIED Client-side personalSourceName persistence -> Task 1 (Modify `SourceSelector.tsx` to not clear `personalSourceName` on selection change/clear) (see [`tasks.md`](../../changes/archive/2026-06-18-recipe-form-personal-source-name/tasks.md))

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Query gating when no source is selected

- **Given** the `SourceSelector` component is rendered without a selected source ID (`value=""`)
- **When** the component mounts or updates
- **Then** no active `sources.byId` tRPC query is initiated, avoiding redundant network requests.

#### Scenario: Rendering performance under source change

See functional scenario: [Selected source changed to non-personal](#scenario-selected-source-changed-to-non-personal).

### Requirement: Accessibility

#### Scenario: Screen reader association for helper text

- **Given** the "Personal Name" input is visible in the DOM
- **When** assistive technology focuses the input field
- **Then** the helper text "Only you can see this." is announced
- **And** this is achieved by matching the input's `aria-describedby` attribute to the helper text element's `id`.

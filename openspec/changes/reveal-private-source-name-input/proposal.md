## GitHub Issues

- #506

## Why

- **Problem statement**: When a user selects the "Personal" source for a recipe, they want to capture a private attribution (e.g. "Aunt Mary") to identify where the recipe came from. However, the UI does not currently provide any input field or way to record this private name when a Personal source is selected.
- **Why now**: The backend model and write normalization are already prepared (issues #501, #503, #504). We now need to build the user interface element that allows inputting this private source name.
- **Business/user impact**: Improves user experience by allowing private personalization of recipe origins without polluting the public/global source database with individual names.

## Problem Space

- **Current behavior**: The source selector input field only selects a source ID. It provides no context-sensitive inputs for additional details such as a private personal name.
- **Desired behavior**: When the user selects a source with the slug `"personal"`, the source selector renders an input field below it to collect the "Personal Name". If any other source is selected, the input field is completely hidden.
- **Constraints**:
  - Follow the project's styling guidelines (theme variable tokens, Inter body font, Title Case labels).
  - No emojis in UI labels or helper text.
  - The maximum length of the personal name input must be 80 characters.
  - The helper text "Only you can see this." must be present and linked via `aria-describedby` for accessibility.
- **Assumptions**:
  - The database has a seeded source with the slug `"personal"` (addressed in #502).
  - The tRPC `sources` router will be updated to expose the `slug` field, enabling the client-side component to identify the selected source by its slug.
- **Edge cases considered**:
  - **Switching sources**: If a user enters a personal name, then switches to a non-personal source, the input field is hidden. (On saving, the tRPC router will automatically discard the name, so the client only needs to hide the input).
  - **Flickering on load**: When loading an existing recipe with a Personal source selected, the component must fetch the source details. To prevent visual layout shift or flickering, the component should check if the source is already cached or found in current search results, and perform an asynchronous `byId` fetch when necessary.

## Scope

### In Scope

- Exposing the `slug` field in `sourcesRouter` queries (`list`, `search`, `byId`).
- Updating unit tests in `sources.test.ts` to assert that `slug` is correctly returned.
- Extending `SourceSelector.tsx` props with `personalSourceName: string` and `onPersonalSourceNameChange: (v: string) => void`.
- Implementing the conditional "Personal Name" input field with a Title Case label, placeholder, character limit, and accessible helper text inside `SourceSelector.tsx`.
- Adding unit/component tests for `SourceSelector.tsx` to verify conditional rendering, callback execution, and accessibility attributes.

### Out of Scope

- Wiring the new props in `RecipeForm.tsx` (addressed in #507).
- Displaying the name in `RecipeDetail.tsx` (addressed in #508).
- Database migrations or schema updates (addressed in #501, #502, #503).

## What Changes

- `src/server/trpc/routers/sources.ts` (expose `slug` in output payloads)
- `src/server/trpc/routers/__tests__/sources.test.ts` (test for `slug` in responses)
- `src/components/ui/SourceSelector.tsx` (extend props and render conditional input)
- `src/components/ui/__tests__/SourceSelector.test.tsx` (new component test file)

## Risks

- **Risk**: Delay in checking source slug via tRPC `byId` query causing UI layout jump.
  - **Impact**: Minor layout shift during rendering.
  - **Mitigation**: Use React Query caching, disable query if `value` is empty, and check local search results list first to get the slug synchronously if the source was just selected.

## Open Questions

- *No unresolved ambiguity exists at this stage. The requirements and boundaries of the ticket are fully clear.*

## Non-Goals

- Modifying `RecipeForm.tsx` or wiring the save action (handled in #507).
- Showing the personal name on recipe details page (handled in #508).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## Context

- **Relevant architecture**:
  - Frontend component `SourceSelector.tsx` is located at `src/components/ui/SourceSelector.tsx`.
  - Backend tRPC API routing is configured in `src/server/trpc/routers/sources.ts`.
  - Database Mongoose schemas reside in `src/db/models/source.ts`.
- **Dependencies**:
  - The seeded "Personal" source (addressed in #502) is required to be present with slug `"personal"`.
  - The Mongoose model schema for `Source` (updated in #501) includes the `slug` field.
- **Interfaces/contracts touched**:
  - `sourcesRouter` payload schemas for `list`, `search`, and `byId` queries.
  - `SourceSelectorProps` React interface.

## Goals / Non-Goals

### Goals

- Expose the `slug` field on all tRPC queries related to sources (`list`, `search`, and `byId`).
- Allow `SourceSelector.tsx` to dynamically query details for the selected source ID and check if its slug is `"personal"`.
- Conditionally render a text input field for "Personal Name" directly below the selected source label if the selected source is Personal.
- Style the new input field using CSS/HSL theme variables (`var(--theme-border)`, `var(--theme-fg)`, etc.) to support all four project themes.
- Enforce accessibility rules by linking the helper text via `aria-describedby`.
- Create a complete test suite for `SourceSelector.tsx` to verify component rendering and callbacks.

### Non-Goals

- Wiring the new props in `RecipeForm.tsx` (addressed in #507).
- Rendering or displaying the personal source name in `RecipeDetail.tsx` (addressed in #508).
- Database migrations or seeding updates (addressed in #501, #502).

## Decisions

### Decision 1: Expose `slug` in tRPC responses

- **Chosen**: Add the `slug` field to the query responses of `list`, `search`, and `byId` in `src/server/trpc/routers/sources.ts`.
- **Alternatives considered**: Checking the source by hardcoded IDs or display name.
- **Rationale**: Database IDs differ between local, test, and production environments. Matching on display names is vulnerable to typos or translations. Slugs are stable, code-friendly identifiers. Exposing them in tRPC queries makes identifying special system sources easy and robust.
- **Trade-offs**: Slightly larger response payload, which is completely negligible.

### Decision 2: Query selected source details to check the slug

- **Chosen**: In `SourceSelector.tsx`, use React Query's `useQuery` hook with `trpc.sources.byId.queryOptions({ id: value })` when `value` (source ID) is present.
- **Alternatives considered**: Passing down the full source object or slug as a prop from the parent.
- **Rationale**: The issue specifically prescribes extending the props only with `personalSourceName` and `onPersonalSourceNameChange`. It does not modify the `value` prop type contract. Performing the lookup locally inside `SourceSelector` keeps the parent interface clean.
- **Trade-offs**: Triggers a query when a source is selected, but React Query caches the result. To prevent layout flickering when just selected from the dropdown, we also check if the slug is found in the current search query's local result list.

### Decision 3: Use `aria-describedby` for helper text

- **Chosen**: Link the helper text `"Only you can see this."` using `aria-describedby="personalSourceName-helper"`.
- **Alternatives considered**: Relying on simple markup without ARIA link, or adding description in placeholder.
- **Rationale**: Matches web accessibility standards (WCAG) to ensure screen readers read the helper text when the input field is focused.

## Proposal to Design Mapping

- **Proposal element**: Expose `slug` in `sourcesRouter` queries
  - **Design decision**: Decision 1 (Expose `slug` in tRPC responses)
  - **Validation approach**: Add unit test assertions to `sources.test.ts`
- **Proposal element**: Extend `SourceSelectorProps` and render "Personal Name" input conditionally when slug is `"personal"`
  - **Design decision**: Decision 2 (Query selected source details to check the slug)
  - **Validation approach**: Add component test assertions to `SourceSelector.test.tsx`
- **Proposal element**: Follow design-system rules and accessibility (Title Case label, no emojis, `aria-describedby` helper text, limit 80 characters)
  - **Design decision**: Decision 3 (Use `aria-describedby` for helper text)
  - **Validation approach**: Assert HTML attributes on the input in `SourceSelector.test.tsx`

## Functional Requirements Mapping

- **Requirement**: Input field renders only when the Personal source is selected.
  - **Design element**: Check `selectedSource?.slug === "personal"` or `selectedFromSearch?.slug === "personal"`.
  - **Acceptance criteria reference**: AC 1 (Input only renders when Personal is selected).
  - **Testability notes**: Render `SourceSelector` with a mock source of slug "personal" vs "bon-appetit" and check if the input is in the DOM.
- **Requirement**: Helper text "Only you can see this." is present and accessible.
  - **Design element**: `aria-describedby="personalSourceName-helper"` matching the ID of the helper `<p>` text.
  - **Acceptance criteria reference**: AC 2 (Helper text present and accessible).
  - **Testability notes**: Query the input element and verify its `aria-describedby` attribute matches the ID of the helper text.
- **Requirement**: All four themes render legibly.
  - **Design element**: Style using variables like `bg-[var(--theme-surface-raised)]`, `border-[var(--theme-border)]`, etc.
  - **Acceptance criteria reference**: AC 4 (All four themes render legibly).
  - **Testability notes**: Verify theme variables are used in CSS classes.

## Non-Functional Requirements Mapping

- **Requirement category**: Performance
  - **Requirement**: Do not trigger queries when no source is selected.
  - **Design element**: Set `enabled: !!value` in `useQuery`.
  - **Acceptance criteria reference**: N/A
  - **Testability notes**: Mock `trpc.sources.byId` and check that it isn't called when `value` is empty.
- **Requirement category**: Security / Reliability
  - **Requirement**: Max length validation.
  - **Design element**: Add `maxLength={80}` on input.
  - **Acceptance criteria reference**: Max length 80.
  - **Testability notes**: Verify `maxLength` attribute equals 80.

## Risks / Trade-offs

- **Risk/trade-off**: Query latency when fetching source slug.
  - **Impact**: Input field might render with a tiny delay if not in cache.
  - **Mitigation**: Check the local search results array synchronously so that when selecting a source via search dropdown, the input field renders immediately.

## Rollback / Mitigation

- **Rollback trigger**: Visual regressions, build breaks, or functional issues.
- **Rollback steps**: Revert changes in `src/server/trpc/routers/sources.ts` and `src/components/ui/SourceSelector.tsx` to prior git commit.
- **Data migration considerations**: None.
- **Verification after rollback**: Ensure test suite passes and original component behavior works.

## Operational Blocking Policy

- **If CI checks fail**: Merge is blocked. Resolve Vitest and compile checks before requesting approval.
- **If security checks fail**: Snyk must clear vulnerabilities first.
- **If required reviews are blocked/stale**: Request reviews manually.
- **Escalation path and timeout**: No bypass allowed; all gates must pass.

## Open Questions

- *None. Requirements and boundaries are fully defined.*

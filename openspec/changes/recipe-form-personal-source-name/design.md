## Context

- Relevant architecture: `RecipeForm.tsx` (recipe creation/edition UI) and `SourceSelector.tsx` (autocomplete source select component with custom Personal Name field).
- Dependencies: Backend normalization (#504) and autocomplete source input (#506) are completed.
- Interfaces/contracts touched: tRPC `recipes.create` and `recipes.update` input schema contracts.

## Goals / Non-Goals

### Goals

- Wire `personalSourceName` through `RecipeForm` for both creating and editing recipes.
- Switch `RecipeForm` from using `SourcePickerDropdown` to the autocomplete-enabled `SourceSelector`.
- Ensure client-side source changes do not clear the entered personal source name.
- Deliver 100% test coverage for the new front-end behavior.

### Non-Goals

- Change backend API schema or normalization rules (already in place).
- Add personal source name display to other pages (e.g. recipe details page).

## Decisions

### Decision 1: Use React state in `RecipeForm` for `personalSourceName`

- Chosen: Storing `personalSourceName` in a local state hook `const [personalSourceName, setPersonalSourceName] = useState("")` in `RecipeForm.tsx`.
- Alternatives considered: Registering `personalSourceName` directly in `react-hook-form` state.
- Rationale: Consistent with existing `RecipeForm` custom fields (`selectedSourceId`, `selectedMealIds`, etc.) which bypass react-hook-form due to using custom select/dropdown components.
- Trade-offs: Bypassing react-hook-form means changes to `personalSourceName` alone do not auto-trigger the autosave hook, but they do mark the form dirty and will be saved when any other form field changes or on manual submission. This is consistent with how source changes work.

### Decision 2: Retain `personalSourceName` client-side on source change

- Chosen: Removing `onPersonalSourceNameChange("")` call inside `SourceSelector.tsx`'s `selectSource` and `clearSource` methods.
- Alternatives considered: Storing the name in a temporary backup state in the parent form.
- Rationale: Storing it in backup state adds unnecessary complexity. Just retaining the state and submitting it to the server is extremely simple. The server already strips `personalSourceName` if `sourceId` does not map to the Personal source, ensuring correct DB writes without client-side duplication.

## Proposal to Design Mapping

- Proposal element: Replace `SourcePickerDropdown` with `SourceSelector`.
  - Design decision: Decision 1.
  - Validation approach: Integration tests checking render of `SourceSelector` in `RecipeForm`.
- Proposal element: Support `personalSourceName` state in `RecipeForm`.
  - Design decision: Decision 1.
  - Validation approach: Check `personalSourceName` is passed in tRPC payload.
- Proposal element: Do not clear client-side name on source change.
  - Design decision: Decision 2.
  - Validation approach: Test case selecting Personal, entering name, switching away, and verifying client state is retained (when switching back to Personal, the name still shows in the input).

## Functional Requirements Mapping

- Requirement: Creating Personal recipe persists the name.
  - Design element: `onSubmit` maps `personalSourceName` in payload.
  - Acceptance criteria reference: Specs AC 1.
  - Testability notes: Mock tRPC create mutation and check arguments.
- Requirement: Editing Personal recipe shows pre-filled name.
  - Design element: `useState` initialized with `initialData?.personalSourceName`.
  - Acceptance criteria reference: Specs AC 2.
  - Testability notes: Provide `initialData` with `personalSourceName` and verify input value.
- Requirement: Non-personal source discards name.
  - Design element: Server normalization.
  - Acceptance criteria reference: Specs AC 3.
  - Testability notes: Submit non-personal source with name, verify normalization.

## Non-Functional Requirements Mapping

- Requirement category: Security
  - Requirement: Personal source name must only be visible to the recipe owner.
  - Design element: Server-side `sanitizeRecipePersonalSource` strips the field for non-owners.
  - Acceptance criteria reference: Specs AC 4.
  - Testability notes: Covered by existing server unit tests.

## Risks / Trade-offs

- Risk/trade-off: Accidental submission of personal name payload on non-personal sources.
  - Impact: Minimal, as server-side normalization discards the value.
  - Mitigation: Rely on existing backend validators; tests verify both front-end submission and backend normalization.

## Rollback / Mitigation

- Rollback trigger: Production build failures, runtime errors on recipe edit/create, test failures.
- Rollback steps: Revert git commits.
- Data migration considerations: None (no schema changes, schema already supports `personalSourceName`).
- Verification after rollback: Run `npm run test` and `npm run test:e2e`.

## Operational Blocking Policy

- If CI checks fail: Do not merge.
- If security checks fail: Remediate immediately.
- If required reviews are blocked/stale: Re-request review, do not bypass PR gates.
- Escalation path and timeout: Contact repository owner if reviews are stuck for more than 24 hours.

## Open Questions

- None. All requirements are clear.

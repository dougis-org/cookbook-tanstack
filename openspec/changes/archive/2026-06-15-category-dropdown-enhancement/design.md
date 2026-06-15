## Context

- Relevant architecture: React frontend using TailwindCSS and `@tanstack/react-router`, with `react-hook-form` managing state in `RecipeForm.tsx`.
- Dependencies: `react-hook-form`, `lucide-react` for icons.
- Interfaces/contracts touched: `SourcePickerDropdown` props and usage in `RecipeForm`, `classifications` payload.

## Goals / Non-Goals

### Goals

- Create a reusable single-select dropdown component with local filtering and sorting.
- Apply this component to both Source selection and Category selection.
- Meet specific sorting requirements: search filter, selected item pinned to top, remaining items A-Z.

### Non-Goals

- Remote search/pagination for categories.
- Migrating `MultiSelectDropdown` to the new generic component.

## Decisions

### Decision 1: Create a Generic SingleSelectDropdown

- Chosen: Refactor `SourcePickerDropdown`'s UI into a generic `SingleSelectDropdown` that accepts `options: {id: string, name: string}[]`.
- Alternatives considered: Duplicating the code into a specific `CategoryPickerDropdown`.
- Rationale: Categories and Sources share the exact same UX requirements for a searchable single select. Duplication would lead to maintenance overhead.
- Trade-offs: Requires a slight refactor to `SourcePickerDropdown` to pass data in rather than fetching internally (or keeping the fetch in a wrapper that renders the generic component).

### Decision 2: Keep Data Fetching in Wrappers / Parent

- Chosen: `SourcePickerDropdown` will still fetch its own options and pass them to `SingleSelectDropdown`. `RecipeForm` will pass the pre-fetched `classifications` to `SingleSelectDropdown` for the category picker.
- Alternatives considered: Having the generic component handle TRPC fetching.
- Rationale: The generic component should remain pure and uncoupled from specific TRPC endpoints.

## Proposal to Design Mapping

- Proposal element: Create generic component.
  - Design decision: Decision 1 (Create `SingleSelectDropdown`).
  - Validation approach: Unit tests verifying props behavior.
- Proposal element: Local search and sorting requirements.
  - Design decision: Implemented entirely within `SingleSelectDropdown`.
  - Validation approach: Unit tests verifying sort order given a specific selected value and search string.
- Proposal element: Update RecipeForm.
  - Design decision: Use `SingleSelectDropdown` and pass `classifications`.
  - Validation approach: E2E test verifying recipe creation flow.

## Functional Requirements Mapping

- Requirement: Alphabetical order A-Z with selected items pinned.
  - Design element: `SingleSelectDropdown` render logic.
  - Acceptance criteria reference: Specs - Category dropdown sorts alphabetically with selected pinned.
  - Testability notes: Mock list of options, assert rendered list order.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Retain keyboard accessibility (Escape to close, click outside to close).
  - Design element: `useEffect` hooks ported from `SourcePickerDropdown`.
  - Acceptance criteria reference: Specs - Dropdown Accessibility.
  - Testability notes: Playwright/testing-library tests for keyboard events.

## Risks / Trade-offs

- Risk/trade-off: Breaking existing source selection.
  - Impact: Cannot assign sources to recipes.
  - Mitigation: Ensure `SourcePickerDropdown` wrapper correctly passes down fetched data and handles the `onChange` callback exactly as before.

## Rollback / Mitigation

- Rollback trigger: Bugs in source selection or form submission in production.
- Rollback steps: Revert the PR.
- Data migration considerations: N/A.
- Verification after rollback: Run E2E tests for recipe creation to ensure `<select>` is restored.

## Operational Blocking Policy

- If CI checks fail: Fix before merge.
- If security checks fail: Fix before merge.
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: Raise to lead if blocked for > 48 hours.

## Open Questions

- None.

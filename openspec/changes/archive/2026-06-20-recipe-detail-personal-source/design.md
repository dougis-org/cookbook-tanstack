## Context

- Relevant architecture: Frontend component `RecipeDetail.tsx` receives a `recipe` prop defined in `RecipeDetailProps` and displays the name, image, metadata, classifications/taxonomy, ingredients, instructions, and source.
- Dependencies: tRPC `recipes.byId` query response schema. We assume it contains the optional `personalSourceName` field when the current user owns the recipe, and strips it otherwise.
- Interfaces/contracts touched: `RecipeDetailProps` interface in `src/components/recipes/RecipeDetail.tsx`.

## Goals / Non-Goals

### Goals

- Conditionally render the custom personal source name as a suffix to "Personal" (joined with ` · ` middle dot separator U+00B7) on the recipe details page.
- Ensure that the suffix is only rendered for valid, non-empty, trimmed personal source names.
- Provide comprehensive test cases covering the three distinct paths (owner with name, owner without name, non-owner/anonymous).

### Non-Goals

- Adding database migrations, server-side code changes, or changing API response contracts.

## Decisions

### Decision 1: Render location and syntax

- Chosen: Check if `recipe.personalSourceName` is present and has a trimmed truthy value. If it does, render it inside the existing `Source` paragraph in `src/components/recipes/RecipeDetail.tsx` immediately after the `<span>{recipe.sourceName}</span>` (or the anchor tag `<a>{recipe.sourceName}</a>`) as `{recipe.personalSourceName?.trim() && <> · {recipe.personalSourceName.trim()}</>}`.
- Alternatives considered: Appending it only if the sourceName is exactly `"Personal"`.
- Rationale: While `personalSourceName` is only set for Personal source recipes on the server, checking `recipe.personalSourceName?.trim()` directly is simpler, more robust, and doesn't hardcode source name strings in the presentation layer. If the server ever sets this field for other custom sources in the future, it will gracefully work.
- Trade-offs: None.

### Decision 2: Testing approach

- Chosen: Extend the parameter table `it.each` within `src/components/recipes/__tests__/RecipeDetail.test.tsx` under the `"renders source $label"` suite to test the three rendering variations. Access the `<p>` container of the source and check its textContent using Vitest matches.
- Alternatives considered: Finding the text element directly via `screen.getByText("Personal · Aunt Mary")`.
- Rationale: Because the source label is split across text nodes (e.g. `Source: `, `<span>Personal</span>`, ` · Aunt Mary`), React Testing Library's `screen.getByText` would fail to match the concatenated string directly since it is split across multiple text nodes. Querying the nearest paragraph and examining its `textContent` or using a regex match on the container is clean, robust, and idiomatic.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Update `RecipeDetail` UI logic.
  - Design decision: Decision 1 (Render personalSourceName dynamically inside Source line).
  - Validation approach: Unit tests verifying HTML output text matches expectations.
- Proposal element: Render only if non-empty and non-whitespace.
  - Design decision: Decision 1 (Trim checks: `recipe.personalSourceName?.trim()`).
  - Validation approach: Test case with whitespace-only personalSourceName asserts suffix is omitted.
- Proposal element: Component tests covering the three render branches.
  - Design decision: Decision 2 (Add test cases to parameters loop).
  - Validation approach: Verify with `npm run test`.

## Functional Requirements Mapping

- Requirement: Render name for owner when present.
  - Design element: `recipe.personalSourceName` truthiness check and render.
  - Acceptance criteria reference: `[ ] Owner viewing own Personal recipe with a name sees the name.`
  - Testability notes: Test with mock `personalSourceName: "Doug's Recipes"`, assert element text is `"Source: Personal · Doug's Recipes"`.
- Requirement: Render just "Personal" if owner has not set a name.
  - Design element: Check truthiness of `recipe.personalSourceName` (falsy if undefined or empty).
  - Acceptance criteria reference: `[ ] Owner viewing own Personal recipe with no name sees just "Personal".`
  - Testability notes: Test with `personalSourceName: undefined` and `personalSourceName: ""`, assert element text is `"Source: Personal"`.
- Requirement: Render just "Personal" for non-owners.
  - Design element: Implicitly handled because server strips `personalSourceName` from query response.
  - Acceptance criteria reference: `[ ] Non-owner / unauthenticated viewer sees just "Personal" (verified by server strip).`
  - Testability notes: Test with `personalSourceName: null` or omitted, assert element text is `"Source: Personal"`.

## Non-Functional Requirements Mapping

- Requirement category: security (privacy)
  - Requirement: Personal source name must never leak to non-owners.
  - Design element: Ensure we rely solely on server-side query serialization / filtering (from issue #505), keeping frontend lightweight.
  - Acceptance criteria reference: N/A
  - Testability notes: Already verified by unit/integration tests in tRPC router router.
- Requirement category: operability
  - Requirement: Adhere to Repository Standards / AGENTS.md (Cyan theme, tailwind design rules, TDD strategy).
  - Design element: Use correct middle-dot separator `·` and standard layout alignment.
  - Acceptance criteria reference: N/A
  - Testability notes: Run component tests locally to verify.

## Risks / Trade-offs

- Risk/trade-off: Visual layout breaking in narrow screen sizes/mobile.
  - Impact: Long names could wrap awkwardly.
  - Mitigation: The source line is styled with `text-sm text-[var(--theme-fg-subtle)]` and fits standard text wrapping, which handles wrap gracefully.

## Rollback / Mitigation

- Rollback trigger: Production visual defects or layout break.
- Rollback steps: Revert the commit using git: `git revert HEAD` and push to main.
- Data migration considerations: None (purely client-side representation change).
- Verification after rollback: Verify all tests in `RecipeDetail.test.tsx` pass.

## Operational Blocking Policy

- If CI checks fail: All PR gates must pass. Do not merge until CI build, unit tests, and E2E tests are 100% green.
- If security checks fail: Run Snyk/Codacy checks if dependencies change. Any High/Critical alerts must be addressed immediately before merge.
- If required reviews are blocked/stale: Re-request feedback and ping reviewers.
- Escalation path and timeout: If blocked by a reviewer thread for >24h, verify build locally and escalate to team lead.

## Open Questions

- None.

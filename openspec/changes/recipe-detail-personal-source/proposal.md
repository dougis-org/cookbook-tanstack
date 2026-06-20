## GitHub Issues

- #508

## Why

- Problem statement: Personal recipes currently display the generic source label "Personal" for both owners and non-owners. There is no way for the owner of a personal recipe to see the custom name (e.g. "Aunt Mary") they assigned to it when viewing the recipe details page.
- Why now: The "Personal source initiative" database storage (#503), tRPC serialization/deserialization (#504), server-side privacy filtering (#505), and UI inputs (#506) are all complete. The final step is to show this custom name on the recipe details page so that the owner gets visibility and confirmation of their personal attribution.
- Business/user impact: Improves the user experience of personal recipe tracking by presenting the custom source name to the owner while preserving complete privacy to others.

## Problem Space

- Current behavior: `RecipeDetail` renders "Source: Personal" as plain text (or link if url exists) without any custom suffix.
- Desired behavior: If `recipe.personalSourceName` is present and non-empty, `RecipeDetail` renders `Source: Personal · <personalSourceName>`. Otherwise, it renders `Source: Personal` (or whatever the source is).
- Constraints: Use the middle-dot separator `·` (U+00B7) with one space on each side. Follow design-system rules: theme tokens, no emoji, Inter body, Title Case label.
- Assumptions: The server-side privacy guarantee from #505 is solid. If `recipe.personalSourceName` is present in the payload, the user is authenticated and is the owner. No client-side identity checks are required in this component.
- Edge cases considered:
  - If `personalSourceName` is an empty string `""` or whitespace-only `"   "`, we must not show a dangling middle dot separator. We must trim and verify truthiness.

## Scope

### In Scope

- Update the `RecipeDetail` component to append the dot separator and the personal source name when `personalSourceName` is present and non-empty.
- Add comprehensive component tests covering all three rendering branches:
  1. Owner viewing own Personal recipe with a name (sees name).
  2. Owner viewing own Personal recipe without a name (sees just "Personal").
  3. Non-owner / unauthenticated viewer (sees just "Personal").

### Out of Scope

- Modifying the tRPC server router or database schemas (already implemented).
- Modifying recipe create/edit form inputs (already implemented).

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: Conditional display logic for `personalSourceName`.
- `src/components/recipes/__tests__/RecipeDetail.test.tsx`: Addition of tests covering the three render paths.

## Risks

- Risk: Empty/whitespace string stored in database could bypass a simple truthy check and render a dangling separator (e.g. `Source: Personal · `).
  - Impact: Broken UI rendering.
  - Mitigation: Trim the value and check for length/truthiness before rendering.

## Open Questions

- Question: Should the personal source name be clickable or linkable in any way?
  - Needed from: Product / Requester
  - Blocker for apply: no
  - Assumption: No, it is plain text.
- Question: Should we display the personal source name in print views?
  - Needed from: Product / Requester
  - Blocker for apply: no
  - Assumption: Yes, the source line is shared between print and screen, so it will naturally appear in both, which is the correct and desired behavior.

## Non-Goals

- Implementing filtering or searching by personal source name on the recipe list page.
- Allowing direct edit/update of personal source name from the detail page.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

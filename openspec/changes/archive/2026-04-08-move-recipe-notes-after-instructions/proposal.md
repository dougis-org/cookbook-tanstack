## GitHub Issues

- #273

## Why

- Problem statement: Recipe notes currently render near the top of the
  recipe detail view as unlabeled content, which makes them easy to
  misread as part of the general recipe description instead of a
  distinct notes section.
- Why now: Issue #273 identifies a concrete presentation problem in the
  recipe detail experience, and the requested layout change is small
  enough to define and implement as an isolated slice.
- Business/user impact: Moving notes below instructions and giving them
  a `Notes` header makes recipe details easier to scan and interpret in
  both the standard detail view and the shared print layout.

## Problem Space

- Current behavior: `src/components/recipes/RecipeDetail.tsx` renders
  `recipe.notes` as a plain paragraph above the recipe metadata,
  ingredients, and instructions.
- Desired behavior: When notes exist, recipe detail rendering shows
  them in a distinct `Notes` section positioned after `Instructions`
  and before `Nutrition`.
- Constraints: `RecipeDetail` is shared by the standard recipe detail
  route and the cookbook print route, so the section ordering must
  remain consistent across both. Existing behavior for recipes without
  notes must remain unchanged.
- Assumptions: The requested layout applies anywhere `RecipeDetail` is
  used. The `Notes` section should only render when notes content
  exists.
- Edge cases considered: recipes with no notes; recipes with notes but
  no nutrition panel; cookbook print rendering that reuses the same
  detail component.

## Scope

### In Scope

- Reorder recipe notes rendering within
  `src/components/recipes/RecipeDetail.tsx`
- Add an explicit `Notes` section heading when notes are present
- Preserve shared behavior across the recipe detail route and cookbook print route
- Add tests that verify section presence and ordering

### Out of Scope

- Changing note content, formatting, or storage semantics
- Editing recipe card summaries or recipe form fields
- Redesigning the rest of the recipe detail layout beyond the requested
  section movement

## What Changes

- Move notes out of the top-of-page paragraph position and render them
  as their own section
- Place the `Notes` section after the `Instructions` section
- Keep the `Notes` section before the `Nutrition` section when nutrition data exists
- Add regression coverage for note section rendering and section order

## Risks

- Risk: Section reordering in `RecipeDetail` unintentionally changes
  cookbook print output in an undesirable way
  - Impact: Printed cookbook recipes could differ from expected visual order
  - Mitigation: Treat shared print rendering as in-scope and verify the
    ordering through component-level coverage tied to the shared
    `RecipeDetail` component
- Risk: The new `Notes` header renders even when notes content is empty or absent
  - Impact: Empty visual chrome and inconsistent detail pages
  - Mitigation: Require conditional rendering so the section appears only when note content exists

## Open Questions

- Question: Are there any remaining ambiguities in the requested
  placement or wording of the section header?
  - Needed from: requester
  - Blocker for apply: no
- No unresolved ambiguity remains for this proposal; the requested
  interpretation is to place `Notes` after `Instructions` and before
  `Nutrition`.

## Non-Goals

- Introducing markdown, rich text, or multi-paragraph note formatting rules
- Changing ingredient or instruction rendering behavior
- Creating a separate notes-specific route, component, or data model

## Change Control

Proposal must be reviewed and explicitly approved by a human before design, specs, tasks, or apply proceed.

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

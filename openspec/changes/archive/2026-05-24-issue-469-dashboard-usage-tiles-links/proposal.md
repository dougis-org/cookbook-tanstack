## GitHub Issues

- #469

## Why

- Problem statement: On the authenticated dashboard at `src/routes/home.tsx`, the Recipes and Cookbooks usage tiles are currently static summary cards and cannot be clicked to navigate to their collections.
- Why now: Issue #469 requests direct navigation from those tiles, and the dashboard already exposes `/recipes` and `/cookbooks` as existing destinations.
- Business/user impact: Reduces clicks and improves dashboard usability by making high-intent summary tiles immediately actionable.

## Problem Space

- Current behavior: Users must use separate discovery links to open recipe and cookbook collections; usage tiles do not navigate.
- Desired behavior: Entire Recipes and Cookbooks usage tiles act as links to the relevant visible collections.
- Constraints:
  - Keep duplicate navigation links in the Discovery section.
  - Do not add analytics instrumentation in this change.
  - Preserve existing styling patterns and accessibility expectations.
- Assumptions:
  - "All visible recipes" maps to default `/recipes` route behavior.
  - "All visible cookbooks" maps to default `/cookbooks` route behavior.
- Edge cases considered:
  - Keyboard-only navigation and focus visibility for full-card links.
  - Loading states: tile links should only render in the non-loading card state.
  - Existing dashboard tests currently validate content but not tile navigation behavior.

## Scope

### In Scope

- Make the entire Recipes usage tile clickable and route to `/recipes`.
- Make the entire Cookbooks usage tile clickable and route to `/cookbooks`.
- Add/adjust route tests for dashboard tile link behavior.
- Preserve existing Discovery links (intentional duplicate navigation).

### Out of Scope

- Adding click tracking/analytics events.
- Changing route-level visibility/filter logic for recipes or cookbooks.
- Redesigning the dashboard layout beyond link affordances for these two tiles.
- Making the "This Month" card clickable.

## What Changes

- Update authenticated home dashboard tile wrappers in `src/routes/home.tsx` so Recipes and Cookbooks usage tiles are full-tile links.
- Keep current tile visual language while adding clear interactive/focus affordances.
- Extend home route tests in `src/routes/__tests__/-home.test.tsx` to verify link targets and accessibility-aligned behavior.

## Risks

- Risk: Full-card links may alter layout/hover behavior unexpectedly.
  - Impact: Minor visual regressions or clickable-area mismatch.
  - Mitigation: Keep existing classes where possible; only adjust wrapper semantics and link/focus classes.
- Risk: Keyboard/focus behavior could regress if link semantics are implemented incorrectly.
  - Impact: Accessibility regression for keyboard users.
  - Mitigation: Ensure semantic links and explicit focus-visible styles; cover in tests.
- Risk: Ambiguity around "all visible" could lead to wrong route params.
  - Impact: Incorrect filtered landing views.
  - Mitigation: Use bare `/recipes` and `/cookbooks` targets with no additional search params.

## Open Questions

- No unresolved questions at this time based on issue #469 clarifications.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Implementing analytics instrumentation for tile clicks.
- Consolidating or removing existing Discovery links.
- Adding new dashboard metrics or altering the "This Month" tile behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

Human approval gate: This proposal must be explicitly reviewed and approved by a human before implementation (`/opsx:apply`) begins.

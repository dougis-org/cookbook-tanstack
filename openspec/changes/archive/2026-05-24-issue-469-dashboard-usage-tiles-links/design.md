## Context

- Relevant architecture:
  - Authenticated dashboard route: `src/routes/home.tsx`.
  - Destination routes: `src/routes/recipes/index.tsx` and `src/routes/cookbooks/index.tsx`.
  - Existing dashboard route tests: `src/routes/__tests__/-home.test.tsx`.
- Dependencies:
  - `@tanstack/react-router` `Link` component for semantic client-side navigation.
  - Existing dashboard tile styling and layout classes.
- Interfaces/contracts touched:
  - UI contract: Recipes/Cookbooks usage tiles become linkable full-tile targets.
  - Test contract: Home route tests include assertions on tile link destinations.

## Goals / Non-Goals

### Goals

- Convert Recipes and Cookbooks usage tiles to whole-tile links.
- Preserve existing duplicate Discovery links.
- Keep no-analytics scope for this change.
- Ensure keyboard and screen-reader-friendly link semantics.

### Non-Goals

- Route-level data visibility or filtering changes.
- Click analytics, event tracking, or telemetry additions.
- Expanding clickable behavior to the "This Month" tile.

## Decisions

### Decision 1: Use semantic Link wrappers for full-tile navigation

- Chosen: Wrap each of the two usage card containers with `Link` targeting `/recipes` and `/cookbooks` respectively.
- Alternatives considered:
  - Add small inline CTA links inside cards.
  - Use non-semantic click handlers on `div` containers.
- Rationale: Whole-tile links match issue intent and reduce user friction while preserving semantic navigation.
- Trade-offs: Increased clickable surface may slightly raise accidental clicks; acceptable for dashboard summary cards.

### Decision 2: Keep Discovery links unchanged

- Chosen: Retain existing Discovery section links to `/recipes` and `/cookbooks` without consolidation.
- Alternatives considered:
  - Remove duplicates after making tiles clickable.
  - Replace Discovery links with secondary actions.
- Rationale: Explicitly aligned with requester direction that duplicate links are fine.
- Trade-offs: Repeated navigation affordances remain in UI, but reduce discoverability risk.

### Decision 3: Exclude analytics from this scope

- Chosen: No click tracking or telemetry for these tile interactions.
- Alternatives considered:
  - Add lightweight event hooks now.
  - Add data attributes for future tracking.
- Rationale: Explicitly aligned with requester direction and keeps change minimal.
- Trade-offs: No immediate usage metrics for this interaction.

## Proposal to Design Mapping

- Proposal element: Make Recipes tile clickable to recipes collection
  - Design decision: Decision 1
  - Validation approach: Route test asserts Recipes tile link href is `/recipes`.
- Proposal element: Make Cookbooks tile clickable to cookbooks collection
  - Design decision: Decision 1
  - Validation approach: Route test asserts Cookbooks tile link href is `/cookbooks`.
- Proposal element: Preserve duplicate Discovery links
  - Design decision: Decision 2
  - Validation approach: Existing Discovery link assertions remain valid; no removal refactor.
- Proposal element: No analytics in this change
  - Design decision: Decision 3
  - Validation approach: Implementation review confirms no analytics imports/hooks/side effects.

## Functional Requirements Mapping

- Requirement: Recipes usage tile navigates via whole-card interaction
  - Design element: Semantic `Link` wrapping Recipes tile in `src/routes/home.tsx`
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` ADDED Requirement scenario "Recipes tile full-link navigation"
  - Testability notes: Assert rendered link and href in `src/routes/__tests__/-home.test.tsx`.
- Requirement: Cookbooks usage tile navigates via whole-card interaction
  - Design element: Semantic `Link` wrapping Cookbooks tile in `src/routes/home.tsx`
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` ADDED Requirement scenario "Cookbooks tile full-link navigation"
  - Testability notes: Assert rendered link and href in `src/routes/__tests__/-home.test.tsx`.
- Requirement: Discovery links remain available after tile-link change
  - Design element: No modifications to Discovery section links
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` MODIFIED Requirement scenario "Dashboard keeps duplicate navigation affordances"
  - Testability notes: Existing tests and UI structure review confirm links remain.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Tile-link conversion must not introduce additional network calls or extra query dependencies.
  - Design element: Pure markup/semantics update within existing rendered content.
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` Non-Functional Performance scenario.
  - Testability notes: Code review verifies no new data hooks; route render remains unchanged in query count.
- Requirement category: security
  - Requirement: Navigation targets must remain internal app routes only.
  - Design element: `Link` targets fixed to `/recipes` and `/cookbooks` with no user-derived path segments.
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` Non-Functional Security scenario.
  - Testability notes: Unit test asserts exact href strings.
- Requirement category: reliability
  - Requirement: Loading-state fallback remains stable and does not surface broken link wrappers during skeleton render.
  - Design element: Link wrappers only in non-loading card branch.
  - Acceptance criteria reference: `specs/home-dashboard-navigation/spec.md` Non-Functional Reliability scenario.
  - Testability notes: Existing loading-state tests plus review of conditional render paths.
- Requirement category: operability
  - Requirement: Change remains low-risk and rollback-friendly.
  - Design element: Localized edit in one route + focused route tests.
  - Acceptance criteria reference: tasks validation + rollback section.
  - Testability notes: Single-file revert restores prior behavior.

## Risks / Trade-offs

- Risk/trade-off: Nested interactive content in full-tile links could violate HTML semantics if future controls are added.
  - Impact: Potential accessibility or behavior regressions.
  - Mitigation: Keep tile body as static content; avoid placing buttons inside linked tile wrappers.
- Risk/trade-off: Overlap between discovery links and tile links can appear redundant.
  - Impact: Minor UX duplication.
  - Mitigation: Intentional and accepted by scope; revisit in future IA cleanup if needed.

## Rollback / Mitigation

- Rollback trigger: Dashboard tile links cause regression in layout, accessibility, or navigation.
- Rollback steps:
  - Revert tile wrappers in `src/routes/home.tsx` from `Link` back to static containers.
  - Re-run affected route tests in `src/routes/__tests__/-home.test.tsx` and full unit suite.
- Data migration considerations: None (UI-only change, no schema/data mutation).
- Verification after rollback:
  - Confirm dashboard renders previous non-clickable tiles.
  - Confirm `/recipes` and `/cookbooks` remain reachable through Discovery links.

## Operational Blocking Policy

- If CI checks fail:
  - Stop merge progression, diagnose failing suite, patch minimally, rerun local validation, then push.
- If security checks fail:
  - Triage severity; remediate critical/high findings before continuing; document medium/low follow-ups.
- If required reviews are blocked/stale:
  - Address comments in-thread, push fixes, request re-review; do not force merge.
- Escalation path and timeout:
  - If blocked for more than one business day, escalate in PR thread and project channel with concrete blocker summary.

## Open Questions

- None at this time.

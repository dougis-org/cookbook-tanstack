## Context

- Relevant architecture: `Header.tsx` is a shared component rendered in `src/routes/__root.tsx`. It currently uses a controlled form with `onSubmit` for search. The recipe page (`src/routes/recipes/index.tsx`) owns its own search input with debouncing and URL sync via TanStack Router's `useSearch`.
- Dependencies: TanStack Router (`useNavigate`, `useRouterState`), React (`useState`, `useRef`, `useEffect`, `useCallback`)
- Interfaces/contracts touched:
  - `Header.tsx` — search state, navigation, and UI
  - `src/routes/recipes/index.tsx` — removes search input and associated logic
  - `src/e2e/recipes-list.spec.ts` — test selectors updated

## Goals / Non-Goals

### Goals

- Single global search input owned by `Header.tsx`
- Auto-filter on keypress with 300ms debounce
- Mobile: icon-only with cyan dot → full-width overlay on activation
- Desktop: always-visible input with cyan dot on the search icon when active
- Header syncs its input value from the URL `?search=` param on mount and route changes

### Non-Goals

- Autocomplete, suggestions, or search history
- Searching content other than recipes
- Any backend or API changes

## Decisions

### Decision 1: URL param sync via `useRouterState`

- Chosen: Read `useRouterState().location.search` and parse with `URLSearchParams` to extract the `search` param. Sync into header input state via `useEffect`.
- Alternatives considered: (a) `useSearch` — route-scoped, cannot be called from a shared component. (b) Global state store (Zustand/Context) — unnecessary complexity for a single string value.
- Rationale: `useRouterState` is the standard TanStack Router escape hatch for reading route state outside a route component. It re-renders when location changes, so the sync is automatic.
- Trade-offs: Reads raw search string; requires manual `URLSearchParams` parsing. Acceptable given the simplicity of the value being extracted.

### Decision 2: Mobile search — full-width overlay (Style B)

- Chosen: When `mobileSearchOpen` is true, render a full-width bar that replaces the entire header row content (logo, nav, auth buttons hidden). Shows an input and an `✕` close button. Activated by tapping the search icon button.
- Alternatives considered: (a) Inline expand — input animates open within the header, other elements shift. Rejected: cramped on small screens with auth buttons present. (b) Sidebar search — would require opening the drawer. Rejected: extra interaction cost.
- Rationale: Maximises typing room, well-established pattern on mobile (iOS Safari, shopping apps). Simple boolean state manages the toggle.
- Trade-offs: During overlay, logo and auth buttons are hidden. Acceptable because the user is actively searching; they can close with ✕ or Escape.

### Decision 3: Debounced navigation

- Chosen: On `onChange`, update local `inputValue` state immediately (controlled input), and fire a debounced (300ms) `navigate({ to: '/recipes', search: (prev) => ({ ...prev, search: value || undefined }) })`. Debounce implemented with `useRef<ReturnType<typeof setTimeout>>`.
- Alternatives considered: Immediate navigation on every keypress — excessive navigations, poor performance with slow tRPC queries.
- Rationale: 300ms matches the existing recipe page behaviour, feels responsive without hammering the API.
- Trade-offs: 300ms lag before results update. Negligible in practice.

### Decision 4: Active indicator (cyan dot)

- Chosen: Render a small cyan dot (`w-2 h-2 rounded-full bg-cyan-400`) absolutely positioned on the search icon button when `inputValue` is non-empty. Visible on both mobile (on the icon button) and desktop (on the icon inside the input).
- Alternatives considered: Cyan ring around the input, cyan icon colour change. Dot is more compact and works for both the icon-only mobile state and the inline-icon desktop state.
- Trade-offs: Dot requires `relative` positioning on the icon container. Minor layout consideration only.

### Decision 5: Remove recipe page search input

- Chosen: Delete the search input JSX block and all associated state/logic from `src/routes/recipes/index.tsx`. The page reads `search` from `Route.useSearch()` and passes it directly to the tRPC query — no local input state needed.
- Alternatives considered: Keep both inputs in sync (bidirectional). Rejected: adds complexity, creates confusing dual-input UX.
- Trade-offs: The `/` keyboard shortcut (focus search) is removed. Low impact — can be re-added targeting the header input in a follow-up.

## Proposal to Design Mapping

- Proposal element: Auto-filter on keypress
  - Design decision: Decision 3 (debounced navigation)
  - Validation approach: E2E test types into header input, asserts recipe list updates without pressing Enter

- Proposal element: Mobile full-width overlay
  - Design decision: Decision 2 (Style B overlay)
  - Validation approach: E2E test on mobile viewport — clicks search icon, asserts overlay appears and input is focused

- Proposal element: Cyan dot active indicator
  - Design decision: Decision 4
  - Validation approach: Unit/E2E test asserts dot is visible when search param is set, hidden when empty

- Proposal element: Header syncs from URL
  - Design decision: Decision 1 (`useRouterState`)
  - Validation approach: E2E test navigates to `/recipes?search=chicken` directly, asserts header input value is "chicken"

- Proposal element: Remove recipe page search
  - Design decision: Decision 5
  - Validation approach: Verify `data-testid="recipe-search-input"` no longer exists in DOM; E2E tests updated to use header input

## Functional Requirements Mapping

- Requirement: Header input auto-filters recipes on keypress
  - Design element: Decision 3 — debounced onChange navigation
  - Acceptance criteria reference: specs/header-search.md — "Auto-filter"
  - Testability notes: E2E — type into header input, assert recipe cards update after debounce delay

- Requirement: Mobile overlay opens on search icon tap
  - Design element: Decision 2 — `mobileSearchOpen` state, conditional render
  - Acceptance criteria reference: specs/header-search.md — "Mobile overlay"
  - Testability notes: E2E on 375px viewport — click icon, assert input visible and focused

- Requirement: Cyan dot appears when search is active
  - Design element: Decision 4 — conditional dot render
  - Acceptance criteria reference: specs/header-search.md — "Active indicator"
  - Testability notes: Query for dot element; assert presence/absence based on input value

- Requirement: Header input populates from URL on navigation
  - Design element: Decision 1 — `useRouterState` sync
  - Acceptance criteria reference: specs/header-search.md — "URL sync"
  - Testability notes: E2E — navigate to `/recipes?search=foo`, assert header input value equals "foo"

- Requirement: Clearing input removes search param
  - Design element: Decision 3 — `value || undefined` in navigate call
  - Acceptance criteria reference: specs/header-search.md — "Clear"
  - Testability notes: E2E — clear input, assert URL has no `search` param and all recipes shown

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No excessive API calls on fast typing
  - Design element: Decision 3 — 300ms debounce
  - Acceptance criteria reference: Debounce cancels in-flight timers on rapid keypress
  - Testability notes: Unit test debounce logic; E2E asserts single network request after pause

- Requirement category: accessibility
  - Requirement: Search input is keyboard accessible; overlay closeable via Escape
  - Design element: Decision 2 — Escape key listener in overlay, `aria-label` on icon button
  - Acceptance criteria reference: specs/header-search.md — "Accessibility"
  - Testability notes: Keyboard-only navigation test; Escape closes overlay

## Risks / Trade-offs

- Risk/trade-off: `useRouterState` re-renders Header on every route change
  - Impact: Minor — Header is already re-rendering on route changes; one extra `useEffect` run
  - Mitigation: No action needed; effect only updates state when the extracted value actually differs

- Risk/trade-off: Removing `data-testid="recipe-search-input"` breaks existing E2E tests until updated
  - Impact: Medium — CI fails until tests are updated in the same PR
  - Mitigation: Update E2E tests as part of this change (included in tasks)

## Rollback / Mitigation

- Rollback trigger: Header search causes navigation loop, input desync, or broken mobile layout on production
- Rollback steps: Revert `Header.tsx` and `recipes/index.tsx` changes via git revert; redeploy
- Data migration considerations: None — URL param `?search=` is stateless
- Verification after rollback: Confirm recipe page search input is present and functional; header form submit works

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or linting before proceeding.
- If security checks fail: Do not merge. Assess whether the failure is related to this change; escalate if needed.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: 48 hours without review → maintainer merge or re-assignment.

## Open Questions

No open questions. All design decisions confirmed during explore session.

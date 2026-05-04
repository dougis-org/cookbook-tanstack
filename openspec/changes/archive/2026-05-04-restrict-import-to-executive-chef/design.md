## Context

- Relevant architecture: TanStack Start + React 19. Tier entitlements are read client-side via `useTierEntitlements` (calls `useAuth` → session.user.tier). The `canImport()` function in `src/lib/tier-entitlements.ts` already gates at `executive-chef`. `TierWall` component supports `display="inline"` and `display="modal"`.
- Dependencies: `src/hooks/useTierEntitlements.ts`, `src/lib/tier-entitlements.ts`, `src/components/ui/TierWall.tsx`
- Interfaces/contracts touched:
  - `Header.tsx` — adds `useTierEntitlements` call; changes nav link render condition
  - `src/routes/import/index.tsx` — adds `useTierEntitlements` call; changes JSX conditional rendering

## Goals / Non-Goals

### Goals

- Hide the "Import Recipe" nav link for users where `canImport` is false
- Show an inline upsell on `/import/` page load for users where `canImport` is false
- Keep existing TierWall-on-mutation behavior intact for defense-in-depth

### Non-Goals

- Modifying backend enforcement (already correct)
- Adding import entry points anywhere else
- Changing `TierWall` component or its messages

## Decisions

### Decision 1: Nav link — hide entirely vs. show with lock indicator

- Chosen: Hide entirely (`{session && canImport && <Link ...>}`)
- Alternatives considered: Show with a lock icon to hint feature exists; show but disabled
- Rationale: User explicitly chose hide. Sous Chef users have no expectation of import — it was never shown to them historically.
- Trade-offs: Slightly reduces feature discoverability for users who might upgrade, but avoids confusion and is consistent with how other tier-gated UI is handled in this codebase.

### Decision 2: Page-load gate — inline upsell vs. modal vs. redirect

- Chosen: Render `<TierWall reason="import" display="inline" />` in place of the dropzone content; all hooks still run (no early return before hooks).
- Alternatives considered: Show blocking modal on mount; redirect to `/pricing` immediately; show disabled dropzone with overlay.
- Rationale: User explicitly chose inline upsell. Inline TierWall is already in the component library with the correct message and Upgrade link. Keeps the page title/description visible for context. No navigation side-effects.
- Trade-offs: User can still see the PageLayout shell (title "Import Recipe", description). This is intentional — it tells them what the page is for before prompting them to upgrade.

### Decision 3: Hook placement in import page — top-level call, JSX conditional

- Chosen: Call `useTierEntitlements()` at the top of `ImportPage` alongside existing hooks; conditionally render TierWall vs. dropzone in JSX.
- Alternatives considered: Extract gated content into a sub-component; use a route-level `beforeLoad` check.
- Rationale: Hooks must not be called conditionally. JSX conditional keeps the component structure flat and readable. `beforeLoad` would hard-redirect rather than show an upsell — wrong UX.
- Trade-offs: All state and mutation hooks initialize even for non-entitled users (wasted setup). Acceptable — these are cheap React hooks, not side-effectful operations.

### Decision 4: Test strategy for Header

- Chosen: Rely on the existing `useAuth` mock chain (Header tests mock `useAuth` → `useTierEntitlements` reads from it). Update `mockSession` to include `tier: 'executive-chef'` where import visibility is expected; add sous-chef test with `tier: 'sous-chef'`.
- Alternatives considered: Mock `useTierEntitlements` directly in Header tests.
- Rationale: Using the existing `useAuth` mock chain tests the real hook integration, which is more valuable. Less mocking surface.
- Trade-offs: If `useTierEntitlements` internals change, Header tests may need updating — acceptable.

### Decision 5: Test strategy for import page

- Chosen: Add `vi.mock('@/hooks/useTierEntitlements', ...)` to `-import.test.tsx`; default mock returns `canImport: true` to preserve all existing tests; new test sets `canImport: false`.
- Alternatives considered: Mock `useAuth` instead and let real `useTierEntitlements` run.
- Rationale: The import page tests do not currently mock `useAuth` — introducing it would require wiring context providers. Directly mocking `useTierEntitlements` is cleaner and keeps the test scope focused on the import page behavior.
- Trade-offs: Mock bypasses real hook integration, but that integration is already covered by `useTierEntitlements.test.ts`.

## Proposal to Design Mapping

- Proposal element: Hide nav link for non-executive-chef users
  - Design decision: Decision 1 (hide entirely)
  - Validation approach: Header unit tests — assert link absent for sous-chef session, present for executive-chef session

- Proposal element: Show inline upsell on page load
  - Design decision: Decision 2 (inline TierWall), Decision 3 (hook placement)
  - Validation approach: Import page unit test — assert TierWall inline text visible when `canImport: false`

- Proposal element: Existing tests break risk
  - Design decision: Decision 4, Decision 5
  - Validation approach: All tests in `Header.test.tsx` and `-import.test.tsx` pass after changes

## Functional Requirements Mapping

- Requirement: Import nav link hidden when `canImport` is false
  - Design element: `Header.tsx` — `{session && canImport && <Link to="/import">...}`
  - Acceptance criteria reference: specs/import-tier-gate.md — AC-1
  - Testability notes: Unit test with sous-chef session; assert `queryByText('Import Recipe')` is null

- Requirement: Import nav link visible when `canImport` is true
  - Design element: `Header.tsx` — same condition, executive-chef session
  - Acceptance criteria reference: specs/import-tier-gate.md — AC-2
  - Testability notes: Unit test with executive-chef session; assert `getByText('Import Recipe')` is present

- Requirement: Inline TierWall shown on `/import/` for non-entitled users
  - Design element: `src/routes/import/index.tsx` — conditional JSX branch
  - Acceptance criteria reference: specs/import-tier-gate.md — AC-3
  - Testability notes: Unit test with `canImport: false` mock; assert "Import requires Executive Chef" text present

- Requirement: Full import UI shown for executive-chef users
  - Design element: `src/routes/import/index.tsx` — `canImport` true branch renders dropzone
  - Acceptance criteria reference: specs/import-tier-gate.md — AC-4
  - Testability notes: Existing tests with `canImport: true` mock continue to pass

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No perceptible render delay for entitled users
  - Design element: `useTierEntitlements` reads synchronously from cached `useAuth` session — no async work
  - Acceptance criteria reference: implicit (no regression)
  - Testability notes: No additional perf testing needed; hook is synchronous

- Requirement category: security
  - Requirement: Backend gate remains as defense-in-depth
  - Design element: No changes to tRPC import router; existing `canImport` server check still active
  - Acceptance criteria reference: Not part of this change — covered by #419
  - Testability notes: Existing tRPC tests cover this

## Risks / Trade-offs

- Risk/trade-off: `mockSession` in Header tests has no `tier` field — after change, `canImport` resolves false, breaking "shows Import Recipe link" test.
  - Impact: CI failure if not addressed.
  - Mitigation: Update `mockSession` to `{ user: { ..., tier: 'executive-chef' } }` in the tests that expect the link visible.

- Risk/trade-off: Import page tests call `useTierEntitlements` without a mock — may throw or return unexpected value.
  - Impact: Test failures or false passes.
  - Mitigation: Add `vi.mock('@/hooks/useTierEntitlements')` with default `canImport: true`.

## Rollback / Mitigation

- Rollback trigger: CI failure, visual regression in nav for executive-chef users, or import page broken for entitled users.
- Rollback steps: Revert the two source file changes (`Header.tsx`, `import/index.tsx`); test file changes are safe to leave.
- Data migration considerations: None — purely UI rendering change.
- Verification after rollback: `npm run test` passes; manually verify import link appears in nav for any authenticated user.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix tests before proceeding.
- If security checks fail: Investigate; this change has no new auth surface, so failures are likely pre-existing.
- If required reviews are blocked/stale: Re-request review after 24 hours; escalate to repo owner (dougis) if blocked beyond 48 hours.
- Escalation path and timeout: Tag @dougis in PR if blocked >48 hours.

## Open Questions

No open questions. All design decisions were confirmed during exploration.

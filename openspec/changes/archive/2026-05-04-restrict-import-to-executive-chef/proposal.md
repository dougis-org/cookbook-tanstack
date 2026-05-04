## GitHub Issues

- #421
- #419 (prerequisite — backend gate already merged)

## Why

- Problem statement: Sous Chef subscribers can navigate to `/import/`, see the full import UI, upload a file, and preview a recipe — only hitting a tier wall when they click Confirm. The nav sidebar also shows an "Import Recipe" link to all authenticated users regardless of tier.
- Why now: The backend `canImport` gate (requiring `executive-chef`) shipped with #419. The UI has not yet been updated to reflect this, leaving Sous Chef users with a confusing experience where the feature appears available until the last step.
- Business/user impact: Sous Chef users waste effort before learning they can't use the feature. Hiding the nav entry and showing an early upsell improves clarity and creates a natural upgrade prompt.

## Problem Space

- Current behavior: "Import Recipe" appears in the mobile sidebar for all authenticated users. The `/import/` page renders fully for any logged-in user; the tier wall only fires after the tRPC mutation is submitted.
- Desired behavior: The nav link is hidden for users below `executive-chef`. Users who reach `/import/` without the entitlement immediately see an inline upsell instead of the dropzone.
- Constraints: `canImport()` and `useTierEntitlements` already exist and are correct — no new entitlement logic needed. `TierWall` already has `display="inline"` mode with the correct 'import' message and an Upgrade link.
- Assumptions: The only import entry point in the nav is the mobile sidebar link at `Header.tsx:449`. There is no desktop nav link.
- Edge cases considered:
  - Anonymous users: already blocked by `requireAuth()` on the route — no change needed.
  - Executive Chef users: unaffected — `canImport` is true, they see the nav link and the full page.
  - Users with no tier field on their session: `useTierEntitlements` resolves to `home-cook` (no import) — correctly excluded.
  - Direct URL navigation to `/import/` by a Sous Chef user: handled by the page-load upsell.

## Scope

### In Scope

- Hide "Import Recipe" nav link in `Header.tsx` when `canImport` is false
- Show inline `TierWall` on `/import/` page load when `canImport` is false, replacing the dropzone
- Update `Header.test.tsx` and `-import.test.tsx` to cover the new tier-gated behavior

### Out of Scope

- Any changes to the backend tRPC import router (already enforces the gate)
- Any changes to `canImport()` logic in `tier-entitlements.ts`
- Desktop nav (no import link exists there)
- E2E test changes (the inline upsell is covered by unit tests)

## What Changes

- `src/components/Header.tsx` — import and call `useTierEntitlements`; add `&& canImport` to the import link render condition
- `src/routes/import/index.tsx` — import and call `useTierEntitlements`; conditionally render `<TierWall reason="import" display="inline" />` instead of the dropzone when `!canImport`
- `src/components/__tests__/Header.test.tsx` — update "shows Import Recipe link when session is non-null" test to use an executive-chef session; add test asserting the link is hidden for a sous-chef session
- `src/routes/__tests__/-import.test.tsx` — mock `useTierEntitlements`; add test asserting inline TierWall is shown when `canImport: false`

## Risks

- Risk: Existing Header tests break because `mockSession` has no `tier` field, causing `canImport` to resolve false.
  - Impact: Test suite fails on CI.
  - Mitigation: Update `mockSession` in Header tests to include `tier: 'executive-chef'` where import visibility is expected; existing `useAuth` mock already covers the hook chain.

- Risk: Import page tests break because `useTierEntitlements` is now called but `useAuth` is not mocked.
  - Impact: Hook throws or returns unexpected values, causing test failures.
  - Mitigation: Add a `vi.mock('@/hooks/useTierEntitlements', ...)` to the import page test file; default mock returns `canImport: true` to preserve existing test behavior.

## Open Questions

No unresolved ambiguity. Direction confirmed in exploration session:
- Nav link: hide entirely (not lock icon, not disabled state)
- Page gate: inline upsell on load (not a blocking modal)

## Non-Goals

- Adding a lock/badge to the nav entry to hint at the feature's existence
- Gating other entry points (e.g., recipe list "Import" buttons — none exist currently)
- Changing the upsell copy or TierWall component design

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## Context

- **Relevant architecture**: TanStack Start with React 19, Tailwind CSS 4, tRPC, and Vitest.
- **Dependencies**: Lucide React for theme-compliant icons, `@tanstack/react-router` for linking.
- **Interfaces/contracts touched**: 
  - `src/lib/tier-entitlements.ts` (tier structures, limits, and pricing).
  - `src/hooks/useTierEntitlements.ts` (retrieving current user tier context).
  - `src/components/ui/TierWall.tsx` (the limit modal component).
  - `src/routes/recipes/index.tsx` (recipe overview).
  - `src/routes/recipes/new.tsx` (new recipe creation page).

## Goals / Non-Goals

### Goals

- Build a highly A/B-testable dynamic paywall nudging helper `src/lib/nudgeCopy.ts` that decouples UI rendering from string literal maintenance.
- Create a shared `src/components/ui/UsageNudge.tsx` component that processes limits, counts, resources, and triggers appropriate threshold layout states (`soft` at 70%, `loud` at 90%).
- Upgrade `<TierWall>` to output a gorgeous pricing/limit comparison matrix between current and target tiers.
- Enforce the 100% hard limit wall at the routing/form entry level on `/recipes/new`.

### Non-Goals

- Refactoring `/home` usage components.
- Storing or caching recipe limits in local databases (keeping client tier hooks as clean UI affordances).

## Decisions

### Decision 1: A/B Testable Copy Decoupling (`src/lib/nudgeCopy.ts`)

- **Chosen**: Define all text generation strings, formats, and button label templates in `src/lib/nudgeCopy.ts` as functions/constants.
- **Alternatives considered**: Inline interpolation inside the components.
- **Rationale**: Decoupled strings allow clean localization and rapid A/B testing of pricing nudges without re-building component rendering structures.
- **Trade-offs**: Marginally more file switching, but fully aligned with the handoff specifications.

### Decision 2: Shared Component for Nudges (`src/components/ui/UsageNudge.tsx`)

- **Chosen**: A single component that handles both soft and loud nudges, with standard CSS color-mix and theme tokens for warning status.
- **Alternatives considered**: Two separate components (e.g. `SoftNudge.tsx` and `LoudNudge.tsx`).
- **Rationale**: A single component naturally enforces the transition thresholds (70% to 89% and 90% to 99%) off a single set of parameters and ensures high reuse.
- **Trade-offs**: The component must conditionally switch layouts, but keeping them together reduces overall lines of code and state logic.

### Decision 3: Form-Entry Blocking for `/recipes/new`

- **Chosen**: Mount a modal `<TierWall reason="count-limit" display="modal" onDismiss={...} />` at the top level of `src/routes/recipes/new.tsx` if `myRecipeCount >= recipeLimit`.
- **Alternatives considered**: Redirecting from the route's `beforeLoad`.
- **Rationale**: Renders a visually premium modal backdrop rather than a jarring sudden redirect, letting the user see they are blocked, and allows them to dismiss to route back home cleanly.
- **Trade-offs**: Requires querying usage on the `/recipes/new` page, but ensures complete client-side security and UX consistency.

## Proposal to Design Mapping

- **Proposal element**: 70%–89% soft nudge
  - **Design decision**: Render inline, read dismissed state from `sessionStorage`, and use `--theme-accent` borders.
  - **Validation approach**: Unit tests mocking sessionStorage and count ratios at `7/10`.
- **Proposal element**: 90%–99% loud nudge
  - **Design decision**: Persistent layout warning box using `--theme-warning` tokens and custom progress bar.
  - **Validation approach**: Unit tests with count ratio at `9/10` asserting progress track width and CTA presence.
- **Proposal element**: 100% hard wall block
  - **Design decision**: Extend `<TierWall>` with comparative grid block mapping Current vs Next Tier feature advantages. Enforce at `/recipes/new`.
  - **Validation approach**: Test route rendering at 10/10 limit, and assert table entries match plan specifications.

## Functional Requirements Mapping

- **Requirement**: Dismissable Soft Nudge.
  - **Design element**: `UsageNudge.tsx` reads/writes `sessionStorage.getItem('nudge_dismissed_recipe')`.
  - **Acceptance criteria reference**: `F05-paywall-nudges.md` Acceptance Criteria #1.
  - **Testability notes**: Verify that clicking `[X]` calls `sessionStorage.setItem` and hides the element.
- **Requirement**: Persistent Warning banner with next tier pricing.
  - **Design element**: `UsageNudge.tsx` renders progress bar at 90% and retrieves next tier monthly price dynamically.
  - **Acceptance criteria reference**: `F05-paywall-nudges.md` Acceptance Criteria #2.
  - **Testability notes**: Render at 9/10, check that progress elements are present and dismiss buttons are absent.

## Non-Functional Requirements Mapping

- **Requirement category**: operability
  - **Requirement**: Zero regressions on existing `<TierWall>` usages.
  - **Design element**: Retain existing `MESSAGES` and modal fallback structures.
  - **Acceptance criteria reference**: `F05-paywall-nudges.md` Constraints #3.
  - **Testability notes**: Verify other limit types (e.g. `private-content`, `import`) continue rendering modal without comparison rows.

## Risks / Trade-offs

- **Risk/trade-off**: Adding state dependencies on `new.tsx` might cause render delays.
  - **Impact**: Jumpy layout during loading.
  - **Mitigation**: Handle loading states smoothly (return null or skeleton until `ownedUsageData` query completes).

## Rollback / Mitigation

- **Rollback trigger**: Discovery of rendering regression on modal popups.
- **Rollback steps**: Revert updates to `src/components/ui/TierWall.tsx` and route files using Git.
- **Data migration considerations**: None (UI changes only).
- **Verification after rollback**: Run existing `TierWall.test.tsx` test suite.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge. Run `npm run test` and `npx tsc --noEmit` locally to identify typescript or routing issues.
- **If security checks fail**: Consult security advisories. Progressive paywall components are strictly UI/UX layers and present no credential leakage risks.
- **If required reviews are blocked/stale**: Proactively ping peer maintainers.
- **Escalation path and timeout**: Escalate to lead maintainer if stale for more than 24 hours.

## Open Questions

- None.

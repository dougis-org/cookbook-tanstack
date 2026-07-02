## Context

- Relevant architecture: TanStack Start + React 19, TailwindCSS 4 with `var(--theme-*)` tokens, Lucide React icons, `<Link>` from `@tanstack/react-router`.
- Dependencies: `lucide-react` (Lock icon), `@tanstack/react-router` (Link).
- Interfaces/contracts touched: None — purely presentational. Parent resolves state and passes as prop.

## Goals / Non-Goals

### Goals

- Render the correct copy and CTA for each of the three unentitled states
- Use adblock-safe classnames (`.up-*` prefix)
- Match the inline strip visual pattern of `TierWall` inline
- Cover all three states in unit tests

### Non-Goals

- Performing any tRPC query or auth check inside the component
- Wiring into `RecipeDetail` or any route
- Modal or full-page variants

## Decisions

### Decision 1: Purely presentational — state resolved by parent

- Chosen: Component accepts `state: 'anonymous' | 'below-tier' | 'hidden-by-downgrade'` as a prop; all business logic lives in the parent.
- Alternatives considered: Component could call `useAuth` and `privateRecipeNotes.get` internally.
- Rationale: Keeps the component testable in isolation without mocking hooks or tRPC. Consistent with the "thin adapter" pattern established by `TierWall` and `UsageNudge`. Tier entitlement decisions stay centralized in the caller per the `keep-tier-entitlement-checks-centralized` project decision.
- Trade-offs: Parent must map server response + auth state to the correct `state` value. This is minimal logic and lives closest to where the data already is.

### Decision 2: Inline strip visual pattern (no modal)

- Chosen: Amber/accent-tinted compact strip with icon + copy + CTA in a single row, matching `TierWall` inline. Classnames `.up-card`, `.up-body`, `.up-cta`.
- Alternatives considered: Full empty-state panel, modal.
- Rationale: Inline strip is least intrusive and consistent with existing upgrade surfaces. `hidden-by-downgrade` still needs to feel informative (not just decorative), but a strip with strong copy achieves that without adding new visual patterns.
- Trade-offs: Less visual prominence than a panel; acceptable given this feature is secondary to the recipe content itself.

### Decision 3: Lock icon (Lucide)

- Chosen: `Lock` from `lucide-react`, size 16px, `currentColor`.
- Alternatives considered: `NotebookPen` (signals what's withheld), `LockKeyhole`.
- Rationale: `Lock` unambiguously signals access gating. `NotebookPen` would be good but is less universally understood as a tier gate. Consistent with design-system rule: icons carry semantic meaning, not decoration.
- Trade-offs: None significant.

### Decision 4: Single CTA per state

- Chosen: One `<Link>` rendered as a button per state — `Login` → `/auth/login` for anonymous; `Upgrade` → `/pricing` for below-tier and hidden-by-downgrade.
- Alternatives considered: Two CTAs for anonymous (Login + Register).
- Rationale: Single CTA reduces visual noise. `/auth/login` page already offers registration flow.
- Trade-offs: Anonymous users who are new must navigate from login to register — an acceptable one-extra-click trade-off.

### Decision 5: Adblock-safe classnames

- Chosen: `.up-card` (container), `.up-body` (copy text), `.up-cta` (button/link).
- Alternatives considered: `.tier-nudge-*`, `.notes-gate-*`.
- Rationale: `.up-*` is the established prefix per design-system guidance. Avoids `.ad-*`, `.promo-*`, `.sponsor-*`, `.banner-*` patterns filtered by uBlock Origin / EasyList.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Three unentitled states (anonymous, below-tier, hidden-by-downgrade)
  - Design decision: Decision 1 — prop-driven, parent resolves state
  - Validation approach: Unit tests assert copy text and link href for each state value

- Proposal element: Inline strip visual (matches TierWall inline)
  - Design decision: Decision 2 — single-row strip with amber/accent tint
  - Validation approach: Visual inspection; snapshot optional

- Proposal element: Lock icon
  - Design decision: Decision 3 — Lucide `Lock`, 16px
  - Validation approach: Unit test queries for the lock icon role/aria or test-id

- Proposal element: Single CTA per state
  - Design decision: Decision 4 — `<Link>` to `/auth/login` or `/pricing`
  - Validation approach: Unit tests assert link `href` per state

- Proposal element: Adblock-safe classnames
  - Design decision: Decision 5 — `.up-*` prefix
  - Validation approach: Code review; no automated check needed

## Functional Requirements Mapping

- Requirement: Render correct copy for `anonymous`
  - Design element: State-driven copy map in component
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: `screen.getByText(...)` in unit test

- Requirement: Render correct copy for `below-tier`
  - Design element: State-driven copy map
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: `screen.getByText(...)` in unit test

- Requirement: Render correct copy for `hidden-by-downgrade`
  - Design element: State-driven copy map
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: `screen.getByText(...)` in unit test; must not render any note body content

- Requirement: CTA links to correct route per state
  - Design element: Decision 4
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: `getByRole('link')` + `.toHaveAttribute('href', ...)`

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Component must never render note body content for unentitled states
  - Design element: Decision 1 — component is stateless; note body never passed as prop
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: No `body` prop exists; structural guarantee

- Requirement category: accessibility
  - Requirement: CTA is a proper `<Link>` (rendered as `<a>`) with descriptive label
  - Design element: Decision 4 — `<Link>` from `@tanstack/react-router`
  - Acceptance criteria reference: specs/recipe-notes-upgrade-nudge/spec.md
  - Testability notes: `getByRole('link', { name: /login|upgrade/i })`

- Requirement category: operability
  - Requirement: Adblock-safe; upgrade surface must not be filtered by cosmetic blockers
  - Design element: Decision 5 — `.up-*` classnames
  - Acceptance criteria reference: design-system/CLAUDE.md
  - Testability notes: Code review

## Risks / Trade-offs

- Risk/trade-off: Copy strings drift from issue spec without automated assertion
  - Impact: Low — wrong copy reaches users silently
  - Mitigation: Tests assert exact strings per acceptance criteria

## Rollback / Mitigation

- Rollback trigger: Incorrect copy rendered, adblock filtering detected, or CTA links broken
- Rollback steps: Revert `RecipeNotesUpgradeNudge.tsx`; no data migration needed (purely UI)
- Data migration considerations: None
- Verification after rollback: Run unit tests; confirm notes slot is empty for unentitled users

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix failing tests or lint errors before proceeding
- If security checks fail: Investigate; this component has no data access so failures are likely in unrelated code
- If required reviews are blocked/stale: Re-request after 24 hours; escalate to project owner if still blocked after 48 hours
- Escalation path and timeout: 48-hour timeout, then project owner decides

## Open Questions

No open questions. All design decisions confirmed during exploration session.

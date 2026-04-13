## Context

- Relevant architecture: `src/components/Header.tsx` — single component owning the `isOpen` boolean state for the mobile sidebar drawer. The `<aside>` slides in/out via Tailwind `translate-x` classes. Nav links each call `setIsOpen(false)` on click.
- Dependencies: React `useState` (already used), Tailwind CSS z-index utilities.
- Interfaces/contracts touched: No props changed; `isOpen` state management is internal to `Header`.

## Goals / Non-Goals

### Goals

- Close the sidebar when the user clicks/taps outside of it.
- Close the sidebar when the user selects a theme from the sidebar theme picker.

### Non-Goals

- Focus trap inside the sidebar.
- Keyboard (Escape key) close for the sidebar drawer (Escape only closes the mobile search input, not the sidebar).
- Swipe-to-close gesture.
- Any refactor of Header beyond the two targeted changes.

## Decisions

### Decision 1: Backdrop overlay div (click-outside)

- Chosen: Render a `<div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsOpen(false)} />` when `isOpen` is true, placed in the JSX between `<header>` and `<aside>`.
- Alternatives considered: `useEffect` + `document.addEventListener('mousedown', ...)` with a `ref` on the `<aside>`.
- Rationale: The overlay approach is simpler (no ref, no event cleanup), visually clear, and is the standard pattern used by every major UI library for drawer/modal dismiss. The `<aside>` is already `z-50`; `z-40` for the backdrop ensures it sits behind the drawer but above all page content.
- Trade-offs: Pointer events on page content are intercepted while the menu is open — this is intentional and expected behavior for a drawer pattern.

### Decision 2: Close sidebar on theme change

- Chosen: Update each theme button's `onClick` from `() => setTheme(t.id)` to `() => { setTheme(t.id); setIsOpen(false) }`.
- Alternatives considered: A `useEffect` watching `theme` that calls `setIsOpen(false)` on change.
- Rationale: Inline handler is explicit, co-located with the action, and avoids side effects from a `useEffect` that would also fire on initial mount.
- Trade-offs: None significant; both state updates are synchronous and React batches them.

## Proposal to Design Mapping

- Proposal element: "Add a full-screen backdrop overlay rendered when `isOpen === true`"
  - Design decision: Decision 1 (backdrop overlay div)
  - Validation approach: Playwright E2E — open menu, click outside, assert sidebar closed.

- Proposal element: "Add `setIsOpen(false)` to each theme button's `onClick` handler"
  - Design decision: Decision 2 (close on theme change)
  - Validation approach: Playwright E2E — open menu, click theme button, assert sidebar closed and theme applied.

## Functional Requirements Mapping

- Requirement: Clicking outside the open sidebar closes it.
  - Design element: Backdrop overlay div (Decision 1).
  - Acceptance criteria reference: specs/sidebar-close-behavior.md — AC1.
  - Testability notes: Playwright `click` on the backdrop element; assert `<aside>` has `translate-x-full` class or is not visible.

- Requirement: Selecting a theme while the sidebar is open closes the sidebar.
  - Design element: Updated theme button `onClick` (Decision 2).
  - Acceptance criteria reference: specs/sidebar-close-behavior.md — AC2.
  - Testability notes: Playwright `click` on a theme button; assert sidebar dismissed and `data-theme` attribute on `<html>` updated.

- Requirement: Existing close behaviors (X button, nav links, sign-out) continue to work.
  - Design element: No changes to those handlers.
  - Acceptance criteria reference: specs/sidebar-close-behavior.md — AC3.
  - Testability notes: Existing tests must still pass; no regression.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Backdrop must not cause layout shift or repaints on pages without open sidebar.
  - Design element: Backdrop is conditionally rendered (`{isOpen && <div ... />}`) — zero DOM cost when closed.
  - Acceptance criteria reference: N/A (implicit).
  - Testability notes: Visual inspection; no measurable perf impact expected.

- Requirement category: accessibility
  - Requirement: Backdrop must not be reachable by screen readers or keyboard.
  - Design element: `aria-hidden="true"` on the backdrop div.
  - Acceptance criteria reference: specs/sidebar-close-behavior.md — AC4.
  - Testability notes: axe-core scan; assert no new accessibility violations introduced.

## Risks / Trade-offs

- Risk/trade-off: Backdrop `z-40` vs page elements with high z-index (e.g., tooltips, dropdowns).
  - Impact: Low — the app currently has no other fixed/absolute elements competing in this z-range.
  - Mitigation: If a conflict arises later, adjust the backdrop z-index; current page content uses default stacking.

## Rollback / Mitigation

- Rollback trigger: Regression in existing sidebar close behavior or accessibility failure in CI.
- Rollback steps: Revert the two changes to `src/components/Header.tsx`.
- Data migration considerations: None — purely UI state change.
- Verification after rollback: Run `npm run test` and `npm run test:e2e`; confirm all Header tests pass.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Investigate and fix the failure before proceeding.
- If security checks fail: Do not merge. This change has no security surface, so any failure is likely unrelated — confirm and fix upstream.
- If required reviews are blocked/stale: Wait up to 48 hours, then ping the reviewer. After 48 hours with no response, escalate to the team lead.
- Escalation path and timeout: Team lead decision after 48 hours of blocked review.

## Open Questions

No open questions — design is fully resolved.

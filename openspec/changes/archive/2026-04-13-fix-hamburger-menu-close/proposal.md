## GitHub Issues

- dougis-org/cookbook-tanstack#310

## Why

- Problem statement: The mobile hamburger sidebar does not close when the user clicks/taps outside it, nor when they select a theme. The only way to dismiss it is the explicit X button.
- Why now: Reported open UX issue causing frustration on mobile — users expect drawer UIs to close on outside interaction.
- Business/user impact: Poor mobile UX; users feel "stuck" in the menu until they find the X button.

## Problem Space

- Current behavior: Sidebar opens on hamburger click. Nav links close it (`onClick={() => setIsOpen(false)}`). Theme buttons and clicking outside the sidebar do not close it.
- Desired behavior: (1) Clicking/tapping anywhere outside the sidebar closes it. (2) Selecting a theme closes the sidebar.
- Constraints: Fix must not break existing close behaviors (X button, nav links, sign-out).
- Assumptions: The fix is self-contained to `src/components/Header.tsx`. No other component manages `isOpen` state.
- Edge cases considered:
  - Backdrop must sit behind the sidebar (`z-40`) but above all page content (`z-50` for aside).
  - Backdrop must be `aria-hidden` so screen readers don't interact with it.
  - Theme selection should still apply the chosen theme in addition to closing the menu.

## Scope

### In Scope

- Add a full-screen backdrop overlay rendered when `isOpen === true` that calls `setIsOpen(false)` on click.
- Add `setIsOpen(false)` to each theme button's `onClick` handler.

### Out of Scope

- Focus trap inside the sidebar (separate accessibility enhancement).
- Swipe-to-close gesture on mobile.
- Any changes to theme switching logic itself.
- Changes to the desktop header layout.

## What Changes

- `src/components/Header.tsx`: Add backdrop `<div>` between `<header>` and `<aside>`. Update theme button `onClick` to also call `setIsOpen(false)`.

## Risks

- Risk: Backdrop intercepts pointer events on page content while menu is open.
  - Impact: Low — the backdrop only renders when `isOpen` is true, and its sole purpose is capturing outside clicks.
  - Mitigation: None needed; this is the intended behavior.
- Risk: Theme change + close causes a visual flicker if theme re-renders the sidebar before it slides out.
  - Impact: Negligible — CSS transition handles the slide-out; theme change is cosmetic.
  - Mitigation: No action needed.

## Open Questions

No unresolved ambiguity exists. The fix is fully scoped and the implementation approach was confirmed during the explore session.

## Non-Goals

- Keyboard accessibility / focus trap (out of scope for this fix).
- Swipe gestures.
- Any refactor of the Header component beyond the two targeted changes.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

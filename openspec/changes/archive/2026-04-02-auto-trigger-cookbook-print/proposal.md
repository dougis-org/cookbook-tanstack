## Why

When a user clicks "Print" on the cookbook detail page, they are navigated to the print view but must click a second "Print" button to trigger the browser's print dialog. This two-click flow is redundant — arriving at a print route implies intent to print. Eliminating the second click improves the experience while preserving a `?displayonly=1` escape hatch for future print-preview use cases.

## What Changes

- The cookbook print route (`/cookbooks/:cookbookId/print`) will automatically invoke `window.print()` once its async data has loaded and rendered, unless the `?displayonly=1` query parameter is present.
- A `?displayonly=1` query param suppresses the auto-trigger, enabling the route to be visited in preview mode without opening the browser print dialog.
- The existing `PrintButton` on the print page is retained for manual re-printing after the dialog is dismissed.
- The "Print" link on the cookbook detail page remains a standard `<Link>` navigating to `/print` (no URL changes needed — auto-trigger fires by default).
- E2E tests are updated/added to assert auto-trigger behavior and verify `?displayonly=1` suppresses it.

## Capabilities

### New Capabilities

- `cookbook-print-auto-trigger`: The print route auto-invokes `window.print()` after data loads, unless suppressed by `?displayonly=1`.

### Modified Capabilities

- `cookbook-print-view`: The print route now has auto-trigger behavior as a new requirement on top of the existing TOC/layout spec.

## Impact

- **Code**: `src/routes/cookbooks.$cookbookId_.print.tsx` — add `useEffect` and read search param
- **Tests**: `src/e2e/cookbooks-print.spec.ts` — add auto-trigger tests; existing display tests must pass `?displayonly=1` to avoid the print dialog firing mid-test
- **No API changes**, no new dependencies, no routing changes

## Problem Space

**In scope:**
- Auto-triggering `window.print()` on the cookbook print route
- `?displayonly=1` suppression param
- E2E test coverage for both behaviors

**Out of scope:**
- Recipe print route (already calls `window.print()` directly via `PrintButton` — no navigation step involved)
- Building a dedicated "print preview" UI (the `?displayonly=1` param makes this possible later, but it is not implemented here)
- Changing the cookbook detail page "Print" link

## Risks

- **Playwright dialog handling**: `window.print()` opens a native OS print dialog. Tests must intercept `window.print` via `addInitScript` to prevent the dialog from blocking the test runner.
- **Existing E2E tests**: Tests that navigate directly to the print route will now trigger the auto-print effect. Those tests need `?displayonly=1` added to their navigation URLs to stay unaffected.

## Non-Goals

- Do not add a print preview page or UI.
- Do not change the URL structure of the print route.
- Do not modify the recipe-level print flow.

## Open Questions

No unresolved ambiguity. The approach (auto-trigger + `?displayonly=1` suppression) was explicitly decided during exploration. Scope is confirmed.

---

> **Change-control note:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before `/opsx:apply` proceeds.
>
> **This proposal must be reviewed and explicitly approved before design, specs, tasks, or apply proceed.**

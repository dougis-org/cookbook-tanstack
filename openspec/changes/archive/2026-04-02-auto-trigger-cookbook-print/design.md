## Context

The cookbook print route (`/cookbooks/:cookbookId/print`) renders a full print-ready document. It currently requires a second manual click of a `PrintButton` to invoke `window.print()`. The print page loads data asynchronously via `useQuery` before rendering, so the print trigger must fire after data is available — not at mount time.

The "Print" link on the cookbook detail page is a standard TanStack `<Link>` that navigates to the print route. No change is needed there.

## Goals / Non-Goals

**Goals:**
- Auto-invoke `window.print()` on the cookbook print route once data has loaded and rendered
- Provide a `?displayonly=1` search param to suppress auto-trigger (enables future preview use)
- Keep existing `PrintButton` for manual re-print after dialog dismissal
- Update E2E tests to cover both auto-trigger and suppressed behaviors; patch existing tests that navigate directly to the print route so they pass `?displayonly=1` and are not disrupted

**Non-Goals:**
- Building a print preview UI
- Changing the recipe-level print flow
- Modifying the cookbook detail "Print" link URL

## Decisions

### D1: `useEffect` fires after data resolves

**Decision:** Add a `useEffect` in `CookbookPrintPage` that calls `window.print()` when `!isLoading && !!printData && !displayOnly`.

**Rationale:** `useEffect` runs after the DOM has committed — meaning recipes are rendered before the browser opens the print dialog, which snapshots the live DOM. Calling `window.print()` during render or before data arrives would produce an empty or partial printout.

**Alternative considered:** Triggering print from the `onSuccess` callback of `useQuery`. Rejected because `onSuccess` is deprecated in TanStack Query v5 and the effect approach is idiomatic.

**Testability:** E2E test intercepts `window.print` via `addInitScript`, navigates to the print route, and asserts the intercepted flag is set.

---

### D2: `?displayonly=1` read via TanStack Router search params

**Decision:** Read the `displayonly` search param using TanStack Router's `Route.useSearch()` (after declaring the search schema on the route). If `displayonly === '1'`, skip the auto-trigger.

**Rationale:** TanStack Router owns search param parsing for this route. Using `Route.useSearch()` keeps param handling consistent with the rest of the app and avoids raw `window.location.search` parsing.

**Alternative considered:** Reading `new URLSearchParams(window.location.search)` directly. Rejected — bypasses the router and is fragile with SSR/Nitro.

**Testability:** E2E test navigates to `/print?displayonly=1` and asserts `window.print` was NOT called.

---

### D3: `useEffect` dependency array fires exactly once per data load

**Decision:** Use `[isLoading, printData, displayOnly]` as the dependency array. Guard with a `hasPrinted` ref so the effect does not re-fire if the component re-renders after the dialog is dismissed.

```
const hasPrinted = useRef(false)
useEffect(() => {
  if (!isLoading && printData && !displayOnly && !hasPrinted.current) {
    hasPrinted.current = true
    window.print()
  }
}, [isLoading, printData, displayOnly])
```

**Rationale:** Without the ref guard, any re-render after dialog close (e.g., React Strict Mode double-invoke, window focus event) could re-open the dialog unexpectedly.

**Testability:** Covered implicitly — the E2E test asserts the flag is truthy exactly after page load without double-firing.

---

### D4: Existing E2E tests use `?displayonly=1`

**Decision:** All existing tests in `src/e2e/cookbooks-print.spec.ts` that navigate to the print route via `gotoAndWaitForHydration` must append `?displayonly=1` to their URLs.

**Rationale:** Without suppression, every test would trigger the native print dialog, blocking Playwright's interaction model. The `addInitScript` intercept approach only works reliably for tests that are explicitly testing the trigger; for all other display/content tests the suppression param is cleaner.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|---|---|
| Auto-invoke `window.print()` after data loads | D1: `useEffect` after `!isLoading && printData` |
| `?displayonly=1` suppression | D2: TanStack Router `Route.useSearch()` |
| Prevent re-trigger on re-render | D3: `hasPrinted` ref guard |
| E2E test safety | D4: Existing tests use `?displayonly=1` |

## Risks / Trade-offs

- **React Strict Mode double-invoke** → Mitigated by `hasPrinted` ref (D3)
- **Dialog fires before full render** → `useEffect` runs post-commit; DOM is complete before `window.print()` is called
- **Playwright print dialog blocking** → Mitigated by `addInitScript` intercept in auto-trigger tests; `?displayonly=1` in all other tests (D4)
- **Slow network / long data load** → User lands on the loading state briefly, then print fires. Acceptable; loading UI is already in place.

## Rollback / Mitigation

Change is isolated to one route file and one E2E spec file. Rollback is a revert of two files. No database, API, or routing changes are involved.

If CI is blocked: fix the failing test or E2E assertion before merging. The `?displayonly=1` param provides a stable escape hatch for any test that doesn't want auto-trigger behavior.

## Open Questions

No open questions. All decisions are resolved.

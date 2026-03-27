## Context

`RecipeForm` is used by two routes — `/recipes/new` and `/recipes/:recipeId/edit` — and will be usable from future entry points (e.g. editing from a cookbook page). The form manages state in two layers:

1. **RHF-registered fields** (`name`, `classificationId`, `ingredients`, `instructions`, etc.) — tracked by react-hook-form's `formState.isDirty`
2. **External `useState` values** (`selectedMealIds`, `selectedCourseIds`, `selectedPrepIds`, `selectedSourceId`) — not tracked by RHF; require manual dirty detection

There are three distinct navigation paths that can discard unsaved changes:

| Path | Mechanism |
|---|---|
| Cancel button click | `navigate()` call in the form |
| In-app link / browser back | TanStack Router navigation event |
| Tab close / page refresh | `window.beforeunload` |

TanStack Router's `useBlocker` with `withResolver: true` and `enableBeforeUnload: true` covers all three from a single hook call.

## Goals / Non-Goals

**Goals:**
- Block all three navigation paths when form is dirty
- Show a styled confirmation modal (not a browser `alert`) for in-app navigation
- Detect dirty state accurately for both RHF fields and external taxonomy/source state
- Fix the existing Cancel button destination bug (currently hardcoded to `/recipes`)
- Require zero prop changes on consuming routes

**Non-Goals:**
- Auto-save (issue #217)
- Any server-side or data model changes
- Styling the native `beforeunload` dialog (browser-controlled)

## Decisions

### D1: Single `useBlocker` call covers all three paths

**Decision:** Use `useBlocker({ shouldBlockFn: () => isFormDirty, enableBeforeUnload: true, withResolver: true })`.

**Rationale:** `enableBeforeUnload: true` handles tab close/refresh via the native browser dialog at no extra cost. `withResolver: true` returns `{ status, proceed, reset }` which drives the custom modal for in-app navigation — no separate `useState` for modal visibility needed. The Cancel button simply calls `router.history.back()`, which triggers a TanStack Router navigation event that the blocker intercepts naturally.

**Alternative considered:** Separate `useEffect` for `beforeunload` + `useBlocker` for in-app. Rejected — more code, two sources of truth for the dirty condition.

### D2: Dirty detection — RHF `isDirty` combined with sorted array comparison for external state

**Decision:**
```ts
const isFormDirty = isDirty || hasExternalChanges

const hasExternalChanges =
  !sortedEqual(selectedMealIds, initialMealIds) ||
  !sortedEqual(selectedCourseIds, initialCourseIds) ||
  !sortedEqual(selectedPrepIds, initialPrepIds) ||
  selectedSourceId !== initialSourceId
```

Where `sortedEqual` sorts both arrays before comparison and `initialMealIds` / `initialCourseIds` / `initialPrepIds` / `initialSourceId` are computed once at mount via `useMemo`.

**Rationale:** RHF handles all registered fields correctly. The four external state values are not registered, so manual comparison is required. Sorted comparison avoids false positives if `MultiSelectDropdown` happens to return selections in a different order than they were initialised. Memoising initial values prevents recomputation on every render.

**`sortedEqual` helper (module-level, not exported):**
```ts
function sortedEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const as = [...a].sort()
  const bs = [...b].sort()
  return as.every((v, i) => v === bs[i])
}
```

### D3: Cancel uses `router.history.back()` with `/recipes` fallback

**Decision:**
```ts
const router = useRouter()

function handleCancel() {
  if (window.history.length > 1) {
    router.history.back()
  } else {
    navigate({ to: '/recipes' })
  }
}
```

**Rationale:** The form does not need to know where it was opened from. Any caller — recipe list, recipe detail, cookbook (future) — gets correct Cancel behaviour automatically without a `cancelTo` prop. The `window.history.length <= 1` guard prevents navigating outside the app when the user opens the form URL directly (e.g. bookmarked link, fresh tab).

**Alternative considered:** `cancelTo?: string` prop passed by each consuming route. Rejected — requires updating every route that links to the form; no benefit over history navigation for this use case.

**Note:** The blocker intercepts the navigation triggered by `router.history.back()` just as it would any other navigation. No special handling is needed in `handleCancel` for the dirty-form case — the blocker fires, the modal is shown, and the user decides.

### D4: `ConfirmDialog` as a shared UI component

**Decision:** Create `src/components/ui/ConfirmDialog.tsx` with the interface:
```ts
interface ConfirmDialogProps {
  message: string
  confirmLabel?: string   // default: "Discard Changes"
  cancelLabel?: string    // default: "Keep Editing"
  onConfirm: () => void
  onCancel: () => void
}
```

Renders as a fixed full-screen overlay with a centred card. Styled with `slate-800` background, `cyan-500` confirm button, gray cancel button — consistent with the app's dark/cyan theme.

**Rationale:** Confirmation dialogs will recur (cookbook unsaved changes, delete confirmations, etc.). Building it once as a shared component avoids inline-JSX duplication. The `message` prop makes it adaptable. `confirmLabel`/`cancelLabel` defaults are chosen to match this feature's copy but can be overridden.

**Integration in `RecipeForm`:**
```tsx
{blocker.status === 'blocked' && (
  <ConfirmDialog
    message="You have unsaved changes. Are you sure you want to leave?"
    onConfirm={blocker.proceed}
    onCancel={blocker.reset}
  />
)}
```

### D5: No changes to route files

**Decision:** `new.tsx` and `$recipeId_.edit.tsx` are unchanged.

**Rationale:** D3 (history-based Cancel) and D1 (blocker in RecipeForm) mean the guard is entirely self-contained in the component. Routes simply render `<RecipeForm />` or `<RecipeForm initialData={recipe} />` as before.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `useBlocker` fires on successful save navigation | `shouldBlockFn` returns `isFormDirty`; after `onSubmit` the mutation succeeds before `navigate()` is called, so the form is clean (or about to unmount). No issue in practice. |
| `window.history.length` is 1 on server-side render | The Cancel handler only runs in the browser on a click event; SSR is not a concern. |
| Native `beforeunload` dialog wording is browser-controlled | Acceptable — the spec only requires the dialog to fire; it doesn't require custom wording. |

## Open Questions

None.

---

### Proposal → Design Mapping

| Proposal Element | Design Decision |
|---|---|
| Unsaved-changes guard | D1: `useBlocker` (single hook, all three paths) |
| Dirty detection | D2: RHF `isDirty` + sorted external comparison |
| Cancel navigation | D3: `router.history.back()` with `/recipes` fallback |
| `ConfirmDialog` component | D4: Shared `src/components/ui/ConfirmDialog.tsx` |
| No route file changes | D5: Guard is self-contained in `RecipeForm` |

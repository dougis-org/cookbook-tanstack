## Context

`ImportDropzone` (`src/components/recipes/ImportDropzone.tsx`) is a single-component file drop zone used in the recipe import flow. It currently renders a `<button>` element with `onDragOver` and `onDrop` handlers. Two problems:

1. `<button>` is not semantically appropriate for a drag target — it carries implicit "activatable control" semantics that conflict with the drag-and-drop role.
2. No `isDragging` state exists, so the component has no way to change its appearance when a file is dragged over it.

All design decisions were confirmed during a pre-proposal explore session. The change is fully contained within one file.

## Goals / Non-Goals

**Goals:**
- Correct the semantic element from `<button>` to `<div role="button" tabIndex={0}>`
- Preserve keyboard activation (Enter/Space → open file picker)
- Add reliable drag-over visual feedback using `isDragging` state
- Prevent visual flicker when dragging across child elements (counter pattern)
- Match drag-over appearance to existing hover style (`border-cyan-500`, no fill)

**Non-Goals:**
- Background fill on drag-over
- Drag animation beyond border color
- Changes to file validation or the broader import flow

## Decisions

### D1: `<div role="button" tabIndex={0}>` over bare `<div>`

A bare `<div>` would be completely inaccessible to keyboard users. `role="button"` declares the element as an activatable control to assistive technology, and `tabIndex={0}` puts it in the natural tab order. An explicit `onKeyDown` handler (Enter/Space → `inputRef.current?.click()`) completes the pattern.

**Alternative considered:** Keep `<button>` and add drag handlers — rejected because `<button>` has native submit behavior in forms and the semantic mismatch is the root issue the ticket identifies.

### D2: Counter ref pattern for drag enter/leave

`dragleave` fires when the pointer crosses *any* element boundary inside the drop zone, not just the outer boundary. Without mitigation, moving the cursor from the zone root onto a child `<p>` would fire `dragleave` and clear `isDragging`, causing a flicker.

Solution: a `useRef` counter (`dragCounterRef`) incremented on `dragenter` and decremented on `dragleave`. `isDragging` is set `true` when counter goes from 0→1, and `false` when it returns to 0.

```
onDragEnter → dragCounterRef.current++; setIsDragging(true)
onDragLeave → dragCounterRef.current--; if (counter === 0) setIsDragging(false)
onDrop      → dragCounterRef.current = 0; setIsDragging(false); handleFile(...)
```

`dragCounterRef` is a ref (not state) because its intermediate values don't need to trigger renders — only the boolean `isDragging` flip does.

**Alternative considered:** `relatedTarget` check on `dragleave` — rejected due to cross-browser inconsistency.

### D3: Drop Tailwind `hover:border-cyan-500`, manage border with `isDragging`

Since `isDragging` state explicitly controls the active border color, the Tailwind hover utility class would create a conflict (two mechanisms controlling the same property). Replace with a conditional className:

```tsx
isDragging ? 'border-cyan-500' : 'border-slate-600'
```

This also makes the active state explicit and testable.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|---|---|
| Replace `<button>` with correct element | D1: `<div role="button" tabIndex={0}>` + `onKeyDown` |
| Keyboard accessibility | D1: `onKeyDown` Enter/Space handler |
| Drag-over visual feedback | D2: counter pattern → `isDragging` state → conditional class |
| No drag-leave flicker | D2: counter ref pattern |
| Match hover style (no fill) | D3: `border-cyan-500` only, no background class |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Counter stuck at >0 if `drop` not fired (e.g., drag cancelled with Escape) | Add `onDragEnd` handler to reset counter and `isDragging` |
| `role="button"` without `onKeyDown` would be an a11y regression | `onKeyDown` is included in D1 and required by spec |
| Removing `hover:border-cyan-500` Tailwind class may be missed in visual review | Covered by E2E / visual test; counter pattern test verifies state |

**Note on `onDragEnd`:** The `dragend` event fires on the *drag source* (the dragged file), not the drop target — so it will not reliably fire on the dropzone. To handle the user cancelling a drag (Escape key or drag released outside browser window), the safest mitigation is to also add `onDragLeave` on the outermost element to reset the counter to 0 when the drag fully exits the zone. The counter decrement already handles this case correctly as long as every `dragenter` is paired with a `dragleave` when the user cancels — which browsers guarantee.

## Rollback / Mitigation

No rollback needed — this is a purely additive UI change with no API or data model impact. If reverted, the component returns to its prior state with no side effects.

## Open Questions

None. All decisions confirmed prior to proposal.

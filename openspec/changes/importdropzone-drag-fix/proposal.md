## Why

`ImportDropzone` uses a `<button>` element as its drag-and-drop target, which is semantically incorrect and provides no visual feedback when a file is dragged over the zone. This causes an accessibility mismatch and a jarring user experience with no confirmation that the drop will be accepted.

## What Changes

- Replace the `<button>` drop target with a `<div role="button" tabIndex={0}>` to use the correct ARIA pattern for a custom interactive element
- Add `onKeyDown` handler (Enter/Space) to preserve keyboard activation of the file picker
- Add `isDragging` state driven by a `dragCounter` ref (counter pattern) to correctly track drag entry/exit across child elements
- Add `onDragEnter` handler to increment counter and set drag-active state
- Update `onDragLeave` to decrement counter and only clear drag-active state when counter reaches zero
- Update `onDrop` to reset counter and clear drag-active state
- Replace static `hover:border-cyan-500` Tailwind class with explicit conditional class driven by `isDragging` state (matches existing hover style — `border-cyan-500`, no background fill)

## Capabilities

### New Capabilities

- `importdropzone-drag-feedback`: Visual drag-over feedback and semantic drop zone element for the recipe import component

### Modified Capabilities

_(none — no existing spec covers this component)_

## Impact

- **File:** `src/components/recipes/ImportDropzone.tsx` — sole change
- **Tests:** Existing tests for `ImportDropzone` will need updates; new drag interaction tests required
- **No API or routing changes**
- **No dependency changes**

## Problem Space

The `<button>` element has implicit semantics (activatable via keyboard, fires `click` on Enter/Space, announced as "button" to screen readers) that conflict with its use as a drag target. Drag-and-drop zones are not buttons. The correct pattern is a `div` with `role="button"` and explicit keyboard handling.

Additionally, without `onDragEnter`/`onDragLeave` state management, there is no way to change the drop zone's visual appearance while a file is being dragged over it. The counter pattern (using a `useRef` counter incremented on `dragenter` and decremented on `dragleave`) is necessary because `dragleave` fires when the pointer moves between child elements, which would otherwise cause flickering.

## Scope

**In scope:**
- Semantic element fix (`<button>` → `<div role="button">`)
- Keyboard accessibility (`onKeyDown` for Enter/Space)
- Drag-over visual feedback via `isDragging` state
- Counter-based `dragenter`/`dragleave` tracking to prevent flicker

**Out of scope:**
- Drag-over animations beyond border color change
- Support for dragging multiple files
- Any other ImportDropzone functionality changes

## Risks

- Low. The change is confined to a single component with no API surface.
- The counter pattern is a known, well-tested approach. The only risk is forgetting to reset the counter on `drop`, which would leave the drag-active state stuck — mitigated by including counter reset in `onDrop`.

## Non-Goals

- Background color change on drag (user confirmed: match hover style only — `border-cyan-500`, no fill)
- Restructuring the broader import flow
- Changing file type validation logic

## Open Questions

No unresolved ambiguity. All design decisions confirmed during explore session:
1. Use `<div role="button" tabIndex={0}>` with `onKeyDown` — confirmed
2. Use counter pattern to prevent drag-leave flicker — confirmed
3. Drag state matches hover visually (`border-cyan-500` only, no background) — confirmed

## GitHub Issues

- #195

---

_If scope changes after approval, proposal.md, design.md, specs/, and tasks.md must be updated before implementation proceeds._

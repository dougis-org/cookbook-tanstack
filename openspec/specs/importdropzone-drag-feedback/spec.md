## ADDED Requirements

### Requirement: Drop zone uses semantically correct element
The drop zone SHALL be rendered as a `<div>` with `role="button"` and `tabIndex={0}` rather than a native `<button>` element, so that the element's semantics accurately reflect its purpose as a drag-and-drop target while remaining accessible.

#### Scenario: Element is not a button
- **WHEN** the ImportDropzone component is rendered
- **THEN** the drop zone element SHALL NOT be a `<button>` element

#### Scenario: Element has correct ARIA role
- **WHEN** the ImportDropzone component is rendered
- **THEN** the drop zone element SHALL have `role="button"`

#### Scenario: Element is keyboard focusable
- **WHEN** the ImportDropzone component is rendered
- **THEN** the drop zone element SHALL have `tabIndex={0}`

---

### Requirement: Drop zone activates file picker via keyboard
The drop zone SHALL open the hidden file input when the user presses Enter or Space while the drop zone is focused, matching the expected keyboard behavior of a `role="button"` element.

#### Scenario: Enter key activates file picker
- **WHEN** the drop zone is focused and the user presses Enter
- **THEN** the hidden file input SHALL be triggered (click)

#### Scenario: Space key activates file picker
- **WHEN** the drop zone is focused and the user presses Space
- **THEN** the hidden file input SHALL be triggered (click)

#### Scenario: Other keys do not activate
- **WHEN** the drop zone is focused and the user presses any key other than Enter or Space
- **THEN** the hidden file input SHALL NOT be triggered

---

### Requirement: Drop zone shows visual feedback when a file is dragged over it
The drop zone border SHALL change to `border-cyan-500` when a file is dragged over the zone, giving the user visual confirmation that a drop will be accepted. The border SHALL return to `border-slate-600` when the drag leaves or the drop completes.

#### Scenario: Drag enters zone
- **WHEN** a file is dragged over the drop zone
- **THEN** the drop zone border SHALL be `border-cyan-500`

#### Scenario: Drag leaves zone
- **WHEN** a file that was dragged over the drop zone is moved outside it
- **THEN** the drop zone border SHALL return to `border-slate-600`

#### Scenario: Drop completes
- **WHEN** a file is dropped on the drop zone
- **THEN** the drop zone border SHALL return to `border-slate-600`

---

### Requirement: Drag-over feedback does not flicker when crossing child elements
The drag-over visual state SHALL remain stable while the pointer moves between child elements inside the drop zone (e.g., between the heading and the description text), with no intermediate reset or flicker of the border color.

#### Scenario: Pointer moves between child elements mid-drag
- **WHEN** a file is being dragged over the drop zone and the pointer moves from one child element to another child element within the zone
- **THEN** the drop zone border SHALL remain `border-cyan-500` without flickering to `border-slate-600`

## ADDED Requirements

### Requirement: Confirmation modal component
The system SHALL provide a `ConfirmDialog` component that renders a full-screen overlay with a centred confirmation card. It accepts a `message` string, optional `confirmLabel` and `cancelLabel` strings, and `onConfirm` / `onCancel` callbacks.

#### Scenario: Modal renders with message
- **WHEN** `ConfirmDialog` renders with a `message` prop
- **THEN** the message text is visible in the modal card

#### Scenario: Confirm button calls onConfirm
- **WHEN** the user clicks the confirm button
- **THEN** `onConfirm` is called

#### Scenario: Cancel button calls onCancel
- **WHEN** the user clicks the cancel button
- **THEN** `onCancel` is called

#### Scenario: Default button labels
- **WHEN** `confirmLabel` and `cancelLabel` are not provided
- **THEN** the confirm button reads "Discard Changes" and the cancel button reads "Keep Editing"

#### Scenario: Custom button labels
- **WHEN** `confirmLabel="Yes, leave"` and `cancelLabel="Go back"` are provided
- **THEN** the buttons display those custom labels

#### Scenario: Overlay covers the screen
- **WHEN** `ConfirmDialog` is rendered
- **THEN** a full-screen semi-transparent overlay is present behind the card

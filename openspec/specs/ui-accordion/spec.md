## ADDED Requirements

### Requirement: Shared Accordion component
The system SHALL provide a reusable `Accordion` component at `src/components/ui/Accordion.tsx` that renders a list of independently-collapsible sections from a generic `items` prop, suitable for reuse outside the privacy policy page (e.g. a future pricing FAQ).

#### Scenario: Renders items independently toggleable
- **WHEN** `Accordion` is given `items: { id, title, content: ReactNode }[]`
- **THEN** each item renders as its own disclosure that can be expanded or collapsed without affecting other items' open/closed state

#### Scenario: Optional default-open item
- **WHEN** `Accordion` is given a `defaultOpenId` matching one of the item ids
- **THEN** that item renders expanded on initial render and all others render collapsed

### Requirement: Accordion uses accessible disclosure semantics
The `Accordion` component SHALL be built on native `<details>`/`<summary>` semantics so that keyboard navigation, focus handling, and assistive-technology exposure work without additional custom ARIA wiring.

#### Scenario: Keyboard toggling works without custom JS handlers
- **WHEN** a user focuses a section's summary/header and presses Enter or Space
- **THEN** the section's content toggles open/closed using native `<details>` behavior

### Requirement: Accordion follows the design system
The `Accordion` component SHALL use only theme-token colors, borders, and radii, and SHALL use a Lucide icon (e.g. `ChevronDown`) to indicate expand/collapse state, with `transition-transform` for the icon rotation.

#### Scenario: No hardcoded colors
- **WHEN** the component is rendered in any of the four supported themes
- **THEN** no hardcoded slate/cyan/teal/amber hex values are present in the component's styling — only `var(--theme-*)` tokens

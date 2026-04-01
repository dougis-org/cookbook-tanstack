## ADDED Requirements

### Requirement: PrintButton component triggers browser print

The system SHALL provide a reusable `PrintButton` component that calls `window.print()` when clicked and hides itself during printing.

#### Scenario: Button triggers print on click

- **WHEN** a user clicks the PrintButton
- **THEN** `window.print()` is called

#### Scenario: Button is hidden during printing

- **WHEN** the page is printed
- **THEN** the PrintButton is not visible in the printed output (carries `print:hidden`)

#### Scenario: Button renders a Printer icon

- **WHEN** the PrintButton is rendered
- **THEN** it displays a Printer icon (lucide-react `Printer`) and a "Print" label

### Requirement: Recipe detail page displays a print button

The system SHALL render a `PrintButton` on the recipe detail page, visible to all users (not gated by ownership or login), positioned at the top of the recipe card in the same row as the Edit Recipe link.

#### Scenario: Print button visible to all users on recipe detail

- **WHEN** any user (logged in or not, owner or not) views a recipe detail page
- **THEN** a print button is visible at the top of the recipe card

#### Scenario: Print button appears alongside Edit Recipe for owners

- **WHEN** the logged-in user is the recipe owner
- **THEN** both the Print button and the Edit Recipe link are visible in the same action row

#### Scenario: Print button appears without Edit Recipe for non-owners

- **WHEN** the viewing user is not the recipe owner
- **THEN** only the Print button appears in the action row (no Edit Recipe link)

#### Scenario: Print button is hidden during printing

- **WHEN** the recipe detail page is printed
- **THEN** the print button (and the entire action row) is not included in the printed output

### Requirement: Cookbook standalone pages use the shared PrintButton

The system SHALL use the `PrintButton` component in `CookbookStandaloneLayout` instead of the previously inline button, with identical behavior.

#### Scenario: Cookbook print button behavior is unchanged

- **WHEN** a user clicks the print button on a cookbook standalone page
- **THEN** `window.print()` is called (same as before the refactor)

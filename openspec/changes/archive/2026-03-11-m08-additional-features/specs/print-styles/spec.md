## ADDED Requirements

### Requirement: Navigation and UI chrome are hidden when printing
The system SHALL suppress the header navigation, sidebar, action buttons (edit, delete, export), and footer from all printed output.

#### Scenario: Print recipe detail page
- **WHEN** the user triggers the browser print dialog on a recipe detail page
- **THEN** the header, breadcrumb, action buttons, and any sidebar are absent from the print preview

#### Scenario: Print recipe list page
- **WHEN** the user triggers the browser print dialog on the recipe list page
- **THEN** filter controls, sidebar, and navigation are absent from the print preview

---

### Requirement: Recipe detail page prints readably on paper
The system SHALL apply print-specific typography and layout rules to the recipe detail page so the title, ingredients, and instructions are clearly readable on A4/Letter paper.

#### Scenario: Font and margin for readability
- **WHEN** the recipe detail page is printed
- **THEN** the body font is at least 11pt, page margins are at least 1.5cm on all sides, and text is black on white

#### Scenario: Page breaks do not split mid-recipe
- **WHEN** a recipe detail page is printed
- **THEN** the ingredients section and instructions section do not split mid-item across a page break

#### Scenario: Images are appropriately sized
- **WHEN** the recipe detail page is printed
- **THEN** recipe images are scaled to fit within the page width and do not bleed beyond margins

---

### Requirement: Recipe list page prints cleanly
The system SHALL format the recipe list as a readable paper document with card-per-recipe layout and clear separators.

#### Scenario: Recipe cards render without interactive elements
- **WHEN** the recipe list is printed
- **THEN** recipe cards show title, classification badges, and source but omit hover effects, links styling, and action icons

---

### Requirement: Print output is black-and-white friendly
The system SHALL ensure that all critical content remains legible when printed on a monochrome printer.

#### Scenario: Colour-only information is also conveyed via text
- **WHEN** a page is printed in black and white
- **THEN** no information is lost due to relying solely on colour (e.g. classification badges show text labels, not just colour fills)

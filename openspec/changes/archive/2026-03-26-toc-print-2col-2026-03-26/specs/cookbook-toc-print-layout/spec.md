## ADDED Requirements

### Requirement: TOC recipe list renders in 2 columns when printed

The system SHALL render the TOC recipe list in 2 columns when the page is printed, for both flat and chapter-grouped layouts.

#### Scenario: Flat TOC prints in 2 columns

- **WHEN** the TOC page is printed for a cookbook with no chapters
- **THEN** the recipe list is rendered in 2 columns

#### Scenario: Chapter TOC prints in 2 columns per chapter

- **WHEN** the TOC page is printed for a cookbook with chapters
- **THEN** each chapter's recipe list is rendered in 2 columns

#### Scenario: Screen layout is unchanged

- **WHEN** the TOC page is viewed in a browser (not printed)
- **THEN** the recipe list renders in a single column

---

### Requirement: Recipe entries do not split across column breaks when printed

The system SHALL prevent individual recipe entries from splitting across a column or page break when printed.

#### Scenario: Recipe entry is not split

- **WHEN** the TOC page is printed and a column break falls within a recipe entry
- **THEN** the entire recipe entry (number, name, time) moves to the next column rather than splitting

---

### Requirement: Chapter headings do not orphan when printed

The system SHALL prevent a chapter heading from appearing alone at the bottom of a column with no recipes below it.

#### Scenario: Chapter heading stays with its recipes

- **WHEN** the TOC page is printed and a column break would leave a chapter heading without any recipes below it in the same column
- **THEN** the chapter heading flows to the next column with its recipes

---

### Requirement: Print container is wider than screen container

The system SHALL use a wider maximum width for the TOC page container when printing, to provide adequate space for 2 columns.

#### Scenario: Container widens for print

- **WHEN** the TOC page is printed
- **THEN** the content container renders at up to `max-w-4xl` width

#### Scenario: Screen container width is unchanged

- **WHEN** the TOC page is viewed in a browser (not printed)
- **THEN** the content container renders at `max-w-2xl` width

---

### Requirement: Recipe titles wrap within their column when printed

The system SHALL allow recipe titles that exceed the column width to wrap to the next line rather than being truncated.

#### Scenario: Long recipe title wraps

- **WHEN** the TOC page is printed and a recipe title is longer than the column width
- **THEN** the title wraps to the next line and the full title is visible

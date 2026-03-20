# Specification: Recipe Metadata Display

## ADDED Requirements

### Requirement: Category badge SHALL be prominently displayed with solid background and icon

The system SHALL display the recipe's category (classification) as a prominent badge with a solid, opaque background color, white text, and an icon indicator. The badge SHALL appear at the top left of the recipe detail view and in recipe list cards.

#### Scenario: Category badge visible in detail view
- **WHEN** a user views a recipe detail page with a category assigned
- **THEN** a solid-background category badge with text color `text-white`, background color `bg-cyan-600` (or equivalent contrast), and a `Tag` icon SHALL be displayed at the top-left of the metadata section
- **AND** the badge SHALL be sized at least `text-sm` font size or larger

#### Scenario: Category badge visible in list view
- **WHEN** a user views a recipe in the list cards
- **THEN** the category badge SHALL be visible above the recipe title, with the same solid background styling as detail view (scaled appropriately for card space)

#### Scenario: Category badge without category assigned
- **WHEN** a recipe has no category assigned
- **THEN** the category badge SHALL not be rendered

### Requirement: Source information SHALL be displayed adjacent to category in detail view

The system SHALL display the source name and link (if available) in the recipe detail view's metadata header, positioned to the right of the category badge in a 2-column layout, or directly below on narrow screens.

#### Scenario: Source displayed with link in 2-column layout (desktop)
- **WHEN** a user views a recipe detail page on a wide screen with source information present
- **THEN** the source SHALL be displayed in the right column of a 2-column metadata header
- **AND** the source name SHALL appear with a `Link` or `ExternalLink` icon
- **AND** if the source has a URL, the source name SHALL be a clickable link with target `_blank` and `rel="noopener noreferrer"`
- **AND** the text color SHALL indicate a link (e.g., `text-cyan-400` or similar)

#### Scenario: Source displayed without link
- **WHEN** a recipe has source name but no URL
- **THEN** the source SHALL be displayed as plain text with muted color (e.g., `text-gray-500`)
- **AND** the link icon SHALL still be present for visual consistency

#### Scenario: Source displayed stacked below category (mobile)
- **WHEN** viewing on screens narrower than `md` breakpoint
- **THEN** the 2-column layout SHALL stack to a single column
- **AND** source SHALL be displayed directly below the category badge
- **AND** spacing and alignment SHALL remain clean and readable

#### Scenario: Source not displayed when missing
- **WHEN** a recipe has no source information
- **THEN** the source section SHALL not be rendered

### Requirement: Taxonomy badges SHALL have increased opacity and dark text for contrast

The system SHALL display taxonomy badges (meals, courses, preparations) with increased background opacity and dark text colors to ensure readability on white backgrounds.

#### Scenario: Meals badge visibility
- **WHEN** a recipe has meals assigned and is displayed in detail view
- **THEN** each meal badge SHALL have `bg-amber-500/60` (or 60%+ opacity) with `text-amber-900` or darker
- **AND** the badge SHALL meet WCAG AA contrast ratio (4.5:1 minimum) for text against background

#### Scenario: Courses badge visibility
- **WHEN** a recipe has courses assigned and is displayed in detail view
- **THEN** each course badge SHALL have `bg-violet-500/60` (or 60%+ opacity) with `text-violet-900` or darker
- **AND** the badge SHALL meet WCAG AA contrast ratio (4.5:1 minimum) for text against background

#### Scenario: Preparations badge visibility
- **WHEN** a recipe has preparations assigned and is displayed in detail view
- **THEN** each preparation badge SHALL have `bg-emerald-500/60` (or 60%+ opacity) with `text-emerald-900` or darker
- **AND** the badge SHALL meet WCAG AA contrast ratio (4.5:1 minimum) for text against background

#### Scenario: Taxonomy badges grouped below metadata
- **WHEN** a recipe has taxonomy information
- **THEN** all taxonomy badges (meals, courses, preparations) SHALL be displayed below the category/source metadata header
- **AND** badges SHALL be inline with consistent spacing (gap-2)

#### Scenario: Taxonomy badges are grouped visually with labels
- **WHEN** a recipe has taxonomy information
- **THEN** taxonomy badges SHALL be organized into visual groups with labels:
  - "Meals:" followed by meal badges
  - "Courses:" followed by course badges
  - "Preparations:" followed by preparation badges
- **AND** labels SHALL always be present to provide context
- **AND** each group SHALL be separated visually (e.g., different lines or clear spacing)

#### Scenario: Category badge in detail view is not linkable
- **WHEN** a user views a recipe detail page
- **THEN** the category badge SHALL be plain display (not a clickable link)
- **AND** clicking on the category badge SHALL not navigate to the category page

### Requirement: Taxonomy badges SHALL include icon indicators

The system SHALL display icons alongside taxonomy badge text to improve scannability and visual identification.

#### Scenario: Icon displayed for meals taxonomy
- **WHEN** a meals taxonomy badge is rendered
- **THEN** a `Utensils` icon (or semantically equivalent) from Lucide React SHALL be displayed before the meal name

#### Scenario: Icon displayed for courses taxonomy
- **WHEN** a courses taxonomy badge is rendered
- **THEN** a `BookOpen` or `GripVertical` icon (or semantically equivalent) from Lucide React SHALL be displayed before the course name

#### Scenario: Icon displayed for preparations taxonomy
- **WHEN** a preparations taxonomy badge is rendered
- **THEN** a `Timer` or `Beaker` icon (or semantically equivalent) from Lucide React SHALL be displayed before the preparation name

### Requirement: Detail view metadata header SHALL use responsive 2-column layout

The system SHALL arrange the category badge and source information in a responsive layout that adapts to screen width.

#### Scenario: 2-column layout on desktop
- **WHEN** viewing recipe detail on `md` breakpoint or wider
- **THEN** the metadata header SHALL use `flex` layout with two columns
- **AND** category badge SHALL occupy the left column (approximately 40-50% width)
- **AND** source information SHALL occupy the right column (approximately 50-60% width)
- **AND** columns SHALL have visual separation (padding, alignment)

#### Scenario: Stacked layout on mobile
- **WHEN** viewing recipe detail below `md` breakpoint
- **THEN** the metadata header SHALL stack vertically (`flex-col`)
- **AND** category badge SHALL appear first
- **AND** source information SHALL appear directly below
- **AND** layout SHALL remain readable with appropriate spacing

### Requirement: Category badge in list view SHALL be visually prominent

The system SHALL display category badges in recipe list cards with increased visual weight compared to current styling.

#### Scenario: Card category badge displays prominently
- **WHEN** a recipe card is rendered with a category assigned
- **THEN** the category badge SHALL use the same solid background styling as the detail view category badge
- **AND** the badge SHALL be positioned above the recipe title
- **AND** the badge SHALL not be cramped or difficult to read within card constraints

## Non-Functional Requirements

### Accessibility
- All badges SHALL meet WCAG AA contrast ratio of 4.5:1 for text against background
- Icons SHALL be decorative (aria-hidden) since text conveys meaning
- Source link SHALL include proper `rel` attributes for security

### Performance
- Icon rendering SHALL not introduce layout shifts or reflows
- Opacity changes SHALL not require additional requests or data fetching

### Responsiveness
- All changes SHALL be tested on mobile (< 640px), tablet (md), and desktop breakpoints
- Layout changes SHALL gracefully degrade on very small screens (< 320px) without horizontal overflow

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Auto-filter on keypress

The system SHALL navigate to `/recipes?search=<value>` (or update the existing search param) within 300ms of the user stopping typing in the header search input, without requiring a form submission.

#### Scenario: User types into header search input

- **Given** the user is on any page of the application
- **When** the user types "chicken" into the header search input and pauses for 300ms
- **Then** the browser URL contains `?search=chicken` and the recipe list shows only matching recipes

#### Scenario: User clears the header search input

- **Given** the URL is `/recipes?search=chicken` and the header input shows "chicken"
- **When** the user clears the input and pauses for 300ms
- **Then** the URL has no `search` param and the full recipe list is displayed

---

### Requirement: ADDED Mobile search overlay

The system SHALL show a magnifying glass icon button in the header on mobile viewports. Tapping it SHALL replace the entire header row with a full-width search input and a close button.

#### Scenario: User taps the search icon on mobile

- **Given** the viewport width is less than 768px (mobile)
- **When** the user taps the magnifying glass icon in the header
- **Then** the header row is replaced by a full-width search input that is auto-focused, with an `✕` close button

#### Scenario: User closes the mobile overlay with the close button

- **Given** the mobile search overlay is open
- **When** the user taps the `✕` button
- **Then** the overlay closes, the normal header is restored, and the search input value is cleared if it was empty; if a search was active it persists in the URL

#### Scenario: User closes the mobile overlay with Escape

- **Given** the mobile search overlay is open and the input is focused
- **When** the user presses the Escape key
- **Then** the overlay closes and the normal header is restored

---

### Requirement: ADDED Active search indicator (cyan dot)

The system SHALL render a small cyan dot on the search icon when a search term is active (URL `?search` param is non-empty), on both mobile and desktop.

#### Scenario: Search is active — dot is visible

- **Given** the URL contains `?search=pasta`
- **When** the header renders
- **Then** a cyan dot is visible on the search icon (mobile: on the icon button; desktop: on the icon inside the input)

#### Scenario: Search is cleared — dot is hidden

- **Given** the URL does not contain a `search` param
- **When** the header renders
- **Then** no cyan dot is visible on the search icon

---

### Requirement: ADDED Header input syncs from URL

The system SHALL populate the header search input with the current `?search=` URL param value whenever the route changes.

#### Scenario: User navigates directly to a search URL

- **Given** the user navigates to `/recipes?search=tacos` (e.g., via a bookmarked link)
- **When** the page loads
- **Then** the header search input displays "tacos"

#### Scenario: URL search param changes externally

- **Given** the header search input is empty
- **When** the URL changes to `/recipes?search=soup` (e.g., via browser back/forward)
- **Then** the header search input updates to display "soup"

---

## MODIFIED Requirements

### Requirement: MODIFIED Desktop header search always visible

The system SHALL display the search input in the header on all viewport sizes on desktop (≥ 768px). Previously it was hidden on mobile only; now it is always visible on desktop and replaced by an icon on mobile.

#### Scenario: Desktop header always shows search input

- **Given** the viewport width is 768px or greater
- **When** any page renders
- **Then** the search input is visible in the header without requiring any interaction

---

## REMOVED Requirements

### Requirement: REMOVED Recipe page search input

Reason for removal: The header search consolidation makes the inline search input on the recipe page (`src/routes/recipes/index.tsx`) redundant. A single global search in the header provides the same functionality with a consistent UX across all pages. The page continues to read `search` from the URL and pass it to the tRPC query — the local input state is removed, not the filtering capability.

### Requirement: REMOVED Header search requires form submission

Reason for removal: Replaced by debounced auto-filter on keypress (Decision 3 in design.md). The `onSubmit` handler and `<form>` wrapper are removed from the header search.

---

## Traceability

- Proposal: "Auto-filter on keypress" → Requirement: Auto-filter on keypress
- Proposal: "Mobile full-width overlay" → Requirement: Mobile search overlay
- Proposal: "Cyan dot active indicator" → Requirement: Active search indicator
- Proposal: "Sync header input from URL" → Requirement: Header input syncs from URL
- Proposal: "Remove recipe page search" → Requirement: REMOVED Recipe page search input
- Design Decision 1 (useRouterState) → Requirement: Header input syncs from URL
- Design Decision 2 (Style B overlay) → Requirement: Mobile search overlay
- Design Decision 3 (debounced navigation) → Requirement: Auto-filter on keypress
- Design Decision 4 (cyan dot) → Requirement: Active search indicator
- Design Decision 5 (remove page search) → Requirement: REMOVED Recipe page search input
- Requirement: Auto-filter → Task: Refactor Header.tsx search logic
- Requirement: Mobile overlay → Task: Add mobile overlay state and render
- Requirement: Active indicator → Task: Add cyan dot to search icon
- Requirement: URL sync → Task: Add useRouterState sync effect
- Requirement: REMOVED page search → Task: Remove search input from recipes/index.tsx + update E2E tests

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Debounce prevents excessive API calls

- **Given** the user types 8 characters rapidly (< 300ms between keystrokes)
- **When** the user pauses after the final character
- **Then** only one navigation/query is triggered (not one per keystroke)

### Requirement: Accessibility

#### Scenario: Search icon button has accessible label

- **Given** the mobile header is rendered
- **When** an assistive technology reads the header
- **Then** the search icon button has `aria-label="Search recipes"` or equivalent

#### Scenario: Overlay input is auto-focused

- **Given** the mobile search overlay is opened
- **When** the overlay renders
- **Then** the search input receives focus automatically, allowing immediate typing without an additional tap

### Requirement: Reliability

#### Scenario: Navigation does not loop on empty search

- **Given** the user clears the header search input
- **When** the debounce fires
- **Then** `navigate` is called with `search: undefined` (not `search: ""`), preventing an empty param from persisting in the URL

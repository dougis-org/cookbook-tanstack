# Header Search

Global recipe search consolidated into the header, replacing both the header's form-submit search and the inline recipe-page search input.

## Requirements

### Auto-filter on keypress

The system SHALL navigate to `/recipes?search=<value>` (or update the existing search param) within 300ms of the user stopping typing in the header search input, without requiring a form submission. The search value is trimmed before navigating; whitespace-only input is treated as empty. Pagination is reset (`page: undefined`) when the search changes.

#### Scenario: User types into header search input

- **Given** the user is on any page of the application
- **When** the user types "chicken" into the header search input and pauses for 300ms
- **Then** the browser URL contains `?search=chicken` and the recipe list shows only matching recipes

#### Scenario: User clears the header search input

- **Given** the URL is `/recipes?search=chicken` and the header input shows "chicken"
- **When** the user clears the input and pauses for 300ms
- **Then** the URL has no `search` param and the full recipe list is displayed

---

### Mobile search overlay

The system SHALL show a magnifying glass icon button (`data-testid="header-search-icon-btn"`) in the header on mobile viewports (`< 768px`). Tapping it SHALL replace the entire header row with a full-width search input (`data-testid="header-search-input"`) and a close button (`data-testid="header-search-close-btn"`).

#### Scenario: User taps the search icon on mobile

- **Given** the viewport width is less than 768px (mobile)
- **When** the user taps the magnifying glass icon in the header
- **Then** the header row is replaced by a full-width search input that is auto-focused, with an `✕` close button

#### Scenario: User closes the mobile overlay with the close button

- **Given** the mobile search overlay is open
- **When** the user taps the `✕` button
- **Then** the overlay closes, the normal header is restored; active search term/URL is preserved

#### Scenario: User closes the mobile overlay with Escape

- **Given** the mobile search overlay is open and the input is focused
- **When** the user presses the Escape key
- **Then** the overlay closes and the normal header is restored; active search term/URL is preserved

---

### Active search indicator (cyan dot)

The system SHALL render a small cyan dot (`data-testid="header-search-dot"`) on the search icon when a trimmed search term is active (URL `?search` param is non-empty and non-whitespace), on both mobile and desktop.

#### Scenario: Search is active — dot is visible

- **Given** the URL contains `?search=pasta`
- **When** the header renders
- **Then** a cyan dot is visible on the search icon (mobile: on the icon button; desktop: on the icon inside the input)

#### Scenario: Search is cleared — dot is hidden

- **Given** the URL does not contain a `search` param
- **When** the header renders
- **Then** no cyan dot is visible on the search icon

---

### Header input syncs from URL

The system SHALL populate the header search input with the current `?search=` URL param value whenever the route changes. Pending debounce timers are cancelled on route change to prevent stale navigations. Trailing spaces in the input are preserved if the trimmed value matches the URL value.

#### Scenario: User navigates directly to a search URL

- **Given** the user navigates to `/recipes?search=tacos` (e.g., via a bookmarked link)
- **When** the page loads
- **Then** the header search input displays "tacos"

#### Scenario: URL search param changes externally

- **Given** the header search input is empty
- **When** the URL changes to `/recipes?search=soup` (e.g., via browser back/forward)
- **Then** the header search input updates to display "soup"

---

### Desktop header search always visible

The system SHALL display the search input in the header on desktop viewports (≥ 768px). On mobile viewports, the input is replaced by the magnifying glass icon button.

#### Scenario: Desktop header always shows search input

- **Given** the viewport width is 768px or greater
- **When** any page renders
- **Then** the search input is visible in the header without requiring any interaction

---

## Non-Functional Requirements

### Performance

#### Scenario: Debounce prevents excessive API calls

- **Given** the user types 8 characters rapidly (< 300ms between keystrokes)
- **When** the user pauses after the final character
- **Then** only one navigation/query is triggered (not one per keystroke)

### Accessibility

#### Scenario: Search icon button has accessible label

- **Given** the mobile header is rendered
- **When** an assistive technology reads the header
- **Then** the search icon button has `aria-label="Search recipes"`

#### Scenario: Overlay input is auto-focused

- **Given** the mobile search overlay is opened
- **When** the overlay renders
- **Then** the search input receives focus automatically

### Reliability

#### Scenario: Navigation does not loop on empty search

- **Given** the user clears the header search input
- **When** the debounce fires
- **Then** `navigate` is called with `search: undefined`, preventing an empty param from persisting in the URL

---

## Implementation Notes

- `Header.tsx` owns all search UI and logic; `src/routes/recipes/index.tsx` reads `search` from `Route.useSearch()` and passes it directly to the tRPC query — no local search state
- URL sync via `useRouterState({ select: (s) => s.location.search })` — the TanStack Router escape hatch for reading route state from shared components
- Debounce via `useRef<ReturnType<typeof setTimeout>>` with cleanup on unmount and on location change
- Test IDs: `header-search-input`, `header-search-icon-btn`, `header-search-close-btn`, `header-search-dot`

# Spec: Cookbook Print Margin Optimization

Capability specifications for the cookbook print margin and browser title changes defined in `design.md`.

---

## ADDED Requirements

### Requirement: ADDED Named `@page` rule for cookbook print sections

The system SHALL apply reduced top/bottom (0.5 cm) and defined left/right (1 cm) margins to every cookbook recipe section and TOC page when printing, using a named `@page cookbook-page` rule.

#### Scenario: Recipe section page margins are tightened on print

- **Given** a user opens a cookbook print URL (e.g., `/cookbooks/:id/print`)
- **When** the browser renders the print layout
- **Then** every `.cookbook-recipe-section` element uses the `cookbook-page` named page, resulting in 0.5 cm top/bottom and 1 cm left/right margins on each recipe page

#### Scenario: TOC page margins are tightened on print

- **Given** a user opens a cookbook print URL
- **When** the browser renders the print layout
- **Then** the `.cookbook-toc-page` element uses the `cookbook-page` named page, resulting in the same reduced margins as recipe sections

#### Scenario: Single-recipe print is unaffected

- **Given** a user opens a single-recipe print URL (e.g., `/recipes/:id`) and prints
- **When** the browser applies print styles
- **Then** the recipe page continues to use the global `@page { margin: 1 cm }` rule — no `cookbook-page` margins apply

#### Scenario: Safari graceful fallback

- **Given** a user is on Safari, which does not support the `page` CSS property
- **When** the browser renders the cookbook print layout
- **Then** the browser silently ignores `page: cookbook-page` and falls back to the global `@page { margin: 1 cm }` rule — no layout breakage occurs

---

### Requirement: ADDED `cookbook-toc-page` class on TOC section wrapper

The system SHALL apply a `cookbook-toc-page` CSS class to the TOC section wrapper in the cookbook print route component.

#### Scenario: TOC wrapper receives class from the route component

- **Given** a cookbook with recipes is displayed in the standalone/print layout
- **When** the route component renders
- **Then** the TOC section wrapper element has the CSS class `cookbook-toc-page`

---

## MODIFIED Requirements

### Requirement: MODIFIED Browser tab title during cookbook print

The system SHALL temporarily set `document.title` to the cookbook name before triggering `window.print()`, and SHALL restore the original title after the print dialog closes (or on component unmount).

#### Scenario: Browser header shows cookbook name during print

- **Given** a user opens `/cookbooks/:id/print` with `displayonly` not set
- **When** `window.print()` is called
- **Then** the browser print dialog shows the cookbook name (e.g., "My Favourite Recipes") in the header/footer where the page title normally appears

#### Scenario: Original document title is restored after print

- **Given** the print dialog has been opened and then dismissed or confirmed
- **When** `window.print()` returns (the call is synchronous/blocking)
- **Then** `document.title` is reset to the value it had before the print dialog opened

#### Scenario: Title is not changed in display-only mode

- **Given** the print URL is opened with `?displayonly=1`
- **When** the component mounts
- **Then** `document.title` is NOT changed (title swap is gated behind `!displayOnly`)

---

## REMOVED Requirements

No requirements are removed by this change.

---

## Traceability

- Proposal element "reduce browser chrome / gain print real estate" → MODIFIED requirement: browser tab title
- Proposal element "tighter page margins for cookbook print" → ADDED requirement: named `@page` rule
- Proposal element "TOC also gets tighter margins" → ADDED requirement: `cookbook-toc-page` class
- Design decision D1 (named `@page cookbook-page`) → ADDED: named `@page` rule + TOC class
- Design decision D2 (`document.title` swap) → MODIFIED: browser tab title during print
- Design decision D3 (CSS literal values, no variables) → ADDED: named `@page` rule (no variable usage)
- ADDED: named `@page` rule → Task: add rule to `src/styles/print.css`; add `page: cookbook-page` to `.cookbook-recipe-section`
- ADDED: `cookbook-toc-page` class → Task: add class to TOC wrapper in `cookbooks.$cookbookId_.print.tsx`; add `page: cookbook-page` for `.cookbook-toc-page` in `print.css`
- MODIFIED: browser tab title → Task: update `useEffect` in `cookbooks.$cookbookId_.print.tsx`

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No rendering overhead from CSS change

- **Given** a cookbook print page with 20+ recipes
- **When** the browser renders the print layout
- **Then** the named `@page` rule adds no measurable rendering delay compared to the baseline, because the change is limited to static print CSS

### Requirement: Reliability

#### Scenario: Title is always restored even if print errors

- **Given** the `window.print()` call throws or the component unmounts before `window.print()` is called
- **When** the `useEffect` cleanup function runs
- **Then** `document.title` is restored to its original value regardless of whether `window.print()` completed successfully

### Requirement: Security

No security surface changes. `document.title` is set to a value sourced from the authenticated user's cookbook name (server-fetched tRPC data); no user-controlled input is reflected unsanitised.

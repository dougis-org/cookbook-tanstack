<!-- markdownlint-disable MD013 -->

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: FR-LSHEET-1 — Boot-loader resolves via `l.sheet` fast-path on cached stylesheet load

The system SHALL call `markLoaded()` immediately (without attaching a `load` event listener to the stylesheet `<link>`) when `link.sheet` is already non-null at `init()` time, and the app shell SHALL become visible as a result.

#### Scenario: Second navigation — CSS served from browser HTTP cache

- **Given** a user has already visited the app (first navigation primed the browser context HTTP cache with the content-hashed CSS, served with `Cache-Control: public, max-age=31536000, immutable`)
- **When** the user navigates to `'/'` a second time in the same browser session
- **Then** `#app-shell` is visible after the page loads
- **And** `#boot-loader` is not visible
- **And** no `'load'` event listener was attached to the stylesheet `<link>` element (confirming the `l.sheet` branch fired, not the `addEventListener` branch)
- **And** `link.sheet` is non-null after the page loads (confirming cache priming worked)

#### Scenario: `l.sheet` guard removed — boot-loader spins on cached load

- **Given** the `if (l.sheet) { markLoaded() }` check has been removed from the boot-loader script
- **When** the user navigates to `'/'` a second time (CSS from cache, `link.sheet` non-null before `init()`)
- **Then** a `'load'` event listener IS attached to the stylesheet `<link>` (spy flag is `true`)
- **And** the `fastPathTaken` assertion (`!__cssLoadListenerAttached`) fails
- **And** the test does NOT pass

## MODIFIED Requirements

None. No existing requirements are changed by this addition.

## REMOVED Requirements

None.

## Traceability

- Proposal: "`l.sheet` branch has no E2E coverage" → Requirement: FR-LSHEET-1
- Design Decision 1 (double-navigation) → FR-LSHEET-1 scenario: "Second navigation — CSS served from browser HTTP cache"
- Design Decision 2 (`addInitScript` spy) → FR-LSHEET-1 assertion: `fastPathTaken` and `sheetWasNonNull`
- FR-LSHEET-1 → Task: Add test to `src/e2e/fouc-prevention.spec.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Cache priming precondition detectable

- **Given** the test environment fails to serve CSS from cache on the second navigation (e.g. cache headers changed)
- **When** the test runs the second `page.goto('/')`
- **Then** the `sheetWasNonNull` assertion fails with an explicit error, distinguishing an environment/precondition failure from a code regression

### Requirement: Performance

#### Scenario: Test runtime budget

- **Given** a warm CI runner with the Nitro production build
- **When** the new test runs (two sequential `page.goto('/')` calls, no artificial delays)
- **Then** the test completes in under 10 seconds

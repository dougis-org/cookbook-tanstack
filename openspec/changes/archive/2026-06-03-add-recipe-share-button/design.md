## Context

- Relevant architecture: Frontend route rendering using TanStack Router. React 19 components using Tailwind v4 styles. Unit testing with Vitest and JSDOM, and E2E browser testing with Playwright.
- Dependencies: `lucide-react` icons (specifically `Link` and `Check`). `window.location.href` interface.
- Interfaces/contracts touched: `RecipeDetail` rendering component interfaces via its `actions` prop and `src/routes/recipes/$recipeId.tsx` page layout.

## Goals / Non-Goals

### Goals

- Add a Share button to copy the recipe detail page URL.
- Implement robust fallbacks for insecure contexts or missing clipboard APIs.
- Hide the button from print layouts.
- Provide delightful visual success state feedback.

### Non-Goals

- Native mobile OS sharing drawer integration.
- Analytics reporting of copy actions.

## Decisions

### Decision 1: Use the `Link` icon

- Chosen: Use the `Link` icon from `lucide-react` to denote copy-to-clipboard, changing to a `Check` icon when successful.
- Alternatives considered: `Share2` (more generic, could imply opening a social share overlay), or `Copy` (file copy/duplicate convention).
- Rationale: The `Link` icon is the most semantically accurate representation of copying a webpage hyperlink.
- Trade-offs: Visual variance from standard multi-branch sharing icons, but more descriptive for this specific operation.

### Decision 2: Multi-tier Clipboard Copy Strategy

- Chosen: Implement three layers of copy-to-clipboard actions:
  1. Primary: `navigator.clipboard.writeText()` (modern async API).
  2. Secondary: Off-screen `<textarea>` + `document.execCommand('copy')` (legacy API for HTTP/non-secure sandboxes).
  3. Tertiary: Browser fallback `alert` showing the URL text directly.
- Alternatives considered: Simple `navigator.clipboard` without fallbacks (fails on local non-HTTPS sandbox servers).
- Rationale: Maximizes browser compatibility and ensures it works on all dev/testing environments.
- Trade-offs: Minor codebase footprint expansion for fallback boilerplate.

## Proposal to Design Mapping

- Proposal element: Share button visible on recipe detail page.
  - Design decision: Render `ShareButton` component inside the actions bar of the recipe details card in `src/routes/recipes/$recipeId.tsx`.
  - Validation approach: Unit test checking the element renders in the document.
- Proposal element: Copies `window.location.href` to clipboard.
  - Design decision: Implement the multi-tier copy sequence reading `window.location.href`.
  - Validation approach: Unit test mocking the clipboard API, and E2E checking evaluation of copied text in browser window.
- Proposal element: Brief success confirmation message.
  - Design decision: Toggling a `copied` local state for 2 seconds. Displays "Copied!" text styled with green `var(--theme-success)` color.
  - Validation approach: Unit test with fake timers and E2E visibility assertion.
- Proposal element: Hidden in print view.
  - Design decision: Assign `print:hidden` Tailwind class to the button.
  - Validation approach: Assert class presence in unit test.

## Functional Requirements Mapping

- Requirement: Copy URL to clipboard.
  - Design element: `ShareButton` click handler trigger.
  - Acceptance criteria reference: Copies `window.location.href`.
  - Testability notes: Spy on clipboard API and mock/assert write text targets.
- Requirement: Visual success confirmation.
  - Design element: 2-second visual state toggle ("Copied!" text + green checkmark).
  - Acceptance criteria reference: Shows a brief success confirmation.
  - Testability notes: Advance system timers to ensure the button resets to its initial state.

## Non-Functional Requirements Mapping

- Requirement category: Reliability
  - Requirement: Graceful degradation if `navigator.clipboard` is unavailable.
  - Design element: Secondary (`execCommand`) and tertiary (`alert`) copy fallbacks.
  - Acceptance criteria reference: Graceful degradation.
  - Testability notes: Stub `navigator.clipboard` as undefined and verify secondary execution.
- Requirement category: Operability
  - Requirement: Hide from print stylesheets.
  - Design element: `print:hidden` CSS class application.
  - Acceptance criteria reference: Hidden in print view.
  - Testability notes: Assert `print:hidden` class on target element.

## Risks / Trade-offs

- Risk/trade-off: Browser security contexts (HTTPS vs HTTP) blocking clipboard access.
  - Impact: Direct `navigator.clipboard` calls will throw or be undefined.
  - Mitigation: The implementation includes an automated legacy backup (`execCommand`) and an explicit copy alert to guarantee success in all edge cases.

## Rollback / Mitigation

- Rollback trigger: Major visual regression in layout or crash in hydration.
- Rollback steps: Revert imports and usages of `<ShareButton />` inside `src/routes/recipes/$recipeId.tsx` and delete added files.
- Data migration considerations: None.
- Verification after rollback: Run unit test suites to confirm passing status.

## Operational Blocking Policy

- If CI checks fail: The PR is blocked from merging. Unit tests, typescript builds (`tsc --noEmit`), and playwright E2E suites must all pass.
- If security checks fail: Resolve any dependencies or vulnerabilities.
- If required reviews are blocked/stale: Escalate to repo admin after 24 hours.

## Open Questions

- None.

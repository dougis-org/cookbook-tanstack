## GitHub Issues

- #185

## Why

- Problem statement: The recipe detail page is missing a Share button, making it hard for users to quickly copy and share recipe links.
- Why now: Required to complete Milestone 02.
- Business/user impact: Greatly improves user experience by introducing a simple, single-click copy action for sharing recipe URLs.

## Problem Space

- Current behavior: No copy or share button exists on the recipe details page. Users must copy the URL from their browser's address bar manually.
- Desired behavior: A Share button with a clipboard/copy icon is rendered on the recipe details card next to the Print button. Clicking it copies the recipe page's current URL (`window.location.href`) to the clipboard, changes to a success state ("Copied!") with a checkmark for 2 seconds, degrades gracefully on restricted environments, and is hidden when printing.
- Constraints: The button must be hidden in the print stylesheet (`print:hidden`).
- Assumptions: Browser context allows execution of selection fallbacks (e.g. `document.execCommand`).
- Edge cases considered: Clipboard API unavailability in HTTP contexts, slow user interactions, print layout integrity.

## Scope

### In Scope

- Add a reusable `ShareButton` component with a clipboard/copy icon.
- Implement fallback copy mechanism using a temporary off-screen `<textarea>` and `document.execCommand('copy')`.
- Implement a final manual copy alert fallback if automatic mechanisms are denied or unsupported.
- Display temporary visual feedback ("Copied!" with a checkmark) for 2 seconds after a successful copy.
- Integrate `ShareButton` next to the `PrintButton` on the recipe detail page actions list.
- Apply `print:hidden` to ensure it is hidden in print view.
- Write unit tests for the component and E2E tests for the share flow.

### Out of Scope

- Native device sharing menu integration (`navigator.share`).
- Custom shortener APIs or social sharing widgets.

## What Changes

- Add `src/components/ui/ShareButton.tsx` (the React component).
- Add unit tests at `src/components/ui/__tests__/ShareButton.test.tsx`.
- Modify `src/routes/recipes/$recipeId.tsx` to include `ShareButton`.
- Add E2E tests at `src/e2e/recipe-share.spec.ts`.

## Risks

- Risk: Clipboard API requires a secure context (HTTPS) in modern browsers, failing on local HTTP testing and dev sandboxes.
  - Impact: Automatic clipboard copying fails.
  - Mitigation: Leverage `document.execCommand('copy')` as a robust secondary mechanism, and a manual copying `alert` fallback as a tertiary mechanism.

## Open Questions

- No unresolved questions. The user has explicitly selected the clipboard icon over the share icon, and all requirements are clear.

## Non-Goals

- Sharing analytics tracking.
- Native mobile sharing integrations.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

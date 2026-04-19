<!-- markdownlint-disable MD013 -->

## GitHub Issues

- #351

## Why

- Problem statement: PR #353 changed the initial load flash from a white page into a themed but still unstructured page. Users can still briefly see raw application content before the main Tailwind stylesheet applies.
- Why now: Issue #351 was reopened after the attempted fix because the visible failure mode remains jarring; the site now flashes a colored skeleton rather than a blank white screen.
- Business/user impact: First impressions on cold load are degraded, especially on slow or unreliable networks. The app should present a deliberate themed loading state instead of exposing incomplete layout.

## Problem Space

- Current behavior: `src/routes/__root.tsx` sets the HTML theme class and inlines a tiny background/color stylesheet. The app shell (`Header`, route content, `PageLayout`) remains visible while the external app stylesheet is pending, so utility-driven layout, spacing, and theme tokens can appear absent for a moment.
- Desired behavior: Before the main app stylesheet is ready, users see a minimal themed boot loader that says "Pre-heating" with a spinner. Real application content remains hidden until the app stylesheet has loaded.
- Constraints:
  - The boot loader must be styled entirely by inline critical CSS and must not depend on Tailwind, Lucide, React hydration, or external CSS.
  - The boot loader must follow the same theme resolution approach as the main site: `dark` default, stored `light-cool`, stored `light-warm`, legacy `light` migration to `light-cool`, invalid/unavailable storage fallback to `dark`.
  - The main app stylesheet may keep a preload hint; the print stylesheet preload must be removed because it does not improve first app paint and competes for initial loading resources.
  - Existing class-based theme behavior and `ThemeProvider` state must continue to work after hydration.
- Assumptions:
  - Hiding app content until app CSS loads is acceptable UX because it replaces raw unstyled content with an intentional themed loading state.
  - A minimal text+spinner loader is sufficient; no branded image or icon asset is needed.
  - The normal print stylesheet should remain available for printing, but it should not be preloaded for normal app navigation.
- Edge cases considered:
  - Slow app CSS download: loader remains visible.
  - App CSS request failure: loader remains visible and eventually offers retry/status feedback.
  - Cached CSS: loader should disappear quickly without introducing a new noticeable pause.
  - JavaScript disabled or hydration delayed: the CSS gate should still reveal the app once the app stylesheet loads.
  - localStorage throws: loader uses dark fallback.

## Scope

### In Scope

- Add an inline critical boot loader and CSS gate in `src/routes/__root.tsx`.
- Wrap the visible app shell in a stable root element that can remain hidden until app CSS loads.
- Add app stylesheet rules that hide the boot loader and reveal the app shell only after the app stylesheet has loaded.
- Remove the `printCss` preload from root head output.
- Prefer `media="print"` for the print stylesheet if compatible with current print behavior.
- Add Playwright coverage for delayed, loaded, and failed CSS states.
- Update `fouc-prevention` OpenSpec requirements.
- Update theme maintenance documentation if the inline critical theme CSS contract changes.

### Out of Scope

- Replacing the current theme system.
- Inlining a large critical Tailwind subset for the full application shell.
- Changing route data loading behavior, tRPC behavior, or authentication loading behavior.
- Adding new dependencies or runtime services.
- Redesigning the home page/header layout beyond boot-time visibility gating.

## What Changes

- The root document emits:
  - existing inline theme init script;
  - inline critical CSS for theme backgrounds, loader presentation, spinner animation, app content cloaking, and delayed status affordance;
  - a boot loader element containing "Pre-heating" and a spinner;
  - a wrapped app shell that starts hidden.
- The main app stylesheet (`src/styles.css`) reveals the app shell and hides the boot loader when it loads.
- Root `head()` keeps preload for `appCss` only and removes preload for `printCss`.
- The print stylesheet remains linked for print behavior but should not compete with first-load app styling.
- E2E tests simulate delayed and aborted stylesheet loading and assert the loader/app visibility contract.

## Risks

- Risk: Loader remains visible if app CSS fails to load.
  - Impact: Users cannot use an unstyled app, but they receive a deliberate loading/failure surface instead of broken UI.
  - Mitigation: Add delayed inline status text and a retry button that works without React or external CSS.
- Risk: The CSS gate could hide app content after CSS loads if selectors drift.
  - Impact: Blank/loader-only page in production.
  - Mitigation: Add E2E tests that confirm CSS-loaded state hides the loader and reveals app content.
- Risk: Inline CSS theme values drift from theme token files.
  - Impact: Loader-to-app transition feels inconsistent.
  - Mitigation: Keep values documented in `docs/theming.md` and adjacent `__root.tsx` comments.
- Risk: Print stylesheet media changes could affect print route behavior.
  - Impact: Print styles may not apply in browser/PDF flows.
  - Mitigation: Verify print route smoke/e2e behavior and use `media="print"` only if compatible.

## Open Questions

- Question: Should the print stylesheet link be changed to `media="print"` as part of this change, or only should its preload be removed?
  - Needed from: implementer validation against current print/PDF behavior
  - Blocker for apply: no
- Question: What delayed failure threshold should show retry messaging?
  - Needed from: implementation choice
  - Blocker for apply: no
- Question: Should the retry text be visible only after CSS failure/delay, while "Pre-heating" is always visible?
  - Needed from: implementation choice
  - Blocker for apply: no

## Non-Goals

- Guarantee the app is usable without CSS.
- Render a route-specific skeleton or data-loading placeholder.
- Use external assets, icon libraries, or Tailwind classes inside the boot loader.
- Optimize every first-load asset beyond removing the print preload and gating app visibility on app CSS readiness.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

---
name: tests
description: Tests for fix-themed-boot-loader-css-gate
---

<!-- markdownlint-disable MD013 -->

# Tests

## Overview

This change is primarily validated with Playwright E2E tests in `src/e2e/fouc-prevention.spec.ts` because the behavior depends on browser parsing, stylesheet loading, computed visibility, and network timing. Unit tests are not expected unless implementation extracts pure helper functions.

All work follows strict TDD:

1. Write failing FOUC tests first.
2. Implement the boot loader, CSS gate, and preload changes.
3. Refactor while keeping focused and full validation green.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing implementation code, write a test that captures the relevant requirement. Run the focused test and confirm it fails.
2. **Write code to pass the test:** Write the simplest code that satisfies the observable behavior.
3. **Refactor:** Improve readability and structure while preserving passing tests.

## Test Cases

### RED/GREEN Task: Themed loader visible while CSS is delayed

- [ ] **TC-1:** Delay the main app stylesheet request, navigate to `/`, and assert the boot loader is visible with text `Pre Heating`.
  - Maps to: `tasks.md` RED coverage; spec FR-6 scenario "Boot loader appears while app CSS is delayed"; design Decisions 1 and 3.
  - Expected initial result before implementation: fails because no boot loader exists.

- [ ] **TC-2:** Delay the main app stylesheet request and assert the boot loader includes a visible CSS-only spinner marker.
  - Maps to: spec FR-6 and FR-9; design Decision 3.
  - Expected initial result before implementation: fails because no spinner exists.

### RED/GREEN Task: App shell hidden until CSS loads

- [ ] **TC-3:** Delay the main app stylesheet request and assert app shell content is present in the DOM but not visible.
  - Maps to: spec FR-7 scenario "App content hidden while app CSS is delayed"; design Decision 1.
  - Expected initial result before implementation: fails because current app content can be visible before CSS applies.

- [ ] **TC-4:** Fulfill the delayed app stylesheet request and assert the boot loader becomes hidden and the app shell becomes visible.
  - Maps to: spec FR-6 scenario "Boot loader is hidden after app CSS loads" and FR-7 scenario "App content revealed by app stylesheet"; design Decision 1.
  - Expected initial result before implementation: fails because there is no CSS-loaded reveal gate.

### RED/GREEN Task: Theme-specific boot loader behavior

- [ ] **TC-5:** With no stored theme or stored `dark`, delay app CSS and assert boot loader background/foreground/accent match the dark theme.
  - Maps to: spec FR-8 scenario "Dark theme boot loader"; design Decision 2.

- [ ] **TC-6:** With stored `light-cool`, delay app CSS and assert boot loader background/foreground/accent match the light-cool theme.
  - Maps to: spec FR-8 scenario "Light-cool boot loader"; design Decision 2.

- [ ] **TC-7:** With stored `light-warm`, delay app CSS and assert boot loader background/foreground/accent match the light-warm theme.
  - Maps to: spec FR-8 scenario "Light-warm boot loader"; design Decision 2.

- [ ] **TC-8:** With stored legacy `light`, delay app CSS and assert theme init migrates to `light-cool` and the boot loader uses light-cool styling.
  - Maps to: spec FR-8 scenario "Legacy and invalid theme values"; design Decision 2.

- [ ] **TC-9:** With invalid theme or throwing localStorage, delay app CSS and assert the boot loader falls back to dark styling.
  - Maps to: spec FR-8 scenario "Legacy and invalid theme values"; design Decision 2.

### RED/GREEN Task: CSS failure and retry behavior

- [ ] **TC-10:** Abort the main app stylesheet request and assert the boot loader remains visible while the app shell remains hidden.
  - Maps to: spec FR-9 scenario "App CSS fails to load" and reliability non-functional scenario; design Decisions 1 and 3.

- [ ] **TC-11:** Abort the main app stylesheet request, wait past the configured failure threshold, and assert retry/status feedback is visible.
  - Maps to: spec FR-9 scenario "App CSS fails to load"; design Decision 3.

- [ ] **TC-12:** Activate the retry affordance after a simulated CSS failure and assert the page reload path is invoked.
  - Maps to: spec FR-9 scenario "App CSS fails to load"; design Decision 3.

### RED/GREEN Task: Stylesheet link behavior

- [ ] **TC-13:** Inspect the document head and assert app CSS has a `rel="preload" as="style"` link before its matching app stylesheet link.
  - Maps to: spec MODIFIED FR-4 scenario "App preload remains before stylesheet"; design Decision 4.

- [ ] **TC-14:** Inspect the document head and assert no `rel="preload"` link targets the print stylesheet.
  - Maps to: spec FR-10 and REMOVED Print stylesheet preload; design Decision 4.

- [ ] **TC-15:** Verify the print stylesheet remains linked and print route/browser print behavior still receives print styles.
  - Maps to: spec FR-10 scenario "Print stylesheet remains available"; design Decision 5.

### Documentation and Static Review

- [ ] **TC-16:** Inspect `docs/theming.md` and assert it documents boot loader theme sync points and names `src/routes/__root.tsx`, `src/styles.css`, `src/styles/themes/*.css`, and `src/contexts/ThemeContext.tsx`.
  - Maps to: spec FR-11; design Decision 2.

- [ ] **TC-17:** Static review of inline boot CSS/JS confirms no request-derived or user-supplied values are interpolated.
  - Maps to: security non-functional scenario; design Decision 2.

- [ ] **TC-18:** Inspect the inline boot CSS/JS and confirm it remains minimal and constrained to boot loader, theme, app cloaking, delayed feedback, and retry behavior.
  - Maps to: performance non-functional scenario; design Decisions 2 and 3.

## Regression Tests

- [ ] `npm run test:e2e -- src/e2e/fouc-prevention.spec.ts`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

## Manual Smoke Tests

- [ ] Cold hard reload with throttled network and default/dark theme: shows themed `Pre Heating` loader, then structured app.
- [ ] Cold hard reload with throttled network and `light-cool`: shows matching light-cool loader, then structured app.
- [ ] Cold hard reload with throttled network and `light-warm`: shows matching light-warm loader, then structured app.
- [ ] Simulated failed app stylesheet: loader remains visible and retry affordance works.
- [ ] Print route and browser/PDF print flow still use print styles after print preload removal.

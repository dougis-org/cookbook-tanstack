<!-- markdownlint-disable MD013 -->

## Context

- Relevant architecture:
  - Root HTML shell lives in `src/routes/__root.tsx`.
  - Root `head()` emits the main app stylesheet (`appCss`) and print stylesheet (`printCss`).
  - The current FOUC mitigation sets the theme class before paint and inlines only `html` background/color.
  - App structure and layout are Tailwind-driven via `src/styles.css`; route content and `Header` can render before those utility rules apply.
- Dependencies:
  - React/TanStack Start root shell.
  - Tailwind CSS output from `src/styles.css`.
  - Theme definitions in `src/contexts/ThemeContext.tsx` and `src/styles/themes/*.css`.
- Interfaces/contracts touched:
  - SSR root document structure in `src/routes/__root.tsx`.
  - Root head link contract for app/print stylesheets.
  - `src/styles.css` boot gate rules.
  - E2E FOUC prevention coverage in `src/e2e/fouc-prevention.spec.ts`.

## Goals / Non-Goals

### Goals

- Show an intentional themed boot loader before the main app stylesheet is ready.
- Hide real application content until the main app stylesheet has loaded.
- Make the boot loader say "Pre-heating" and include a spinner.
- Keep boot loader styling inline and independent from Tailwind, React hydration, icon libraries, or external assets.
- Remove the `printCss` preload from initial navigation.
- Preserve app CSS preload and normal print styling behavior.

### Non-Goals

- Inline a full critical CSS copy of the app shell.
- Make the application usable without CSS.
- Replace existing theme storage or `ThemeProvider`.
- Change route data loading, auth loading, or tRPC behavior.
- Add new runtime dependencies.

## Decisions

### Decision 1: CSS-loaded gate controls app visibility

- Chosen: The root document renders a boot loader and wraps the application shell in a stable element such as `#app-shell`. Inline critical CSS hides `#app-shell` and shows `#boot-loader`. `src/styles.css` hides `#boot-loader` and reveals `#app-shell`.
- Alternatives considered:
  - Hydration-loaded gate: hide loader after React mounts.
  - Inline critical shell CSS: keep app visible and hand-maintain enough CSS to structure header/home page.
  - Preload-only: rely on browser hints to reduce the flash window.
- Rationale: The bug is specifically that app CSS is not ready. Letting the external app stylesheet reveal the app is the most direct and reliable signal.
- Trade-offs: If app CSS fails, the app remains hidden. This is intentional; the visible state becomes an explicit loader/failure affordance instead of broken unstyled UI.

### Decision 2: Inline themed boot loader uses hardcoded critical theme values

- Chosen: `criticalCss` in `src/routes/__root.tsx` includes rules for `html`, `body`, `#boot-loader`, `#boot-loader-mark`, spinner animation, delayed status text, retry button, and `#app-shell`. Theme-specific rules mirror the active theme backgrounds, foregrounds, and accents.
- Alternatives considered:
  - Use CSS variables from theme files.
  - Render a neutral loader independent of theme.
  - Render a route-specific skeleton.
- Rationale: CSS variables from external theme files are unavailable before app CSS loads. Hardcoded inline critical values preserve theme continuity and avoid the same loading dependency.
- Trade-offs: Theme values must stay in sync manually; documentation and tests reduce drift.

### Decision 3: Boot loader is minimal and resilient

- Chosen: The boot loader displays "Pre-heating", a CSS-only spinner, and delayed status/retry messaging implemented with inline CSS/JS that does not require React.
- Alternatives considered:
  - Only spinner, no text.
  - Rich branded screen with icons/images.
  - No delayed failure feedback.
- Rationale: A small explicit loader is understandable during normal lag and remains usable when stylesheet loading stalls. "Pre-heating" matches the cookbook domain without requiring assets.
- Trade-offs: Adds a small amount of inline CSS/JS to the root document. This is acceptable because it prevents a visible broken state.

### Decision 4: Remove print stylesheet preload

- Chosen: Root `head()` keeps `{ rel: 'preload', as: 'style', href: appCss }` and removes `{ rel: 'preload', as: 'style', href: printCss }`.
- Alternatives considered:
  - Keep both preloads.
  - Remove all stylesheet preloads.
  - Lazy-load print CSS only on print routes.
- Rationale: Print CSS does not improve first app paint and can compete with app CSS during initial navigation. App CSS remains the only stylesheet preload because it unlocks visible app content.
- Trade-offs: Print CSS may be discovered slightly later for print operations; normal app load performance and user experience are prioritized.

### Decision 5: Prefer media-gated print stylesheet if validated

- Chosen: During implementation, evaluate whether the `printCss` stylesheet link can safely use `media="print"`. If compatible with current print/PDF flows, add it. If not compatible, leave the normal stylesheet link but do not preload it.
- Alternatives considered:
  - Always add `media="print"` without validation.
  - Never change the print stylesheet link.
- Rationale: `media="print"` is usually correct for print-only CSS, but the app has cookbook print/PDF flows that must be verified.
- Trade-offs: This adds a validation branch to implementation tasks.

## Proposal to Design Mapping

- Proposal element: Themed "Pre-heating" loading state before app CSS
  - Design decision: Decisions 1, 2, and 3
  - Validation approach: E2E tests delay/abort app CSS and assert loader visibility, text, spinner, and theme colors.
- Proposal element: Hide real app content until app CSS loads
  - Design decision: Decision 1
  - Validation approach: E2E tests assert app shell hidden while CSS is delayed and visible after CSS loads.
- Proposal element: Remove print preload
  - Design decision: Decision 4
  - Validation approach: E2E or DOM/head inspection asserts no `rel="preload"` link targets `printCss`.
- Proposal element: Preserve print stylesheet behavior
  - Design decision: Decision 5
  - Validation approach: Existing print tests plus manual/automated smoke for cookbook print route.
- Proposal element: Maintain theme continuity
  - Design decision: Decision 2
  - Validation approach: Tests cover `dark`, `light-cool`, `light-warm`, legacy `light`, and invalid/localStorage failure fallback.

## Functional Requirements Mapping

- Requirement: The boot loader appears before app CSS loads.
  - Design element: Inline `#boot-loader` CSS in `criticalCss`.
  - Acceptance criteria reference: `specs/fouc-prevention/spec.md` FR-6.
  - Testability notes: Route app CSS requests and delay them; assert loader visible immediately.
- Requirement: Application content remains hidden until app CSS loads.
  - Design element: Inline `#app-shell { visibility: hidden }` and external `src/styles.css` reveal rule.
  - Acceptance criteria reference: `specs/fouc-prevention/spec.md` FR-7.
  - Testability notes: Delay stylesheet and assert route/home/header content hidden; then fulfill stylesheet and assert visible.
- Requirement: Boot loader follows the active theme.
  - Design element: Existing theme init script plus theme-specific inline boot CSS rules.
  - Acceptance criteria reference: `specs/fouc-prevention/spec.md` FR-8.
  - Testability notes: Use `page.addInitScript()` to set localStorage values before navigation.
- Requirement: The boot loader says "Pre-heating" and includes a spinner.
  - Design element: Static boot loader markup in `RootDocument`.
  - Acceptance criteria reference: `specs/fouc-prevention/spec.md` FR-9.
  - Testability notes: Assert accessible/text content and CSS animation marker while app CSS is delayed.
- Requirement: Remove print stylesheet preload.
  - Design element: Root `head()` link array removes print preload.
  - Acceptance criteria reference: `specs/fouc-prevention/spec.md` FR-10.
  - Testability notes: Inspect DOM head links and/or SSR HTML.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Do not preload non-critical print CSS for normal navigation.
  - Design element: Decision 4.
  - Acceptance criteria reference: FR-10 and non-functional performance scenario.
  - Testability notes: Head inspection confirms only app CSS has preload.
- Requirement category: reliability
  - Requirement: Loader remains useful during slow or failed CSS loading.
  - Design element: Decisions 1 and 3.
  - Acceptance criteria reference: FR-11.
  - Testability notes: Abort app CSS and assert delayed status/retry is available.
- Requirement category: security
  - Requirement: Inline CSS/JS does not interpolate request/user data.
  - Design element: Decision 2 with static strings and theme ID allowlist.
  - Acceptance criteria reference: non-functional security scenario.
  - Testability notes: Static review and existing inline style safety tests.
- Requirement category: maintainability
  - Requirement: Inline theme values remain documented.
  - Design element: Adjacent comments and `docs/theming.md` update.
  - Acceptance criteria reference: FR-12.
  - Testability notes: Markdown/document inspection.

## Risks / Trade-offs

- Risk/trade-off: CSS failure keeps the app hidden.
  - Impact: Users cannot interact with unstyled content.
  - Mitigation: Show delayed failure/retry messaging in the boot loader.
- Risk/trade-off: Inline critical CSS grows beyond the previous tiny background-only block.
  - Impact: Slightly larger HTML payload.
  - Mitigation: Keep loader minimal and test/style review for payload size.
- Risk/trade-off: Theme values can drift between inline CSS and theme files.
  - Impact: Loader-to-app transition may look inconsistent.
  - Mitigation: Document every sync point and test theme colors.
- Risk/trade-off: `media="print"` might not work with current print/PDF flow.
  - Impact: Broken cookbook print styling.
  - Mitigation: Validate before adopting; removing preload is mandatory, media-gating is conditional.

## Rollback / Mitigation

- Rollback trigger: Loader remains stuck after app CSS loads, app content is hidden in production, print flow breaks, or E2E tests reveal flaky boot-state behavior.
- Rollback steps:
  - Remove boot loader wrapper/markup from `src/routes/__root.tsx`.
  - Remove `#boot-loader`/`#app-shell` gate rules from `src/styles.css`.
  - Restore previous app stylesheet/head behavior except keep any independently approved print preload removal only if validated.
- Data migration considerations: None.
- Verification after rollback: Run `npm run test`, focused FOUC E2E tests, `npm run test:e2e`, and `npm run build`.

## Operational Blocking Policy

- If CI checks fail: Diagnose and fix before merge; do not merge with failing unit, E2E, TypeScript, or build checks.
- If security checks fail: Remediate critical/high findings before merge; rerun relevant analysis.
- If required reviews are blocked/stale: Leave PR open with auto-merge disabled or pending; do not bypass unresolved comments.
- Escalation path and timeout: If CSS gating causes environment-specific failures after one implementation iteration, pause and revisit the design before continuing.

## Open Questions

- Validate whether `printCss` can use `media="print"` without breaking cookbook print/PDF behavior.
- Choose exact delayed status thresholds during implementation; suggested thresholds are roughly 2 seconds for "Still pre-heating..." and 10-15 seconds for retry affordance.

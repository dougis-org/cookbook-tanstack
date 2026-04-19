## Context

- Relevant architecture: `src/routes/__root.tsx` is the SSR shell. It already injects a synchronous inline `themeInitScript` (via React's inline HTML prop) into `<head>` before `<HeadContent />`. `<HeadContent />` emits `<link rel="stylesheet">` for `appCss` and `printCss`. Theme colors are CSS custom properties (`--theme-bg`, `--theme-fg`, …) defined per-class in `src/styles/themes/dark.css`, `light-cool.css`, `light-warm.css`.
- Dependencies: TanStack Start / Nitro SSR; Tailwind CSS 4 (Vite plugin); Vite asset fingerprinting (produces the `appCss?url` import used in `<HeadContent />`).
- Interfaces/contracts touched: `<head>` of every server-rendered page; the `themeInitScript` pattern (existing); `docs/theming.md` (new or updated).

## Goals / Non-Goals

### Goals

- Zero white flash on first paint for all current themes (`dark`, `light-cool`, `light-warm`)
- Faster CSS delivery via `rel="preload"` hint
- Self-documenting maintenance pattern so adding a fourth theme cannot silently break FOUC prevention

### Non-Goals

- Build-time critical CSS extraction
- HTTP Early Hints (103)
- Eliminating other layout shifts (CLS) beyond the background flash
- Automated CI sync-check between inline CSS and theme files

## Decisions

### Decision 1: Inline critical CSS as a `<style>` block in `<head>`

- Chosen: A `<style>` element with inline content placed immediately after the existing `themeInitScript` in `RootDocument`. Contains only `background-color` and `color` per theme class — the minimum needed to prevent a white flash.
- Alternatives considered: (a) Build-time critical CSS extraction — eliminates manual sync but adds tooling complexity and is incompatible with Tailwind 4's streaming CSS model without investigation. (b) Setting `background-color` via the `themeInitScript` JS itself using `document.documentElement.style.setProperty` — avoids a separate `<style>` tag but mixes styling logic into JS and is harder to audit.
- Rationale: Inline `<style>` is render-blocking (by spec) and has zero network cost. The existing `themeInitScript` sets the correct class before this block is evaluated, so class-specific selectors resolve immediately. Surface area is tiny (~5 lines of CSS, static string, no user data interpolated).
- Trade-offs: Hex values are duplicated from the CSS token files. Must be kept in sync manually — mitigated by the maintenance comment and `docs/theming.md` checklist.

### Decision 2: `rel="preload"` hint for `appCss` and `printCss`

- Chosen: Add `{ rel: 'preload', as: 'style', href: appCss }` and `{ rel: 'preload', as: 'style', href: printCss }` to the `links` array returned from `head()` in `__root.tsx`. These appear before the `stylesheet` links in `<HeadContent />`.
- Alternatives considered: (a) `rel="prefetch"` — lower-priority, not suitable for render-critical CSS. (b) HTTP `Link` response headers via Nitro middleware — more powerful (enables HTTP/2 push) but deploy-specific and complex.
- Rationale: `rel="preload"` instructs the browser to begin fetching the CSS file as soon as the `<link>` tag is parsed, before the render-blocking `<link rel="stylesheet">` is encountered. Reduces the window during which the inline critical CSS is the only styling in effect.
- Trade-offs: Minor redundancy (same URL declared twice in `<head>`). Browsers handle this correctly. Some browsers emit a console warning if the preloaded resource is not used within a timeout — mitigated by the matching `stylesheet` link immediately following.

### Decision 3: Maintenance documentation in source and docs

- Chosen: (a) A structured comment block in `__root.tsx` immediately above the `criticalCss` constant, listing every file that must be updated when a theme is added or its background changes. (b) A `## Theme Maintenance Checklist` section in `docs/theming.md`.
- Alternatives considered: A separate `THEMING.md` at project root — redundant with the existing `docs/` convention.
- Rationale: The inline CSS block is the only place in the codebase where theme background values are duplicated outside the CSS token files. Making the duplication explicit and co-located with the code is the lowest-friction maintenance path.
- Trade-offs: Documentation can drift. Accepted — the comment is co-located with the code it describes, which is the strongest signal short of automated enforcement.

### Decision 4: Critical CSS covers `html` element background only

- Chosen: Selectors are `html`, `html.dark`, `html.light-cool`, `html.light-warm` — all targeting the `<html>` element's `background-color` and `color`.
- Alternatives considered: Also setting `body { background-color }` — not needed because `body` defaults to transparent.
- Rationale: The visible white flash comes from the uncovered `<html>` root background. Components use `bg-[var(--theme-bg)]` on inner `div` elements; fixing the root covers the full viewport instantly.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: Inline critical CSS block in `__root.tsx`
  - Design decision: Decision 1
  - Validation approach: Visual regression (Playwright screenshot on first load with throttled network)

- Proposal element: `rel="preload"` hint for `appCss`
  - Design decision: Decision 2
  - Validation approach: Assert `<link rel="preload" as="style">` present in rendered HTML

- Proposal element: Maintenance documentation
  - Design decision: Decision 3
  - Validation approach: PR review; `docs/theming.md` existence check

- Proposal element: Fourth theme preparation
  - Design decision: Decision 3 (comment structure) + Decision 1 (slot reserved for fourth entry)
  - Validation approach: Comment in `__root.tsx` explicitly reserves the slot

## Functional Requirements Mapping

- Requirement: No white flash on first paint for `dark` theme
  - Design element: Decision 1 — `html { background-color: #0f172a; color: #fff }` in inline block
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-1
  - Testability notes: Playwright throttled-network first-load screenshot; assert computed `background-color` on `<html>` matches dark token before CSS loads

- Requirement: No white flash on first paint for `light-cool` theme
  - Design element: Decision 1 — `html.light-cool { background-color: #f1f5f9; color: #0f172a }`
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-2
  - Testability notes: Set `localStorage["cookbook-theme"] = "light-cool"` before load

- Requirement: No white flash on first paint for `light-warm` theme
  - Design element: Decision 1 — `html.light-warm { background-color: #fffbeb; color: #1c1917 }`
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-3
  - Testability notes: Set `localStorage["cookbook-theme"] = "light-warm"` before load

- Requirement: CSS stylesheet begins downloading earlier
  - Design element: Decision 2 — `rel="preload"` link
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-4
  - Testability notes: Assert `<link rel="preload" as="style">` present in SSR HTML output

- Requirement: Adding a fourth theme has a documented update path
  - Design element: Decision 3 — comment block + `docs/theming.md`
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-5
  - Testability notes: `docs/theming.md` contains checklist section; PR review

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Inline CSS block adds negligible bytes to HTML payload
  - Design element: Decision 1 — ~200 bytes minified
  - Acceptance criteria reference: N/A
  - Testability notes: Confirm inline block contains no unnecessary whitespace in production build

- Requirement category: reliability
  - Requirement: Fallback if localStorage is unavailable (e.g., private browsing)
  - Design element: Decision 1 — base `html` selector defaults to dark; existing `themeInitScript` already catches errors and defaults to dark
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-1
  - Testability notes: Test with localStorage blocked (Playwright storage state cleared)

- Requirement category: operability
  - Requirement: Theme maintenance is discoverable for future contributors
  - Design element: Decision 3
  - Acceptance criteria reference: specs/fouc-prevention/spec.md FR-5
  - Testability notes: `docs/theming.md` present and contains checklist

## Risks / Trade-offs

- Risk/trade-off: Inline hex values drift from CSS token files after a theme background color change
  - Impact: Flash returns for the changed theme
  - Mitigation: Co-located maintenance comment + `docs/theming.md` checklist; low probability

- Risk/trade-off: Preload hint causes browser console warning ("preloaded but not used")
  - Impact: Console noise in some browsers; no functional impact
  - Mitigation: Matching `rel="stylesheet"` link with identical `href` satisfies the preload

## Rollback / Mitigation

- Rollback trigger: Visual regression in production (flash returns or new rendering artifact introduced)
- Rollback steps: Revert `src/routes/__root.tsx` to prior state; `docs/theming.md` change is additive and can remain
- Data migration considerations: None — pure frontend change, no DB or API
- Verification after rollback: Deploy and verify first-load paint; confirm no console errors

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or lint errors before proceeding.
- If security checks fail: Do not merge. Inline CSS block contains no user data; any security finding must be reviewed and cleared.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo maintainer after 48 hours.
- Escalation path and timeout: If CI is blocked by infrastructure (not code), document in PR and escalate to repo maintainer.

## Open Questions

No open questions. All design decisions are resolved.

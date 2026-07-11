## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Standalone page background matches the print token family

The shared `CookbookStandalonePage` wrapper (used by both `/cookbooks/$id/toc`
and `/cookbooks/$id/print`) SHALL render its on-screen background using the
same always-light `--theme-print-*` token family already used by its
descendant text and border colors, regardless of the currently active site
theme (`dark`, `dark-greens`, `light-cool`, `light-warm`) — **and this
rendering SHALL be available at first paint, with no window in which the
route's component or its styling is not yet loaded.** The `toc` and `print`
route components SHALL NOT be split into a separate lazily-loaded bundle
chunk that falls outside the app's boot-loader stylesheet-readiness gate
(`#app-shell` visibility in `src/routes/__root.tsx`).

#### Scenario: TOC/print page background is light in the dark theme

- **Given** a user with the "Dark (blues)" theme active (`html.dark`)
- **When** they view `/cookbooks/$id/toc` or `/cookbooks/$id/print` (including with `?displayonly=1`)
- **Then** the page container background renders as the fixed light `--theme-print-bg` value, not the theme's dark `--theme-bg` value, and recipe names, the cookbook title, and footer text remain visible against that background

#### Scenario: Background renders correctly on every load, not just after a settling delay

- **Given** a user navigates directly to `/cookbooks/$id/toc` or `/cookbooks/$id/print` with any of the four supported themes active
- **When** the page's title heading becomes visible
- **Then** the nearest ancestor with a non-transparent background already resolves to the fixed light `--theme-print-bg` value — not a transiently transparent background that would otherwise expose the inherited site-theme background color from `<body>`

#### Scenario: TOC/print route components are not emitted as a separate lazy bundle chunk

- **Given** a production build of the application
- **When** the build output's chunk/asset manifest is inspected
- **Then** there is no separate JS or CSS chunk containing `CookbookStandaloneLayout`'s exports that is excluded from the boot-loader's stylesheet-readiness gate — the toc and print routes' component code loads as part of the main application bundle

#### Scenario: TOC/print page background is light in every supported theme

- **Given** a user with any of the four supported themes active (`dark`, `dark-greens`, `light-cool`, `light-warm`)
- **When** they view `/cookbooks/$id/toc` or `/cookbooks/$id/print`
- **Then** the page container background renders identically as the fixed light `--theme-print-bg` value in all four cases

#### Scenario: Actual print output is unaffected

- **Given** a user on `/cookbooks/$id/print`
- **When** they trigger the browser print dialog
- **Then** the printed page background remains white, as already enforced by the existing `@media print` rule in `src/styles/print.css`, unchanged by this requirement

## Traceability

- Proposal element: disable code splitting on toc/print routes -> Requirement: MODIFIED Standalone page background matches the print token family
- Design decision: Decision 1 (`codeSplitGroupings`) -> Requirement: MODIFIED Standalone page background matches the print token family, scenario "TOC/print route components are not emitted as a separate lazy bundle chunk"
- Design decision: Decision 2 (build-output verification) -> Requirement: MODIFIED Standalone page background matches the print token family, scenario "TOC/print route components are not emitted as a separate lazy bundle chunk"
- Requirement -> Task(s): see `tasks.md` — route config change, build verification, e2e re-run/spec cleanup tasks

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: e2e background-contrast spec passes without relying on retries

- **Given** `src/e2e/cookbooks-print-theme-contrast.spec.ts`'s full parametrized suite (4 themes × 3 route variants)
- **When** it is run repeatedly in CI or locally after this change
- **Then** it passes without needing Playwright's automatic retry mechanism to reach a green result

### Requirement: Performance

#### Scenario: Bundle size impact stays negligible

- **Given** the production build before and after this change
- **When** the emitted asset sizes for the main bundle are compared
- **Then** the increase attributable to un-splitting the toc/print routes is small, consistent with the size of `CookbookStandaloneLayout.tsx` and the two route files alone (no unrelated route chunks pulled in)

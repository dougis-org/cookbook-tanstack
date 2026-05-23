## GitHub Issues

- #448

## Why

- **Problem statement**: The current landing page (public homepage at `src/routes/index.tsx`) renders the wrong brand name ("CookBook" instead of "My CookBooks"). Furthermore, all three of its feature cards describe browsing/reading capabilities rather than the actual product value propositions (saving, importing, printing, and organizing recipes). Finally, there is no mention of paid subscription plans or value additions, making the site look like a simple public recipe viewer rather than a premium product.
- **Why now**: Launching marketing and monetization funnels requires high-converting, value-focused messaging and proper branding above the fold. 
- **Business/user impact**: Rewriting the landing page to showcase actual features (Save, Organise, Import, Print) with clear action-oriented messaging will drive user registration, set proper branding, and boost paid subscription conversions.

## Problem Space

- **Current behavior**:
  - The hero section displays the title "My CookBooks" but uses standard fonts without correct brand styling rules (Fraunces 600, `SOFT 80, WONK 1`).
  - Feature cards represent repetitive browsing operations rather than high-value workflows.
  - CTAs are non-action-oriented and lead to `/recipes` and `/pricing` rather than a direct registration path.
  - No visual or screenshot represents the application interface below the fold.
- **Desired behavior**:
  - Brand-compliant hero section featuring "My CookBooks" with `brand-wordmark` styling and `LogoMark` SVG.
  - Fully verb-led features section (Save, Organise, Import, Print) using customized Lucide icons that act as live links to registration/auth to maximize conversion.
  - Primary CTA driving to `/auth/register` with clean, Title Case action copy ("Start Free — No Credit Card"). Secondary CTA leading to `/recipes` ("Browse Public Recipes").
  - Pricing teaser line below CTAs: "Plans start at $2.99/mo. View Plans" linking to `/pricing`.
  - Slick preview card housing an `<image-slot id="landing-screenshot" placeholder="Add a screenshot of /recipes">` to show a beautiful placeholder layout that can be easily replaced with an actual screenshot later.
- **Constraints**:
  - Theme tokens only; no hardcoded hex colors.
  - Zero emoji anywhere in the UI.
  - Title Case for CTAs, Sentence case for body copy.
  - Maintain the existing single subtle gradient background on the hero. No new gradients elsewhere.
- **Assumptions**:
  - Visitors land on the public homepage anonymously. Authenticated users are redirected to `/home` via route guards.
- **Edge cases considered**:
  - E2E tests checking for exact CTA text will fail unless updated to the new strings.
  - Adblockers must not block container elements (use clean prefix classnames).

## Scope

### In Scope

- Redesign the hero copy, tagline, and sub-tagline in `src/routes/index.tsx`.
- Update primary and secondary CTA buttons to match the new URLs and Title Case strings.
- Add the subscription pricing line below the CTAs.
- Implement the application screenshot placeholder container with the `<image-slot id="landing-screenshot">` element.
- Replace the features section with 4 verb-led, clickable cards (Save, Organise, Import, Print) linking to `/auth/register` with custom Lucide icons.
- Update E2E spec `src/e2e/home-page-revamp.spec.ts` to assert the new branding, CTAs, and layout elements correctly.

### Out of Scope

- Pricing page redesign (F09).
- Register form or logic changes (F10).

## What Changes

- **Route component** `src/routes/index.tsx`: Completely rewritten structure for marketing copy, CTAs, features mapping, and screenshot slots.
- **Imports** `src/routes/index.tsx`: Cleaned up to avoid unused imports (removal of `ChefHat` and `Search`, addition of `Save`, `ArrowUpRight`, `Printer`).
- **Tests** `src/e2e/home-page-revamp.spec.ts`: Test assertions updated to match new CTA text and DOM presence of `image-slot` and feature links.

## Risks

- **Risk**: Existing Playwright E2E tests for the landing page fail due to changed CTA labels and links.
  - **Impact**: Broken build/CI pipelines.
  - **Mitigation**: Update all landing page test assertions concurrently with the changes to verify the new interface cleanly.
- **Risk**: Browser adblockers hide components due to trigger keywords.
  - **Impact**: Part of the page appears broken or missing.
  - **Mitigation**: Ensure no classes, IDs, or custom element attributes use prefixes such as `ad-`, `promo-`, `sponsor-` etc. (strictly adhere to standard Tailwind and theme token utilities).

## Open Questions

- All design questions and technical decisions have been resolved. The requester confirmed that feature cards should be live links to registration, specified the custom icons (`Save` for Save, `ArrowUpRight` for Import, `BookOpen` for Organise, `Printer` for Print), and acknowledged the required E2E test modifications.

## Non-Goals

- Implementing actual image hosting or static image files for the landing screenshot preview.
- Changing authentication mechanisms or user registration flows.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.

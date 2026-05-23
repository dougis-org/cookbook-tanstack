## Context

- **Relevant architecture**: 
  - File-based router using TanStack Router. The public landing page is mapped directly at the root `src/routes/index.tsx`.
  - Reusable layout structure is defined in `src/components/layout/PageLayout.tsx`.
  - Application design tokens are configured in Tailwind CSS 4 and loaded in `src/styles.css`, drawing from theme configurations under `src/styles/themes/`.
  - Custom brand visual mark is implemented in `src/components/ui/LogoMark.tsx`.
- **Dependencies**: 
  - `lucide-react` for iconography.
  - `@tanstack/react-router` for navigation, `<Link>` tags, and redirection guards.
- **Interfaces/contracts touched**:
  - The root index route page structure.
  - The public marketing metadata properties.
  - Assertions within Playwright E2E tests in `src/e2e/home-page-revamp.spec.ts`.

## Goals / Non-Goals

### Goals

- Correct landing page title and wordmark styling to "My CookBooks" using proper typography tokens (Fraunces 600, Soft 80, Wonk 1).
- Set action-oriented, conversion-focused sub-tagline, primary CTA, and secondary CTA.
- Provide a clear, visual application screenshot placeholder using `<image-slot id="landing-screenshot">`.
- Offer four distinct, verb-led feature cards (Save, Organise, Import, Print) that act as live links to drive registration.
- Maintain full compatibility with all four active application themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).
- Ensure E2E tests pass successfully by updating assertions to match the new copywriting.

### Non-Goals

- Modifying the `/pricing` or `/auth/register` route page logic or designs.
- Implementing any backend persistence, user session, or registration endpoint changes.

## Decisions

### Decision 1: Hero Redesign and Conversion CTAs

- **Chosen**: Rewrite `src/routes/index.tsx` hero. We keep the tagline "Your Personal Recipe Management System" and update the sub-tagline to "Save every recipe. Build cookbooks. Cook from any device.". Set Title Case CTAs: Primary CTA "Start Free — No Credit Card" linking to `/auth/register` (solid background style), and Secondary CTA "Browse Public Recipes" linking to `/recipes` (bordered outline style). Place "Plans start at $2.99/mo. View Plans" inline text block right below the buttons.
- **Alternatives considered**: Keeping the original generic CTAs and redirecting users to the pricing page as a primary step.
- **Rationale**: Direct path to `/auth/register` reduces friction, and setting Title Case maintains clean, professional marketing standards. Adding the pricing details directly under the CTA clarifies expectations while allowing users to explore tiers easily.
- **Trade-offs**: Requires changing the Playwright test assertions which expect "Browse Recipes" and "View Plans and Pricing".

### Decision 2: Custom Preview Element

- **Chosen**: Implement a beautiful preview card right below the CTA block using a customized `<image-slot id="landing-screenshot" placeholder="Add a screenshot of /recipes">` container element. By default, this slot renders a centered card using a `BookOpen` Lucide icon, a bold and clean typeface for "Explore the Cooking Experience", and helper text telling the user to replace it with a real screenshot of `/recipes` later.
- **Alternatives considered**: Leaving a simple blank grey box or creating complex SVG layout illustrations.
- **Rationale**: An elegant, theme-compliant card using standard design tokens presents a premium and state-of-the-art aesthetic even without an active image. Custom element tags are standard, valid HTML and easily populated with static assets in the future.
- **Trade-offs**: Needs careful styling to prevent TS compiler errors (declaring a typed local constant for the custom tag) and must adapt gracefully across all themes.

### Decision 3: Clickable Verb-Led Features Section

- **Chosen**: Replace the three existing duplicate feature cards with four distinct verb-led feature cards:
  - **Save**: "Capture any recipe in seconds. Title, ingredients, steps, your own notes." (Icon: `Save` Lucide)
  - **Organise**: "Sort into cookbooks. Tag by meal, course, prep. Find anything in a click." (Icon: `BookOpen` Lucide)
  - **Import**: "Bring recipes in from JSON exports or paste a URL. Available on Executive Chef." (Icon: `ArrowUpRight` Lucide)
  - **Print**: "Recipe and cookbook print layouts that look good on paper." (Icon: `Printer` Lucide)
  All four cards will be wrapped in `<Link to="/auth/register">` tags with sleek hover animations to encourage registration.
- **Alternatives considered**: Static `div` cards with no link context.
- **Rationale**: Active hover states and clickability on features drives stronger user registration actions since the cards sell value propositions.
- **Trade-offs**: Over-linking can sometimes confuse users, but clear card styling and hover cues clarify their nature as interactive elements.

## Proposal to Design Mapping

- **Proposal element**: Correct branding to "My CookBooks" with Soft 80, Wonk 1 typography
  - **Design decision**: Decision 1 (incorporate `brand-wordmark` styling and weight 600)
  - **Validation approach**: Inspect HTML and verify presence of class `.brand-wordmark` and "My CookBooks" string.
- **Proposal element**: Conversion-driven CTAs and Pricing line
  - **Design decision**: Decision 1 (Primary to register, Secondary to recipes, pricing line to pricing)
  - **Validation approach**: Playwright test clicking each CTA and checking correct landing URLs.
- **Proposal element**: App screenshot preview element below hero
  - **Design decision**: Decision 2 (ImageSlot card layout using BookOpen icon)
  - **Validation approach**: Assert presence of `image-slot[id="landing-screenshot"]` in E2E tests.
- **Proposal element**: 4 verb-led features with live links
  - **Design decision**: Decision 3 (Four-card features grid linking to `/auth/register`)
  - **Validation approach**: E2E test verifying features row has exactly 4 links pointing to `/auth/register`.

## Functional Requirements Mapping

- **Requirement**: Display correct brand typography above the fold
  - **Design element**: Hero h1 with `.brand-wordmark`
  - **Acceptance criteria reference**: F03-landing-rewrite AC 1
  - **Testability notes**: Verify wordmark uses `Fraunces` via styles and renders correct casing.
- **Requirement**: Direct anonymous users to registration and recipes
  - **Design element**: Direct CTA links with solid/bordered styles
  - **Acceptance criteria reference**: F03-landing-rewrite AC 5 & AC 7
  - **Testability notes**: Verify register link and recipes link are fully visible and clickable.
- **Requirement**: Provide application preview slot
  - **Design element**: ImageSlot wrapper
  - **Acceptance criteria reference**: F03-landing-rewrite AC 6
  - **Testability notes**: Ensure custom `<image-slot>` renders in output DOM.
- **Requirement**: Present four distinct product features that lead to sign-up
  - **Design element**: Verb-led grid of 4 interactive links
  - **Acceptance criteria reference**: F03-landing-rewrite AC 4
  - **Testability notes**: Match features array items exactly with specified verb-led strings.

## Non-Functional Requirements Mapping

- **Requirement category**: Performance
  - **Requirement**: Fast load times on marketing entry
  - **Design element**: Minimize additional asset dependencies (reusing lightweight Lucide SVG components and standard system stylesheets)
  - **Acceptance criteria reference**: F03-landing-rewrite Constraints
  - **Testability notes**: Keep package payload small, no heavy client-side processing.
- **Requirement category**: Security / Operability
  - **Requirement**: Avoid adblocker blocking of landing elements
  - **Design element**: Do not use ad/promo/sponsor naming on landing components
  - **Acceptance criteria reference**: `design-system/CLAUDE.md` ad-block policy
  - **Testability notes**: Verify no cosmetic filters block the screenshot slot or CTAs.

## Risks / Trade-offs

- **Risk/trade-off**: The use of custom tag `<image-slot>` inside React environment.
  - **Impact**: TypeScript errors and JSX parsing warnings if not declared.
  - **Mitigation**: Define a custom local React typings overlay or cast the tag `const ImageSlot = 'image-slot' as any` to keep code clean and typed.

## Rollback / Mitigation

- **Rollback trigger**: Unexpected routing or build compilation failures in production build.
- **Rollback steps**: Revert changes to `src/routes/index.tsx` and `src/e2e/home-page-revamp.spec.ts` using git checkouts.
- **Data migration considerations**: None (marketing visual change only).
- **Verification after rollback**: Run `npm run test` and `npm run test:e2e` to confirm old homepage works.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge the branch or proceed to auto-merge. Fix linting, compilation, or test assertions immediately.
- **If security checks fail**: Address any newly introduced dependencies or alerts from Snyk before final review.
- **If required reviews are blocked/stale**: Do not force-merge. Contact the reviewer to resolve questions on branding.
- **Escalation path and timeout**: If approvals remain stale for more than 24 hours, request feedback on the open questions.

## Open Questions

- All design questions and details have been resolved in the exploration step. No open design items remain.

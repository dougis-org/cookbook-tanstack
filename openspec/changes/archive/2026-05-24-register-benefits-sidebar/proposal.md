## GitHub Issues

- dougis-org/cookbook-tanstack#454

## Why

- **Problem statement:** The current registration form (`src/components/auth/RegisterForm.tsx`) consists of just four input fields and a submit button inside a narrow, centered layout. While functional, it provides no user reassurance, no social proof, and no preview of the core features and benefits awaiting the user inside the application.
- **Why now:** Although registration conversion has a small impact per visitor, every single paying customer must pass through this gate. Maximizing the registration conversion rate by providing clear value highlights is highly leveraged.
- **Business/user impact:** Enhances registration rate, sets a premium tone for the product from the onboarding phase, and informs users about capabilities like printing, cookbook creation, and private/public recipe allowances.

## Problem Space

- **Current behavior:** The registration form is displayed in a single-column layout centered on the screen. The enclosing card in `AuthPageLayout.tsx` has a hardcoded `max-w-md` constraints limit, which works well for small forms but does not support a multi-column desktop layout.
- **Desired behavior:** 
  - On desktop (≥ md breakpoint), the registration page presents a two-column grid. The registration form is on the left, and a visually stunning benefits sidebar is on the right.
  - On mobile (< md breakpoint), the benefits sidebar stacks cleanly above the form.
  - The benefits sidebar contains 5 concise, benefit-oriented bullet points, each paired with a Lucide checkmark icon colored in the theme's accent color.
  - Below the registration button, legal microcopy is added to state consent to the Terms and Privacy Policy (with real or stub links).
- **Constraints:**
  - Standard theme tokens only (`var(--theme-*)`).
  - No emojis allowed.
  - Do not alter the submission flow, API integrations, or field validation rules (pure layout and copy modifications).
  - Brand name must be `My CookBooks` if mentioned in any copy.
- **Assumptions:**
  - The Terms and Privacy Policy pages do not currently exist in the route registry, so they will be stubbed with `#` links accompanied by clear TODO comments.
- **Edge cases considered:**
  - Stacking on small/narrow screen sizes: Handled gracefully using CSS Grid and standard Tailwind breakpoint utilities (`md:grid-cols-[1fr_280px]`).
  - High error states: The left column should dynamically stretch or wrap error messages cleanly without affecting the alignment or height of the right-hand benefits sidebar.

## Scope

### In Scope

- Widening `AuthPageLayout.tsx` using a customizable, optional `maxWidth` prop defaulting to `max-w-md`.
- Updating the registration route to pass `maxWidth="max-w-3xl"` (or similar premium size) to the auth page wrapper.
- Refactoring `RegisterForm.tsx` to implement a responsive grid structure.
- Coding the benefits sidebar component with hover scaling micro-animations on checkmark icons.
- Injecting the legal microcopy with stub links underneath the registration submit button.
- Creating comprehensive test coverage in `RegisterForm.test.tsx` to assert new elements.

### Out of Scope

- Redesigning the sign-in/login, forgot-password, or reset-password pages.
- Creating or route-wiring the actual Terms or Privacy Policy pages.
- Modifying email verification logic or auth workflows.

## What Changes

- **Component: Layout & Routing**
  - `src/components/auth/AuthPageLayout.tsx`: Add `maxWidth` string property (default: `"max-w-md"`) to the props structure and bind it to the wrapper container class.
  - `src/routes/auth/register.tsx`: Pass `maxWidth="max-w-3xl"` into `<AuthPageLayout>`.
- **Component: Register Form**
  - `src/components/auth/RegisterForm.tsx`:
    - Restructure layout to wrap columns in `grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8`.
    - Construct the Benefits Sidebar using styled theme elements (`var(--theme-surface-raised)`) and list it first in JSX (ordering first on mobile, last on desktop).
    - Add Lucide checkmarks with scaling hover states.
    - Add legal microcopy under the submit button with stubbed link tags.
- **Testing**
  - `src/components/auth/__tests__/RegisterForm.test.tsx`: Write assertions verifying the benefits list, checkmarks, and terms/privacy policy stubs render properly.

## Risks

- **Risk:** Existing E2E Playwright tests failing due to structural layout modifications.
  - *Impact:* Low-to-medium.
  - *Mitigation:* Ensure existing E2E selectors (like button and input attributes) are completely unaltered, and maintain absolute compatibility of the form submit behavior.
- **Risk:** Sidebar causing crowded display on tablet-sized viewports (exactly at `768px` / `md` breakpoint).
  - *Impact:* Medium.
  - *Mitigation:* Use a responsive grid with robust gap sizes (`gap-8`) and compact font sizes (`text-sm`), and let the container widen up to `max-w-3xl`.

## Open Questions

- No unresolved design ambiguities exist. The registration form flow is highly specified.

## Non-Goals

- Do not modify registration validation rules or username/password criteria.
- Do not introduce email notification modifications.
- Do not touch the styling or layouts of other auth screens.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

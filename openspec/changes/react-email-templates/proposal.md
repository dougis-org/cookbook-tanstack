## GitHub Issues

- dougis-org/cookbook-tanstack#345

## Why

- **Problem statement:** Once the foundational transactional email system is established (ref #344), we need a maintainable and visually consistent way to handle HTML emails. Hand-rolling HTML strings is error-prone and hard to test across different mail clients.
- **Why now:** Transitioning from primitive, unstyled HTML strings to structured templates before adding more transactional emails (like tier notifications) is crucial to avoid technical debt and maintain codebase standards.
- **Business/user impact:** Greatly improves user experience with beautifully styled, professional, and responsive emails. Provides a modern developer experience (DX) with local previewing and React component reusability.

## Problem Space

- **Current behavior:** Primitive, unstyled inline HTML strings are passed directly in `src/lib/auth.ts` and `src/server/trpc/routers/cookbooks.ts` to `sendEmail` (defined in `src/lib/mail.ts`).
- **Desired behavior:** Render beautiful, responsive email templates written as React components using React Email components. Support inline styles and consistent design (dark theme first, with cyan accents to match the app layout). Update `src/lib/mail.ts` to accept `react?: React.ReactElement` and handle rendering to HTML and text automatically.
- **Constraints:**
  - Must support React 19.2.0 compatibility.
  - Styling must be inlined (React Email does this automatically).
  - Must ensure email client rendering compatibility (standard table layouts, safe typography, safe styling from `@react-email/components`).
- **Assumptions:**
  - Node version is >= 24.0.0.
  - Node packages will be installed correctly with standard npm install.
- **Edge cases considered:**
  - Email clients blocking external assets/images (host static assets on CDN or public folder).
  - Error handling if React Email rendering fails (fallback to text).

## Scope

### In Scope

- Add dependencies: `react-email`, `@react-email/components`, `@react-email/render`.
- Create a structured `src/emails/` directory.
- Implement Email Verification template (Logo, welcome message, action button).
- Implement Password Reset template (Security notice, reset button, expiration warning).
- Implement Tier Notification template (Executive Chef, etc.).
- Update `src/lib/mail.ts` to support `React.ReactElement` using `@react-email/render`.
- Configure `"email:dev"` dev script for local previews.
- Add unit/integration tests for email rendering and delivery options.

### Out of Scope

- Redesigning pages unrelated to email authentication or email verification status.
- Replacing all other potential emails (e.g., cookbook collaborator emails) unless requested (though we can add a task/future ticket for this).

## What Changes

- **Dependencies:** Add `react-email`, `@react-email/components`, and `@react-email/render` to `package.json`.
- **Scripts:** Add `email:dev` script to run the local preview server.
- **Templates:** Add `src/emails/` directory with `VerificationEmail.tsx`, `PasswordResetEmail.tsx`, and `TierNotificationEmail.tsx`.
- **Utilities:** Update `src/lib/mail.ts` to support rendering components via `@react-email/render`.
- **Auth Config:** Update `src/lib/auth.ts` to send email templates.
- **Admin Actions:** Update `src/server/trpc/routers/admin.ts` to trigger a tier notification email upon tier change.

## Risks

- **Risk:** React 19 compatibility with older React Email packages.
  - **Impact:** Dev compilation or server-side rendering errors.
  - **Mitigation:** Install the latest stable versions of `react-email`, `@react-email/components`, and `@react-email/render`.
- **Risk:** Images/logo not rendering in email clients.
  - **Impact:** Broken image indicators in user mailboxes.
  - **Mitigation:** Place static assets in `src/emails/static/` and reference them using an absolute URL pointing to our public CDN/app domain (using env variables like `APP_PRIMARY_URL` or `BETTER_AUTH_URL`).

## Open Questions

- **Question:** Should we use the root `/emails` or `src/emails` folder?
  - **Needed from:** User
  - **Blocker for apply:** no (We propose `src/emails` to maintain alignment with `@/` path alias and source files).
- **Question:** What logo asset should be used in the email templates?
  - **Needed from:** User
  - **Blocker for apply:** no (We can use a placeholder image or a simple CSS/HTML text logo until a CDN link is provided).
- **Question:** When does the tier notification get sent? Should it trigger immediately upon calling the `admin.users.setTier` mutation?
  - **Needed from:** User
  - **Blocker for apply:** no (We propose sending it immediately upon a successful tier update within the `setTier` mutation).

## Non-Goals

- Re-writing cookbook sharing emails in React Email (can be handled as a separate follow-up).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.

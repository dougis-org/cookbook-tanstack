## GitHub Issues

- #341

## Why

- Problem statement: Password reset plumbing now exists in the repo, but issue `#341` is still open because the end-to-end behavior has not been explicitly validated and the UI path lacks focused regression coverage.
- Why now: The feature is close enough to done that the remaining work is verification, not architecture. Closing the gap now prevents duplicate implementation work and leaves a clear audit trail for why `#341` can be closed.
- Business/user impact: Users need a recoverable login path. Without proof that reset requests, token handling, and reset submission work together, production readiness remains uncertain.

## Problem Space

- Current behavior: `src/lib/auth.ts` configures Better Auth password reset email sending through Mailtrap, `src/components/auth/ForgotPasswordForm.tsx` requests a reset link, and `src/components/auth/ResetPasswordForm.tsx` submits the new password with a token.
- Desired behavior: The repo should have explicit verification coverage for the existing password reset flow, a documented manual Mailtrap smoke test, and a PR trail that closes `#341`.
- Constraints:
  - This change is verification-focused and should not re-implement password reset architecture already present on `main`.
  - Mailtrap remains the required email provider.
  - Validation should follow repo standards: tests first, then any small corrective code only if testing exposes a gap.
- Assumptions:
  - The Better Auth APIs currently used by the repo remain the supported path for reset requests and reset submission.
  - Any missing work uncovered by tests will be small and local to auth UI or configuration.
- Edge cases considered:
  - `redirectTo` points at the wrong route or loses the token.
  - The reset page renders without a token and needs a clear invalid-token state.
  - Client error handling is present but untested for request or reset failures.
  - Mailtrap credentials exist in environments where manual smoke validation is performed.

## Scope

### In Scope

- Add focused automated coverage for the existing forgot-password and reset-password UI flow.
- Validate current Better Auth integration assumptions against the existing implementation.
- Add or update a manual verification procedure for Mailtrap-backed password reset delivery.
- Require the implementation PR for this change to include closing language for `#341`.

### Out of Scope

- Rebuilding the password reset architecture from scratch.
- Switching providers away from Mailtrap.
- Broad auth UX redesign beyond small fixes discovered during verification.
- Expanding into email verification or unrelated auth work.

## What Changes

- Add component and/or route tests for `src/components/auth/ForgotPasswordForm.tsx` and `src/components/auth/ResetPasswordForm.tsx`.
- Add validation for the reset route token handling in `src/routes/auth/reset-password.tsx`.
- Add one manual smoke-test checklist covering request, email delivery, token link, and successful password update.
- Include `Closes #341` in the PR body for the implementation branch created from this change.

## Risks

- Risk: Tests may reveal that the existing implementation differs from issue `#341` assumptions.
  - Impact: Scope could expand from verification into bug fixing.
  - Mitigation: Keep fixes limited to gaps found by tests; update proposal/design/specs/tasks before broadening scope.
- Risk: Manual Mailtrap validation depends on environment credentials that may be missing locally.
  - Impact: The last mile of confidence could remain unverified in one environment.
  - Mitigation: Treat Mailtrap smoke verification as a required checklist item before merge in an environment with valid credentials.
- Risk: The PR might still omit explicit issue-closing language.
  - Impact: `#341` stays open even after merge.
  - Mitigation: Make issue linkage an explicit PR task and review checkpoint.

## Open Questions

- No open product or technical questions remain for proposal approval. The open work is verification and closure discipline.

## Non-Goals

- Adding new authentication providers or OTP-based password reset.
- Changing database schema.
- Shipping email template redesign work.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

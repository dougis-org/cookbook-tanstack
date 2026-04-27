## Context

- Relevant architecture:
  - `src/lib/auth.ts` wires Better Auth `emailAndPassword.sendResetPassword`.
  - `src/lib/mail.ts` sends transactional email through the Mailtrap SDK transport.
  - `src/components/auth/ForgotPasswordForm.tsx` calls `authClient.requestPasswordReset`.
  - `src/components/auth/ResetPasswordForm.tsx` calls `authClient.resetPassword`.
  - `src/routes/auth/reset-password.tsx` reads `token` from route search params and renders an invalid-token state when missing.
- Dependencies:
  - Better Auth client and server configuration already on `main`
  - Mailtrap API token (`MAILTRAP_API_TOKEN`) and sender address (`MAIL_FROM`) through environment variables
  - Existing Vitest and Playwright test setup
- Interfaces/contracts touched:
  - Better Auth client methods: `requestPasswordReset`, `resetPassword`
  - Route search contract for `/auth/reset-password?token=...`
  - PR metadata expectation that merged work closes `#341`

## Goals / Non-Goals

### Goals

- Prove the existing password reset flow behaves as intended.
- Add durable regression coverage around the user-visible forgot/reset forms and route token handling.
- Record a manual Mailtrap verification path for the parts that automated tests do not observe directly.
- Ensure the implementation PR explicitly closes GitHub issue `#341`.

### Non-Goals

- Re-architect auth or mail delivery.
- Add new reset mechanisms such as OTP.
- Expand scope beyond password reset verification unless tests expose a concrete defect.

## Decisions

### Decision 1: Treat this as verification-first, not feature-first

- Chosen: The change will assume the existing password reset implementation is the baseline and will add tests plus targeted corrections only where validation proves they are needed.
- Alternatives considered:
  - Re-open the original implementation scope and rebuild the flow.
  - Close the issue without additional evidence.
- Rationale: The repo already contains the key code paths. What is missing is confidence, not architecture.
- Trade-offs:
  - This keeps scope small and fast.
  - It may uncover a defect that forces limited implementation work during apply.

### Decision 2: Focus automated coverage on user-observable boundaries

- Chosen: Add tests for forgot-password submission behavior, reset-password submission behavior, and reset route token handling rather than retesting Better Auth internals.
- Alternatives considered:
  - Add only server-side auth config tests.
  - Add a large end-to-end suite that depends on live email delivery.
- Rationale: The highest-value gap is whether the app wires existing APIs correctly at the UI and routing layer.
- Trade-offs:
  - Component and route tests are stable and fast.
  - They do not prove real SMTP delivery, so a manual Mailtrap smoke remains necessary.

### Decision 3: Keep real-email verification manual but mandatory before merge

- Chosen: Require a manual Mailtrap smoke test as part of change validation instead of trying to automate mailbox inspection.
- Alternatives considered:
  - Mock Mailtrap completely and skip manual verification.
  - Build API-based mailbox assertions into the test suite.
- Rationale: Manual verification is sufficient for this narrow closure task and avoids adding email-inbox test infrastructure.
- Trade-offs:
  - Human execution is required before merge.
  - The process must be documented clearly to avoid ambiguity.

### Decision 4: Make issue closure an explicit delivery requirement

- Chosen: The implementation PR must include `Closes #341` in the PR body.
- Alternatives considered:
  - Rely on a human to close the issue manually after merge.
  - Mention the issue only in commit messages.
- Rationale: PR-level closing language is the most reliable and auditable way to tie merged work back to the issue.
- Trade-offs:
  - Slightly more process discipline is required.
  - Prevents the change from feeling complete if the PR omits linkage.

## Proposal to Design Mapping

- Proposal element: Add focused automated coverage for the forgot/reset flow
  - Design decision: Decision 2
  - Validation approach: Vitest component and route tests
- Proposal element: Manual Mailtrap smoke verification
  - Design decision: Decision 3
  - Validation approach: Manual checklist executed before merge
- Proposal element: Close GitHub issue `#341` through the implementation PR
  - Design decision: Decision 4
  - Validation approach: PR body review includes `Closes #341`
- Proposal element: Avoid re-implementation of existing architecture
  - Design decision: Decision 1
  - Validation approach: Scope review during apply keeps changes local to proven gaps

## Functional Requirements Mapping

- Requirement: The app SHALL verify forgot-password request behavior through automated tests.
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/password-reset-validation/spec.md` requirement "ADDED Password Reset Request Verification"
  - Testability notes: Mock `authClient.requestPasswordReset` and assert request payload, success state, and error behavior.
- Requirement: The app SHALL verify reset-password submission and token handling through automated tests.
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/password-reset-validation/spec.md` requirement "ADDED Password Reset Completion Verification"
  - Testability notes: Mock `authClient.resetPassword`; assert invalid-token route behavior and successful submission behavior.
- Requirement: The implementation PR SHALL close `#341`.
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/password-reset-validation/spec.md` requirement "ADDED Issue Closure Traceability"
  - Testability notes: Review PR body content before enabling auto-merge.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Verification coverage must catch regressions in user-visible reset wiring without depending on live SMTP.
  - Design element: Decision 2
  - Acceptance criteria reference: non-functional reliability criteria in `specs/password-reset-validation/spec.md`
  - Testability notes: Fast deterministic Vitest coverage over components and routes.
- Requirement category: operability
  - Requirement: The team must have a repeatable manual procedure for validating Mailtrap delivery before merge.
  - Design element: Decision 3
  - Acceptance criteria reference: non-functional operability/reliability criteria in `specs/password-reset-validation/spec.md`
  - Testability notes: Checklists in tests/tasks; reviewer verifies execution note.
- Requirement category: traceability
  - Requirement: Merged work must clearly close the originating issue.
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/password-reset-validation/spec.md` requirement "ADDED Issue Closure Traceability"
  - Testability notes: Confirm PR body contains `Closes #341`.

## Risks / Trade-offs

- Risk/trade-off: Manual Mailtrap validation is not fully automated
  - Impact: One final verification step depends on a human and environment credentials
  - Mitigation: Keep it mandatory in tasks and required before merge
- Risk/trade-off: Existing code may already pass the new tests with little or no edits
  - Impact: The implementation PR may be mostly tests and documentation
  - Mitigation: That is acceptable because the goal is verified closure, not feature volume
- Risk/trade-off: A failing test may reveal a larger auth flaw
  - Impact: Scope could grow unexpectedly
  - Mitigation: Pause and update proposal/design/specs/tasks before taking on larger repairs

## Rollback / Mitigation

- Rollback trigger: Newly added verification changes cause auth UI regressions, flaky tests, or CI instability
- Rollback steps:
  - Revert the verification PR from the working branch or follow-up PR
  - Remove only the newly added tests or local auth fixes introduced by this change
  - Keep existing baseline auth implementation intact unless the regression came from it
- Data migration considerations:
  - None expected; this verification-focused change should not alter persisted data
- Verification after rollback:
  - Re-run the prior auth unit tests
  - Confirm login and existing auth pages still build and render

## Operational Blocking Policy

- If CI checks fail:
  - Diagnose the failing test or build step immediately
  - Fix the local issue or narrow flaky coverage before pushing again
  - Do not merge while required checks are red
- If security checks fail:
  - Investigate whether the change introduced new risk
  - Remediate or revert the risky delta before merge
  - Do not waive critical or high findings introduced by the change
- If required reviews are blocked/stale:
  - Address comments, refresh the PR with a new push, and re-request review as needed
  - Keep the PR open and monitored until review state is clear
- Escalation path and timeout:
  - If the change reveals a broader auth defect or remains blocked after one focused repair cycle, stop and update OpenSpec artifacts before continuing implementation

## Open Questions

- None for design approval. The change is intentionally narrow and implementation-ready.

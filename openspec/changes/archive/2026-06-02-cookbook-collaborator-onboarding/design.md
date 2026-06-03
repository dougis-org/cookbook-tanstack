## Context

- Relevant architecture: The cookbook detail page is rendered by `CookbookDetailPage` in `src/routes/cookbooks.$cookbookId.tsx`, which queries cookbook details from tRPC backend (`cookbooks.byId`). The schema definitions reside in `src/db/models/`.
- Dependencies: Mongoose/MongoDB, tRPC Server procedures, React 19, `@tanstack/react-query`.
- Interfaces/contracts touched:
  - `ICollaborator` schema interface in `src/db/models/collaborator.ts`
  - `cookbooks.byId` output type definition
  - Addition of `cookbooks.onboardCollaborator` tRPC mutation.

## Goals / Non-Goals

### Goals

- Introduce persistent first-time onboarding tracking for shared cookbook collaborators.
- Present a beautiful, premium, accessible welcome modal that matches the user's explicit role (Viewer vs Editor).
- Prevent returning users from seeing the onboarding again on any device.

### Non-Goals

- Creating a general multi-step tour framework.
- Modifying email delivery or notification templates.

## Decisions

### Decision 1: Database-tracked onboarding state

- Chosen: Add a boolean field `onboarded: { type: Boolean, default: false }` to the Mongoose `Collaborator` schema and typescript `ICollaborator` interface.
- Alternatives considered: LocalStorage, SessionStorage.
- Rationale: DB-backed state provides robust multi-device consistency. Users will not be repeatedly prompted if they switch between mobile and desktop, or clear browser data.
- Trade-offs: Requires a minor database write operations layer.

### Decision 2: Single-Acknowledge Welcome Dialog

- Chosen: Render a high-impact focused welcome dialog containing role cards and details about what the collaborator can do. The only action is a primary confirmation button that updates the backend.
- Alternatives considered: Multi-step carousel, close-on-click dismiss without acknowledgement.
- Rationale: Ensuring clear positive acknowledgment aligns with the goal of guiding collaborators to understand collaboration rules (e.g. knowing edits are live and shared) before they interact.
- Trade-offs: Blocks standard page interaction until acknowledged (which is desired for safety).

## Proposal to Design Mapping

- Proposal element: Add `onboarded` state tracking
  - Design decision: Decision 1 (Database field addition)
  - Validation approach: Mongoose schema unit test in `collaborator.test.ts`
- Proposal element: Welcome Onboarding Modal
  - Design decision: Decision 2 (React modal component)
  - Validation approach: React Testing Library tests in `CookbookDetail.test.tsx`

## Functional Requirements Mapping

- Requirement: Show welcome message and custom instructions based on role
  - Design element: `OnboardingModal` renders different copy for `'editor'` vs `'viewer'` role
  - Acceptance criteria reference: Specs #1
  - Testability notes: Test with mock roles and assert editor-specific/viewer-specific lists are visible.
- Requirement: Persist acknowledgment securely
  - Design element: `cookbooks.onboardCollaborator` tRPC mutation triggered on button click
  - Acceptance criteria reference: Specs #2
  - Testability notes: Execute integration tests verifying mutation updates `onboarded` to `true` in DB.

## Non-Functional Requirements Mapping

- Requirement category: Accessibility
  - Requirement: Keyboard navigation and screen reader support for the modal
  - Design element: Wrapping within existing `DialogOverlay` component
  - Acceptance criteria reference: Specs #3
  - Testability notes: Verify focus is captured and Esc key closes if desired.
- Requirement category: Reliability
  - Requirement: Resilient to network mutations and load state changes
  - Design element: Button loading indicator during mutation execution
  - Acceptance criteria reference: Specs #4
  - Testability notes: Mock network delay and verify loading states.

## Risks / Trade-offs

- Risk/trade-off: User is locked out if mutation fails due to connection loss.
  - Impact: Medium
  - Mitigation: Provide clear error boundaries, keep the CTA interactive on failure so they can retry, and add a refresh fallback.

## Rollback / Mitigation

- Rollback trigger: Core query performance issues or write lockouts on database.
- Rollback steps: Revert the git commit. The DB changes are fully backwards compatible since `onboarded` is non-breaking and default-valued.
- Data migration considerations: No migration required. Old collaborator documents lacking the `onboarded` field will resolve as `false` dynamically or using a fallback in aggregation: `onboarded: c.onboarded ?? false`.
- Verification after rollback: Verify that cookbooks can be fetched and edited without onboarding prompts appearing.

## Operational Blocking Policy

- If CI checks fail: PR cannot be merged under any circumstances. Bypassing PR gates is prohibited.
- If security checks fail: Snyk scanning alerts must be remediated or officially whitelisted by security team.
- If required reviews are blocked/stale: Re-request feedback and do not force-merge. All comments must be resolved.
- Escalation path and timeout: Contact team lead or dougis-org admins.

## Open Questions

- None.

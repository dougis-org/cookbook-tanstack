## GitHub Issues

- #459

## Why

- Problem statement: When a user receives their first collaborative cookbook invitation, they are often unfamiliar with the collaboration features, what their assigned role (Editor or Viewer) means in practice, and what impact their actions will have.
- Why now: Driving adoption of the newly released collaborative cookbooks feature (#420) requires a smooth, clear, and reassuring onboarding experience.
- Business/user impact: Enhances user orientation, reduces support overhead/confusion, prevents accidental edits, and reinforces a premium, polished feel for the platform.

## Problem Space

- Current behavior: When a user accesses a collaborative cookbook, they are presented with the standard cookbook interface. There is no welcome greeting, context regarding who invited them, or explanation of what they can or cannot do under their assigned role.
- Desired behavior:
  - Detect first-time access by a collaborator (who is not the owner) to a shared cookbook.
  - Display a beautiful, accessible welcome modal explaining their role (Viewer vs Editor), key features (notifications, real-time sync), and differences from standard cookbooks.
  - Provide a single primary action button to dismiss the onboarding, persisting this state in the database so it never shows again for this invitation on any device.
- Constraints:
  - Keep the welcome modal fully non-intrusive for returning collaborators (who have already acknowledged it).
  - Must correctly reflect dynamic role rules ('editor' | 'viewer').
  - Ensure compatibility with screen readers and keyboard accessibility.
- Assumptions:
  - The collaborator is already registered and logged in (route guards automatically redirect anonymous visitors).
  - A user who is the owner of the cookbook does not need onboarding.
- Edge cases considered:
  - **Re-invitation**: If a collaborator is removed and subsequently re-invited, the new `Collaborator` record will start with `onboarded: false` and onboarding will show again, which is correct behavior for a new invite.
  - **Offline/Network Failures**: If the acknowledgement mutation fails due to network issues, the modal should remain visible but allow retries, ensuring the state is correctly synced with the server.

## Scope

### In Scope

- **Database updates**: Add an `onboarded` boolean field to the `Collaborator` Mongoose schema, defaulting to `false`.
- **tRPC API updates**:
  - Expose the `onboarded` status in `fetchCollaboratorsWithUsers` and `cookbooks.byId` query.
  - Implement a new authenticated mutation `cookbooks.onboardCollaborator` to mark onboarding as completed for a specific cookbook and user.
- **Frontend changes**:
  - Implement a premium welcome onboarding modal within `src/routes/cookbooks.$cookbookId.tsx` using the custom `DialogOverlay` wrapper.
  - Render customized content based on the collaborator's role (Editor vs Viewer).
  - Auto-trigger the onboarding modal when a logged-in collaborator lands on the page with `onboarded: false`.
  - Wire the acknowledgment action to trigger the tRPC mutation and reactively invalidate the query cache to close the modal.
- **Tests**: Comprehensive unit tests for model default values, tRPC router mutation, and React components.

### Out of Scope

- A multi-step interactive wizard or walkthrough guide (a single focused premium dialog is much cleaner).
- Onboarding for the general application.
- Changes to email delivery or notification templates.

## What Changes

- `src/db/models/collaborator.ts` - schema modification to add `onboarded` field and typing.
- `src/server/trpc/routers/cookbooks.ts` - addition of `onboardCollaborator` mutation and update to retrieval stages.
- `src/routes/cookbooks.$cookbookId.tsx` - onboarding component creation, display trigger, and mutation hook integration.
- `src/db/models/__tests__/collaborator.test.ts` - test case to verify Mongoose default value.
- `src/server/trpc/routers/__tests__/cookbooks.test.ts` - integration test for mutation authorization and state updates.
- `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` - component unit tests for onboarding layout.

## Risks

- Risk: Onboarding modal gets stuck or cannot be dismissed due to network mutation failure, locking the user out of the cookbook.
  - Impact: High
  - Mitigation: Clear user-friendly error boundaries, active loading feedback on the button, and fallback reload behaviors.

## Open Questions

- Question: No outstanding unresolved questions remain. The requirements are clear, and the chosen implementation path matches all codebase conventions.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Creating a general multi-step tour framework.
- Modifying email copy or templates for cookbook invitations.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

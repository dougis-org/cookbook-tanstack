## Context

- Relevant architecture: `README.md` at project root.
- Dependencies: None (pure documentation update).
- Interfaces/contracts touched: Public project description.

## Goals / Non-Goals

### Goals

- Align `README.md` with the current state of the codebase.
- Highlight tRPC, MongoDB/Mongoose, and Better Auth.

### Non-Goals

- Documentation refactoring outside of `README.md`.
- Functional code changes.
- Automated testing (explicitly excluded).

## Decisions

### Decision 1: Update "Project Status" Section

- Chosen: Rewrite the section to remove "not yet implemented" claims for API, DB, and Auth. Focus on describing them as core, integrated features.
- Alternatives considered: Keeping the section but adding "partial" or "WIP" notes.
- Rationale: The features are substantially implemented and their presence in the codebase is a selling point for contributors.
- Trade-offs: May require future updates if these systems are replaced, but this is true of any documentation.

### Decision 2: Update "Tech Stack" Section

- Chosen: Add tRPC, MongoDB & Mongoose, and Better Auth to the tech stack list.
- Alternatives considered: Leaving it as is.
- Rationale: These are foundational technologies for the project that were missing from the high-level overview.
- Trade-offs: Increases the length of the section slightly.

## Proposal to Design Mapping

- Proposal element: Updating the "Project Status" section.
  - Design decision: Decision 1.
  - Validation approach: Manual verification that rewritten text matches codebase reality.
- Proposal element: Updating the "Tech Stack" section.
  - Design decision: Decision 2.
  - Validation approach: Manual verification that added tech exists in `package.json` and `src/`.

## Functional Requirements Mapping

- Requirement: Accurate project status.
  - Design element: Decision 1.
  - Acceptance criteria reference: README reflects tRPC, Mongo, and Auth as implemented.
  - Testability notes: Manual review.

## Non-Functional Requirements Mapping

- Requirement category: Operability
  - Requirement: Clear onboarding for new developers.
  - Design element: Updated tech stack and status.
  - Acceptance criteria reference: `README.md` clearly lists all core technologies.
  - Testability notes: Manual review.

## Risks / Trade-offs

- Risk/trade-off: Over-promising "completeness" if features are still in early stages.
  - Impact: Confusion if a contributor finds a missing edge case in a "completed" feature.
  - Mitigation: Use language like "Integrated" and "Core features" rather than "Finished" or "Complete".

## Rollback / Mitigation

- Rollback trigger: Typo or factual inaccuracy found post-merge.
- Rollback steps: Revert the commit to `README.md`.
- Data migration considerations: N/A.
- Verification after rollback: Check `README.md` content.

## Operational Blocking Policy

- If CI checks fail: N/A (no code changes).
- If security checks fail: N/A.
- If required reviews are blocked/stale: Ping the requester/owner.
- Escalation path and timeout: Resolve manually within 24h.

## Open Questions

- None.

## GitHub Issues

- #315

## Why

- **Problem statement**: The current `README.md` contains an outdated "Project Status" section that incorrectly states backend API endpoints, database integration, and authentication are not yet implemented.
- **Why now**: To avoid confusing new contributors and accurately reflect the project's current maturity and capabilities.
- **Business/user impact**: Improved developer experience and professional project presentation.

## Problem Space

- **Current behavior**: `README.md` claims the app is only a layout/structure implementation with placeholder data.
- **Desired behavior**: `README.md` highlights the integrated tRPC API, MongoDB/Mongoose database layer, and Better Auth implementation.
- **Constraints**: Documentation-only change; no functional code changes.
- **Assumptions**: The identified implementations (tRPC, Mongoose, Better Auth) are functional and ready for public acknowledgment.
- **Edge cases considered**: N/A for documentation update.

## Scope

### In Scope

- Updating the "Project Status" section of `README.md`.
- Updating the "Tech Stack" section of `README.md`.
- Verifying the implementation status of core features (Database, API, Auth).

### Out of Scope

- Updating other documentation files (e.g., `CONTRIBUTING.md`).
- Functional code changes or feature implementations.
- Adding TDD/test artifacts (specifically excluded by user directive).

## What Changes

- **README.md**:
    - "Project Status" will be rewritten to highlight functional backend, database, and auth layers.
    - "Tech Stack" will be expanded to include tRPC, MongoDB/Mongoose, and Better Auth.

## Risks

- **Risk**: Inaccurate portrayal of "Substantially complete" features.
  - **Impact**: Misleading contributors about the robustness of specific modules.
  - **Mitigation**: Use precise language regarding the current state (e.g., "Integrated" vs "Complete").

## Open Questions

- None. The current implementation status has been empirically verified via codebase inspection.

## Non-Goals

- Implementing "Image upload functionality" or "Full CRUD operations" if they are truly missing (though basic CRUD appears present).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

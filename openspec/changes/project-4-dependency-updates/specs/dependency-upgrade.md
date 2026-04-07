## ADDED Requirements

This document details *changes* to requirements and is additive to the
existing dependency-upgrade capability specification.

### Requirement: ADDED Project-driven dependency upgrade sequencing

The system SHALL execute the remaining dependency-upgrade work for
GitHub Project 4 in the project board's stated risk order unless the
change artifacts are updated first to record an intentional re-ordering.

#### Scenario: Remaining project items are executed in board order

- **Given** GitHub Project 4 contains remaining `Todo` items for dependency upgrades
- **When** execution begins for the next iteration
- **Then** the selected issue is the next in-scope `Todo` item in project order

#### Scenario: Sequence changes are explicitly documented

- **Given** new information makes the existing project order unsafe or impractical
- **When** the team decides to re-order the remaining work
- **Then** `proposal.md`, `design.md`, and `tasks.md` are updated before implementation continues

### Requirement: ADDED Iteration completion includes GitHub issue and project hygiene

Each dependency-upgrade iteration SHALL be considered complete only
after repository validation passes, the related pull request merges, the
GitHub issue is closed, and the associated Project 4 item status is set
to `Done`.

#### Scenario: Completed slice updates all tracking systems

- **Given** an iteration's code changes have merged successfully
- **When** the iteration is closed out
- **Then** the related GitHub issue is closed
- **Then** the related Project 4 item has status `Done`
- **Then** the OpenSpec task for that iteration can be marked complete

### Requirement: ADDED Project completion requires every remaining item to be complete

The Project 4 dependency-upgrade change SHALL NOT be considered complete
until every in-scope remaining board item is closed and marked `Done`.

#### Scenario: Final project audit passes

- **Given** all seven planned iterations have been executed
- **When** final closeout is performed
- **Then** issues #258, #256, #253, #267, #252, #255, and #254 are all closed
- **Then** each corresponding Project 4 item is marked `Done`
- **Then** the change is eligible for archive

---

## MODIFIED Requirements

### Requirement: MODIFIED Dependency-upgrade validation gates apply per iteration

After any dependency-upgrade iteration, the full validation suite SHALL
pass before the linked issue can be closed or the Project 4 item can be
marked `Done`.

#### Scenario: Per-iteration validation passes before closeout

- **WHEN** a Project 4 dependency iteration is ready for merge or post-merge closeout
- **THEN** `npm run test` passes
- **THEN** `npm run test:e2e` passes
- **THEN** `npx tsc --noEmit` passes
- **THEN** `npm run build` passes
- **THEN** the issue remains open and the project item remains not-done if any gate fails

---

## Traceability

- Proposal: "Use GitHub Project 4 as the governing work queue" →
  Requirement: ADDED Project-driven dependency upgrade sequencing
- Proposal: "Work should be iterative" → Requirement: ADDED
  Project-driven dependency upgrade sequencing, MODIFIED
  Dependency-upgrade validation gates apply per iteration
- Proposal: "When complete all items should be closed and complete" →
  Requirement: ADDED Iteration completion includes GitHub issue and
  project hygiene, ADDED Project completion requires every remaining
  item to be complete
- Design Decision 2 (project status is part of done) → Requirement:
  ADDED Iteration completion includes GitHub issue and project hygiene
- Design Decision 3 (preserve risk order) → Requirement: ADDED Project-driven dependency upgrade sequencing

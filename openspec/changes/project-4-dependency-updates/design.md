## Context

- **Relevant architecture:** Dependency maintenance is already governed
  by `openspec/specs/dependency-upgrade/spec.md`, with additional
  capability-specific specs such as `tailwind-dependency/spec.md` where
  needed. The repository standards require TDD where application-code
  changes are necessary and full validation (`npm run test`,
  `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`) before merge.
- **Dependencies:** GitHub Project 4 is the governing queue. Its notes
  define both risk and sequencing guidance, including explicit
  prerequisites such as "Do after Vite is stable" for TypeScript and
  "Highest risk" for MongoDB/Mongoose. Issue #267 is additionally gated
  on the release of `better-auth` `1.6.1`.
- **Interfaces/contracts touched:** `package.json`, `package-lock.json`,
  test/tooling configuration, and application code only when a specific
  upgrade proves incompatible without source changes.

## Goals / Non-Goals

### Goals

- Execute the remaining Project 4 work as a controlled series of upgrade iterations
- Preserve the project board's risk-based order unless the change artifacts are updated first
- Define a strict done state that includes repository validation and GitHub project hygiene
- Keep dependency-upgrade scope traceable from issue to iteration to merged outcome

### Non-Goals

- Folding unrelated maintenance into the same change just because it also touches dependencies
- Merging partially validated upgrades
- Declaring the project complete while any item is still open or not marked `Done`

## Decisions

### Decision 1: One umbrella change, many small execution slices

- **Chosen:** Represent the remaining Project 4 work as one OpenSpec
  change with iteration-specific tasks under a single proposal.
- **Alternatives considered:** One OpenSpec change per issue; one
  combined implementation effort with no iteration boundaries
- **Rationale:** The project is already a coherent backlog, but the
  actual execution needs small slices. One umbrella change preserves
  board-level context while the task list preserves iteration discipline.
- **Trade-offs:** The change remains open longer. That is acceptable
  because the work is intentionally iterative and externally governed by
  the project board.

### Decision 2: Use GitHub Project status as part of the definition of done

- **Chosen:** An iteration is complete only when the merged work also
  results in the linked GitHub issue being closed and the project item
  being marked `Done`.
- **Alternatives considered:** Treat merge as sufficient; update the
  project board manually at the end
- **Rationale:** The user explicitly wants the project to drive the
  proposal and completion state. If the issue or board item lags behind,
  the operational state is inaccurate.
- **Trade-offs:** Slightly more operational overhead per slice, but it
  prevents silent drift between repo state and project state.

### Decision 3: Preserve the project's risk order by default

- **Chosen:** Execute the seven remaining items in the order already encoded on Project 4.
- **Alternatives considered:** Re-sort by convenience or contributor preference
- **Rationale:** The board description explicitly says updates are
  ordered by risk, patch/minor first and major last. That ordering is
  the control mechanism for reducing dependency risk.
- **Trade-offs:** A lower-effort item might wait behind another item at
  the same general risk level. The consistency is worth more than
  micro-optimizing sequence.

### Decision 4: Require an explicit scope update when dependency-only work becomes code-change work

- **Chosen:** If an upgrade requires `src/` or other application-code
  changes, update the change artifacts before merging that iteration.
- **Alternatives considered:** Let the change absorb the code changes informally
- **Rationale:** Existing dependency specs already say code changes must
  be documented when a dependency-only upgrade stops being
  dependency-only.
- **Trade-offs:** Slight process friction, but it keeps the true blast radius visible.

## Iteration Model

```text
Project 4 backlog
    |
    v
+-------------------------------+
| Select next Todo item         |
| in project risk order         |
+-------------------------------+
    |
    v
+-------------------------------+
| Upgrade + test locally        |
| expand scope docs if needed   |
+-------------------------------+
    |
    v
+-------------------------------+
| Open / update PR              |
| address review + CI feedback  |
+-------------------------------+
    |
    v
+-------------------------------+
| Merge                         |
| close GitHub issue            |
| set project item = Done       |
+-------------------------------+
    |
    v
+-------------------------------+
| Move to next Project 4 item   |
+-------------------------------+
```

## Proposal to Design Mapping

- Proposal element: Use Project 4 as the governing queue
  - Design decision: Decision 2 and Decision 3
  - Validation approach: Before each iteration, confirm the target issue
    is the next `Todo` item in project order
- Proposal element: Work iteratively
  - Design decision: Decision 1
  - Validation approach: One issue per iteration, with issue-specific validation and merge tracking
- Proposal element: All items closed and complete at the end
  - Design decision: Decision 2
  - Validation approach: Final project audit shows no remaining `Todo` items in scope

## Functional Requirements Mapping

- **Requirement:** Remaining Project 4 dependency items execute in board order
  - Design element: Ordered iteration list in `tasks.md`
  - Acceptance criteria reference: `specs/dependency-upgrade.md`
  - Testability notes: Operational verification against project board ordering

- **Requirement:** Every iteration records repo validation before completion
  - Design element: Per-iteration validation gate
  - Acceptance criteria reference: `specs/dependency-upgrade.md`
  - Testability notes: Validation commands captured in task completion evidence

- **Requirement:** Every merged iteration closes its issue and marks the
  project item `Done`
  - Design element: GitHub hygiene closeout steps in `tasks.md`
  - Acceptance criteria reference: `specs/dependency-upgrade.md`
  - Testability notes: Project board and issue states can be queried directly

## Non-Functional Requirements Mapping

- **Requirement category:** Traceability
  - Requirement: Each Project 4 slice stays linked to a concrete GitHub
    issue and completion state
  - Design element: Issue-numbered tasks and closeout checklist per iteration
  - Acceptance criteria reference: `specs/dependency-upgrade.md`
  - Testability notes: Board item state and issue state remain consistent with merged code

## Risks / Trade-offs

- Risk/trade-off: #267 depends on the external release of
  `better-auth` `1.6.1`
  - Impact: Could block full project closure even after other work lands
  - Mitigation: Treat `1.6.1` availability as a formal gate and do not
    start the slice on `1.6.0`

## Rollback / Mitigation

- **Rollback trigger:** An iteration introduces regressions or incompatible toolchain behavior
- **Rollback steps:** Revert the specific upgrade slice, restore
  previous lockfile/package versions, and return the GitHub issue /
  project item to active state if needed
- **Data migration considerations:** MongoDB/Mongoose upgrade (#254) may
  require extra rollback care if any migration work is introduced;
  document that explicitly before executing that slice
- **Verification after rollback:** Re-run build, unit/integration tests,
  E2E tests, and any slice-specific manual verification

## Operational Blocking Policy

- **If CI checks fail:** Do not close the issue or set the project item to `Done`
- **If security or dependency health checks fail:** Remediate or explicitly re-scope before merge
- **If review comments remain unresolved:** The slice stays in progress;
  do not advance to the next project item
- **If `better-auth` `1.6.1` is not yet released for #267:** Defer that
  slice and document the blocking condition before continuing with later
  work only if the board sequence is intentionally changed in the
  artifacts

## Open Questions

- For #267, no further ambiguity remains: the slice starts only after
  `better-auth` `1.6.1` is available

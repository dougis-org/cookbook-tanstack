## GitHub Project

- Project: `dougis-org` Project 4
- URL: <https://github.com/orgs/dougis-org/projects/4>

## GitHub Issues In Scope

- #258 `chore(deps): routine minor/patch dependency updates`
- #256 `chore(deps): upgrade lucide-react 0.x → 1.x (major)`
- #253 `chore(deps): upgrade Vitest 3 → 4 and testing toolchain (major)`
- #267 `chore(deps): upgrade better-auth to 1.6.x once stable`
- #252 `chore(deps): upgrade Vite 7 → 8 and @vitejs/plugin-react 5 → 6 (major)`
- #255 `chore(deps): upgrade TypeScript 5 → 6 (major)`
- #254 `chore(deps): upgrade MongoDB 6 → 7 and Mongoose 8 → 9 (major)`

## GitHub Issues Already Complete

- #251 `chore(deps): update Tailwind CSS v4 packages`
- #249 `chore(deps): update TanStack Router/Start ecosystem`
- #250 `chore(deps): update tRPC packages`
- #257 `chore(deps): update better-auth and TanStack DevTools`

## Why

- **Problem statement:** GitHub Project 4 tracks the remaining
  dependency maintenance backlog, but the work is currently only
  represented as board items and issues. There is no single execution
  proposal that defines sequencing, validation expectations, or the
  explicit completion rule for each iteration.
- **Why now:** The board is already prioritized by risk and partially
  completed. Converting the remaining work into one OpenSpec change gives
  the repo an implementation plan that can be executed slice-by-slice
  without losing project governance.
- **Business/user impact:** Finishing the project reduces dependency
  drift while controlling upgrade risk. It also creates a repeatable
  workflow for closing the board cleanly instead of treating package
  updates as ad hoc work.

## Problem Space

- **Current behavior:** Project 4 contains 11 dependency-update items.
  Four are already closed and marked `Done`; seven remain `Todo`. The
  remaining items vary materially in blast radius, from routine patch
  bumps to MongoDB/Mongoose major upgrades that touch the entire data
  layer.
- **Desired behavior:** The remaining project items are executed
  iteratively in the board's stated risk order, with each issue handled
  as its own slice under one umbrella change. Every slice has explicit
  validation gates, PR handling, and closeout requirements. The project
  is not considered complete until every in-scope issue is closed and
  every corresponding project item is marked `Done`.
- **Constraints:** Existing dependency specs already govern upgrade
  quality gates. Some items may require application-code changes, but
  only when the proposal/design/spec scope explicitly records why.
  High-risk upgrades must not leapfrog lower-risk prerequisites called
  out by the project notes.
- **Assumptions:** Project 4 remains the source of truth for remaining
  dependency-update scope. Issue titles/notes accurately describe the
  intended version movements and sequencing dependencies.

## Scope

### In Scope

- Create a single OpenSpec change governing the remaining Project 4 dependency work
- Execute work iteratively in risk order, one project item at a time
- Require full local validation for every iteration before PR updates
- Require issue closure and project-item completion as part of each slice's definition of done
- Close out the project only when all seven remaining items are complete

### Out of Scope

- Re-opening or redoing the four already completed Project 4 issues
- Unplanned dependency upgrades not represented on Project 4
- Large architectural refactors unrelated to enabling a documented dependency upgrade
- Changing project prioritization unless new evidence forces a re-order and the proposal/design are updated first

## What Changes

- Add a project-backed OpenSpec change for dependency maintenance, using Project 4 as the governing work queue
- Define the execution order as:
  1. #258 routine minor/patch dependency updates
  2. #256 lucide-react 0.x → 1.x
  3. #253 Vitest 3 → 4 and testing toolchain
  4. #267 better-auth 1.6.x once stable
  5. #252 Vite 7 → 8 and `@vitejs/plugin-react` 5 → 6
  6. #255 TypeScript 5 → 6
  7. #254 MongoDB 6 → 7 and Mongoose 8 → 9
- Define per-iteration completion criteria: local validation passes, PR
  is merged, GitHub issue is closed, and the GitHub Project status is
  updated to `Done`
- Define final completion criteria: all remaining project items are
  closed and marked complete, then the OpenSpec change is archived

## Risks

- Risk: A later high-risk upgrade reveals hidden prerequisites that force re-ordering
  - Impact: Schedule churn and extra validation work
  - Mitigation: Reconfirm issue notes before each iteration and update
    proposal/design/tasks before changing sequence
- Risk: A dependency-only issue actually requires `src/` changes
  - Impact: Scope drift and hidden product risk
  - Mitigation: Record the required code changes explicitly in the change artifacts before merging that iteration
- Risk: `better-auth` issue #267 may remain blocked until `1.6.1`
  ships
  - Impact: Project completion stalls on an external dependency
  - Mitigation: Treat `better-auth` `1.6.1` availability as the gating
    condition and do not start the slice on `1.6.0`

## Open Questions

- #267 is intentionally blocked until `better-auth` `1.6.1` is
  released, giving the `1.6.x` line time to settle after `1.6.0`

## Non-Goals

- Compressing all seven remaining board items into a single unreviewable PR
- Bypassing project hygiene by leaving merged issues open or project items in `Todo`
- Treating the project board and the OpenSpec change as separate plans

## Change Control

If Project 4 scope, ordering, or completion rules change during
execution, update `proposal.md`, `design.md`, `specs/**/*.md`, and
`tasks.md` before continuing with the next iteration.

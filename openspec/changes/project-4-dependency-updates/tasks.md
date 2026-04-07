# Tasks

## Preparation

- [ ] Confirm GitHub Project 4 (`https://github.com/orgs/dougis-org/projects/4`)
  is still the governing queue and capture the current item states before
  starting work
- [ ] Create and publish a working branch for the first iteration
- [ ] Reconfirm the next in-scope `Todo` item before each new iteration;
  do not skip ahead without updating the change artifacts first

## Iteration 1 — Issue #258 routine minor/patch dependency updates

- [ ] Review issue #258 scope and confirm it is still the next `Todo` item
- [ ] Perform the package updates and write tests first if application-code changes become necessary
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 1 and address all review / CI feedback before merge
- [ ] After merge, close issue #258 and set the Project 4 item status to `Done`

## Iteration 2 — Issue #256 lucide-react 0.x → 1.x

- [ ] Review issue #256 scope and confirm it is the next `Todo` item
- [ ] Update `lucide-react` and repair imports or application code only if required, documenting any scope expansion first
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 2 and address all review / CI feedback before merge
- [ ] After merge, close issue #256 and set the Project 4 item status to `Done`

## Iteration 3 — Issue #253 Vitest 3 → 4 and testing toolchain

- [ ] Review issue #253 scope and confirm it is the next `Todo` item
- [ ] Update Vitest, jsdom, Playwright patch versions, and any related test tooling required by the upgrade
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 3 and address all review / CI feedback before merge
- [ ] After merge, close issue #253 and set the Project 4 item status to `Done`

## Iteration 4 — Issue #267 better-auth 1.6.x once stable

- [ ] Review issue #267 scope and confirm it is the next `Todo` item
- [ ] Verify `better-auth` `1.6.1` has been released; do not start this
  slice on `1.6.0`
- [ ] Perform the upgrade and run auth-focused manual verification in addition to the standard automated validation
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 4 and address all review / CI feedback before merge
- [ ] After merge, close issue #267 and set the Project 4 item status to `Done`

## Iteration 5 — Issue #252 Vite 7 → 8 and `@vitejs/plugin-react` 5 → 6

- [ ] Review issue #252 scope and confirm it is the next `Todo` item
- [ ] Review the Vite migration guidance and preserve the required plugin order in `vite.config.ts`
- [ ] Perform the upgrade, documenting any required source/config changes before merge
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 5 and address all review / CI feedback before merge
- [ ] After merge, close issue #252 and set the Project 4 item status to `Done`

## Iteration 6 — Issue #255 TypeScript 5 → 6

- [ ] Review issue #255 scope and confirm it is the next `Todo` item
- [ ] Confirm the Vite slice is stable before starting this iteration
- [ ] Perform the TypeScript and `@types/node` upgrades, documenting any required source/config changes before merge
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 6 and address all review / CI feedback before merge
- [ ] After merge, close issue #255 and set the Project 4 item status to `Done`

## Iteration 7 — Issue #254 MongoDB 6 → 7 and Mongoose 8 → 9

- [ ] Review issue #254 scope and confirm it is the next `Todo` item
- [ ] Identify any data-layer or migration risk before making the version change; document scope expansion first if needed
- [ ] Perform the upgrade and execute any required database-specific verification in addition to the standard validation
- [ ] Run validation: `npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run build`
- [ ] Open or update the PR for iteration 7 and address all review / CI feedback before merge
- [ ] After merge, close issue #254 and set the Project 4 item status to `Done`

## Final Project Closeout

- [ ] Audit Project 4 and confirm all in-scope items (#258, #256, #253,
  #267, #252, #255, #254) are closed and have project status `Done`
- [ ] Sync approved dependency-upgrade spec deltas into `openspec/specs/`
- [ ] Mark all remaining OpenSpec tasks complete
- [ ] Archive `openspec/changes/project-4-dependency-updates/` once the project is fully complete

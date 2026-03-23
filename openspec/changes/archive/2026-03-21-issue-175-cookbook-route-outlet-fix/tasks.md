## Tasks

- [x] Add outlet support in Cookbook parent route
   - Modify `src/routes/cookbooks.tsx` to render the recipe list plus `<Outlet />`.
   - Ensure existing `CreateCookbookForm` behavior is preserved.

- [x] Add outlet support in Categories parent route
   - Modify `src/routes/categories.tsx` similarly to render `<Outlet />` for category detail child route.

- [x] Verify cookbooks and categories nested route tree
   - Confirm `routeTree.gen.ts` includes the expected parent/child relationships and no invalid path semantics exist.

- [x] Add or update E2E tests
   - Add coverage to `src/e2e/recipes-list.spec.ts` or a dedicated new spec file:
     - redirect to cookbook detail on card click
     - open cookbook TOC from detail
     - navigation back to list
   - Add coverage for categories page:
     - click category card and detail displays

- [x] Add or extend lint rule
   - Implement a new lint rule (ESLint + custom rule) to verify that any `createFileRoute` route with nested children includes `<Outlet />` in the parent route component.
   - Add a test for the lint rule with sample violations and valid examples.

- [x] Add a small code comment or note in FOLDER standards for nested route outlets
   - Document: "If you add a child route under `/x`, confirm parent route renders `<Outlet />` or uses route-specific layout."

- [x] Run validators
   - `npm run test` / `npx vitest run` for unit tests and route behavior
   - `npm run test:e2e` for browser route tests
   - `npx tsc --noEmit`

- [x] Branch and PR workflow
   - Start from main: `git checkout main && git pull`.
   - Create feature branch with standard convention (e.g., `issue-175/cookbook-route-outlet`).
   - Commit changes with semantic messages (e.g., `fix(cookbooks): add route outlet layout`).
   - Push branch and open pull request into `main`.
   - Add reference to issue #175 and include testing steps in PR description.
   - Monitor CI checks and resolve any failing tests or lint errors.
   - Address PR review comments (if any).
   - Merge when all checks pass and reviews are approved.
   - Confirm post-merge by re-running relevant smoke tests if needed.

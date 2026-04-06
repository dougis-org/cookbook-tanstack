## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b upgrade-tanstack-ecosystem`
- [x] 1.3 Push branch to remote immediately: `git push -u origin upgrade-tanstack-ecosystem`

## 2. Execution

- [x] 2.1 Install updated packages: `npm install @tanstack/react-router@latest @tanstack/react-start@latest @tanstack/router-plugin@latest @tanstack/react-router-devtools@latest @tanstack/react-router-ssr-query@latest @tanstack/react-query@latest`
- [x] 2.2 Verify installed versions meet targets (`npm ls @tanstack/react-router @tanstack/react-start @tanstack/router-plugin @tanstack/react-router-devtools @tanstack/react-router-ssr-query @tanstack/react-query`)
- [x] 2.3 Confirm `package.json` version specifiers were updated by npm to reflect new baseline

## 3. Validation

- [x] 3.1 Run build: `npm run build` — must exit 0 with no type errors
- [x] 3.2 Run unit/integration tests: `npm run test` — must pass with no new failures
- [x] 3.3 Run E2E tests: `npm run test:e2e` — must pass with no new failures
- [x] 3.4 Smoke-test unsaved-changes guard: open recipe edit form, make a change, attempt to navigate away — blocker dialog must appear

## 4. PR and Merge

- [x] 4.1 Commit changes: `package.json` and `package-lock.json` (reference issue #249)
- [x] 4.2 Push to remote: `git push`
- [x] 4.3 Open PR targeting `main` with auto-merge enabled (all CI checks must be green first)
- [x] 4.4 Monitor CI: if any check fails, diagnose, fix, commit, push, and repeat until clean
- [x] 4.5 Address any review comments, commit fixes, push — repeat until no blocking comments remain
- [x] 4.6 Enable auto-merge once all checks are green and no blocking comments remain

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 5.2 Verify merged changes appear on `main`
- [x] 5.3 Sync approved spec deltas to `openspec/specs/` (no spec changes in this upgrade — confirm no action needed)
- [ ] 5.4 Archive this change as a single atomic commit (copy to `openspec/changes/archive/` and delete original in one commit)
- [ ] 5.5 Push archive commit to `main`
- [ ] 5.6 Prune merged local branch: `git branch -d upgrade-tanstack-ecosystem`

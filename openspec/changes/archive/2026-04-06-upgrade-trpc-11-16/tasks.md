## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch and push to remote: `git checkout -b upgrade-trpc-11-16 && git push -u origin upgrade-trpc-11-16`

## 2. Execution

- [x] 2.1 Install updated packages: `npm install @trpc/client@latest @trpc/server@latest @trpc/tanstack-react-query@latest`
- [x] 2.2 Verify resolved versions: `npm ls @trpc/client @trpc/server @trpc/tanstack-react-query` — all three should show ≥ 11.16.0

## 3. Validation

- [x] 3.1 Run build: `npm run build` — must exit 0 with no TypeScript errors
- [x] 3.2 Run unit and integration tests: `npm run test` — all tests must pass
- [x] 3.3 Run E2E tests: `npm run test:e2e` — all tests must pass

## 4. PR and Merge

- [x] 4.1 Commit changes: `package.json` and `package-lock.json` only
- [x] 4.2 Push branch and open PR targeting `main`, referencing issue #250, with auto-merge enabled
- [x] 4.3 Monitor CI — if any check fails: diagnose, fix, commit, push, repeat until all checks are green
- [x] 4.4 Address any review comments, push fixes, and repeat until no blocking comments remain

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 5.2 Verify merged `package.json` shows `^11.16.0` for all three tRPC packages
- [x] 5.3 Sync approved spec delta: copy `openspec/changes/upgrade-trpc-11-16/specs/dependency-upgrade/spec.md` additions into `openspec/specs/dependency-upgrade/spec.md`
- [ ] 5.4 Archive the change: run `openspec archive upgrade-trpc-11-16` (single atomic commit — copy to archive + delete original)
- [ ] 5.5 Push the archive commit to `main`
- [ ] 5.6 Prune merged local branch: `git branch -d upgrade-trpc-11-16`

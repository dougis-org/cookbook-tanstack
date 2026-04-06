## Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch and push to remote immediately:
  ```
  git checkout -b chore/upgrade-tailwind-css-4-2
  git push -u origin chore/upgrade-tailwind-css-4-2
  ```

## Execution

- [x] 2.1 Run the package update: `npm install tailwindcss@latest @tailwindcss/vite@latest`
- [x] 2.2 Confirm resolved versions in `package-lock.json`: grep for `"tailwindcss"` and `"@tailwindcss/vite"` and verify both show `4.2.2`
- [x] 2.3 Confirm no `src/` files were modified: `git diff --name-only` should show only `package.json` and/or `package-lock.json`

## Validation

- [x] 3.1 Run unit and integration tests: `npm run test` — all tests must pass
- [x] 3.2 Run E2E tests: `npm run test:e2e` — all Playwright tests must pass
- [x] 3.3 Start dev server and visually confirm dark mode renders: `npm run dev`, load app with `.dark` on `<html>`, spot-check a few pages

## PR and Merge

- [x] 4.1 Commit changes: `git add package.json package-lock.json && git commit -m "chore(deps): update tailwindcss and @tailwindcss/vite to 4.2.2 (closes #251)"`
- [x] 4.2 Push branch: `git push`
- [x] 4.3 Open PR targeting `main`, referencing issue #251, and enable auto-merge
- [x] 4.4 Monitor CI — if checks fail: diagnose, fix, commit, push, repeat until all green
- [x] 4.5 Address any review comments: commit fixes, push, repeat until no unresolved comments

**Blocking criteria:** If CI remains red and cannot be resolved, revert `package.json` and `package-lock.json` (`git restore package.json package-lock.json && npm ci`) and open a follow-up issue before closing this one.

## Post-Merge

- [x] 5.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 5.2 Verify merged changes appear: confirm `package-lock.json` on `main` shows `tailwindcss@4.2.2`
- [x] 5.3 Sync approved spec deltas to `openspec/specs/`: copy `openspec/changes/upgrade-tailwind-css-4-2/specs/tailwind-dependency/spec.md` to `openspec/specs/tailwind-dependency/spec.md`
- [x] 5.4 Archive the change — single atomic commit (copy to `archive/` AND delete original in one commit):
  ```
  openspec archive upgrade-tailwind-css-4-2
  ```
- [x] 5.5 Push archive commit to `main`
- [x] 5.6 Prune merged local branch: `git branch -d chore/upgrade-tailwind-css-4-2`

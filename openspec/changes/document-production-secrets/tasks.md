## 1. Gate: confirm blocking dependencies are resolved

- [ ] 1.1 Confirm #632 (domain migration to `www.mycookbooks.us`) is merged to `main`; capture the final `APP_PRIMARY_URL` / `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` values it landed with
- [ ] 1.2 Confirm #635 (`VITE_STRIPE_PUBLISHABLE_KEY` build-arg gap) is resolved; capture whether it ended up as a GitHub Actions Variable passed via `--build-arg` (matching the AdSense/GA pattern) or some other fix
- [ ] 1.3 If either #632 or #635 is still open, stop here and do not proceed to section 2 — re-run this gate before continuing

## 2. Audit and verify the var inventory

- [ ] 2.1 Re-grep `.env.example`, `fly.toml`, `.github/workflows/deploy.yml`, and `.github/workflows/build-and-test.yml` for any var added/removed since this change was proposed
- [ ] 2.2 Reconcile the confirmed list against the inventory in `specs/docs-update/spec.md`'s first requirement scenario; update the spec if the live var list has drifted
- [ ] 2.3 (Best-effort, non-blocking per proposal open question) Cross-check the inventory against `fly secrets list` output and the GitHub repo's Settings → Secrets and variables page if accessible, to catch anything with no repo-file trace

## 3. Write the ci-cd.md section

- [ ] 3.1 Insert `## Production Secrets & Environment Variables` into `docs/standards/ci-cd.md` after "What CI/CD Checks" and before "Deployment & Release"
- [ ] 3.2 Write the storage-location category definitions (Fly secret, Fly `[env]`, GitHub Actions secret, GitHub Actions Variable) at the top of the section
- [ ] 3.3 Write the table with one row per var from the confirmed inventory (section 2), filling in where-set / depends-on / changes-when using the confirmed #632/#635 values
- [ ] 3.4 Write the `### What Breaks If Wrong` subsection covering the vars listed in `specs/docs-update/spec.md`'s second requirement, including the introductory sentence explaining why coverage is selective
- [ ] 3.5 Add the explicit callout that `mycookbooks.app` (`src/emails/Layout.tsx`) and `mycookbooks.com` (`src/routes/privacy-policy.tsx`) are hardcoded and not driven by `APP_PRIMARY_URL`
- [ ] 3.6 Proofread the full section for any accidental inclusion of real secret values — none should appear, only names/locations/behavior

## 4. Fix the stale .env.example comment

- [ ] 4.1 Update the `# Production: APP_PRIMARY_URL=...` comment in `.env.example` to the confirmed post-#632 canonical domain
- [ ] 4.2 Confirm the value matches exactly what section 3's table states for `APP_PRIMARY_URL`, so the two files don't disagree

## 5. Validate and ship through normal gates

- [ ] 5.1 Run any configured markdown lint/fix tooling on the edited files (per project convention: `fix_markdown` then `lint_markdown` if available)
- [ ] 5.2 Open a PR through the normal flow — full CI/CD gates apply (build, tests, TypeScript check, security scans, Codacy) even though the diff is docs-only, per explicit instruction to treat this like any other code change
- [ ] 5.3 Enable auto-merge on the PR per `docs/standards/ci-cd.md`'s existing auto-merge workflow
- [ ] 5.4 Link the PR to #633 so it closes automatically on merge

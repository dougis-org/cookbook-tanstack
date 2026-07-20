---
name: tests
description: Tests for the fix-adsense-buildarg-plumbing change
---

# Tests

## Overview

This document outlines the tests for the `fix-adsense-buildarg-plumbing` change. All work should follow a strict TDD (Test-Driven Development) process. Because this change is infrastructure/config (`Dockerfile`, `.github/workflows/deploy.yml`) rather than application code, most "tests" are verification commands run against the artifacts themselves (Docker build output, workflow YAML structure) rather than Vitest unit tests — each is still written and run *before* the corresponding implementation edit, confirmed to fail (or be inapplicable) first, then confirmed to pass after.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test (a `docker build` invocation with an assertion on output, a YAML-structure grep/assertion, or a Vitest case) that captures the requirement. Run it and confirm it fails against the current (unfixed) `Dockerfile`/`deploy.yml`.
2.  **Write code to pass the test:** Make the minimal `Dockerfile`/`deploy.yml` edit to make the test pass.
3.  **Refactor:** Clean up formatting/ordering of the new `ARG`/`ENV`/`--build-arg` lines while keeping the test green.

## Test Cases

### Task 1–2: Dockerfile ARG/ENV declarations

- [ ] Test case: `docker build --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 -t adsense-test .` then `docker create adsense-test` + extract `.output/` and `grep -r "1234567890" .output/client/` finds the literal slot ID inlined in a compiled JS asset. **Fails today** (no `ARG` declared, value never reaches the build) — confirms Spec scenario "Build args are visible to the Vite build".
- [ ] Test case: Repeat for `VITE_ADSENSE_ENABLED=true`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID` (use a valid-shaped GA ID, e.g. `G-TESTID1234`) — same grep-for-literal-value assertion for each.

### Task 3–4: Graceful degradation

- [ ] Test case: `docker build -t adsense-baseline .` with **no** `--build-arg` flags succeeds with exit code 0. Confirms Spec scenario "Missing build args degrade gracefully" — must pass both before and after the Dockerfile edit (no regression introduced).
- [ ] Test case: Extract `.output/` from the no-args build and confirm it contains no literal AdSense slot ID or GA measurement ID strings (confirms the app still degrades to `SponsorSlot`/no-GA, not a broken bundle).

### Task 5: Prod-only loud validation step

- [ ] Test case: With `vars.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` (or any one of the 5) deliberately unset, trigger `deploy.yml` via `workflow_dispatch` in a disposable/dry-run context (or simulate the validation step's shell logic locally with the variable unset in the environment) — the step must exit non-zero with a message naming the missing variable, **before** the `flyctl deploy` step is reached. Confirms Spec scenario "Deploy fails loudly when a required variable is missing".
- [ ] Test case: With all 5 variables set (non-empty), the same validation step exits zero and the job proceeds. Confirms Spec scenario "Deploy proceeds when all required variables are present".
- [ ] Test case: `grep -L "VITE_ADSENSE_ENABLED\|VITE_GOOGLE_ADSENSE\|VITE_GOOGLE_ANALYTICS_ID" .github/workflows/*.yml | grep -v deploy.yml` — confirms no other workflow file references these variables or the validation logic. Confirms Spec scenario "Validation does not run on non-production workflows".

### Task 7: Deploy step build-arg forwarding

- [ ] Test case: Static assertion — parse `.github/workflows/deploy.yml` and confirm the `flyctl deploy` step's `run:` value contains `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent for the other 4 variables. Confirms Spec scenario "Deploy step includes build args sourced from repo variables".
- [ ] Test case: Static assertion — confirm none of the 5 `--build-arg` flags reference `secrets.` in their value expression. Confirms Spec scenario "Values are not sourced from GitHub Secrets".

### Task 8: Documentation

- [ ] Test case: `grep -A2 "VITE_ADSENSE_ENABLED" .env.example` shows a comment referencing "GitHub Actions repository Variable" (or equivalent wording) rather than only "Fly secret"/"production only" with no plumbing caveat.

### Existing regression coverage (no new code, confirm no breakage)

- [ ] Test case: `npm run test` — full suite passes, including `src/lib/__tests__/google-adsense.test.ts`, `src/lib/__tests__/ad-policy.test.ts`, and `src/lib/__tests__/google-adsense-contract.test.ts` (these exercise the application read-side, which this change does not modify — they must remain green throughout).

### Post-merge live verification (manual, not automatable in CI)

- [ ] Test case: After the first production deploy with real Actions Variable values, `curl -s https://recipe.dougis.com/ | grep -o 'data-ad-slot="[0-9]*"'` returns 3 non-empty slot IDs (or the equivalent check via browser view-source if the ad slots are client-rendered after hydration — in that case, use a headless browser check instead of raw `curl`).
- [ ] Test case: After the same deploy, confirm the GA `gtag.js` script tag (or `dataLayer` initialization) is present in the rendered page.

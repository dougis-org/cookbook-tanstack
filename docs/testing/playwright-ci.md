# Playwright CI Runtime Tuning

## Baseline

Before this change, pull requests already ran the full Playwright suite and
generated E2E coverage, but CI hard-pinned Playwright to `workers: 1`. That
kept execution deterministic by default, but it also serialized the entire E2E
segment and left maintainers with only the coarse GitHub Actions step timing as
runtime visibility.

## Current CI Path

- Pull requests still run the full `npm run test:e2e` suite.
- Coverage still writes to `e2e-coverage/lcov.info`.
- CI now sets `PLAYWRIGHT_CI_WORKERS=2` as the first validated step above the
  serialized baseline.
- Playwright emits a CI-only JSON report at `playwright-report/results.json`.
- The workflow runs a lightweight runtime summary after the existing E2E run so
  maintainers can see the slowest specs, retry counts, and active worker count
  without launching a second Playwright pass.

## Runtime Summary

The workflow step `Run Playwright runtime summary` parses the generated JSON
report and prints:

- the configured worker count
- total measured spec runtime
- the slowest specs in the run
- any specs that retried and how often they retried

This summary is meant to answer whether CI time is currently dominated by worker
configuration, spec skew, or retry-driven instability.

## Rollback

If CI becomes unstable or the savings do not justify the higher concurrency,
restore serialized execution by setting `PLAYWRIGHT_CI_WORKERS=1` in
`.github/workflows/build-and-test.yml`. That rollback leaves the rest of the
workflow intact and preserves the full-suite coverage behavior.

## Relation To #277

Issue `#277` remains research-only for deterministic impacted-test selection.
This change does not route or skip E2E specs selectively; it only improves the
runtime of the full-suite pull request path.

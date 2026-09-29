---
schema: 1
id: n067-warm-all-lazy-loaded-ssr-paths-before-production-s
kind: decision
title: "Warm all lazy-loaded SSR paths before production-server E2E tests"
domains: ["ci", "e2e", "hydration", "authentication"]
file_globs:
  - ".github/workflows/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:38:49.78156+00:00
updated_at: 2026-08-16T15:38:49.754+00:00
related: ["n022-bound-pr-review-waits-with-polling-and-a-timeout"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Warm all lazy-loaded SSR paths before production-server E2E tests

Before Playwright E2E tests, warm the production server through every SSR path that depends on lazy-loaded server modules, including Better Auth session handling. Without this initialization, tests can observe failures caused by cold module loading rather than application behavior. Apply this to CI workflows that start and exercise the production server.

## Related

**Related:**
- [[n022-bound-pr-review-waits-with-polling-and-a-timeout]]


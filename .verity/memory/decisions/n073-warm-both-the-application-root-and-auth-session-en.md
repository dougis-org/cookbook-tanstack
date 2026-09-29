---
schema: 1
id: n073-warm-both-the-application-root-and-auth-session-en
kind: decision
title: "Warm both the application root and auth session endpoint before E2E tests"
domains: ["ci", "e2e", "authentication", "hydration"]
file_globs:
  - ".github/workflows/**"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T17:44:57.013124+00:00
updated_at: 2026-08-16T17:44:56.982+00:00
related: ["n022-bound-pr-review-waits-with-polling-and-a-timeout"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Warm both the application root and auth session endpoint before E2E tests

Before browser-based E2E tests, warm both the application root and the authentication session endpoint when authentication SSR code can be lazy-loaded. The separate session request ensures that auth-dependent server paths are initialized before Playwright assertions begin, preventing failures caused by startup timing rather than application behavior.

## Related

**Related:**
- [[n022-bound-pr-review-waits-with-polling-and-a-timeout]]


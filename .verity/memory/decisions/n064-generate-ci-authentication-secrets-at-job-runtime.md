---
schema: 1
id: n064-generate-ci-authentication-secrets-at-job-runtime
kind: decision
title: "Generate CI authentication secrets at job runtime"
domains: ["ci", "security", "authentication"]
file_globs:
  - ".github/workflows/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:13:44.264977+00:00
updated_at: 2026-08-16T15:13:44.236+00:00
related: ["n022-bound-pr-review-waits-with-polling-and-a-timeout"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Generate CI authentication secrets at job runtime

CI authentication workflows should create BETTER_AUTH_SECRET at job runtime rather than storing or embedding a reusable secret in workflow source. The test secret only needs job-local validity, while runtime generation limits credential exposure and prevents accidental reuse across jobs or environments.

## Related

**Related:**
- [[n022-bound-pr-review-waits-with-polling-and-a-timeout]]


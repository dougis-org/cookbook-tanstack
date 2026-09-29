---
schema: 1
id: n066-generate-better-auth-secrets-at-ci-job-runtime
kind: decision
title: "Generate Better Auth secrets at CI job runtime"
domains: ["ci", "authentication", "security"]
file_globs:
  - ".github/workflows/*test*.yml"
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:27:11.490616+00:00
updated_at: 2026-08-16T15:27:11.411+00:00
related: ["n065-warm-production-and-authentication-endpoints-befor"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Generate Better Auth secrets at CI job runtime

CI workflows must generate BETTER_AUTH_SECRET at job runtime rather than committing or embedding a reusable secret in workflow source. Authentication tests need a valid secret, but a job-local value limits credential exposure and prevents reuse across runs; apply this wherever CI provisions Better Auth for isolated test jobs.

## Related

**Related:**
- [[n065-warm-production-and-authentication-endpoints-befor]]


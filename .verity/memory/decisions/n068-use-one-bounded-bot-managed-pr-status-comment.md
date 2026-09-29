---
schema: 1
id: n068-use-one-bounded-bot-managed-pr-status-comment
kind: decision
title: "Use one bounded bot-managed PR status comment"
domains: ["ci", "pull-requests", "workflow-reporting"]
file_globs:
  - ".github/workflows/**"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:38:49.957663+00:00
updated_at: 2026-08-16T15:38:49.928+00:00
related: ["n022-bound-pr-review-waits-with-polling-and-a-timeout", "n067-warm-all-lazy-loaded-ssr-paths-before-production-s"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use one bounded bot-managed PR status comment

CI automation that reports results on pull requests should update one marker-identifiable bot comment rather than creating a new comment per run. A bounded comment history prevents repeated workflow runs from producing unbounded PR noise; reporting must remain non-blocking so a notification failure cannot fail the validation job.

## Related

**Related:**
- [[n022-bound-pr-review-waits-with-polling-and-a-timeout]]
- [[n067-warm-all-lazy-loaded-ssr-paths-before-production-s]]


---
schema: 1
id: n063-retry-assertions-for-data-fetched-independently-of
kind: decision
title: "Retry assertions for data fetched independently of hydration"
domains: ["testing", "playwright", "hydration", "cookbook"]
file_globs:
  - "**/*cookbook*.spec.ts"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:13:44.164118+00:00
updated_at: 2026-08-16T15:13:44.125+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Retry assertions for data fetched independently of hydration

Hydration readiness does not imply that independently fetched cookbook data has arrived. E2E tests covering client-side query results must use retrying Playwright expectations for the rendered data, rather than asserting immediately after the hydration marker; otherwise valid asynchronous behavior produces flaky failures.

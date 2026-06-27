---
schema: 1
id: n022-bound-pr-review-waits-with-polling-and-a-timeout
kind: decision
title: "Bound PR review waits with polling and a timeout"
domains: ["github", "ci", "workflow"]
file_globs:
  - ".github/workflows/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-27T00:15:08.26103+00:00
updated_at: 2026-06-27T00:15:08.165+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Bound PR review waits with polling and a timeout

When a workflow needs to wait on external GitHub review/check state, it must poll and stop at a fixed timeout rather than blocking indefinitely. The external state is asynchronous and can stall, so the workflow needs a bounded wait to avoid hung jobs and unrecoverable automation. Apply this to review-wait logic and any similar CI automation that depends on third-party state becoming available.

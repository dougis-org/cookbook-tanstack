---
schema: 1
id: n029-assert-personal-source-privacy-at-the-network-laye
kind: decision
title: "Assert Personal source privacy at the network layer"
domains: ["testing", "security", "privacy", "playwright"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-05T02:42:59.749926+00:00
updated_at: 2026-07-05T02:42:59.639+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Assert Personal source privacy at the network layer

For Personal recipe source privacy checks, the contract must be verified against the tRPC response itself, not only the rendered UI. Direct GET assertions are required because DOM-only checks can miss accidental leakage of `personalSourceName` in the wire payload. Use this approach in E2E coverage whenever the test is proving that sensitive source metadata is not exposed to unauthorized viewers.

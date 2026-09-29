---
schema: 1
id: n097-keep-collaborator-lookup-outages-retryable-without
kind: decision
title: "Keep collaborator lookup outages retryable without broadening shared access"
domains: ["cookbooks", "authorization", "error-handling"]
file_globs: []
confidence: 0.75
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "d8e673fd-390c-45cc-8f74-fd2dfa96a910"
task: "aacaa824-b23b-4d8e-af05-8708d475ea79"
run: "run-20260926211307-bdddd550"
created_at: 2026-09-26T21:13:18.596098+00:00
updated_at: 2026-09-26T21:13:18.51+00:00
related: ["n088-represent-shared-cookbook-content-as-live-owner-re"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep collaborator lookup outages retryable without broadening shared access

When cookbook visibility depends on both LibraryShare aggregation and collaborator lookup, treat failures according to their different security effects: a failed share aggregation must fail closed so it cannot broaden access, while a failed collaborator lookup should surface a retryable error rather than be interpreted as no collaboration. Apply this distinction to shared-cookbook lookup paths where treating an unavailable dependency as an empty result would either expose content or incorrectly deny a collaborator.

## Related

**Related:**
- [[n088-represent-shared-cookbook-content-as-live-owner-re]]


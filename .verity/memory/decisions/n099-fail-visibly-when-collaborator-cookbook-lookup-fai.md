---
schema: 1
id: n099-fail-visibly-when-collaborator-cookbook-lookup-fai
kind: decision
title: "Fail visibly when collaborator cookbook lookup fails"
domains: ["cookbook", "authorization", "error-handling"]
file_globs:
  - "**/trpc/**"
confidence: 0.72
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "d8e673fd-390c-45cc-8f74-fd2dfa96a910"
task: "aacaa824-b23b-4d8e-af05-8708d475ea79"
run: "run-20260926212232-839dff94"
created_at: 2026-09-26T21:22:38.800833+00:00
updated_at: 2026-09-26T21:22:38.703+00:00
related: ["n088-represent-shared-cookbook-content-as-live-owner-re"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Fail visibly when collaborator cookbook lookup fails

For procedures whose authorized cookbook scope depends on collaboration membership, do not convert a failed collaborator lookup into an empty result or silently fall back to narrower access. That would make an infrastructure failure appear to be a legitimate lack of access and can produce incorrect behavior for collaborators. Surface a controlled TRPC error instead. Keep this distinct from shared-library owner lookup, whose authorization policy explicitly fails closed. Apply this where cookbook collaboration membership determines access.

## Related

**Related:**
- [[n088-represent-shared-cookbook-content-as-live-owner-re]]


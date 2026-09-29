---
schema: 1
id: n100-fail-closed-when-resolving-shared-cookbook-access
kind: decision
title: "Fail closed when resolving shared cookbook access"
domains: ["authorization", "cookbook-sharing"]
file_globs: []
confidence: 0.76
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "d8e673fd-390c-45cc-8f74-fd2dfa96a910"
task: "aacaa824-b23b-4d8e-af05-8708d475ea79"
run: "run-20260926212858-6ef430cc"
created_at: 2026-09-26T21:29:01.359346+00:00
updated_at: 2026-09-26T21:29:01.272+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Fail closed when resolving shared cookbook access

When resolving shared-library ownership or collaborator access, a failed lookup must not be treated as an empty result or otherwise broaden access. Propagate collaborator lookup failures as retryable tRPC errors so callers can distinguish an outage from a genuine absence of sharing; this preserves the authorization boundary while allowing clients to retry transient failures.

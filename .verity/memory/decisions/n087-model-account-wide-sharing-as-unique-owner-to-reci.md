---
schema: 1
id: n087-model-account-wide-sharing-as-unique-owner-to-reci
kind: decision
title: "Model account-wide sharing as unique owner-to-recipient grants"
domains: ["sharing", "libraries", "data-model"]
file_globs:
  - "**/*library*share*"
  - "**/models/*share*"
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
session: "6681c89f-04b3-4ae9-a8e8-d9c31208c2a7"
task: "503381dd-c7d0-4e42-a1e1-32952fffefc4"
run: "run-20260920214015-215fe849"
created_at: 2026-09-20T21:40:23.555446+00:00
updated_at: 2026-09-20T21:40:23.459+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Model account-wide sharing as unique owner-to-recipient grants

Use a dedicated, role-less sharing grant for each owner/recipient pair rather than embedding recipients in libraries or reusing cookbook-collaboration state. This keeps account-wide sharing normalized, avoids coupling future-content access to cookbook membership, and provides a stable record that can be evaluated against current eligibility. Apply this to library-sharing persistence and grant management.

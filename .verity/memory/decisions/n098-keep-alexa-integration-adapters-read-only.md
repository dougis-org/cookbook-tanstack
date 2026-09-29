---
schema: 1
id: n098-keep-alexa-integration-adapters-read-only
kind: decision
title: "Keep Alexa integration adapters read-only"
domains: ["alexa", "authorization", "api-boundaries"]
file_globs:
  - "**/alexa/**"
confidence: 0.77
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "d8e673fd-390c-45cc-8f74-fd2dfa96a910"
task: "aacaa824-b23b-4d8e-af05-8708d475ea79"
run: "run-20260926212138-925f9045"
created_at: 2026-09-26T21:21:49.72449+00:00
updated_at: 2026-09-26T21:21:49.621+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep Alexa integration adapters read-only

Alexa-facing adapters should expose only read operations and derive their internal context from the Alexa token. This limits the capabilities available through the integration boundary while allowing reads to reuse existing recipe and cookbook visibility and entitlement checks. Apply this when adding or changing Alexa adapter operations; do not expose writes through this adapter.

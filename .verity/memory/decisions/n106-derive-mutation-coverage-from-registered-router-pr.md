---
schema: 1
id: n106-derive-mutation-coverage-from-registered-router-pr
kind: decision
title: "Derive mutation coverage from registered router procedures"
domains: ["API", "testing", "coverage"]
file_globs: []
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "e018b53a-776a-4057-8a70-e89b65b8794e"
task: "8b2310e3-4b43-475b-bdf2-a723e50e21de"
run: "run-20260928221608-081ebccf"
created_at: 2026-09-28T22:16:13.851001+00:00
updated_at: 2026-09-28T22:16:13.757+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Derive mutation coverage from registered router procedures

For API mutation-coverage tests, derive the expected mutation set from router procedure registration rather than maintaining a separate hand-written inventory. Assert that the registered set matches the tested mutations plus explicit exclusions. This makes adding a mutation without coverage or an intentional exclusion fail visibly, preventing the coverage list from silently drifting as routers evolve.

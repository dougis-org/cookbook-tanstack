---
schema: 1
id: n090-retain-sharing-grants-and-evaluate-tier-eligibilit
kind: decision
title: "Retain sharing grants and evaluate tier eligibility at read time"
domains: ["sharing", "authorization", "entitlements"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
session: "6681c89f-04b3-4ae9-a8e8-d9c31208c2a7"
task: "63a60ca9-e52b-4b4b-a97e-44e0ca617d5e"
run: "run-20260921224439-8fbe1666"
created_at: 2026-09-21T22:44:45.324266+00:00
updated_at: 2026-09-21T22:44:45.235+00:00
related: ["n088-represent-shared-cookbook-content-as-live-owner-re"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Retain sharing grants and evaluate tier eligibility at read time

LibraryShare grants must survive recipient tier changes, with access eligibility evaluated from the recipient’s current tier when data is read. This preserves intended access automatically when a user regains the required Executive Chef tier, avoiding grant recreation and reconciliation jobs. Apply this rule to sharing persistence and authorization-context resolution paths.

## Related

**Related:**
- [[n088-represent-shared-cookbook-content-as-live-owner-re]]


---
schema: 1
id: n102-keep-personal-and-eligibility-data-out-of-sharing
kind: decision
title: "Keep personal and eligibility data out of sharing-grant results"
domains: ["sharing", "privacy"]
file_globs:
  - "**/library-sharing/**"
confidence: 0.79
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "1f5f0a27-7f94-4d07-8b01-2d4d941c167c"
task: "51ac8128-52fa-4658-b060-ce9c664f31f4"
run: "run-20260927172658-2d323dc8"
created_at: 2026-09-27T17:27:03.795801+00:00
updated_at: 2026-09-27T17:27:03.71+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep personal and eligibility data out of sharing-grant results

Sharing-grant views should expose only the information recipients and owners need to identify the grant and shared content; do not include either party’s email or tier. These fields are not necessary to use the grant, and exposing them would leak personal and account-eligibility data. Apply this constraint to both outgoing and received grant results and any equivalent sharing-list response.

---
schema: 1
id: n091-retain-sharing-grants-across-owner-tier-changes
kind: decision
title: "Retain sharing grants across owner tier changes"
domains: ["sharing", "authorization", "entitlements"]
file_globs:
  - "**/share-my-library/**"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
session: "04e37461-2ab1-45f0-86de-ea4733330eff"
task: "cff821ca-85fa-4926-a153-8946976306ee"
run: "run-20260922003048-65e79f86"
created_at: 2026-09-22T00:30:57.049287+00:00
updated_at: 2026-09-22T00:30:56.957+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Retain sharing grants across owner tier changes

Sharing grants must remain stored when an owner’s tier changes; eligibility is evaluated from the owner’s current tier at access time. This preserves the owner-recipient relationship across downgrade and re-upgrade, while still preventing access when the current tier is ineligible. Apply this to grant persistence and shared-library authorization logic.

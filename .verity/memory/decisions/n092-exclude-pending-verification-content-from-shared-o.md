---
schema: 1
id: n092-exclude-pending-verification-content-from-shared-o
kind: decision
title: "Exclude pending-verification content from shared-owner visibility results"
domains: ["sharing", "visibility", "content-moderation"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
session: "04e37461-2ab1-45f0-86de-ea4733330eff"
task: "cff821ca-85fa-4926-a153-8946976306ee"
run: "run-20260922003305-fdee78c3"
created_at: 2026-09-22T00:33:11.908359+00:00
updated_at: 2026-09-22T00:33:11.818+00:00
related: ["n091-retain-sharing-grants-across-owner-tier-changes"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Exclude pending-verification content from shared-owner visibility results

Shared-library views must apply the same pending-verification exclusion used for public and collaborative content. This prevents unverified content from becoming visible merely because access is granted through an owner-sharing relationship, preserving a consistent verification boundary across visibility paths. Apply this rule whenever shared-owner results are assembled or filtered.

## Related

**Related:**
- [[n091-retain-sharing-grants-across-owner-tier-changes]]


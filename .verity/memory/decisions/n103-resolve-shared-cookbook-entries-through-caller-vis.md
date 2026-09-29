---
schema: 1
id: n103-resolve-shared-cookbook-entries-through-caller-vis
kind: decision
title: "Resolve shared cookbook entries through caller visibility at read time"
domains: ["sharing", "authorization", "read-path"]
file_globs: []
confidence: 0.83
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "e018b53a-776a-4057-8a70-e89b65b8794e"
task: "a632a69e-e5a3-4c7a-8eac-9b227dad9b51"
run: "run-20260928031149-35f75737"
created_at: 2026-09-28T03:11:53.685281+00:00
updated_at: 2026-09-28T03:11:53.591+00:00
related: ["n088-represent-shared-cookbook-content-as-live-owner-re", "n091-retain-sharing-grants-across-owner-tier-changes", "n092-exclude-pending-verification-content-from-shared-o"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Resolve shared cookbook entries through caller visibility at read time

For shared-cookbook read paths, resolve cross-owner recipe references using the same visibility filter applied to the caller’s other readable content. This keeps references live rather than copying recipe data or persisting access snapshots, so revocation or any loss of visibility naturally produces an unavailable placeholder instead of exposing stale or unauthorized content.

## Related

**Related:**
- [[n088-represent-shared-cookbook-content-as-live-owner-re]]
- [[n091-retain-sharing-grants-across-owner-tier-changes]]
- [[n092-exclude-pending-verification-content-from-shared-o]]


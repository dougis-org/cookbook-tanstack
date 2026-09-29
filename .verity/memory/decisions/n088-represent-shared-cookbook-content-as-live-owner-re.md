---
schema: 1
id: n088-represent-shared-cookbook-content-as-live-owner-re
kind: decision
title: "Represent shared cookbook content as live owner references"
domains: ["sharing", "cookbooks", "data-consistency", "authorization"]
file_globs: []
confidence: 0.92
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
session: "6681c89f-04b3-4ae9-a8e8-d9c31208c2a7"
task: "503381dd-c7d0-4e42-a1e1-32952fffefc4"
run: "run-20260920214015-215fe849"
created_at: 2026-09-20T21:40:23.907968+00:00
updated_at: 2026-09-20T21:40:23.812+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Represent shared cookbook content as live owner references

Cross-owner cookbook entries must reference the owner’s canonical recipe or cookbook data rather than copying it into the recipient’s library. This preserves edits made by the owner and ensures revoked, deleted, or no-longer-eligible content disappears through normal resolution instead of leaving stale or unauthorized copies. Apply whenever shared content is projected into another user’s library.

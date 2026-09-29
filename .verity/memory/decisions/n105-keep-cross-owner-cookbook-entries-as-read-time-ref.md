---
schema: 1
id: n105-keep-cross-owner-cookbook-entries-as-read-time-ref
kind: decision
title: "Keep cross-owner cookbook entries as read-time references"
domains: ["cookbook", "authorization"]
file_globs: []
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "e018b53a-776a-4057-8a70-e89b65b8794e"
task: "aa957652-e74b-48a2-a9db-eb432b161447"
run: "run-20260928215133-e1fb1356"
created_at: 2026-09-28T21:51:44.032359+00:00
updated_at: 2026-09-28T21:51:43.925+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep cross-owner cookbook entries as read-time references

Representing another owner's cookbook entry as a reference, rather than a copied snapshot, keeps the displayed content current and lets reads reflect current access. When a referenced entry becomes inaccessible through revocation, tier downgrade, or deletion, return only a minimal unavailable stub; do not expose stale copied content. Apply this to cross-owner cookbook reads where ownership or access can change independently of the referencing cookbook.

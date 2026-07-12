---
schema: 1
id: n033-sync-approved-spec-deltas-into-the-canonical-spec
kind: decision
title: "Sync approved spec deltas into the canonical spec after merge"
domains: ["openspec", "spec-management"]
file_globs:
  - "openspec/specs/**/spec.md"
  - "openspec/changes/**/spec.md"
confidence: 0.77
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-06T23:31:28.022237+00:00
updated_at: 2026-07-06T23:31:27.915+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Sync approved spec deltas into the canonical spec after merge

When an openspec change is approved and merged, its requirement delta must be copied into the canonical spec file so the spec remains the source of truth. Leaving accepted changes only in the change record creates drift between implemented behavior and documented requirements, which breaks future review and follow-up work. Apply this whenever a merged change modifies a spec that has a canonical in-repo representation.

---
schema: 1
id: n024-ignore-generated-review-snapshots-and-local-state
kind: decision
title: "Ignore generated review snapshots and local state in .gitignore"
domains: ["repo hygiene", "tooling", "review workflow"]
file_globs:
  - ".gitignore"
  - "**/.gitignore"
confidence: 0.77
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-27T23:51:49.45293+00:00
updated_at: 2026-06-27T23:51:49.36+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Ignore generated review snapshots and local state in .gitignore

Generated Verity snapshot files and local review-state artifacts must stay out of version control because committing them can break local tooling and make the repo state machine inconsistent. When adding new review or snapshot outputs, prefer ignoring them rather than tracking them unless they are true source inputs. This rule applies to repo hygiene around generated artifacts, not just this one path.

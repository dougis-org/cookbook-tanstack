---
schema: 1
id: n028-use-optimistic-cache-writes-with-rollback-for-note
kind: decision
title: "Use optimistic cache writes with rollback for note saves"
domains: ["recipes", "caching", "mutations"]
file_globs:
  - "src/components/**/PrivateRecipeNotes*"
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T04:46:39.668222+00:00
updated_at: 2026-07-01T04:46:39.58+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use optimistic cache writes with rollback for note saves

When a note save is user-facing and backed by a cache, update the cache optimistically so the UI responds immediately, but always retain a rollback path if the server rejects the write. This preserves responsiveness without letting failed mutations leave stale or incorrect note state visible. Apply this pattern anywhere note-editing mutations are reflected through the query cache and the save can fail after the client has already shown the new value.

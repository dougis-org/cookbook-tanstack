---
schema: 1
id: n050-use-optimistic-note-save-cache-updates-with-rollba
kind: decision
title: "Use optimistic note-save cache updates with rollback on failure"
domains: ["notes", "data-fetching", "ui-state"]
file_globs: []
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-08T01:48:27.832803+00:00
updated_at: 2026-08-08T01:48:27.815+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use optimistic note-save cache updates with rollback on failure

When saving private notes, update the cached note state optimistically so the UI responds immediately, but always restore the previous query result if the mutation fails and surface an error. This avoids leaving the notes panel in a falsely-saved state after a network or validation error. Apply this pattern anywhere note-save mutations can change cached recipe-note data.

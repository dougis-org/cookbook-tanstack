---
schema: 1
id: n058-do-not-let-session-refreshes-overwrite-unsaved-set
kind: decision
title: "Do not let session refreshes overwrite unsaved settings edits"
domains: ["settings", "session-state", "forms"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T00:35:28.218666+00:00
updated_at: 2026-08-16T00:35:28.195+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Do not let session refreshes overwrite unsaved settings edits

Settings forms must protect locally edited values from asynchronous session refreshes until the user saves or explicitly discards them. Otherwise a background refresh can silently erase in-progress input, creating data loss and misleading UI state. Apply this to settings flows that hydrate from session data.

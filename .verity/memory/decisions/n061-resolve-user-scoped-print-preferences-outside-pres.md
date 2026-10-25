---
schema: 1
id: n061-resolve-user-scoped-print-preferences-outside-pres
kind: decision
title: "Resolve user-scoped print preferences outside presentational recipe-detail components"
domains: ["print-preferences", "recipe-detail", "component-architecture"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T01:02:47.585756+00:00
updated_at: 2026-08-16T01:02:47.553+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Resolve user-scoped print preferences outside presentational recipe-detail components

Resolve per-user print preferences in the route or page layer and pass the resulting booleans into recipe-detail presentation components. This keeps request/session concerns out of reusable UI, preventing duplicated authorization or preference logic and making the component safe to render in contexts without a request. Apply this to recipe-detail views that consume user-scoped print settings.

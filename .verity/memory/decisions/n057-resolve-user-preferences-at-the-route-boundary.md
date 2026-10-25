---
schema: 1
id: n057-resolve-user-preferences-at-the-route-boundary
kind: decision
title: "Resolve user preferences at the route boundary"
domains: ["recipe-detail", "user-preferences", "authorization"]
file_globs:
  - "**/recipes/**"
  - "**/RecipeDetail.*"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T00:27:52.268023+00:00
updated_at: 2026-08-16T00:27:52.234+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Resolve user preferences at the route boundary

Resolve per-user preferences at the route boundary and pass a typed value into presentational recipe-detail components. This keeps session and malformed-identity handling in shared request-aware code, preventing UI components from making authorization or persistence decisions. Apply this whenever recipe views consume user-specific settings.

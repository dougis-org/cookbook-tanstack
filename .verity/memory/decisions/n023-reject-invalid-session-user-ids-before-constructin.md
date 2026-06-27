---
schema: 1
id: n023-reject-invalid-session-user-ids-before-constructin
kind: decision
title: "Reject invalid session user IDs before constructing ObjectId"
domains: ["auth", "trpc", "mongoose"]
file_globs:
  - "src/server/trpc/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-27T00:16:27.990089+00:00
updated_at: 2026-06-27T00:16:27.898+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Reject invalid session user IDs before constructing ObjectId

When a session-derived userId is needed for a Mongo query, validate it first and fail with an explicit unauthorized/invalid-session response. Letting malformed IDs reach Mongoose turns an auth failure into a cast/runtime error, which obscures the real problem and can leak implementation details. Apply this anywhere session identity is converted into an ObjectId for authorization checks or ownership lookups.

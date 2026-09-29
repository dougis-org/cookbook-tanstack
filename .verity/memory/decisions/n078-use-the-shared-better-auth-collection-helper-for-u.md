---
schema: 1
id: n078-use-the-shared-better-auth-collection-helper-for-u
kind: decision
title: "Use the shared Better Auth collection helper for user data access"
domains: ["users", "better-auth", "database"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T21:06:25.646319+00:00
updated_at: 2026-08-21T21:06:25.54+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use the shared Better Auth collection helper for user data access

All users-router reads and writes involving the Better Auth user collection must go through getBetterAuthCollection("user") rather than obtaining a collection directly. The shared helper preserves the application's database-singleton and connection-management guarantees, preventing divergent handles or lifecycle behavior in related user operations.

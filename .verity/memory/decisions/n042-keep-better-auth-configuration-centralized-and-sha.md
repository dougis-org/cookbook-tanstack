---
schema: 1
id: n042-keep-better-auth-configuration-centralized-and-sha
kind: decision
title: "Keep Better Auth configuration centralized and shape-tested"
domains: ["auth", "security"]
file_globs:
  - "src/lib/auth.ts"
  - "**/*better-auth*"
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T19:00:13.660704+00:00
updated_at: 2026-07-16T19:00:13.569+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep Better Auth configuration centralized and shape-tested

Auth settings that affect session lifetime, trusted origins, and exposed user fields must live in one shared config module and be covered by tests. Splitting this setup across ad hoc call sites makes it easy to drift from the intended security model or silently break session behavior. This applies whenever changing Better Auth initialization or adding new auth-related options: prefer a single canonical config surface so the app can validate the shape and reason about the effective policy in one place.

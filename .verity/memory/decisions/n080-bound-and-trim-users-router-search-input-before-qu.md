---
schema: 1
id: n080-bound-and-trim-users-router-search-input-before-qu
kind: decision
title: "Bound and trim users-router search input before querying"
domains: ["users", "search", "validation", "database"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:25:45.292263+00:00
updated_at: 2026-08-21T23:25:45.191+00:00
related: ["n078-use-the-shared-better-auth-collection-helper-for-u"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Bound and trim users-router search input before querying

Users-router search terms must be trimmed and constrained to 2–254 characters before database access. This prevents whitespace-only or excessively large inputs from producing ambiguous, wasteful, or potentially abusive queries, while preserving a predictable minimum for meaningful prefix search. Apply the same boundary rule to equivalent user-search entry points and keep it covered by validation tests.

## Related

**Related:**
- [[n078-use-the-shared-better-auth-collection-helper-for-u]]


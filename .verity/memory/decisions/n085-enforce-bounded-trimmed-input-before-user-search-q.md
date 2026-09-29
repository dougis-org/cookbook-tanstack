---
schema: 1
id: n085-enforce-bounded-trimmed-input-before-user-search-q
kind: decision
title: "Enforce bounded, trimmed input before user-search query construction"
domains: ["users", "search", "validation"]
file_globs:
  - "src/**/routers/users*"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:46:07.028692+00:00
updated_at: 2026-08-21T23:46:06.922+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Enforce bounded, trimmed input before user-search query construction

User-search endpoints must normalize input with Zod using trim, a minimum of 2 characters, and a maximum of 254 characters before constructing queries. These documented bounds prevent meaningless or excessively large searches from reaching the database and apply to related users-router search inputs.

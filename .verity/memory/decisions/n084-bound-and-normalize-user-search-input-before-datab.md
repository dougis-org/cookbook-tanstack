---
schema: 1
id: n084-bound-and-normalize-user-search-input-before-datab
kind: decision
title: "Bound and normalize user-search input before database access"
domains: ["users", "validation", "database"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:45:04.436097+00:00
updated_at: 2026-08-21T23:45:04.331+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Bound and normalize user-search input before database access

User-search procedures must trim input and enforce a meaningful minimum and maximum length before invoking the database layer. Early validation prevents empty or excessively large terms from reaching MongoDB, limiting unnecessary work and keeping query behavior bounded. Apply this to user search inputs and equivalent validation schemas in the users-router subsystem.

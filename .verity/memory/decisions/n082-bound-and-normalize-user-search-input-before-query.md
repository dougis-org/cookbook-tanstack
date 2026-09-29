---
schema: 1
id: n082-bound-and-normalize-user-search-input-before-query
kind: decision
title: "Bound and normalize user-search input before querying"
domains: ["users", "search", "validation", "mongodb"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:31:12.116343+00:00
updated_at: 2026-08-21T23:31:12.011+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Bound and normalize user-search input before querying

User-search handlers must trim input and require a length between 2 and 254 characters before constructing a database query. This rejects empty searches that could produce overly broad results and limits oversized input that can waste query or validation resources. Apply this rule to all user-search endpoints, not merely the current router implementation.

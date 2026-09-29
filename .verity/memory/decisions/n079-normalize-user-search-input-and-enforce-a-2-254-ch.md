---
schema: 1
id: n079-normalize-user-search-input-and-enforce-a-2-254-ch
kind: decision
title: "Normalize user search input and enforce a 2–254 character bound"
domains: ["users", "search", "validation"]
file_globs:
  - "**/routers/users.ts"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T21:06:53.597217+00:00
updated_at: 2026-08-21T21:06:53.487+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Normalize user search input and enforce a 2–254 character bound

User-search endpoints must trim surrounding whitespace and reject inputs shorter than 2 or longer than 254 characters. Trimming makes equivalent queries behave consistently, the minimum prevents empty or overly broad lookups, and the upper bound preserves the RFC 5321-aligned limit for email-oriented search values. Apply this validation to users-router search requests.

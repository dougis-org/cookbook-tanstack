---
schema: 1
id: n083-trim-and-bound-users-router-search-input-before-ex
kind: decision
title: "Trim and bound users-router search input before executing queries"
domains: ["users", "search", "validation", "resource-limits"]
file_globs: []
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:32:49.261153+00:00
updated_at: 2026-08-21T23:32:49.154+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Trim and bound users-router search input before executing queries

Users-router search handlers must normalize input and enforce a minimum and maximum length before database work. Trimming avoids whitespace-only or misleading queries, while the 2–254 character bounds reject ineffective input and limit resource use at the request boundary. Apply this rule to comparable user-search validation added to the users-router subsystem.
